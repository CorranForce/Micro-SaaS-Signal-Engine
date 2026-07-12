"use server";

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cookies, headers } from "next/headers";
import {
  createSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword,
  rateLimit,
  escapeHtml,
} from "./security";
import {
  getSettings,
  saveSettings,
  getUsers,
  saveUsers,
  ApiSettings,
} from "./db";

const OPERATOR_EMAIL = (
  process.env.OPERATOR_EMAIL || "corranforce@gmail.com"
).toLowerCase();
const SESSION_COOKIE = "session_token";

// Identity comes from the signed session cookie — never from client-supplied
// parameters. Returns null for anonymous/invalid/expired sessions.
async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

async function setSessionCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
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
): Promise<GenerationResult<{ saasIdeas: any[] }>> {
  const client = await getClientKey();
  if (!rateLimit(`search:${client}`, 10, 60_000)) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a minute and try again.",
    };
  }
  try {
    const ai = getAIClient();

    const prompt = `You are Signal Engine — an elite B2B micro-SaaS researcher. Your specialty is finding "boring", unglamorous, highly underserved B2B opportunities in legacy offline industries (e.g., HVAC, construction, pest control, local logistics, veterinary clinics, waste management, dry cleaning). These businesses have low competition, high willingness to pay, and very low churn.

User inputs:
- Focus Niche/Industry: ${niche || "Any Legacy B2B Industry"}
- Additional Context/Interests: ${context || "None provided"}

Generate EXACTLY 3 unique B2B micro-SaaS opportunities targeting this niche.

Return ONLY a valid JSON object matching the requested schema. Ensure the ideas are realistic, solve deep workflow pains (administrative, reporting, billing, or scheduling friction), and provide an calculated Return on Investment (ROI) matrix assuming standard AI app builder setup (e.g. build costs: $50-150 for simple, $150-300 for moderate, $300-600 for complex; monthly operations: $50-120). Also, suggest 3 highly professional, brand-new available dotcom domains with likelihood scores.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
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
                  "roi",
                  "domains",
                ],
              },
            },
          },
          required: ["saasIdeas"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API");
    }
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.error("Error in searchSaaSIdeas Server Action:", error);
    return {
      success: false,
      error:
        error.message ||
        "Failed to search SaaS ideas. Please verify your GEMINI_API_KEY.",
    };
  }
}

export async function generateLaunchKit(idea: {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  painSolved: string;
}): Promise<GenerationResult<any>> {
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
2. buildRoadmap has a detailed 4-week task-by-task execution plan.
3. noCodeStack maps actual modern SaaS builders (Stripe, Supabase, Resend, etc.) with estimated costs.
4. marketingAssets contains customized landing headlines, social copy, blog ideas, and cold outreach emails.
5. salesScript provides highly structured questions, objections, and pitch structures to close the target audience.
6. databaseRequirements outlines actual database schema tables with field types, descriptions, AND a complete valid PostgreSQL / Supabase SQL schema script in 'sqlSchema' that creates all these tables, relationships, and relevant indexes with comments.
7. pricingTiers defines the saas pricing plans.
8. marketValidation provides a go/no-go score out of 100, proof of demand, and any red flags.
9. preSellChecklist gives a list of action items before launching.
10. validationChecklist gives a step-by-step list of actions to verify market demand before building.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
                  week: { type: Type.STRING },
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
    console.error("Error in generateLaunchKit Server Action:", error);
    return {
      success: false,
      error: error.message || "Failed to generate Launch Kit.",
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

  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  // Same message whether the account exists or not — no user enumeration.
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const { valid, needsUpgrade } = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  if (needsUpgrade) {
    // Transparently migrate legacy SHA-256 hashes to salted scrypt.
    user.passwordHash = hashPassword(password);
    saveUsers(users);
  }

  await setSessionCookie(user.email);
  return { success: true, email: user.email };
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
  return getSettings();
}

export async function updateApiSettings(settings: ApiSettings) {
  const email = await getSessionEmail();
  if (!email || email.toLowerCase() !== OPERATOR_EMAIL) {
    return { error: "Access denied." };
  }
  saveSettings(settings);
  return { success: true };
}

export async function chatWithAgent(
  history: { role: "user" | "model"; parts: [{ text: string }] }[],
  message: string,
  taskType: "complex" | "general" | "fast" = "general",
): Promise<string> {
  const client = await getClientKey();
  if (!rateLimit(`chat:${client}`, 20, 60_000)) {
    throw new Error("Rate limit exceeded. Please slow down and try again.");
  }
  try {
    const ai = getAIClient();

    let model = "gemini-3.1-flash-lite";
    let config: any = {
      systemInstruction:
        "You are an expert SaaS advisor and micro-SaaS ideation assistant. You help users refine their startup ideas, understand market dynamics, and build production-ready launch kits.",
    };

    if (taskType === "complex") {
      model = "gemini-3.1-pro-preview";
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (taskType === "fast") {
      model = "gemini-3.1-flash-lite";
    }

    const contents = [...history, { role: "user", parts: [{ text: message }] }];

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    return (
      response.text ?? "Sorry — no response was generated. Please try again."
    );
  } catch (error: any) {
    console.error("Error in chatWithAgent Server Action:", error);
    throw new Error(error.message || "Failed to generate chat response.");
  }
}

export async function getRealtimeSuggestions(
  niche: string,
  currentText: string,
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

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
    console.error("Error in getRealtimeSuggestions:", error);
    return { keywords: [], suggestions: [] };
  }
}

export async function sendLaunchKitEmail(idea: any, kit: any = null) {
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
    const e = escapeHtml;

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

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">4-Week Roadmap</h3>
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
      body: JSON.stringify({
        // Note: the default onboarding@resend.dev sandbox sender only
        // delivers to the Resend account owner's address. Set RESEND_FROM
        // to a verified domain sender for real delivery.
        from: process.env.RESEND_FROM || "SaaS Radar <onboarding@resend.dev>",
        to: [userEmail],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API error response:", errText);
      return { success: false, error: errText };
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (err: any) {
    console.error("Failed to send email through Resend:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function addToSupabaseAction(idea: any, kit: any = null) {
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
    const url = `${cleanUrl}/rest/v1/saved_ideas`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = { message: errText };
      }

      if (
        (errText.includes("relation") && errText.includes("does not exist")) ||
        errText.includes("schema cache") ||
        errText.includes("Could not find the table")
      ) {
        const sqlSchema = `-- If you recently created the table and still see schema cache errors, run this first:
-- NOTIFY pgrst, 'reload schema';

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
CREATE POLICY "Allow anon insert" ON saved_ideas FOR INSERT TO anon WITH CHECK (true);`;

        return {
          success: false,
          reason: "TABLE_NOT_FOUND",
          sql: sqlSchema,
          error:
            "Table 'saved_ideas' not found (or Supabase schema cache needs reload).",
        };
      }

      return {
        success: false,
        reason: "SUPABASE_API_ERROR",
        error: parsedErr.message || "Failed to insert into Supabase.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in addToSupabaseAction server action:", err);
    return {
      success: false,
      error: err.message || "Failed to connect to Supabase endpoint.",
    };
  }
}

export async function syncToSupabaseAction(items: any[]) {
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

    const cleanUrl = supabaseUrl.replace(/\/$/, "");
    const url = `${cleanUrl}/rest/v1/saved_ideas`;

    // Best-effort server-side dedupe. With the recommended RLS (no anon
    // SELECT) this returns nothing — the client also tracks synced items
    // locally, which is the primary duplicate guard.
    const getUrl = `${url}?user_email=eq.${encodeURIComponent(userEmail)}&select=name`;
    const getRes = await fetch(getUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    let existingNames = new Set();
    if (getRes.ok) {
      const existing = await getRes.json();
      existingNames = new Set(existing.map((e: any) => e.name));
    }

    const newPayloads = payloads.filter((p) => !existingNames.has(p.name));

    if (newPayloads.length === 0) return { success: true, count: 0 };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(newPayloads),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase sync failed:", errText);
      return { success: false, error: errText };
    }

    return { success: true, count: newPayloads.length };
  } catch (err: any) {
    console.error("Error in syncToSupabaseAction:", err);
    return { success: false, error: err.message };
  }
}

export async function checkDomainAvailabilityAction(domain: string) {
  const client = await getClientKey();
  if (!rateLimit(`domain:${client}`, 30, 60_000)) {
    return { success: false, error: "Rate limit exceeded. Try again shortly." };
  }
  try {
    const settings = getSettings();
    const apiKey = settings.godaddyApiKey;
    const apiSecret = settings.godaddyApiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        reason: "GODADDY_CONFIG_MISSING",
        error: "GoDaddy API keys are not configured in settings.",
      };
    }

    const response = await fetch(
      `https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          Authorization: `sso-key ${apiKey}:${apiSecret}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("GoDaddy API error:", text);
      return { success: false, error: "Failed to check domain availability." };
    }

    const data = await response.json();
    return {
      success: true,
      available: data.available,
      domain: data.domain,
      price: data.price,
    };
  } catch (err: any) {
    console.error("Domain check error:", err);
    return { success: false, error: err.message };
  }
}
