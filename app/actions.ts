"use server";

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Settings > Secrets panel of AI Studio.",
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

export async function searchSaaSIdeas(niche: string, context: string) {
  try {
    const ai = getAIClient();

    const prompt = `You are Signal Engine — an elite B2B micro-SaaS researcher. Your specialty is finding "boring", unglamorous, highly underserved B2B opportunities in legacy offline industries (e.g., HVAC, construction, pest control, local logistics, veterinary clinics, waste management, dry cleaning). These businesses have low competition, high willingness to pay, and very low churn.

User inputs:
- Focus Niche/Industry: ${niche || "Any Legacy B2B Industry"}
- Additional Context/Interests: ${context || "None provided"}

Generate EXACTLY 3 unique B2B micro-SaaS opportunities targeting this niche.

Return ONLY a valid JSON object matching the requested schema. Ensure the ideas are realistic, solve deep workflow pains (administrative, reporting, billing, or scheduling friction), and provide an calculated Return on Investment (ROI) matrix assuming standard AI app builder setup (e.g. build costs: $50-150 for simple, $150-300 for moderate, $300-600 for complex; monthly operations: $50-120). Also, suggest 3 highly professional, brand-new available dotcom domains with likelihood scores.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error in searchSaaSIdeas Server Action:", error);
    throw new Error(
      error.message ||
        "Failed to search SaaS ideas. Please verify your GEMINI_API_KEY.",
    );
  }
}

export async function generateLaunchKit(idea: {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  painSolved: string;
}) {
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
9. preSellChecklist gives a list of action items before launching.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error in generateLaunchKit Server Action:", error);
    throw new Error(error.message || "Failed to generate Launch Kit.");
  }
}

export async function getLatestNewsForNiche(niche: string) {
  try {
    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Find the 3 most recent, relevant news headlines or business trends in the "${niche}" industry. Return a clean JSON array with title, source, and an approximate date.`,
      tools: [{ googleSearch: {} }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              date: { type: Type.STRING },
            },
            required: ["title", "source", "date"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      return [];
    }
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error fetching news:", error);
    return [];
  }
}

// --- AUTHENTICATION & API SETTINGS ACTIONS ---

import {
  getSettings,
  saveSettings,
  getUsers,
  saveUsers,
  ApiSettings,
} from "./db";
import crypto from "crypto";
import { cookies } from "next/headers";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function loginUser(email: string, password: string) {
  try {
    const users = getUsers();
    const user = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) {
      throw new Error(
        "No user found with this email. You can register a new account.",
      );
    }
    const pwdHash = hashPassword(password);
    if (user.passwordHash !== pwdHash) {
      throw new Error("Incorrect password.");
    }

    const cookieStore = await cookies();
    cookieStore.set("session_user", user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return { success: true, email: user.email };
  } catch (error: any) {
    throw new Error(error.message || "Failed to log in.");
  }
}

export async function registerUser(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    const users = getUsers();
    const exists = users.some(
      (u: any) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const cookieStore = await cookies();
    cookieStore.set("session_user", newUser.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return { success: true, email: newUser.email };
  } catch (error: any) {
    throw new Error(error.message || "Failed to register.");
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_user");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to log out.");
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_user");
    return sessionCookie ? sessionCookie.value : null;
  } catch (e) {
    return null;
  }
}

export async function loadApiSettings(email: string) {
  try {
    if (!email || email.toLowerCase() !== "corranforce@gmail.com") {
      throw new Error(
        "Access Denied: Only corranforce@gmail.com can manage API settings.",
      );
    }
    return getSettings();
  } catch (error: any) {
    throw new Error(error.message || "Failed to load API settings.");
  }
}

export async function updateApiSettings(email: string, settings: ApiSettings) {
  try {
    if (!email || email.toLowerCase() !== "corranforce@gmail.com") {
      throw new Error(
        "Access Denied: Only corranforce@gmail.com can manage API settings.",
      );
    }
    saveSettings(settings);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to update API settings.");
  }
}

