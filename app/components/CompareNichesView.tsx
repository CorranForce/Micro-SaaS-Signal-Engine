"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { Flame, BarChart3, Layers, Sparkles } from "lucide-react";
import { LEGACY_NICHES } from "../lib/niches";
import type { SaasIdea } from "../types";

const DEFAULT_SAMPLE_IDEAS: SaasIdea[] = [
  {
    name: "Solar Permit Auto-Filer",
    tagline: "Automate AHJ solar permitting for local installers",
    problem: "Solar contractors lose 3+ weeks on manual AHJ permit paperwork.",
    solution: "AI CAD parser and auto-submission workflow.",
    targetAudience: "Solar Installers",
    painSolved: "High permit turn-around delay",
    competitors: ["Manual Expeditors"],
    gtmChannel: "Cold Email & Trade Associations",
    buildComplexity: "moderate",
    integrationComplexity: "moderate",
    marketDemandScore: 95,
    hotnessScore: 96,
    roi: {
      buildCostUSD: "1200",
      monthlyExpensesUSD: "80",
      realisticMRRMonth1USD: "6500",
      breakEvenMonths: 1,
      roiMonth1Pct: "441%",
      assumptions: "10 clients at $650/mo",
    },
    domains: [],
  },
  {
    name: "HVAC Dispatch Synthesizer",
    tagline: "AI voice dispatch & route optimizer for technicians",
    problem: "HVAC owners lose $2k/day on misrouted tech emergency calls.",
    solution: "24/7 Voice AI triage & geo-route optimization.",
    targetAudience: "HVAC Contractors",
    painSolved: "Unanswered emergency dispatch calls",
    competitors: ["Housecall Pro"],
    gtmChannel: "Local HVAC Associations",
    buildComplexity: "complex",
    integrationComplexity: "moderate",
    marketDemandScore: 92,
    hotnessScore: 94,
    roi: {
      buildCostUSD: "1500",
      monthlyExpensesUSD: "100",
      realisticMRRMonth1USD: "7200",
      breakEvenMonths: 1,
      roiMonth1Pct: "380%",
      assumptions: "12 clients at $600/mo",
    },
    domains: [],
  },
  {
    name: "Dental Intake Voice Bot",
    tagline: "Automated patient intake and insurance verification",
    problem: "Dental front-desk staff spend 15 hrs/wk verifying insurance manually.",
    solution: "Automated eligibility lookup and pre-appointment intake bot.",
    targetAudience: "Dental Practices",
    painSolved: "Front desk administrative overload",
    competitors: ["Weave"],
    gtmChannel: "Dental Supply Rep Partners",
    buildComplexity: "moderate",
    integrationComplexity: "complex",
    marketDemandScore: 90,
    hotnessScore: 91,
    roi: {
      buildCostUSD: "1000",
      monthlyExpensesUSD: "60",
      realisticMRRMonth1USD: "5500",
      breakEvenMonths: 1,
      roiMonth1Pct: "450%",
      assumptions: "11 practices at $500/mo",
    },
    domains: [],
  },
  {
    name: "Roofing Storm Inspector AI",
    tagline: "Drone photo hail damage classifier for claims",
    problem: "Roofers spend hours climbing roofs for initial estimate photo tags.",
    solution: "Computer vision hail strike detection & Xactimate integration.",
    targetAudience: "Roofing Contractors",
    painSolved: "Slow estimate creation after storms",
    competitors: ["Hover", "Roofing AI"],
    gtmChannel: "Storm Chaser Facebook Groups",
    buildComplexity: "complex",
    integrationComplexity: "moderate",
    marketDemandScore: 88,
    hotnessScore: 89,
    roi: {
      buildCostUSD: "1800",
      monthlyExpensesUSD: "120",
      realisticMRRMonth1USD: "6000",
      breakEvenMonths: 1,
      roiMonth1Pct: "233%",
      assumptions: "8 contractors at $750/mo",
    },
    domains: [],
  },
  {
    name: "MedSpa Re-activator AI",
    tagline: "Re-engage lapsed Botox patients via SMS AI",
    problem: "MedSpas have 1,000+ uncontacted past clients worth $400/visit.",
    solution: "Two-way SMS AI assistant that books open calendar slots.",
    targetAudience: "MedSpa Owners",
    painSolved: "Lapsed customer churn",
    competitors: ["RepeatMD"],
    gtmChannel: "Instagram DM Outreach",
    buildComplexity: "simple",
    integrationComplexity: "simple",
    marketDemandScore: 86,
    hotnessScore: 88,
    roi: {
      buildCostUSD: "800",
      monthlyExpensesUSD: "50",
      realisticMRRMonth1USD: "4800",
      breakEvenMonths: 1,
      roiMonth1Pct: "500%",
      assumptions: "16 spas at $300/mo",
    },
    domains: [],
  },
  {
    name: "Property Management AI Bot",
    tagline: "24/7 tenant maintenance triage & vendor dispatcher",
    problem: "Landlords wake up at 2 AM for leaky faucet emergency calls.",
    solution: "Automated tenant photo diagnostic and preferred vendor booking.",
    targetAudience: "Property Managers",
    painSolved: "After-hours maintenance chaos",
    competitors: ["AppFolio Addons"],
    gtmChannel: "REIA Meetings",
    buildComplexity: "simple",
    integrationComplexity: "moderate",
    marketDemandScore: 85,
    hotnessScore: 87,
    roi: {
      buildCostUSD: "900",
      monthlyExpensesUSD: "50",
      realisticMRRMonth1USD: "5000",
      breakEvenMonths: 1,
      roiMonth1Pct: "455%",
      assumptions: "10 PMs at $500/mo",
    },
    domains: [],
  },
  {
    name: "Plumbing Estimate AI",
    tagline: "Instant job quoting from jobsite video clips",
    problem: "Plumbers lose 40% of leads waiting until evening to write quotes.",
    solution: "AI extracts pipe dimensions & fittings to output instant PDF quotes.",
    targetAudience: "Plumbing Businesses",
    painSolved: "Slow quote turnarounds",
    competitors: ["Jobber"],
    gtmChannel: "Plumbing Supply Counter Flyers",
    buildComplexity: "moderate",
    integrationComplexity: "simple",
    marketDemandScore: 82,
    hotnessScore: 85,
    roi: {
      buildCostUSD: "1100",
      monthlyExpensesUSD: "70",
      realisticMRRMonth1USD: "4200",
      breakEvenMonths: 1,
      roiMonth1Pct: "281%",
      assumptions: "12 shops at $350/mo",
    },
    domains: [],
  },
  {
    name: "Auto Repair Fleet Log",
    tagline: "Commercial vehicle fleet maintenance predictor",
    problem: "Local courier fleets suffer costly breakdowns without tracking.",
    solution: "OBD-II telemetry parser & automated service alerts.",
    targetAudience: "Auto Repair Shops",
    painSolved: "Fleet client retention",
    competitors: ["Fleetio"],
    gtmChannel: "B2B Fleet Outreach",
    buildComplexity: "moderate",
    integrationComplexity: "complex",
    marketDemandScore: 80,
    hotnessScore: 82,
    roi: {
      buildCostUSD: "1300",
      monthlyExpensesUSD: "90",
      realisticMRRMonth1USD: "3900",
      breakEvenMonths: 1,
      roiMonth1Pct: "200%",
      assumptions: "10 shops at $390/mo",
    },
    domains: [],
  },
  {
    name: "Fleet Parts Predictor",
    tagline: "Predictive parts ordering for diesel mechanics",
    problem: "Diesel repair shops hold $50k in dead inventory parts.",
    solution: "Just-in-time parts procurement algorithm based on repair trends.",
    targetAudience: "Diesel Shops",
    painSolved: "Overstocked inventory cash lockup",
    competitors: ["Fullbay"],
    gtmChannel: "Diesel Expo Booths",
    buildComplexity: "complex",
    integrationComplexity: "moderate",
    marketDemandScore: 78,
    hotnessScore: 78,
    roi: {
      buildCostUSD: "1600",
      monthlyExpensesUSD: "110",
      realisticMRRMonth1USD: "4500",
      breakEvenMonths: 1,
      roiMonth1Pct: "181%",
      assumptions: "9 mechanics at $500/mo",
    },
    domains: [],
  },
  {
    name: "Legal Clause Synthesizer",
    tagline: "Contract clause risk flags for boutique firms",
    problem: "Boutique law firms spend 4 hrs per commercial lease review.",
    solution: "AI highlights non-standard indemnity and termination clauses.",
    targetAudience: "Solo Legal Practitioners",
    painSolved: "Unbillable contract review hours",
    competitors: ["LexisNexis"],
    gtmChannel: "State Bar Journal Ads",
    buildComplexity: "moderate",
    integrationComplexity: "simple",
    marketDemandScore: 75,
    hotnessScore: 76,
    roi: {
      buildCostUSD: "950",
      monthlyExpensesUSD: "60",
      realisticMRRMonth1USD: "3600",
      breakEvenMonths: 1,
      roiMonth1Pct: "278%",
      assumptions: "8 solo attorneys at $450/mo",
    },
    domains: [],
  },
];

