export interface GeminiEngineOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  tier: string;
  badgeColor: string;
  supportsSearchGrounding: boolean;
  supportsHighThinking: boolean;
  defaultSearchGrounding: boolean;
  defaultHighThinking: boolean;
  wiredCapabilityLabel: string;
  wiredBadge: string;
}

export const GEMINI_ENGINES: GeminiEngineOption[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "Recommended",
    description: "Next-gen ultra-fast model with live Search Grounding and low latency.",
    tier: "Fast & Smart",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800",
    supportsSearchGrounding: true,
    supportsHighThinking: false,
    defaultSearchGrounding: true,
    defaultHighThinking: false,
    wiredCapabilityLabel: "Google Search Grounding",
    wiredBadge: "⚡ Search Grounded",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    tag: "Pro Intelligence",
    description: "Deep multi-step reasoning, mathematical modeling & High Thinking mode.",
    tier: "Deep Reasoning",
    badgeColor: "bg-purple-950 text-purple-300 border-purple-800",
    supportsSearchGrounding: true,
    supportsHighThinking: true,
    defaultSearchGrounding: false,
    defaultHighThinking: true,
    wiredCapabilityLabel: "High Thinking Level",
    wiredBadge: "🧠 High Thinking",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    tag: "High Performance",
    description: "Advanced reasoning and fast turnaround with Search Grounding support.",
    tier: "High Capability",
    badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800",
    supportsSearchGrounding: true,
    supportsHighThinking: false,
    defaultSearchGrounding: true,
    defaultHighThinking: false,
    wiredCapabilityLabel: "Google Search Grounding",
    wiredBadge: "⚡ Search Grounded",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    tag: "Standard",
    description: "Proven workhorse engine for high-volume structured B2B scanning.",
    tier: "Standard",
    badgeColor: "bg-blue-950 text-blue-300 border-blue-800",
    supportsSearchGrounding: true,
    supportsHighThinking: false,
    defaultSearchGrounding: true,
    defaultHighThinking: false,
    wiredCapabilityLabel: "Google Search Grounding",
    wiredBadge: "⚡ Search Grounded",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    tag: "Lowest Latency",
    description: "Lightweight flash engine optimized for near-instant responses.",
    tier: "Ultra Fast",
    badgeColor: "bg-amber-950 text-amber-300 border-amber-800",
    supportsSearchGrounding: true,
    supportsHighThinking: false,
    defaultSearchGrounding: true,
    defaultHighThinking: false,
    wiredCapabilityLabel: "Google Search Grounding",
    wiredBadge: "⚡ Low Latency",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    tag: "Cost-Efficient",
    description: "High-frequency lightweight model for quick idea generation.",
    tier: "Cost-Efficient",
    badgeColor: "bg-teal-950 text-teal-300 border-teal-800",
    supportsSearchGrounding: true,
    supportsHighThinking: false,
    defaultSearchGrounding: false,
    defaultHighThinking: false,
    wiredCapabilityLabel: "Standard Mode",
    wiredBadge: "⚡ Efficient",
  },
];

export const DEFAULT_GEMINI_ENGINE = "gemini-3.8-flash";
