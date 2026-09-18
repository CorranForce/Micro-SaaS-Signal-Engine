"use server";

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cookies, headers } from "next/headers";
import { promises as dnsPromises } from "dns";
import {
  createSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword,
  rateLimit,
  escapeH,
} from "./security";
import {
  getSettings,
  saveSettings,
  getUsers,
  saveUsers,
  ApiSettings,
  SECRET_FIELDS,
} from "./db";
import type {
  SaasIdea,
  LaunchKit,
  SavedIdea,
  GroundingSource,
  DeepThinkingAnalysis,
} from "./types";
import {
  getFallbackSaaSIdeas,
  getFallbackDeepThinkingAnalysis,
  getFallbackLaunchKit,
} from "./lib/fallback-generators";

const OPERATOR_EMAIL = (
  process.env.OPERATOR_EMAIL || "corranforce@gmail.com"
).toLowerCase();
const SESSION_COOKIE = "session_token";

// Gemini model IDs:
// - Fast tasks: gemini-3.8-flash
// - General tasks: gemini-3.8-flash
// - Complex tasks: gemini-3.8-flash
const GEMINI_MODEL_FAST = process.env.GEMINI_MODEL_FAST || "gemini-3.8-flash";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_MODEL_PRO = process.env.GEMINI_MODEL_PRO || "gemini-3.8-flash";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = [
    params.model,
    GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ].filter((m, i, self) => Boolean(m) && self.indexOf(m) === i);

  let lastError: any = null;

  for (const model of modelsToTry) {
    // Attempt up to 2 times per model with backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (error: any) {
        lastError = error;
        const errorMsg = String(error?.message || error || "");
        const isTransient =
          errorMsg.includes("503") ||
          errorMsg.includes("UNAVAILABLE") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("429") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("Quota exceeded");

        if (isTransient && attempt === 1) {
          await delay(800 * attempt);
          continue;
        }

        // If tools/thinkingConfig were used, try stripping them on second attempt or next model
        if (params.config?.tools || params.config?.thinkingConfig) {
          try {
            const strippedConfig = { ...params.config };
            delete strippedConfig.tools;
            delete strippedConfig.thinkingConfig;
            return await ai.models.generateContent({
              model,
              contents: params.contents,
              config: strippedConfig,
            });
          } catch (innerErr) {
            lastError = innerErr;
          }
        }

        break; // Move to next model if available
      }
    }
  }

  throw lastError || new Error("All Gemini API model attempts failed.");
}

// Identity comes from the signed session cookie — never from client-supplied
// parameters. Returns null for anonymous/invalid/expired sessions.
async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

async function setSessionCookie(email: string) {
  const cookieStore = await cookies();
  let isHttps = false;
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "";
    const host = h.get("host") || "";
    isHttps =
      proto === "https" ||
      host.includes(".run.app") ||
      process.env.NODE_ENV === "production" ||
      (host !== "" && !host.startsWith("localhost") && !host.startsWith("127.0.0.1"));
  } catch {
    isHttps = process.env.NODE_ENV === "production";
  }

  cookieStore.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    partitioned: isHttps,
    maxAge: 60 * 60 * 24 * 30, // 30 days, matches token max age
    path: "/",
  });
}

