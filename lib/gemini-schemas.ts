
export const ideaGenerationSchema = {
  type: "OBJECT",
  properties: {
    niche: { type: "STRING" },
    marketSummary: { type: "STRING" },
    targetAudiences: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          size: { type: "STRING" },
          willingnessToPay: { type: "STRING" }
        }
      }
    },
    topPainPoints: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          pain: { type: "STRING" },
          severity: { type: "STRING" },
          audience: { type: "STRING" },
          currentWorkaround: { type: "STRING" }
        }
      }
    },
    saasIdeas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          tagline: { type: "STRING", description: "A short, catchy phrase that summarizes the SaaS idea." },
          description: { type: "STRING" },
          painSolved: { type: "STRING" },
          targetAudience: { type: "STRING" },
          demandLevel: { type: "STRING" },
          competitionLevel: { type: "STRING" },
          competitionReason: { type: "STRING" },
          buildComplexity: { type: "STRING" },
          integrationComplexity: { type: "STRING" },
          churnRisk: { type: "STRING" },
          boringScore: { type: "NUMBER" },
          gtmChannel: { type: "STRING", description: "MUST be a highly specific, actionable, and relevant go-to-market strategy. DO NOT use generic terms like 'Cold email' or 'SEO'. Provide a precise playbook (e.g., 'Scrape Apollo.io for Safety Managers at manufacturing plants with 50-200 employees, and send a 3-step cold email sequence offering a free OSHA compliance audit template')." },
          genesis: { type: "STRING" },
          marketAnalysis: { type: "STRING" },
          industryInsights: {
            type: "OBJECT",
            properties: {
              typicalChallenges: { type: "ARRAY", items: { type: "STRING" }, description: "Specific, non-obvious challenges typical to this legacy industry." },
              softwareAdoptionHurdles: { type: "ARRAY", items: { type: "STRING" }, description: "Specific reasons why this industry typically struggles with or resists new software (e.g., 'reliance on paper-based carbon forms', 'non-technical field staff')." }
            }
          },
          competitorAnalysis: {
            type: "OBJECT",
            properties: {
              majorCompetitors: { type: "ARRAY", items: { type: "STRING" } },
              competitorStrengths: { type: "STRING" },
              competitorWeaknesses: { type: "STRING" },
              uniqueSellingProposition: { type: "STRING" }
            }
          },
          marketValidation: {
            type: "OBJECT",
            properties: {
              indicators: { type: "ARRAY", items: { type: "STRING" }, description: "Specific indicators of market validation, e.g., '50+ customer testimonials complaining about X', 'waitlist of 200 early adopter sign-ups'." },
              metrics: { type: "STRING", description: "Concrete metrics showing demand." },
              earlyAdopterSignals: { type: "STRING", description: "Concrete early signals applicable to the niche, e.g., 'forum discussions showing high interest in Y'." },
              goNoGoScore: { type: "NUMBER", description: "Score from 1-10 based on validation details." },
              goNoGoReason: { type: "STRING", description: "Reasoning for the go/no-go score based on the validation details." }
            }
          },
          keyFeatures: { type: "ARRAY", items: { type: "STRING" } },
          redditSignal: { type: "STRING" },
          pricingTiers: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                price: { type: "STRING" },
                description: { type: "STRING" }
              }
            }
          },
          roiEstimate: {
            type: "OBJECT",
            properties: {
              buildCostUSD: { type: "STRING" },
              monthlyExpensesUSD: { type: "STRING" },
              realisticMRRMonth1USD: { type: "STRING" },
              roiMonth1Pct: { type: "STRING" },
              breakEvenMonths: { type: "STRING" },
              assumptions: { type: "STRING" }
            }
          }
        }
      }
    },
    verdict: { type: "STRING" }
  }
};

export const moreIdeasSchema = {
  type: "OBJECT",
  properties: {
    saasIdeas: ideaGenerationSchema.properties.saasIdeas
  }
};

export const launchKitSchema = {
  type: "OBJECT",
  properties: {
    lovablePrompt: { type: "STRING" },
    noCodeStack: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tool: { type: "STRING" },
          role: { type: "STRING" },
          why: { type: "STRING" },
          cost: { type: "STRING" },
          url: { type: "STRING" }
        }
      }
    },
    buildRoadmap: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          week: { type: "STRING" },
          title: { type: "STRING" },
          tasks: { type: "ARRAY", items: { type: "STRING" } }
        }
      }
    },
    presellValidation: { type: "ARRAY", items: { type: "STRING" } },
    validation: {
      type: "OBJECT",
      properties: {
        marketSizeSnapshot: { type: "STRING" },
        proofOfDemand: { type: "ARRAY", items: { type: "STRING" } },
        redFlags: { type: "ARRAY", items: { type: "STRING" } },
        testScripts: { type: "ARRAY", items: { type: "STRING" } },
        goNoGoScore: { type: "NUMBER" },
        goNoGoReason: { type: "STRING" }
      }
    },
    marketingAssets: {
      type: "OBJECT",
      properties: {
        landingHeadline: { type: "STRING" },
        landingSubheadline: { type: "STRING" },
        ctaButton: { type: "STRING" },
        elevatorPitch: { type: "STRING" },
        coldEmail: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING" },
            body: { type: "STRING" }
          }
        },
        socialPost: { type: "STRING" },
        blogPostIdeas: { type: "ARRAY", items: { type: "STRING" }, description: "3-5 catchy blog post titles that address the core pain point and attract the target audience." },
        socialContentStrategy: { type: "STRING", description: "A brief strategy for social media content (e.g., 'Post daily tips for property managers on LinkedIn', 'Share customer horror stories in specialized FB groups')." },
        objectionHandlers: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              objection: { type: "STRING" },
              response: { type: "STRING" }
            }
          }
        }
      }
    },
    salesScript: {
      type: "OBJECT",
      properties: {
        opener: { type: "STRING" },
        painQuestion: { type: "STRING" },
        pitch: { type: "STRING" },
        trialClose: { type: "STRING" },
        close: { type: "STRING" },
        followUp: { type: "STRING" },
        tips: { type: "ARRAY", items: { type: "STRING" } }
      }
    }
  }
};
