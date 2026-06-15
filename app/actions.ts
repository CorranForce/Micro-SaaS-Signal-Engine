"use server";

import { GoogleGenAI, Type } from "@google/genai";

export async function checkDomainAction(domain: string, key?: string, secret?: string) {
  let apiKey = key || process.env.GODADDY_API_KEY;
  let apiSecret = secret || process.env.GODADDY_API_SECRET;
  if (apiKey === "MY_GODADDY_API_KEY") apiKey = "";
  if (apiSecret === "MY_GODADDY_API_SECRET") apiSecret = "";

  if (!apiKey || !apiSecret) {
    return { error: "GoDaddy API credentials are required. Please check your API Key and Secret in Settings." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`, {
      headers: {
        "Authorization": `sso-key ${apiKey}:${apiSecret}`,
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your GoDaddy API Key and Secret. They might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Your GoDaddy API Key does not have permission. Ensure you are using production keys and check IP allowlists.";
      if (res.status === 429) errorMessage = "Rate Limited: GoDaddy API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return await res.json();
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}

export async function testGoDaddyAction(key?: string, secret?: string) {
  let apiKey = key || process.env.GODADDY_API_KEY;
  let apiSecret = secret || process.env.GODADDY_API_SECRET;
  if (apiKey === "MY_GODADDY_API_KEY") apiKey = "";
  if (apiSecret === "MY_GODADDY_API_SECRET") apiSecret = "";

  if (!apiKey || !apiSecret) {
    return { error: "GoDaddy API credentials are required. Please check your API Key and Secret in Settings." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`https://api.godaddy.com/v1/domains/available?domain=example.guru`, {
      headers: {
        "Authorization": `sso-key ${apiKey}:${apiSecret}`,
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your GoDaddy API Key and Secret. They might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Your GoDaddy API Key does not have permission. Ensure you are using production keys and check IP allowlists.";
      if (res.status === 429) errorMessage = "Rate Limited: GoDaddy API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return { success: true };
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}

export async function checkConfigAction() {
  const hasGoDaddy = !!(
    process.env.GODADDY_API_KEY && 
    process.env.GODADDY_API_KEY !== "MY_GODADDY_API_KEY" && 
    process.env.GODADDY_API_SECRET && 
    process.env.GODADDY_API_SECRET !== "MY_GODADDY_API_SECRET"
  );
  const hasResend = !!(
    process.env.RESEND_API_KEY && 
    process.env.RESEND_API_KEY !== "MY_RESEND_API_KEY"
  );
  return {
    hasGoDaddy,
    hasResend
  };
}

export async function sendEmailAction(toEmail: string, subject: string, html: string, key?: string) {
  let apiKey = key || process.env.RESEND_API_KEY;
  if (apiKey === "MY_RESEND_API_KEY") {
    apiKey = "";
  }

  if (!apiKey) {
    return { error: "Resend API key is required. Please check your API Key in Settings." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Launch Kit <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your Resend API Key. It might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Verify your domain with Resend, or ensure you are sending to an allowed email address if using a sandbox domain.";
      if (res.status === 429) errorMessage = "Rate Limited: Resend API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return await res.json();
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}


function isValidGeminiKey(key?: any): key is string {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === 'undefined' || lower === 'null' || lower === 'my_gemini_api_key' || lower.includes('your_api_key')) return false;
  if (trimmed.startsWith('MY_') || trimmed.includes('INSERT_') || trimmed.includes('YOUR_')) return false;
  return trimmed.length >= 10;
}

function formatServerGeminiError(err: any): string {
  let msg = err?.message || String(err || "Unknown API Error");
  if (typeof msg === 'object') {
    try {
      msg = JSON.stringify(msg);
    } catch {
      msg = "Unknown API Error";
    }
  }
  const lower = msg.toLowerCase();
  if (lower.includes("invalid") || lower.includes("api key not valid") || lower.includes("api_key_invalid") || lower.includes("400") || lower.includes("argument")) {
    return "The Gemini API connection could not be established. This is typically due to an invalid or unconfigured API key. Please visit the Settings page to enter a valid Gemini API key starting with 'AIza'.";
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return "API Rate Limit or Quota Exceeded. Please try again after a few moments or use your own custom API key in Settings.";
  }
  return msg;
}

async function runWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 5,
  initialDelayMs: number = 2000
): Promise<T> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      const msg = error?.message || String(error || "");
      const lower = msg.toLowerCase();
      const isRateLimit = lower.includes("429") || 
                          lower.includes("rate limit") || 
                          lower.includes("quota") || 
                          lower.includes("resource_exhausted") || 
                          lower.includes("too many requests");
      
      if (isRateLimit && attempt < maxRetries) {
        console.log(`[GEMINI API] Rate limit observed. Backoff retry attempt ${attempt} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error("API transaction exhausted retry limits");
}

export async function searchLeadsWithGroundingAction(service: string, city: string, userKey?: string) {
  let apiKey = "";
  if (isValidGeminiKey(userKey)) {
    apiKey = userKey;
  } else if (isValidGeminiKey(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY;
  } else if (isValidGeminiKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY)) {
    apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }

  if (!apiKey) {
    return { error: "Gemini API key is invalid or not configured. Please go to the Settings page and configure a valid Gemini API Key starting with 'AIza'." };
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Find 6-10 real active businesses/service providers matching: "${service}" in city/region: "${city}".
For each business, identify their exact name, website domain/URL, phone number, physical address/location, and a 1-sentence description.
Use Google Search grounding to find real, currently operating local businesses. Do not invent any names or sites.

Return the response as a JSON object with a single property 'leads', which is an array of objects matching this TypeScript type:
{
  leads: Array<{
    name: string;
    website: string;
    phone: string;
    address: string;
    description: string;
  }>
}`;

    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["leads"],
          properties: {
            leads: {
              type: Type.ARRAY,
              description: "List of real local business leads found",
              items: {
                type: Type.OBJECT,
                required: ["name", "website", "phone", "address", "description"],
                properties: {
                  name: { type: Type.STRING },
                  website: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  address: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
    }));

    const text = response.text;
    if (!text) {
      throw new Error("No response text returned from Gemini model.");
    }

    const parsed = JSON.parse(text.trim());
    
    // Extract grounding chunks as source references
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || "Web Search Result",
      uri: chunk.web?.uri || ""
    })).filter((src: any) => src.uri);

    return { leads: parsed.leads || [], sources };
  } catch (error: any) {
    return { error: formatServerGeminiError(error) };
  }
}

export async function compareCompetitorsAction(niche: string, userKey?: string) {
  let apiKey = "";
  if (isValidGeminiKey(userKey)) {
    apiKey = userKey;
  } else if (isValidGeminiKey(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY;
  } else if (isValidGeminiKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY)) {
    apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }

  if (!apiKey) {
    return { error: "Gemini API key is invalid or not configured. Please go to the Settings page and configure a valid Gemini API Key starting with 'AIza'." };
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Perform research on 3 to 4 real-world competitors or similar services for the following micro-SaaS niche/idea: "${niche}".
Find real competitors operating in this area. For each competitor, identify:
1. Name of competitor
2. Target Customer / Audience
3. Key Features / Unique services they offer
4. Competitor Strengths
5. Competitor Weaknesses / Chinks in Armor (why a custom tailored boring micro-SaaS can win)
6. Real Website reference URL / Domain

Use Google Search grounding to look up real active companies, tools, platforms, or systems. Do not invent names or URLs.

Return the response as a JSON object with a single property 'competitors', which is an array of objects matching this TypeScript type:
{
  competitors: Array<{
    name: string;
    targetAudience: string;
    keyFeatures: string;
    strengths: string;
    weaknesses: string;
    website: string;
  }>
}`;

    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["competitors"],
          properties: {
            competitors: {
              type: Type.ARRAY,
              description: "List of real industry competitors found via search grounding",
              items: {
                type: Type.OBJECT,
                required: ["name", "targetAudience", "keyFeatures", "strengths", "weaknesses", "website"],
                properties: {
                  name: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  keyFeatures: { type: Type.STRING },
                  strengths: { type: Type.STRING },
                  weaknesses: { type: Type.STRING },
                  website: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
    }));

    const text = response.text;
    if (!text) {
      throw new Error("No response text returned from Gemini model.");
    }

    const parsed = JSON.parse(text.trim());
    
    // Extract grounding chunks as source references
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || "Web Search Result",
      uri: chunk.web?.uri || ""
    })).filter((src: any) => src.uri);

    return { competitors: parsed.competitors || [], sources };
  } catch (error: any) {
    return { error: formatServerGeminiError(error) };
  }
}

export async function generateContentAction(options: {
  model: string;
  contents: string;
  config?: any;
  userKey?: string;
}) {
  let apiKey = "";
  if (isValidGeminiKey(options.userKey)) {
    apiKey = options.userKey;
  } else if (isValidGeminiKey(process.env.GEMINI_API_KEY)) {
    apiKey = process.env.GEMINI_API_KEY;
  } else if (isValidGeminiKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY)) {
    apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }

  if (!apiKey) {
    return { error: "Gemini API key is invalid or not configured. Please visit the Settings page (via the top-right button) to configure a valid API key." };
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await runWithRetry(() => ai.models.generateContent({
      model: options.model,
      contents: options.contents,
      config: options.config,
    }));

    const chunksRaw = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const chunks = chunksRaw.map((chunk: any) => ({
      web: {
        title: chunk.web?.title || "Web Search Result",
        uri: chunk.web?.uri || ""
      }
    }));
    const sources = chunks.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((src: any) => src.uri);

    return { 
      text: response.text || "", 
      sources,
      chunks
    };
  } catch (error: any) {
    return { error: formatServerGeminiError(error) };
  }
}