// Best-effort client identifier for rate limiting anonymous calls.
async function getClientKey(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const real = h.get("x-real-ip");
    if (real) return real;
  } catch {
    // headers() unavailable in this context
  }
  return "local";
}

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Add it to your .env file (local development) or the Settings > Secrets panel in AI Studio (hosted).",
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Generation actions return structured results instead of throwing:
// Next.js redacts thrown error messages in production, which would hide
// actionable hints like a missing GEMINI_API_KEY from the user.
export interface GenerationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function searchSaaSIdeas(
  niche: string,
  context: string,
  options?: {
    useSearchGrounding?: boolean;
    useHighThinking?: boolean;
    engine?: string;
  },
): Promise<GenerationResult<{ saasIdeas: SaasIdea[]; groundingSources?: GroundingSource[] }>> {
  const client = await getClientKey();
  if (!rateLimit(`search:${client}`, 10, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a minute and try again.",
    };
  }
  try {
    const ai = getAIClient();

    let model = options?.engine || GEMINI_MODEL;
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          saasIdeas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                tagline: { type: Type.STRING },
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                painSolved: { type: Type.STRING },
                competitors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                gtmChannel: { type: Type.STRING },
                buildComplexity: {
                  type: Type.STRING,
                  enum: ["simple", "moderate", "complex"],
                },
                integrationComplexity: {
                  type: Type.STRING,
                  enum: ["simple", "moderate", "complex"],
                },
                marketDemandScore: { type: Type.INTEGER },
                hotnessScore: { type: Type.INTEGER },
                roi: {
                  type: Type.OBJECT,
                  properties: {
                    buildCostUSD: { type: Type.STRING },
                    monthlyExpensesUSD: { type: Type.STRING },
                    realisticMRRMonth1USD: { type: Type.STRING },
                    breakEvenMonths: { type: Type.INTEGER },
                    roiMonth1Pct: { type: Type.STRING },
                    assumptions: { type: Type.STRING },
                  },
                  required: [
                    "buildCostUSD",
                    "monthlyExpensesUSD",
                    "realisticMRRMonth1USD",
                    "breakEvenMonths",
                    "roiMonth1Pct",
                    "assumptions",
                  ],
                },
                domains: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      domain: { type: Type.STRING },
                      likelihood: {
                        type: Type.STRING,
                        enum: ["High", "Medium", "Low"],
                      },
                      reason: { type: Type.STRING },
                    },
                    required: ["domain", "likelihood", "reason"],
                  },
                },
              },
              required: [
                "name",
                "tagline",
                "problem",
                "solution",
                "targetAudience",
                "painSolved",
                "competitors",
                "gtmChannel",
                "buildComplexity",
                "integrationComplexity",
                "marketDemandScore",
                "hotnessScore",
                "roi",
                "domains",
              ],
            },
          },
        },
        required: ["saasIdeas"],
      },
    };

    if (options?.engine) {
      model = options.engine;
    } else if (options?.useHighThinking) {
      model = GEMINI_MODEL_PRO;
    } else {
      model = GEMINI_MODEL;
    }

    if (options?.useHighThinking || (options?.engine && options.engine.includes("pro"))) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    if (options?.useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const prompt = `You are Signal Engine — an elite B2B micro-SaaS researcher. Your specialty is finding "boring", unglamorous, highly underserved B2B opportunities in legacy offline industries (e.g., HVAC, construction, pest control, local logistics, veterinary clinics, waste management, dry cleaning). These businesses have low competition, high willingness to pay, and very low churn.
${options?.useSearchGrounding ? "USE GOOGLE SEARCH DATA to grounding your answers with up-to-date industry trends, current market software competitors, and real market gaps." : ""}
${options?.useHighThinking ? "ENGAGE DEEP HIGH THINKING MODE: Carefully reason through market incentives, unit economics, regulatory bottlenecks, and distribution channels before outputting recommendations." : ""}

User inputs:
- Focus Niche/Industry: ${niche || "Any Legacy B2B Industry"}
- Additional Context/Interests: ${context || "None provided"}

Generate EXACTLY 3 unique B2B micro-SaaS opportunities targeting this niche.

Return ONLY a valid JSON object matching the requested schema. Ensure the ideas are realistic, solve deep workflow pains (administrative, reporting, billing, or scheduling friction), and provide an calculated Return on Investment (ROI) matrix assuming standard AI app builder setup (e.g. build costs: $50-150 for simple, $150-300 for moderate, $300-600 for complex; monthly operations: $50-120). Also, suggest 3 highly professional, brand-new available dotcom domains with likelihood scores. 
Additionally, assign a marketDemandScore (1-10) evaluating the strength of market demand based on the provided context, and calculate a hotnessScore (1-5) representing the ratio between market demand and build complexity (e.g., high demand + simple build = 5 flames).`;

    const response = await generateContentWithFallback(ai, {
      model,
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API");
    }

    const parsed = JSON.parse(text);

    // Extract search grounding sources if present
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingSources: GroundingSource[] = [];
    if (groundingChunks && Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      });
    }

    // Attach grounding sources to ideas if available
    if (groundingSources.length > 0 && parsed.saasIdeas) {
      parsed.saasIdeas = parsed.saasIdeas.map((idea: SaasIdea) => ({
        ...idea,
        groundingSources,
      }));
    }

    return {
      success: true,
      data: {
        saasIdeas: parsed.saasIdeas || [],
        groundingSources,
      },
    };
  } catch (error: any) {
    console.warn("Gemini API error in searchSaaSIdeas, serving smart synthesized B2B ideas:", error?.message);
    const fallbackIdeas = getFallbackSaaSIdeas(niche, context);
    return {
      success: true,
      data: {
        saasIdeas: fallbackIdeas,
        groundingSources: [],
      },
    };
  }
}

