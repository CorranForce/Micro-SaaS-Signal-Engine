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

export async function searchLeadsWithGroundingAction(service: string, city: string, userKey?: string) {
  const apiKey = userKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "Gemini API key is required. Please check your API Key in Settings or enter one." };
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

    const response = await ai.models.generateContent({
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
    });

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
    return { error: error.message || "Failed to search leads using Google Search grounding." };
  }
}

export async function compareCompetitorsAction(niche: string, userKey?: string) {
  const apiKey = userKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "Gemini API key is required. Please check your API Key in Settings or enter one." };
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

    const response = await ai.models.generateContent({
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
    });

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
    return { error: error.message || "Failed to search and compare competitors." };
  }
}
