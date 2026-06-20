import { Type } from "@google/genai";

export const ideaGenerationSchema = {
  type: Type.OBJECT,
  required: ["niche", "marketSummary", "targetAudiences", "topPainPoints", "saasIdeas", "verdict"],
  properties: {
    niche: { type: Type.STRING },
    marketSummary: { type: Type.STRING },
    targetAudiences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "description", "size", "willingnessToPay"],
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          size: { type: Type.STRING },
          willingnessToPay: { type: Type.STRING }
        }
      }
    },
    topPainPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["pain", "severity", "audience", "currentWorkaround"],
        properties: {
          pain: { type: Type.STRING },
          severity: { type: Type.STRING },
          audience: { type: Type.STRING },
          currentWorkaround: { type: Type.STRING }
        }
      }
    },
    saasIdeas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "name", "tagline", "description", "painSolved", "targetAudience", 
          "demandLevel", "competitionLevel", "competitionReason", 
          "buildComplexity", "integrationComplexity", "churnRisk", "boringScore", 
          "gtmChannel", "genesis", "marketAnalysis", "industryInsights", 
          "competitorAnalysis", "marketValidation", "keyFeatures", "redditSignal", 
          "pricingTiers", "roiEstimate"
        ],
        properties: {
          name: { type: Type.STRING },
          tagline: { type: Type.STRING, description: "A short, catchy phrase that summarizes the SaaS idea." },
          description: { type: Type.STRING },
          painSolved: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          demandLevel: { type: Type.STRING },
          competitionLevel: { type: Type.STRING },
          competitionReason: { type: Type.STRING },
          buildComplexity: { type: Type.STRING },
          integrationComplexity: { type: Type.STRING },
          churnRisk: { type: Type.STRING },
          boringScore: { type: Type.NUMBER },
          gtmChannel: { type: Type.STRING, description: "MUST be a highly specific, actionable, and relevant go-to-market strategy. DO NOT use generic terms like 'Cold email' or 'SEO'. Provide a precise playbook (e.g., 'Scrape Apollo.io for Safety Managers at manufacturing plants with 50-200 employees, and send a 3-step cold email sequence offering a free OSHA compliance audit template')." },
          genesis: { type: Type.STRING },
          marketAnalysis: { type: Type.STRING },
          industryInsights: {
            type: Type.OBJECT,
            required: ["typicalChallenges", "softwareAdoptionHurdles"],
            properties: {
              typicalChallenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific, non-obvious challenges typical to this legacy industry." },
              softwareAdoptionHurdles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific reasons why this industry typically struggles with or resists new software (e.g., 'reliance on paper-based carbon forms', 'non-technical field staff')." }
            }
          },
          competitorAnalysis: {
            type: Type.OBJECT,
            required: ["majorCompetitors", "competitorStrengths", "competitorWeaknesses", "uniqueSellingProposition"],
            properties: {
              majorCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } },
              competitorStrengths: { type: Type.STRING },
              competitorWeaknesses: { type: Type.STRING },
              uniqueSellingProposition: { type: Type.STRING }
            }
          },
          marketValidation: {
            type: Type.OBJECT,
            required: ["indicators", "metrics", "earlyAdopterSignals", "goNoGoScore", "goNoGoReason"],
            properties: {
              indicators: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific indicators of market validation, e.g., '50+ customer testimonials complaining about X', 'waitlist of 200 early adopter sign-ups'." },
              metrics: { type: Type.STRING, description: "Concrete metrics showing demand." },
              earlyAdopterSignals: { type: Type.STRING, description: "Concrete early signals applicable to the niche, e.g., 'forum discussions showing high interest in Y'." },
              goNoGoScore: { type: Type.NUMBER, description: "Score from 1-10 based on validation details." },
              goNoGoReason: { type: Type.STRING, description: "Reasoning for the go/no-go score based on the validation details." }
            }
          },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          redditSignal: { type: Type.STRING },
          pricingTiers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["name", "price", "description"],
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          roiEstimate: {
            type: Type.OBJECT,
            required: ["buildCostUSD", "monthlyExpensesUSD", "realisticMRRMonth1USD", "roiMonth1Pct", "breakEvenMonths", "assumptions"],
            properties: {
              buildCostUSD: { type: Type.STRING },
              monthlyExpensesUSD: { type: Type.STRING },
              realisticMRRMonth1USD: { type: Type.STRING },
              roiMonth1Pct: { type: Type.STRING },
              breakEvenMonths: { type: Type.STRING },
              assumptions: { type: Type.STRING }
            }
          }
        }
      }
    },
    verdict: { type: Type.STRING }
  }
};

export const moreIdeasSchema = {
  type: Type.OBJECT,
  properties: {
    saasIdeas: ideaGenerationSchema.properties.saasIdeas
  }
};

export const launchKitSchema = {
  type: Type.OBJECT,
  properties: {
    lovablePrompt: { type: Type.STRING },
    noCodeStack: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tool: { type: Type.STRING },
          role: { type: Type.STRING },
          why: { type: Type.STRING },
          cost: { type: Type.STRING },
          url: { type: Type.STRING }
        }
      }
    },
    buildRoadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.STRING },
          title: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    presellValidation: { type: Type.ARRAY, items: { type: Type.STRING } },
    validation: {
      type: Type.OBJECT,
      properties: {
        marketSizeSnapshot: { type: Type.STRING },
        proofOfDemand: { type: Type.ARRAY, items: { type: Type.STRING } },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        testScripts: { type: Type.ARRAY, items: { type: Type.STRING } },
        goNoGoScore: { type: Type.NUMBER },
        goNoGoReason: { type: Type.STRING }
      }
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
            body: { type: Type.STRING }
          }
        },
        socialPost: { type: Type.STRING },
        blogPostIdeas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 catchy blog post titles that address the core pain point and attract the target audience." },
        socialContentStrategy: { type: Type.STRING, description: "A brief strategy for social media content (e.g., 'Post daily tips for property managers on LinkedIn', 'Share customer horror stories in specialized FB groups')." },
        objectionHandlers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              objection: { type: Type.STRING },
              response: { type: Type.STRING }
            }
          }
        }
      }
    },
    salesScript: {
      type: Type.OBJECT,
      properties: {
        opener: { type: Type.STRING },
        painQuestion: { type: Type.STRING },
        pitch: { type: Type.STRING },
        trialClose: { type: Type.STRING },
        close: { type: Type.STRING },
        followUp: { type: Type.STRING },
        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  }
};