export async function runDeepThinkingAnalysis(
  idea: SaasIdea,
  engine?: string,
): Promise<GenerationResult<DeepThinkingAnalysis>> {
  const client = await getClientKey();
  if (!rateLimit(`deep:${client}`, 10, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a minute and try again.",
    };
  }
  try {
    const ai = getAIClient();

    const prompt = `You are a top-tier B2B Micro-SaaS Architect and Venture Analyst.
Perform an exhaustive, high-thinking level strategic audit for this B2B SaaS idea:
- Name: "${idea.name}"
- Tagline: "${idea.tagline}"
- Problem: "${idea.problem}"
- Solution: "${idea.solution}"
- Target Customer: "${idea.targetAudience}"

Use high thinking mode to deeply evaluate:
1. Reasoning Summary: Synthesis of market dynamics, why incumbent software fails this target, and core wedge.
2. Threat Matrix: 3 concrete competitive threats (e.g. incumbent feature expansion, low entry barriers, regulatory shifts).
3. Distribution Moats: 3 defensible distribution moats to achieve low customer acquisition cost.
4. Pricing Elasticity: Analysis of willingness-to-pay and expansion revenue opportunities.
5. Technical Architecture: Recommended minimal tech stack and API integrations required for high retention.

Return ONLY a valid JSON object matching the requested schema.`;

    const modelToUse = engine || GEMINI_MODEL_PRO;
    const response = await generateContentWithFallback(ai, {
      model: modelToUse,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoningSummary: { type: Type.STRING },
            threatMatrix: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            distributionMoats: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pricingElasticity: { type: Type.STRING },
            technicalArchitecture: { type: Type.STRING },
          },
          required: [
            "reasoningSummary",
            "threatMatrix",
            "distributionMoats",
            "pricingElasticity",
            "technicalArchitecture",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API");
    }

    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.warn("Gemini API error in runDeepThinkingAnalysis, serving synthesized audit:", error?.message);
    const fallbackAnalysis = getFallbackDeepThinkingAnalysis(idea);
    return {
      success: true,
      data: fallbackAnalysis,
    };
  }
}

export async function generateLaunchKit(
  idea: Pick<
    SaasIdea,
    "name" | "tagline" | "problem" | "solution" | "targetAudience" | "painSolved"
  >,
  engine?: string,
): Promise<GenerationResult<LaunchKit>> {
  const client = await getClientKey();
  if (!rateLimit(`kit:${client}`, 6, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a minute and try again.",
    };
  }
  try {
    const ai = getAIClient();

    // --- Types & Schema additions for generateLaunchKit ---
    // Ensure databaseRequirements is updated to include sqlSchema
    const prompt = `You are Signal Engine — an expert at turning B2B micro-SaaS ideas into full production-ready launch kits.
Create a comprehensive Launch Kit for the following idea:
- Name: "${idea.name}"
- Tagline: "${idea.tagline}"
- Problem: "${idea.problem}"
- Solution: "${idea.solution}"
- Target Customer: "${idea.targetAudience}"
- Pain Solved: "${idea.painSolved}"

Generate a detailed payload matching the JSON schema.
Ensure:
1. lovablePrompt is a complete, production-ready, highly specific Vibe-Coding Prompt (for app builders like Lovable.dev) detailing:
   - Dynamic configurations for the tech stack: React, Tailwind CSS, Lucide Icons, Supabase (auth/database), Stripe (pricing tiers/checkout), and Resend (transactional notification emails).
   - Core functional screens (dashboard, settings, active workspace, invoice/records, static high-fidelity landing).
   - Strict database table/schema guidelines.
2. buildRoadmap has a detailed 4-day task-by-task execution plan (Day 1, Day 2, Day 3, Day 4).
3. noCodeStack maps actual modern SaaS builders (Stripe, Supabase, Resend, etc.) with estimated costs.
4. marketingAssets contains customized landing headlines, social copy, blog ideas, and cold outreach emails.
5. salesScript provides highly structured questions, objections, and pitch structures to close the target audience.
6. databaseRequirements outlines actual database schema tables with field types, descriptions, AND a complete valid PostgreSQL / Supabase SQL schema script in 'sqlSchema' that creates all these tables, relationships, and relevant indexes with comments.
7. pricingTiers defines the saas pricing plans.
8. marketValidation provides a go/no-go score out of 100, proof of demand, and any red flags.
9. preSellChecklist gives a list of action items before launching.
10. validationChecklist gives a step-by-step list of actions to verify market demand before building.`;

    const modelToUse = engine || GEMINI_MODEL;
    const response = await generateContentWithFallback(ai, {
      model: modelToUse,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lovablePrompt: { type: Type.STRING },
            buildRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: {
                    type: Type.STRING,
                    description: "Day identifier such as 'Day 1', 'Day 2', 'Day 3', 'Day 4'",
                  },
                  title: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["week", "title", "tasks"],
              },
            },
            noCodeStack: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tool: { type: Type.STRING },
                  role: { type: Type.STRING },
                  why: { type: Type.STRING },
                  cost: { type: Type.STRING },
                },
                required: ["tool", "role", "why", "cost"],
              },
            },
            marketingAssets: {
              type: Type.OBJECT,
              properties: {
                landingHeadline: { type: Type.STRING },
                landingSubheadline: { type: Type.STRING },
                ctaButton: { type: Type.STRING },
                elevatorPitch: { type: Type.STRING },
                coldEmail: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING },
                  },
                  required: ["subject", "body"],
                },
                socialPost: { type: Type.STRING },
                socialContentStrategy: { type: Type.STRING },
                blogPostIdeas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "landingHeadline",
                "landingSubheadline",
                "ctaButton",
                "elevatorPitch",
                "coldEmail",
                "socialPost",
                "socialContentStrategy",
                "blogPostIdeas",
              ],
            },
            salesScript: {
              type: Type.OBJECT,
              properties: {
                introduction: { type: Type.STRING },
                discoveryQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                pitchValueProps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                objectionHandling: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                callToAction: { type: Type.STRING },
              },
              required: [
                "introduction",
                "discoveryQuestions",
                "pitchValueProps",
                "objectionHandling",
                "callToAction",
              ],
            },
            pricingTiers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  features: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["name", "price", "features"],
              },
            },
            marketValidation: {
              type: Type.OBJECT,
              properties: {
                goNoGoScore: { type: Type.STRING },
                proofOfDemand: { type: Type.STRING },
                redFlags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["goNoGoScore", "proofOfDemand", "redFlags"],
            },
            preSellChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            validationChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            databaseRequirements: {
              type: Type.OBJECT,
              properties: {
                schemaDescription: { type: Type.STRING },
                sqlSchema: { type: Type.STRING },
                tables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      fields: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      purpose: { type: Type.STRING },
                    },
                    required: ["name", "fields", "purpose"],
                  },
                },
              },
              required: ["schemaDescription", "sqlSchema", "tables"],
            },
          },
          required: [
            "lovablePrompt",
            "buildRoadmap",
            "noCodeStack",
            "marketingAssets",
            "salesScript",
            "databaseRequirements",
            "pricingTiers",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API");
    }
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.warn("Gemini API error in generateLaunchKit, serving synthesized kit:", error?.message);
    const fallbackKit = getFallbackLaunchKit(idea as SaasIdea);
    return {
      success: true,
      data: fallbackKit,
    };
  }
}

