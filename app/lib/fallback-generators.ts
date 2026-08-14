import type {
  SaasIdea,
  DeepThinkingAnalysis,
  LaunchKit,
} from "../types";

export function getFallbackSaaSIdeas(niche: string, context: string): SaasIdea[] {
  const cleanNiche = niche?.trim() || "B2B Field Services";
  const cleanContext = context?.trim() || "Mobile workflow automation";

  return [
    {
      name: `${cleanNiche.split(" ")[0]}Pulse HQ`,
      tagline: `Automated dispatch, field audit logging, and instant billing for ${cleanNiche} operators.`,
      problem: `Operators in ${cleanNiche} lose 15+ hours weekly on paper job sheets, delayed invoice approvals, and missed compliance deadlines.`,
      solution: `A lightweight, mobile-first SaaS platform unifying job scheduling, customer SMS updates, offline audit logs, and 1-click QuickBooks sync.`,
      targetAudience: `Small-to-midsize ${cleanNiche} business owners and fleet dispatch managers (5-50 staff).`,
      painSolved: `Eliminates billable hours leakage, reduces invoice turnaround from 21 days to 24 hours, and ensures 100% compliance record accuracy.`,
      competitors: [`Generic Jobber`, `Manual Spreadsheets`, `Legacy Desktop ERPs`],
      gtmChannel: `Direct LinkedIn cold outreach to trade association members and regional distributor partnerships.`,
      buildComplexity: "simple",
      integrationComplexity: "moderate",
      marketDemandScore: 9,
      hotnessScore: 5,
      roi: {
        buildCostUSD: "$150",
        monthlyExpensesUSD: "$65",
        realisticMRRMonth1USD: "$1,200",
        breakEvenMonths: 1,
        roiMonth1Pct: "700%",
        assumptions: "4 beta accounts paying $300/mo on annual contracts.",
      },
      domains: [
        {
          domain: `${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}pulse.com`,
          likelihood: "High",
          reason: "Clear brand authority for operational management.",
        },
        {
          domain: `get${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}hq.com`,
          likelihood: "High",
          reason: "Direct action call domain for SaaS conversions.",
        },
        {
          domain: `${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}flow.io`,
          likelihood: "Medium",
          reason: "Modern tech-forward brand feel.",
        },
      ],
    },
    {
      name: `ComplianceShield ${cleanNiche.split(" ")[0]}`,
      tagline: `Automated safety checklists, OSHA audit trails, and certification alerts for ${cleanNiche}.`,
      problem: `${cleanNiche} businesses face massive regulatory fines and insurance rate hikes when equipment inspections or worker certifications lapse.`,
      solution: `Automated mobile inspection routines, photo verification with GPS timestamping, and instant audit PDF generation.`,
      targetAudience: `EHS (Environmental Health & Safety) directors, shop foremen, and compliance managers in ${cleanNiche}.`,
      painSolved: `Prevents $10,000+ regulatory fines, lowers worker comp insurance premiums by 12%, and automates weekly safety reports.`,
      competitors: [`Paper binder checklists`, `Generic Formstack`, `Heavy Enterprise EHS software`],
      gtmChannel: `Sponsoring state safety trade association newsletters and cold email campaigns targeting EHS managers.`,
      buildComplexity: "moderate",
      integrationComplexity: "simple",
      marketDemandScore: 8,
      hotnessScore: 4,
      roi: {
        buildCostUSD: "$250",
        monthlyExpensesUSD: "$85",
        realisticMRRMonth1USD: "$1,800",
        breakEvenMonths: 1,
        roiMonth1Pct: "620%",
        assumptions: "6 compliance accounts at $300/mo.",
      },
      domains: [
        {
          domain: `shieldfor${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          likelihood: "High",
          reason: "Establishes trust and compliance focus instantly.",
        },
        {
          domain: `${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}audit.com`,
          likelihood: "Medium",
          reason: "Highly category-specific domain.",
        },
        {
          domain: `try${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}shield.com`,
          likelihood: "High",
          reason: "Great conversion landing domain.",
        },
      ],
    },
    {
      name: `ContractSync ${cleanNiche.split(" ")[0]}`,
      tagline: `Automated recurring contract billing, change-order approvals, and retainer tracking.`,
      problem: `${cleanNiche} providers struggle with out-of-scope work requests that are performed for free without formal change orders or billing adjustments.`,
      solution: `Mobile SMS change-order approval engine where field technicians capture client e-signatures on job sites in seconds.`,
      targetAudience: `Contractors, service business owners, and client account leads in ${cleanNiche}.`,
      painSolved: `Recovers 8-12% of unbilled revenue trapped in unrecorded job-site scope changes.`,
      competitors: [`Verbal agreements`, `DocuSign (too slow/expensive)`, `Manual pen-and-paper notes`],
      gtmChannel: `Direct integration partnerships with regional supplier portals and local trade meetups.`,
      buildComplexity: "simple",
      integrationComplexity: "simple",
      marketDemandScore: 9,
      hotnessScore: 5,
      roi: {
        buildCostUSD: "$100",
        monthlyExpensesUSD: "$45",
        realisticMRRMonth1USD: "$1,500",
        breakEvenMonths: 1,
        roiMonth1Pct: "1400%",
        assumptions: "10 contractor accounts at $150/mo.",
      },
      domains: [
        {
          domain: `contract${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          likelihood: "High",
          reason: "Strong commercial keyword intent.",
        },
        {
          domain: `getcontractsync.com`,
          likelihood: "High",
          reason: "Clear SaaS identity.",
        },
        {
          domain: `${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, "")}billing.io`,
          likelihood: "Medium",
          reason: "Modern financial workflow domain.",
        },
      ],
    },
  ];
}

export function getFallbackDeepThinkingAnalysis(idea: SaasIdea): DeepThinkingAnalysis {
  return {
    reasoningSummary: `Strategic Audit for "${idea.name}": The core value proposition relies on solving high-frequency operational friction in ${idea.targetAudience}. Incumbent software is typically bloated and built for desktop, creating an opening for a mobile-first, zero-training micro-SaaS wedge.`,
    threatMatrix: {
      competitorRisk: `Horizontal field service suites (e.g. Jobber, ServiceTitan) may attempt lightweight feature additions, but lack deep industry-specific compliance workflows.`,
      regulatoryRisk: `Changing regional labor regulations and privacy standards require dynamic consent logging and audit record retention.`,
      executionFriction: `Non-technical field staff require zero-friction UX with offline sync and high-contrast touch interfaces.`,
    },
    distributionMoats: [
      `Direct cold email campaigns targeting niche trade association directories.`,
      `Co-marketing with local equipment suppliers and distributors who interact daily with the target buyers.`,
      `High-intent programmatic SEO landing pages targeting exact long-tail industry compliance keywords.`,
    ],
    pricingElasticity: `High willingness-to-pay ($199-$499/mo) because the product directly prevents thousands in billable leakage and regulatory fines.`,
    technicalArchitecture: `Next.js 15 App Router, Supabase PostgreSQL with Row Level Security, Stripe Webhooks for subscription billing, and Resend for transactional email notifications.`,
  };
}

export function getFallbackLaunchKit(idea: SaasIdea): LaunchKit {
  const name = idea.name || "MicroSaaS Launch";
  return {
    lovablePrompt: `Build a modern, production-ready B2B Micro-SaaS web application called "${name}".
Target Audience: ${idea.targetAudience}
Core Problem Solved: ${idea.problem}
Key Solution Features:
1. Executive Dashboard: Key metrics (active jobs, unbilled change orders, compliance score, revenue pipeline).
2. Job & Inspection Tracker: Interactive table with status filters, search, detail drawer, photo upload simulator, and audit exports.
3. Client Invoicing & SMS Approvals: One-click change-order builder with SMS approval link preview and Stripe payment link generator.
4. Settings & Team Access: Role-based permissions (Admin, Foreman, Technician), branding logo upload, and webhook integrations.

Tech Stack & Theme:
- Framework: Next.js 15 App Router with TypeScript and Tailwind CSS.
- Styling: High-contrast dark luxury theme with emerald accents (#10b981), sleek border cards, clean typography (Inter + Plus Jakarta Sans).
- Icons: Lucide React.
- State: Local persistence with real-time UI updates, optimistic UI states, and toast notifications.`,
    buildRoadmap: [
      {
        week: "Week 1",
        title: "Foundation & Core UI Layout",
        tasks: [
          "Setup Next.js 15 App Router repository with Tailwind CSS and Lucide icons.",
          "Design responsive navigation sidebar, header stats bar, and dark luxury theme variables.",
          "Implement mock data state handlers for job records, compliance logs, and client lists.",
        ],
      },
      {
        week: "Week 2",
        title: "Workflows & Mobile Field Interface",
        tasks: [
          "Build interactive job creation modal with photo attachment upload dropzone.",
          "Construct change-order approval module with instant customer share links.",
          "Add CSV and PDF export generators for compliance reporting.",
        ],
      },
      {
        week: "Week 3",
        title: "Database Integration & Stripe Checkout",
        tasks: [
          "Provision Supabase PostgreSQL database tables and RLS security policies.",
          "Wire Stripe checkout webhooks for monthly tier subscriptions.",
          "Implement Resend email notifications for job status updates.",
        ],
      },
      {
        week: "Week 4",
        title: "Beta Launch & Cold Outreach",
        tasks: [
          "Deploy application to Vercel/Cloud Run with custom domain SSL.",
          "Launch cold email outreach sequence to 100 targeted industry contacts.",
          "Onboard first 3 beta customers and refine UX based on recorded feedback.",
        ],
      },
    ],
    noCodeStack: [
      {
        tool: "Next.js + Tailwind",
        role: "Frontend Application",
        why: "Fast, SEO-friendly, highly customizable React framework.",
        cost: "Free / $20/mo Vercel",
      },
      {
        tool: "Supabase",
        role: "Database & Authentication",
        why: "Managed PostgreSQL with instant Auth, RLS, and auto-generated APIs.",
        cost: "Free tier / $25/mo Pro",
      },
      {
        tool: "Stripe",
        role: "Subscription Payments",
        why: "Industry standard for automated SaaS billing and invoice handling.",
        cost: "2.9% + 30¢ per transaction",
      },
      {
        tool: "Resend",
        role: "Transactional Email",
        why: "Developer-first email delivery with sleek React email templates.",
        cost: "Free (3,000 emails/mo)",
      },
    ],
    marketingAssets: {
      landingHeadline: `Stop Losing Revenue to Manual Paperwork in ${idea.targetAudience}`,
      landingSubheadline: `The all-in-one software platform that automates field compliance, captures job-site change orders, and accelerates client payments by 3x.`,
      ctaButton: "Start 14-Day Free Beta Trial",
      elevatorPitch: `${name} is the dedicated operations management platform for ${idea.targetAudience}. We eliminate billable leakage and compliance risk by giving field teams a simple 30-second mobile app to log jobs, capture client sign-offs, and auto-generate invoices.`,
      coldEmail: {
        subject: `Quick question regarding ${idea.targetAudience.split(" ")[0]} operations at {{Company}}`,
        body: `Hi {{FirstName}},\n\nNotice most ${idea.targetAudience} owners lose 10+ hours weekly chasing paperwork approvals and unbilled scope changes.\n\nWe built ${name} specifically to solve this — field techs log job details in 30 seconds on their phone, and client invoices are auto-generated with instant e-signatures.\n\nWould you be open to a 5-minute video preview this Thursday to see if it could save {{Company}} 15 hours a week?\n\nBest,\n[Your Name]\nFounder, ${name}`,
      },
      socialPost: `🚀 Excited to announce the launch of ${name}! Built specifically for ${idea.targetAudience} to automate field compliance and capture job-site change orders. No more paper binders or lost invoice records. Check it out!`,
      socialContentStrategy: "Post daily 30-second video tear-downs comparing manual paper field logs vs automated 1-click mobile workflows.",
      blogPostIdeas: [
        `5 Hidden Causes of Billable Leakage in ${idea.targetAudience} (And How to Fix Them)`,
        `The Ultimate OSHA & Compliance Safety Checklist for Modern Field Operations`,
        `How Digital Change-Order Approvals Recovered $12,000 for a Regional Contractor`,
      ],
    },
    salesScript: {
      introduction: `Hi [Prospect Name], this is [Your Name] with ${name}. We help ${idea.targetAudience} eliminate manual paper logs and recover unbilled job-site change orders.`,
      discoveryQuestions: [
        `How do your field technicians currently communicate job site scope changes back to the office?`,
        `How many days does it typically take from completing a job to receiving client payment?`,
        `Have you ever faced a dispute or audit where paper job sheets were missing or illegible?`,
      ],
      pitchValueProps: [
        `30-Second Mobile Logging: Techs capture photos, notes, and signatures without training.`,
        `Instant Client Approvals: Automated SMS links allow clients to approve scope changes in 1 click.`,
        `Zero Paperwork Leakage: Syncs directly to accounting so every hour worked gets billed.`,
      ],
      objectionHandling: [
        `"Our field staff aren't tech-savvy": ${name} was designed like WhatsApp — if they can send a photo text, they can use ${name} in under 10 seconds.`,
        `"We already use spreadsheets": Spreadsheets can't capture e-signatures or send instant SMS approval links on job sites.`,
      ],
      callToAction: `Let's set up a free 10-minute trial setup with your team this Friday. If it doesn't save you 5 hours in week one, you owe nothing.`,
    },
    pricingTiers: [
      {
        name: "Starter",
        price: "$149/mo",
        features: ["Up to 5 field techs", "Unlimited job logs", "Basic PDF exports", "Email support"],
      },
      {
        name: "Pro Growth",
        price: "$299/mo",
        features: [
          "Up to 15 field techs",
          "Automated SMS approvals",
          "QuickBooks & Stripe integration",
          "OSHA audit trail generator",
          "Priority 24/7 support",
        ],
      },
      {
        name: "Enterprise Fleet",
        price: "$599/mo",
        features: [
          "Unlimited technicians",
          "Custom API & ERP webhooks",
          "Dedicated account manager",
          "SLA uptime guarantee",
          "Custom domain branding",
        ],
      },
    ],
    marketValidation: {
      goNoGoScore: "88/100",
      proofOfDemand: "High search volume for specialized industry field software with high willingness to pay due to high ticket sizes.",
      redFlags: ["Requires high initial trust; overcome via 14-day free trial and direct founder onboarding."],
    },
    preSellChecklist: [
      "Create high-converting 1-page landing site with elevator pitch and demo video.",
      "Conduct 10 discovery calls with local business owners in the target niche.",
      "Offer 50% lifetime discount for 5 founding beta members.",
    ],
    validationChecklist: [
      "Send 100 personalized cold outreach emails to target managers.",
      "Track landing page conversion rate (target > 8% sign-up rate).",
      "Collect initial credit card deposits or LOIs from at least 3 prospects.",
    ],
    databaseRequirements: {
      schemaDescription: `PostgreSQL schema tailored for ${name} managing users, job orders, compliance inspection logs, and invoice line items.`,
      sqlSchema: `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  location VARCHAR(255),
  total_amount_usd NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inspections Log Table
CREATE TABLE IF NOT EXISTS inspection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id),
  notes TEXT,
  passed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      tables: [
        {
          name: "users",
          fields: ["id (uuid)", "email (text)", "full_name (text)", "role (text)", "created_at (timestamp)"],
          purpose: "Stores user accounts, roles (admin, foreman, technician), and authentication metadata.",
        },
        {
          name: "jobs",
          fields: ["id (uuid)", "client_name (text)", "title (text)", "status (text)", "total_amount_usd (numeric)", "created_at (timestamp)"],
          purpose: "Tracks field job orders, status lifecycle, and financial value.",
        },
        {
          name: "inspection_logs",
          fields: ["id (uuid)", "job_id (uuid)", "technician_id (uuid)", "notes (text)", "passed (boolean)", "created_at (timestamp)"],
          purpose: "Stores compliance inspection entries, safety checks, and pass/fail records.",
        },
      ],
    },
  };
}