export async function chatWithAgent(
  history: { role: "user" | "model"; parts: [{ text: string }] }[],
  message: string,
  taskType: "complex" | "general" | "fast" = "general",
) {
  try {
    const ai = getAIClient();

    let model = "gemini-3.5-flash";
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

    return response.text;
  } catch (error: any) {
    console.error("Error in chatWithAgent Server Action:", error);
    throw new Error(error.message || "Failed to generate chat response.");
  }
}

export async function getRealtimeSuggestions(
  niche: string,
  currentText: string,
) {
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
      model: "gemini-3.5-flash",
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

export async function sendLaunchKitEmail(
  userEmail: string,
  idea: any,
  kit: any,
) {
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

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111827; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h1 style="color: #00f076; font-size: 24px; margin-bottom: 4px;">SaaS Radar Opportunity</h1>
        <p style="color: #4b5563; font-size: 14px; margin-top: 0;">Your premium B2B SaaS blueprint is ready.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <h2 style="font-size: 18px; margin-bottom: 8px; color: #111827;">${idea.name}</h2>
        <p style="font-style: italic; color: #4b5563; margin-top: 0;">"${idea.tagline}"</p>
        
        <div style="margin-top: 16px;">
          <p><strong>Problem:</strong> ${idea.problem}</p>
          <p><strong>Solution:</strong> ${idea.solution}</p>
          <p><strong>Target Customer:</strong> ${idea.targetAudience}</p>
          <p><strong>Pain Solved:</strong> ${idea.painSolved || ""}</p>
          ${idea.buildComplexity ? `<p><strong>Build Complexity:</strong> ${idea.buildComplexity.toUpperCase()}</p>` : ""}
          ${idea.roi?.realisticMRRMonth1USD ? `<p><strong>MRR Target:</strong> ${idea.roi.realisticMRRMonth1USD}</p>` : ""}
        </div>
        
        ${
          hasKit
            ? `
          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Lovable Vibe-Coding Prompt</h3>
          <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; white-space: pre-wrap; word-break: break-all; color: #1f2937;">${kit.lovablePrompt || ""}</pre>
          
          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">4-Week Roadmap</h3>
          <ul style="padding-left: 20px; color: #1f2937;">
            ${(kit.buildRoadmap || [])
              .map(
                (week: any) => `
              <li style="margin-bottom: 12px;">
                <strong>${week.week}: ${week.title}</strong>
                <ul style="padding-left: 15px; margin-top: 4px; color: #4b5563;">
                  ${(week.tasks || []).map((t: string) => `<li>${t}</li>`).join("")}
                </ul>
              </li>
            `,
              )
              .join("")}
          </ul>

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Marketing & Outreach</h3>
          <div style="color: #1f2937;">
            <p><strong>Landing Page Headline:</strong> ${kit.marketingAssets?.landingHeadline || ""}</p>
            <p><strong>Elevator Pitch:</strong> ${kit.marketingAssets?.elevatorPitch || ""}</p>
            <p><strong>Cold Email Subject:</strong> ${kit.marketingAssets?.coldEmail?.subject || ""}</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; font-style: italic; color: #374151;">
            ${(kit.marketingAssets?.coldEmail?.body || "").replace(/\n/g, "<br />")}
          </div>

          <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; color: #111827;">Pricing Tiers</h3>
          <div style="color: #1f2937;">
            ${(kit.pricingTiers || [])
              .map(
                (tier: any) => `
              <div style="margin-bottom: 12px;">
                <strong>${tier.name} - ${tier.price}</strong>
                <ul style="padding-left: 15px; margin-top: 4px; color: #4b5563;">
                  ${(tier.features || []).map((f: string) => `<li>${f}</li>`).join("")}
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
        from: "SaaS Radar <onboarding@resend.dev>",
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
      user_email: (kit && kit.user_email) || "anonymous", // fallback or we can accept it in params
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

-- Enable Row Level Security (or allow anon write inserts)
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert" ON saved_ideas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON saved_ideas FOR SELECT TO anon USING (true);`;

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

export async function syncToSupabaseAction(userEmail: string, items: any[]) {
  try {
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

    // Fetch existing names for this user to avoid duplicates
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