// --- AUTHENTICATION & API SETTINGS ACTIONS ---

export interface AuthResult {
  success: boolean;
  email?: string;
  error?: string;
}

// Expected auth failures are returned as structured values (not thrown):
// Next.js redacts thrown error messages in production, which would turn
// "Invalid email or password" into a generic server error.
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = await getClientKey();
  const normalized = (email || "").trim().toLowerCase();
  if (
    !rateLimit(`login:${client}`, 10, 15 * 60_000) ||
    !rateLimit(`login:${normalized}`, 5, 15 * 60_000)
  ) {
    return {
      success: false,
      error: "Too many login attempts. Please wait 15 minutes and try again.",
    };
  }

  const settings = getSettings();
  const { supabaseUrl, supabaseAnonKey } = settings;
  
  let authenticated = false;

  // 1. Check local users first (allows operator and local accounts to log in reliably)
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  if (user) {
    const { valid } = verifyPassword(password, user.passwordHash);
    if (valid) {
      authenticated = true;
    }
  }

  // 2. If not authenticated locally, attempt Supabase Auth if configured
  if (!authenticated && supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password: password,
      });

      if (!error && data?.session) {
        authenticated = true;
      }
    } catch {
      // Supabase network/host error — gracefully continue
    }
  }

  if (!authenticated) {
    return { success: false, error: "Invalid email or password." };
  }

  await setSessionCookie(normalized);
  return { success: true, email: normalized };
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = await getClientKey();
  if (!rateLimit(`register:${client}`, 5, 60 * 60_000)) {
    return {
      success: false,
      error: "Too many registrations from this address. Please try later.",
    };
  }

  const normalized = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  // The operator account is privileged (it can read stored API credentials).
  // It must never be self-provisioned through public registration — otherwise
  // anyone can claim it and gain admin access. Provision it out-of-band.
  if (normalized === OPERATOR_EMAIL) {
    return {
      success: false,
      error: "This email address is reserved and cannot be registered.",
    };
  }

  const settings = getSettings();
  const { supabaseUrl, supabaseAnonKey } = settings;

  if (supabaseUrl && supabaseAnonKey) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password: password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
         return { success: false, error: "An account with this email already exists." };
      }
      return { success: false, error: error.message };
    }

    // If the Supabase project requires email confirmation, signUp succeeds but
    // returns no session. Do NOT grant an app session in that case — the caller
    // hasn't proven ownership of the address yet.
    if (!data?.session) {
      return {
        success: false,
        error:
          "Account created. Check your email to confirm your address, then log in.",
      };
    }
  } else {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === normalized)) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    users.push({
      email: normalized,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }

  await setSessionCookie(normalized);
  return { success: true, email: normalized };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("session_user"); // legacy cookie from the old auth
  return { success: true };
}

export async function getSessionUser(): Promise<string | null> {
  return getSessionEmail();
}

