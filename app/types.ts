// Shared domain types used by both client components and server actions.

export interface SaasIdea {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  targetAudience: string;
  painSolved: string;
  competitors: string[];
  gtmChannel: string;
  buildComplexity: "simple" | "moderate" | "complex";
  integrationComplexity: "simple" | "moderate" | "complex";
  roi: {
    buildCostUSD: string;
    monthlyExpensesUSD: string;
    realisticMRRMonth1USD: string;
    breakEvenMonths: number;
    roiMonth1Pct: string;
    assumptions: string;
  };
  domains: {
    domain: string;
    likelihood: "High" | "Medium" | "Low";
    reason: string;
  }[];
}

export interface LaunchKit {
  lovablePrompt: string;
  buildRoadmap: {
    week: string;
    title: string;
    tasks: string[];
  }[];
  noCodeStack: {
    tool: string;
    role: string;
    why: string;
    cost: string;
  }[];
  marketingAssets: {
    landingHeadline: string;
    landingSubheadline: string;
    ctaButton: string;
    elevatorPitch: string;
    coldEmail: {
      subject: string;
      body: string;
    };
    socialPost: string;
    socialContentStrategy: string;
    blogPostIdeas: string[];
  };
  salesScript: {
    introduction: string;
    discoveryQuestions: string[];
    pitchValueProps: string[];
    objectionHandling: string[];
    callToAction: string;
  };
  pricingTiers?: {
    name: string;
    price: string;
    features: string[];
  }[];
  marketValidation?: {
    goNoGoScore: string;
    proofOfDemand: string;
    redFlags: string[];
  };
  preSellChecklist?: string[];
  databaseRequirements: {
    schemaDescription: string;
    sqlSchema?: string;
    tables: {
      name: string;
      fields: string[];
      purpose: string;
    }[];
  };
}

export interface SavedIdea {
  idea: SaasIdea;
  kit: LaunchKit | null;
  savedAt: string;
}