interface CompareNichesViewProps {
  generatedIdeas?: SaasIdea[];
  savedIdeas?: { idea: SaasIdea }[];
}

export function CompareNichesView({ generatedIdeas = [], savedIdeas = [] }: CompareNichesViewProps) {
  const [niche1, setNiche1] = useState<string>("Dental Practices");
  const [niche2, setNiche2] = useState<string>("HVAC Services");
  const [chartMode, setChartMode] = useState<"histogram" | "individual">("histogram");

  // Niche hash comparison logic
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const getMetrics = (name: string) => {
    const hash = hashCode(name);
    const mrr = 5000 + (hash % 15000);
    const buildScore = (hash % 10) + 1;
    const growth = 5 + (hash % 30);

    let base = 30 + (hash % 20);
    const data = [
      { month: "Jan", demand: base },
      { month: "Feb", demand: (base += hash % 5) },
      { month: "Mar", demand: (base -= hash % 3) },
      { month: "Apr", demand: (base += 5 + (hash % 8)) },
      { month: "May", demand: (base += 2 + (hash % 6)) },
      { month: "Jun", demand: (base += 8 + (hash % 10)) },
    ];

    return { mrr, buildScore, growth, data };
  };

  const metrics1 = getMetrics(niche1);
  const metrics2 = getMetrics(niche2);

  // Extract last 10 SaaS ideas (using actual generated/saved ideas, filling with DEFAULT_SAMPLE_IDEAS if needed)
  const poolOfIdeas = [...generatedIdeas];
  savedIdeas.forEach((s) => {
    if (s.idea && !poolOfIdeas.some((i) => i.name === s.idea.name)) {
      poolOfIdeas.push(s.idea);
    }
  });

  let combined10 = [...poolOfIdeas];
  if (combined10.length < 10) {
    DEFAULT_SAMPLE_IDEAS.forEach((sample) => {
      if (combined10.length < 10 && !combined10.some((i) => i.name === sample.name)) {
        combined10.push(sample);
      }
    });
  }

  const last10Ideas = combined10.slice(-10);

  // Calculate statistics
  const totalHotness = last10Ideas.reduce((sum, idea) => sum + (idea.hotnessScore || 0), 0);
  const avgHotness = (totalHotness / last10Ideas.length).toFixed(1);
  const topIdea = [...last10Ideas].sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0))[0];
  const highDemandCount = last10Ideas.filter((i) => (i.hotnessScore || 0) >= 80).length;
  const highDemandRatio = Math.round((highDemandCount / last10Ideas.length) * 100);

  // Construct Histogram Buckets data
  const histogramBuckets = [
    { range: "50-60", label: "50-60 (Low)", count: 0, color: "#f97316" },
    { range: "61-70", label: "61-70 (Moderate)", count: 0, color: "#facc15" },
    { range: "71-80", label: "71-80 (High)", count: 0, color: "#38bdf8" },
    { range: "81-90", label: "81-90 (Very High)", count: 0, color: "#a855f7" },
    { range: "91-100", label: "91-100 (Extreme 🔥)", count: 0, color: "#00f076" },
  ];

  last10Ideas.forEach((idea) => {
    const score = idea.hotnessScore || 0;
    if (score >= 91) histogramBuckets[4].count++;
    else if (score >= 81) histogramBuckets[3].count++;
    else if (score >= 71) histogramBuckets[2].count++;
    else if (score >= 61) histogramBuckets[1].count++;
    else histogramBuckets[0].count++;
  });

  // Construct Individual Bar Chart data
  const individualBarData = last10Ideas.map((idea, idx) => ({
    id: idx + 1,
    name: idea.name,
    shortName: idea.name.length > 15 ? idea.name.slice(0, 14) + "…" : idea.name,
    score: idea.hotnessScore || 0,
    demand: idea.marketDemandScore || 0,
    tagline: idea.tagline,
    complexity: idea.buildComplexity,
    color:
      (idea.hotnessScore || 0) >= 90
        ? "#00f076"
        : (idea.hotnessScore || 0) >= 80
        ? "#ffeb3b"
        : (idea.hotnessScore || 0) >= 70
        ? "#38bdf8"
        : "#f97316",
  }));

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ms-card border border-ms-border p-3 rounded shadow-2xl text-xs space-y-1 z-50 max-w-xs font-ms">
          <p className="font-bold text-white text-xs">{data.name || data.label}</p>
          {data.tagline && <p className="text-[10px] text-ms-text-muted italic leading-tight">{data.tagline}</p>}
          <div className="flex items-center gap-2 pt-1 border-t border-ms-border/50">
            <span className="text-[10px] text-ms-text-muted">
              {data.score !== undefined ? "Hotness Score:" : "Ideas in Range:"}
            </span>
            <span className="font-bold font-mono text-ms-green text-xs">
              {data.score !== undefined ? `${data.score} / 100` : `${data.count} Idea(s)`}
            </span>
          </div>
          {data.complexity && (
            <div className="text-[10px] text-ms-text-muted flex justify-between">
              <span>Complexity:</span>
              <span className="text-ms-yellow uppercase font-bold">{data.complexity}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* HISTOGRAM DISTRIBUTION SECTION */}
      <div className="bg-ms-card border border-ms-border rounded-lg p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ms-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-ms-green animate-pulse" />
              <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">
                Hotness Score Distribution (Last 10 Ideas)
              </h3>
            </div>
            <p className="text-xs text-ms-text-muted mt-1 font-ms">
              Visualizing market demand density to accelerate high-yield micro-SaaS niche selection.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-ms-bg p-1 rounded border border-ms-border self-start md:self-auto">
            <button
              onClick={() => setChartMode("histogram")}
              className={`px-3 py-1.5 rounded text-xs font-ms font-bold flex items-center gap-1.5 transition-all ${
                chartMode === "histogram"
                  ? "bg-ms-green text-ms-bg shadow-sm"
                  : "text-ms-text-muted hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Score Buckets
            </button>
            <button
              onClick={() => setChartMode("individual")}
              className={`px-3 py-1.5 rounded text-xs font-ms font-bold flex items-center gap-1.5 transition-all ${
                chartMode === "individual"
                  ? "bg-ms-green text-ms-bg shadow-sm"
                  : "text-ms-text-muted hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Idea Ranking
            </button>
          </div>
        </div>

        {/* Statistical KPI Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ms-bg p-3.5 rounded border border-ms-border flex flex-col justify-between">
            <span className="text-[10px] text-ms-text-muted uppercase font-ms font-bold tracking-wider">Avg Hotness</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-ms-green">{avgHotness}</span>
              <span className="text-[10px] text-ms-text-muted font-mono">/100</span>
            </div>
          </div>
          <div className="bg-ms-bg p-3.5 rounded border border-ms-border flex flex-col justify-between">
            <span className="text-[10px] text-ms-text-muted uppercase font-ms font-bold tracking-wider">Top Scoring Idea</span>
            <div className="mt-1">
              <span className="text-xs font-bold text-white block truncate">{topIdea.name}</span>
              <span className="text-[10px] text-ms-green font-mono font-bold">🔥 {topIdea.hotnessScore}/100</span>
            </div>
          </div>
          <div className="bg-ms-bg p-3.5 rounded border border-ms-border flex flex-col justify-between">
            <span className="text-[10px] text-ms-text-muted uppercase font-ms font-bold tracking-wider">High Demand Ratio</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-ms-yellow">{highDemandRatio}%</span>
              <span className="text-[10px] text-ms-text-muted font-ms">(≥80 Score)</span>
            </div>
          </div>
          <div className="bg-ms-bg p-3.5 rounded border border-ms-border flex flex-col justify-between">
            <span className="text-[10px] text-ms-text-muted uppercase font-ms font-bold tracking-wider font-mono">Sample Size</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-white">{last10Ideas.length}</span>
              <span className="text-[10px] text-ms-text-muted font-ms">Ideas Tracked</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Canvas */}
        <div className="bg-ms-bg/60 border border-ms-border/60 p-4 rounded-lg">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "histogram" ? (
                <BarChart data={histogramBuckets} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {histogramBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={individualBarData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {individualBarData.map((entry, index) => (
                      <Cell key={`ind-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Idea Score Breakdown Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase font-ms tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ms-green" />
            Last 10 Generated Ideas Hotness Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {last10Ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-ms-bg border border-ms-border p-3 rounded flex items-center justify-between gap-3 hover:border-ms-border-light transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-ms-text-muted">#{idx + 1}</span>
                    <h5 className="text-xs font-bold text-white truncate">{idea.name}</h5>
                  </div>
                  <p className="text-[10px] text-ms-text-muted truncate mt-0.5">{idea.tagline}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                      (idea.hotnessScore || 0) >= 90
                        ? "bg-ms-green/15 text-ms-green border-ms-green/40"
                        : (idea.hotnessScore || 0) >= 80
                        ? "bg-ms-yellow/15 text-ms-yellow border-ms-yellow/40"
                        : "bg-orange-500/15 text-orange-400 border-orange-500/40"
                    }`}
                  >
                    🔥 {idea.hotnessScore}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EXISTING NICHE COMPARISON ENGINE TABLE */}
      <div className="space-y-4">
        <div className="border-b border-ms-border pb-2">
          <h3 className="text-sm font-bold text-white uppercase font-ms tracking-wider">
            Side-by-Side Niche Metric Benchmarks
          </h3>
          <p className="text-xs text-ms-text-muted font-ms">
            Compare macro operational metrics across pre-indexed B2B industries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
              Niche 1
            </label>
            <select
              value={niche1}
              onChange={(e) => setNiche1(e.target.value)}
              className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
            >
              {LEGACY_NICHES.map((n) => (
                <option key={`n1-${n.id}`} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
              Niche 2
            </label>
            <select
              value={niche2}
              onChange={(e) => setNiche2(e.target.value)}
              className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
            >
              {LEGACY_NICHES.map((n) => (
                <option key={`n2-${n.id}`} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-ms-card border border-ms-border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left font-ms text-ms-text-muted">
            <thead className="text-[10px] text-white uppercase bg-ms-bg/80 border-b border-ms-border">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Metric</th>
                <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-green w-1/3">
                  {niche1}
                </th>
                <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-yellow w-1/3">
                  {niche2}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ms-border">
              <tr className="hover:bg-ms-bg/30 transition-colors">
                <td className="px-6 py-4 font-bold text-white text-xs">
                  Growth Trend (6Mo)
                </td>
                <td className="px-6 py-4 border-l border-ms-border">
                  <span className="text-ms-green font-bold">
                    +{metrics1.growth}%
                  </span>
                  <div className="h-16 mt-2 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics1.data}>
                        <Line
                          type="monotone"
                          dataKey="demand"
                          stroke="#00f076"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
                <td className="px-6 py-4 border-l border-ms-border">
                  <span className="text-ms-yellow font-bold">
                    +{metrics2.growth}%
                  </span>
                  <div className="h-16 mt-2 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics2.data}>
                        <Line
                          type="monotone"
                          dataKey="demand"
                          stroke="#ffeb3b"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-ms-bg/30 transition-colors">
                <td className="px-6 py-4 font-bold text-white text-xs">
                  Avg MRR Potential
                </td>
                <td className="px-6 py-4 border-l border-ms-border text-white">
                  ${metrics1.mrr.toLocaleString()}/mo
                </td>
                <td className="px-6 py-4 border-l border-ms-border text-white">
                  ${metrics2.mrr.toLocaleString()}/mo
                </td>
              </tr>
              <tr className="hover:bg-ms-bg/30 transition-colors">
                <td className="px-6 py-4 font-bold text-white text-xs">
                  Build Complexity
                </td>
                <td className="px-6 py-4 border-l border-ms-border">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ms-green"
                        style={{ width: `${(metrics1.buildScore / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px]">{metrics1.buildScore}/10</span>
                  </div>
                </td>
                <td className="px-6 py-4 border-l border-ms-border">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ms-yellow"
                        style={{ width: `${(metrics2.buildScore / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px]">{metrics2.buildScore}/10</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