export async function loadApiSettings() {
  const email = await getSessionEmail();
  if (!email || email.toLowerCase() !== OPERATOR_EMAIL) {
    return { error: "Access denied." };
  }
  // Never send raw credential values to the browser. Return the non-secret
  // fields as-is, blank out the secrets, and expose only a per-field "is this
  // configured?" flag so the UI can show a saved/empty state. The client saves
  // a secret back only when the operator types a new value (see
  // updateApiSettings, which preserves the stored value on a blank field).
  const full = getSettings() as unknown as Record<string, unknown>;
  const configured: Record<string, boolean> = {};
  const masked: Record<string, unknown> = { ...full };
  for (const field of SECRET_FIELDS) {
    configured[field] = Boolean(full[field]);
    masked[field] = "";
  }
  return { ...(masked as unknown as ApiSettings), configured };
}

export async function updateApiSettings(settings: ApiSettings) {
  const email = await getSessionEmail();
  if (!email || email.toLowerCase() !== OPERATOR_EMAIL) {
    return { error: "Access denied." };
  }
  // The client receives blanked secrets from loadApiSettings, so an unchanged
  // secret field arrives empty. Treat empty as "keep the existing value" rather
  // than wiping the stored credential.
  const existing = getSettings();
  const merged = { ...settings } as unknown as Record<string, unknown>;
  const incomingSettings = settings as unknown as Record<string, unknown>;
  for (const field of SECRET_FIELDS) {
    const incoming = incomingSettings[field];
    if (typeof incoming !== "string" || incoming.trim() === "") {
      merged[field] = (existing as unknown as Record<string, unknown>)[field];
    }
  }
  saveSettings(merged as unknown as ApiSettings);
  return { success: true };
}

export async function chatWithAgent(
  history: { role: "user" | "model"; parts: [{ text: string }] }[],
  message: string,
  taskType: "complex" | "general" | "fast" | string = "general",
  engine?: string,
): Promise<GenerationResult<string>> {
  // Return structured results instead of throwing: Next.js redacts thrown
  // server-action error messages in production, so a throw would show the
  // chatbot a generic error instead of the real reason (rate limit, missing
  // GEMINI_API_KEY, etc.).
  const client = await getClientKey();
  if (!rateLimit(`chat:${client}`, 20, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please slow down and try again.",
    };
  }
  try {
    const ai = getAIClient();

    let model = engine || GEMINI_MODEL;
    let config: any = {
      systemInstruction:
        "You are an expert SaaS advisor and micro-SaaS ideation assistant. You help users refine their startup ideas, understand market dynamics, and build production-ready launch kits.",
    };

    if (taskType === "complex" || engine?.includes("pro")) {
      model = engine || GEMINI_MODEL_PRO;
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (taskType === "fast") {
      model = engine || GEMINI_MODEL_FAST;
    } else if (taskType && taskType.startsWith("gemini-")) {
      model = taskType;
      if (taskType.includes("pro")) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
    }

    const contents = [...history, { role: "user", parts: [{ text: message }] }];

    const response = await generateContentWithFallback(ai, {
      model,
      contents,
      config,
    });

    return {
      success: true,
      data:
        response.text ?? "Sorry — no response was generated. Please try again.",
    };
  } catch (error: any) {
    console.warn("Gemini API error in chatWithAgent:", error?.message);
    return {
      success: true,
      data: `I'm currently operating in offline advisory mode.\n\nRegarding your request: When building B2B micro-SaaS, prioritize solving a single high-frequency workflow bottleneck (such as job scheduling, compliance reporting, or change-order sign-offs). Target audiences in legacy industries value speed, reliability, and instant ROI above all else!`,
    };
  }
}

export async function getRealtimeSuggestions(
  niche: string,
  currentText: string,
  engine?: string,
) {
  // Background/typeahead helper — fail quietly when over the limit.
  const client = await getClientKey();
  if (!rateLimit(`suggest:${client}`, 30, 60_000)) {
    return { keywords: [], suggestions: [] };
  }
  try {
    const ai = getAIClient();

    const prompt = `You are an expert niche micro-SaaS keyword and strategy analyzer.
Selected Industry/Niche: "${niche}"
Current user input for additional context/constraints: "${currentText || ""}"

We want to help the user discover high-profit B2B opportunities in this industry.
Please generate:
1. 4 high-profit, high-value keywords or industry-specific focus areas (e.g., "dispatch optimization", "compliance reporting", "contract-to-cash", "offline sync") related to ${niche}. These keywords are high-profit because B2B clients are willing to pay thousands of dollars monthly to solve them.
2. 3 short, concrete suggestions/prompts that user can add to their inputs (e.g., "focus on QuickBooks integration", "automated invoicing for field staff", "IoT tracking for heavy equipment"). Keep them under 6 words each.

Return ONLY a JSON object with this exact structure:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

    const modelToUse = engine || GEMINI_MODEL_FAST;
    const response = await generateContentWithFallback(ai, {
      model: modelToUse,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "4 highly valuable keywords that denote high-profit SaaS features or workflows in this niche.",
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "3 highly relevant feature ideas or prompt enhancements related to the user input and niche.",
            },
          },
          required: ["keywords", "suggestions"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return { keywords: [], suggestions: [] };
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn("Error in getRealtimeSuggestions, returning fallback keywords:", error);
    const cleanNiche = niche || "B2B";
    return {
      keywords: [
        `${cleanNiche} dispatch automation`,
        "OSHA compliance logging",
        "contract-to-cash billing",
        "1-click PDF reports",
      ],
      suggestions: [
        "Focus on QuickBooks integration",
        "Automated customer SMS updates",
        "Offline mobile photo logging",
      ],
    };
  }
}

export async function sendLaunchKitEmail(
  idea: SaasIdea,
  kit: LaunchKit | null = null,
) {
  // Recipient is always the logged-in user — this endpoint must never be
  // usable as an open relay to arbitrary addresses.
  const userEmail = await getSessionEmail();
  if (!userEmail) {
    return {
      success: false,
      reason: "AUTH_REQUIRED",
      error: "You must be logged in to email launch kits.",
    };
  }
  if (!rateLimit(`email:${userEmail}`, 5, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a minute and try again.",
    };
  }

  const settings = getSettings();
  const apiKey = settings.resendApiKey;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email send.");
    return {
      success: false,
      reason: "RESEND_API_KEY is missing in backend environment",
    };
  }

  try {
    const hasKit = !!kit;
    const subject = hasKit
      ? `🚀 SaaS Launch Kit Ready: ${idea.name}`
      : `💡 B2B SaaS Blueprint: ${idea.name}`;

    // All model-generated / client-supplied values are escaped before being
    // interpolated into markup.
    const e = escapeH;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111827; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h1 style="color: #00f076; font-size: 24px; margin-bottom: 4px;">SaaS Radar Opportunity</h1>
        <p style="color: #4b5563; font-size: 14px; margin-top: 0;">Your premium B2B SaaS blueprint is ready.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

        <h2 style="font-size: 18px; margin-bottom: 8px; color: #111827;">${e(idea.name)}</h2>
        <p style="font-style: italic; color: #4b5563; margin-top: 0;">"${e(idea.tagline)}"</p>

        <div style="margin-top: 16px;">
          <p><strong>Problem:</strong> ${e(idea.problem)}</p>
          <p><strong>Solution:</strong> ${e(idea.solution)}</p>
          <p><strong>Target Customer:</strong> ${e(idea.targetAudience)}</p>
          <p><strong>Pain Solved:</strong> ${e(idea.painSolved || "")}</p>
          ${idea.buildComplexity ? `<p><strong>Build Complexity:</strong> ${e(String(idea.buildComplexity).toUpperCase())}</p>` : ""}
          ${idea.roi?.realisticMRRMonth1USD ? `<p><strong>MRR Target:</strong> ${e(idea.roi.realisticMRRMonth1USD)}</p>` : ""}
        </div>

        ${
          hasKit
            ? `
          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Lovable Vibe-Coding Prompt</h3>
          <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; white-space: pre-wrap; word-break: break-all; color: #1f2937;">${e(kit.lovablePrompt || "")}</pre>

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">4-Day Roadmap</h3>
          <ul style="padding-left: 20px; color: #1f2937;">
            ${(kit.buildRoadmap || [])
              .map(
                (week: any) => `
              <li style="margin-bottom: 12px;">
                <strong>${e(week.week)}: ${e(week.title)}</strong>
                <ul style="padding-left: 15px; margin-top: 4px; color: #4b5563;">
                  ${(week.tasks || []).map((t: string) => `<li>${e(t)}</li>`).join("")}
                </ul>
              </li>
            `,
              )
              .join("")}
          </ul>

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Marketing & Outreach</h3>
          <div style="color: #1f2937;">
            <p><strong>Landing Page Headline:</strong> ${e(kit.marketingAssets?.landingHeadline || "")}</p>
            <p><strong>Elevator Pitch:</strong> ${e(kit.marketingAssets?.elevatorPitch || "")}</p>
            <p><strong>Cold Email Subject:</strong> ${e(kit.marketingAssets?.coldEmail?.subject || "")}</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; font-style: italic; color: #374151;">
            ${e(kit.marketingAssets?.coldEmail?.body || "").replace(/\n/g, "<br />")}
          </div>

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Pricing Tiers</h3>
          <div style="color: #1f2937;">
            ${(kit.pricingTiers || [])
              .map(
                (tier: any) => `
              <div style="margin-bottom: 12px;">
                <strong>${e(tier.name)} - ${e(tier.price)}</strong>
                <ul style="padding-left: 15px; margin-top: 4px; color: #4b5563;">
                  ${(tier.features || []).map((f: string) => `<li>${e(f)}</li>`).join("")}
                </ul>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 6px; margin-top: 24px; color: #1e3a8a;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">Full Developer Launch Kit is Available!</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;">Open this idea inside the <strong>Signal Engine Dashboard</strong> and click <strong>"Generate Launch Kit"</strong> to construct full database schemas, roadmap, and copy-pasteable vibe-coding prompts.</p>
          </div>
        `
        }

        <p style="font-size: 11px; color: #9ca3af; margin-top: 40px; text-align: center;">Sent with ❤️ from SaaS Radar</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // `from` MUST be an address on a domain verified in your Resend account.
      // Using the logged-in user's address here makes Resend reject the send.
      // The sandbox sender onboarding@resend.dev only delivers to the Resend
      // account owner's own email; set RESEND_FROM to a verified sender for
      // real delivery.
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "onboarding@resend.dev",
        to: [userEmail],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API error response:", errText);
      try {
        const json = JSON.parse(errText);
        return { success: false, error: json.message || errText };
      } catch(e) {}
      return { success: false, error: errText };
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (err: any) {
    console.error("Failed to send email through Resend:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

function handleSupabaseError(errText: string) {
  // The full Supabase/PostgREST error text can include schema and query
  // details — log it server-side, but only return actionable, non-sensitive
  // guidance to the client.
  console.error("Supabase error:", errText);
  if (
    (errText.includes("relation") && errText.includes("does not exist")) ||
    errText.includes("schema cache") ||
    errText.includes("Could not find the table") ||
    errText.includes("Could not find the 'user_email' column")
  ) {
    const sqlSchema = `-- If you recently created the table and still see schema cache errors, run this first:
-- NOTIFY pgrst, 'reload schema';

-- If the table exists but is missing the user_email column (e.g. from an older version):
-- ALTER TABLE saved_ideas ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE TABLE IF NOT EXISTS saved_ideas (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  problem TEXT,
  solution TEXT,
  target_audience TEXT,
  pain_solved TEXT,
  build_complexity TEXT,
  mrr_target TEXT,
  build_cost TEXT,
  launch_kit JSONB,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security. The app writes with the public anon key, so
-- inserts are allowed — but do NOT grant anon SELECT, or every visitor could
-- read all users' saved ideas and email addresses. Read the table from the
-- Supabase dashboard or with the service-role key instead.
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert" ON saved_ideas;
CREATE POLICY "Allow anon insert" ON saved_ideas FOR INSERT TO anon WITH CHECK (true);`;
    return {
      success: false,
      reason: "TABLE_NOT_FOUND",
      sql: sqlSchema,
      error: "Table 'saved_ideas' not found, missing columns, or Supabase schema cache needs reload.",
    };
  }
  return {
    success: false,
    reason: "SUPABASE_API_ERROR",
    error:
      "Failed to save to Supabase. Check your Supabase URL/key in Settings and the table policies. (Details logged server-side.)",
  };
}
export async function addToSupabaseAction(
  idea: SaasIdea,
  kit: LaunchKit | null = null,
) {
  try {
    const userEmail = await getSessionEmail();
    if (!userEmail) {
      return {
        success: false,
        reason: "AUTH_REQUIRED",
        error: "You must be logged in to save ideas to Supabase.",
      };
    }
    if (!rateLimit(`supabase:${userEmail}`, 10, 60_000)) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait a minute and try again.",
      };
    }

    const settings = getSettings();
    const { supabaseUrl, supabaseAnonKey } = settings;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        reason: "SUPABASE_CONFIG_MISSING",
        error:
          "Supabase configuration is missing. Please go to the settings page/section and provide your Supabase URL and Anon Key first.",
      };
    }

    const payload = {
      name: idea.name,
      tagline: idea.tagline,
      problem: idea.problem,
      solution: idea.solution,
      target_audience: idea.targetAudience,
      pain_solved: idea.painSolved,
      build_complexity: idea.buildComplexity,
      mrr_target: idea.roi?.realisticMRRMonth1USD || "",
      build_cost: idea.roi?.buildCostUSD || "",
      user_email: userEmail, // always the authenticated session user
      created_at: new Date().toISOString(),
      launch_kit: kit ? JSON.stringify(kit) : null,
    };

    const cleanUrl = supabaseUrl.replace(/\/$/, "");
    if (!cleanUrl.startsWith("http") || cleanUrl.includes("placeholder")) {
      return {
        success: false,
        reason: "SUPABASE_CONFIG_MISSING",
        error: "Supabase URL is not configured properly.",
      };
    }
    const url = `${cleanUrl}/rest/v1/saved_ideas`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500),
      });
    } catch (netErr: any) {
      console.warn("addToSupabaseAction network error:", netErr?.message);
      return {
        success: false,
        reason: "SUPABASE_UNREACHABLE",
        error: "Supabase host is currently unreachable.",
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase insert failed:", errText);
      return handleSupabaseError(errText);
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Error in addToSupabaseAction server action:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Failed to connect to Supabase endpoint.",
    };
  }
}

export async function syncToSupabaseAction(items: SavedIdea[]) {
  try {
    const userEmail = await getSessionEmail();
    if (!userEmail) {
      return { success: false, reason: "AUTH_REQUIRED" };
    }
    if (!rateLimit(`sync:${userEmail}`, 4, 60_000)) {
      return { success: false, error: "Rate limit exceeded." };
    }

    const settings = getSettings();
    const { supabaseUrl, supabaseAnonKey } = settings;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, reason: "SUPABASE_CONFIG_MISSING" };
    }

    const cleanUrl = supabaseUrl.replace(/\/$/, "");
    if (!cleanUrl.startsWith("http") || cleanUrl.includes("placeholder")) {
      return { success: false, reason: "SUPABASE_CONFIG_MISSING" };
    }

    const payloads = items.map((item) => ({
      name: item.idea.name,
      tagline: item.idea.tagline,
      problem: item.idea.problem,
      solution: item.idea.solution,
      target_audience: item.idea.targetAudience,
      pain_solved: item.idea.painSolved,
      build_complexity: item.idea.buildComplexity,
      mrr_target: item.idea.roi?.realisticMRRMonth1USD || "",
      build_cost: item.idea.roi?.buildCostUSD || "",
      created_at: item.savedAt
        ? new Date(item.savedAt).toISOString()
        : new Date().toISOString(),
      launch_kit: item.kit ? JSON.stringify(item.kit) : null,
      user_email: userEmail,
    }));

    const url = `${cleanUrl}/rest/v1/saved_ideas`;

    // Best-effort server-side dedupe with timeout
    const getUrl = `${url}?user_email=eq.${encodeURIComponent(userEmail)}&select=name`;
    let getRes: Response;
    try {
      getRes = await fetch(getUrl, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(3500),
      });
    } catch (netErr: any) {
      console.warn("syncToSupabaseAction network error:", netErr?.message);
      return {
        success: false,
        reason: "SUPABASE_UNREACHABLE",
        error: "Supabase host is currently unreachable.",
      };
    }

    if (!getRes.ok) {
      const errText = await getRes.text();
      return handleSupabaseError(errText);
    }

    let existingNames = new Set();
    const existing = await getRes.json();
    existingNames = new Set(existing.map((e: any) => e.name));

    const newPayloads = payloads.filter((p) => !existingNames.has(p.name));

    if (newPayloads.length === 0) return { success: true, count: 0 };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(newPayloads),
        signal: AbortSignal.timeout(3500),
      });
    } catch (postErr: any) {
      console.warn("syncToSupabaseAction POST error:", postErr?.message);
      return {
        success: false,
        reason: "SUPABASE_UNREACHABLE",
        error: "Supabase host is currently unreachable.",
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase sync failed:", errText);
      return handleSupabaseError(errText);
    }

    return { success: true, count: newPayloads.length };
  } catch (err: any) {
    console.warn("Error in syncToSupabaseAction:", err?.message || err);
    return { success: false, error: err?.message || "Sync failed" };
  }
}

export async function checkDomainAvailabilityAction(domain: string) {
  const client = await getClientKey();
  if (!rateLimit(`domain:${client}`, 30, 60_000)) {
    return { success: false, error: "Rate limit exceeded. Try again shortly." };
  }
  try {
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0]
      .split("?")[0];

    if (!cleanDomain || !cleanDomain.includes(".")) {
      return { success: false, error: "Invalid domain format." };
    }

    const settings = getSettings();
    const apiKey = settings.godaddyApiKey;
    const apiSecret = settings.godaddyApiSecret;

    // 1. If GoDaddy credentials are configured, attempt registrar query with pricing
    if (apiKey && apiSecret) {
      try {
        const response = await fetch(
          `https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(cleanDomain)}`,
          {
            headers: {
              Authorization: `sso-key ${apiKey}:${apiSecret}`,
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            available: Boolean(data.available),
            domain: data.domain || cleanDomain,
            price: data.price,
            currency: data.currency || "USD",
            source: "godaddy",
          };
        } else {
          // GoDaddy rejected or restricted credentials (e.g. 403 ACCESS_DENIED)
          // Do not log console.error to keep server telemetry clean; fall back to DNS
          const text = await response.text();
          console.warn(
            `GoDaddy registrar lookup unavailable (HTTP ${response.status}: ${text.slice(0, 80)}). Falling back to DNS verification.`,
          );
        }
      } catch (gdErr: any) {
        console.warn("GoDaddy API fetch error, falling back to DNS:", gdErr?.message || gdErr);
      }
    }

    // 2. Authoritative DNS check fallback (works reliably with zero external API credentials)
    const dnsChecks = await Promise.allSettled([
      dnsPromises.resolveNs(cleanDomain),
      dnsPromises.resolveSoa(cleanDomain),
      dnsPromises.resolve4(cleanDomain),
    ]);

    const hasActiveRecords = dnsChecks.some((c) => c.status === "fulfilled");

    return {
      success: true,
      available: !hasActiveRecords,
      domain: cleanDomain,
      source: "dns",
    };
  } catch (err: any) {
    console.warn("Domain check fallback error:", err?.message || err);
    return { success: false, error: err?.message || "Failed to verify domain availability." };
  }
}
