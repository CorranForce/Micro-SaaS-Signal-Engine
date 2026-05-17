"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Settings, 
  User, 
  HelpCircle, 
  Sun, 
  Moon, 
  Plus, 
  Search, 
  FolderSearch,
  Database, 
  ArrowLeft,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  LineChart
} from "lucide-react";
import { useMetadata } from "@/hooks/use-metadata";
import { NICHE_CATEGORIES, DEMAND_CFG, COMP_CFG, CHURN_CFG, COMPLEX_CFG, toDomain, toDomainHyphen } from "@/lib/constants";
import { ideaGenerationSchema, launchKitSchema, moreIdeasSchema } from "@/lib/gemini-schemas";
import { Tooltip } from "./Tooltip";
import { Tag, SL, BoringScore, DomainBadge, CopyButton } from "./SharedUI";
import { LocalBusinessFinder } from "./LocalBusinessFinder";
import { IdeaLandscapeChart } from "./IdeaLandscapeChart";
import { PreSellChecklist } from "./PreSellChecklist";
import { EmailModal } from "./EmailModal";
import { LaunchKitPanel } from "./LaunchKitPanel";
import { checkDomainAction, sendEmailAction, checkConfigAction, testGoDaddyAction } from "@/app/actions";
import { getSupabase } from "@/lib/supabase";
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from "@/components/AuthProvider";
import { GoogleGenAI } from "@google/genai";

import { GranularLoader } from "@/components/GranularLoader";
import { ProgressSteps } from "@/components/ProgressSteps";
import { OnboardingTour } from "@/components/OnboardingTour";

const getGeminiKey = () => {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem("ms-gemini-key");
    if (localKey) return localKey;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
};

function SidebarItem({ icon, label, isOpen, active, onClick, color }: { icon: React.ReactNode, label: string, isOpen: boolean, active?: boolean, onClick: () => void, color?: string }) {
  return (
    <button
      id={`sidebar-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative
        ${active 
          ? 'bg-ms-green/10 text-ms-green shadow-[inset_0_0_10px_rgba(80,230,160,0.05)]' 
          : 'text-ms-text-muted hover:bg-ms-panel-light hover:text-ms-text'
        }
      `}
      title={!isOpen ? label : undefined}
    >
      <div 
        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 flex items-center justify-center ${active ? 'text-ms-green' : 'text-ms-text-muted group-hover:text-ms-green'}`}
        style={color && active ? { color } : {}}
      >
        {icon}
      </div>
      
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-medium text-[13px] whitespace-nowrap overflow-hidden flex-1 text-left"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {!isOpen && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-ms-panel border border-ms-border text-ms-text text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none z-[100] whitespace-nowrap transition-opacity shadow-lg">
          {label}
        </div>
      )}
      
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 w-1 h-6 bg-ms-green rounded-full"
        />
      )}
    </button>
  );
}

export default function MicroSaaSFinder() {
  const { setMetadata, resetMetadata } = useMetadata();
  const { user, role } = useAuth();
  const [mounted, setMounted] = useState(false);

  console.log("MicroSaaSFinder rendering, mounted:", mounted);
  const [activeCategory, setActiveCategory] = useState(Object.keys(NICHE_CATEGORIES)[0]);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [redditText, setRedditText] = useState("");
  const [showReddit, setShowReddit] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState("");
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [expandedAbout, setExpandedAbout] = useState<number | null>(null);
  const [view, setView] = useState("niche");
  const [goDaddyKey, setGoDaddyKey] = useState("");
  const [goDaddySecret, setGoDaddySecret] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [savedKits, setSavedKits] = useState<any[]>([]);
  const [loadingSavedKits, setLoadingSavedKits] = useState(false);
  const [domainStatus, setDomainStatus] = useState<Record<string, string>>({});
  const [userInterests, setUserInterests] = useState("");
  const [suggestedNiches, setSuggestedNiches] = useState<string[]>([]);
  const [isSuggestingNiches, setIsSuggestingNiches] = useState(false);
  const [askAiInput, setAskAiInput] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiMarketValidation, setAiMarketValidation] = useState<Record<number, any>>({});
  const [launchKits, setLaunchKits] = useState<Record<number, any>>({});
  const [deepResearch, setDeepResearch] = useState<Record<number, any>>({});
  const [emailModal, setEmailModal] = useState<any>(null);
  const [emailSentFor, setEmailSentFor] = useState<Record<number, string>>({});
  const [serverConfig, setServerConfig] = useState({ hasGoDaddy: false, hasResend: false });
  const [theme, setTheme] = useState("dark");
  const [localResendKey, setLocalResendKey] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Update dynamic metadata for SEO
  useEffect(() => {
    if (expandedIdea !== null && result?.saasIdeas?.[expandedIdea]) {
      const idea = result.saasIdeas[expandedIdea];
      setMetadata({
        title: idea.name,
        description: idea.description || idea.tagline,
        keywords: [idea.name, "micro-saas", "b2b saas", idea.niche || "business idea"]
      });
    } else {
      resetMetadata();
    }
  }, [expandedIdea, result, setMetadata, resetMetadata]);

  const startTour = () => {
    localStorage.removeItem("ms_tour_seen");
    setShowOnboarding(true);
    // Force a re-render by toggling a key if needed, 
    // but the component handles the initial check in useEffect.
    // To re-trigger it immediately if the modal was closed:
    window.location.reload(); // Simple way to reset state and re-trigger tour
  };

  const toggleCompare = (index: number) => {
    setSelectedForCompare(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= 3) {
        toast.error("You can only compare up to 3 ideas at once.");
        return prev;
      }
      return [...prev, index];
    });
  };

  useEffect(() => {
    console.log("MicroSaaSFinder useEffect running");
    setMounted(true);
    checkConfigAction().then(setServerConfig).catch(console.error);
    
    try {
      const savedTheme = localStorage.getItem("ms-theme") || "dark";
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
      const savedKey = localStorage.getItem("ms-godaddy-key") || "";
      const savedSecret = localStorage.getItem("ms-godaddy-secret") || "";
      const savedSupabaseUrl = localStorage.getItem("ms-supabase-url") || "";
      const savedSupabaseKey = localStorage.getItem("ms-supabase-key") || "";
      const savedResendKey = localStorage.getItem("ms-resend-key") || "";
      setGoDaddyKey(savedKey);
      setGoDaddySecret(savedSecret);
      setSupabaseUrl(savedSupabaseUrl);
      setSupabaseKey(savedSupabaseKey);
      setLocalResendKey(savedResendKey);

      if (savedSupabaseUrl && savedSupabaseKey) {
        const supabase = getSupabase(savedSupabaseUrl, savedSupabaseKey);
        if (supabase) {
          supabase.from('app_settings').select('*').eq('id', 'global').single().then(({ data, error }) => {
            if (!error && data) {
              try {
                if (data.godaddy_key) {
                  setGoDaddyKey(data.godaddy_key);
                  localStorage.setItem("ms-godaddy-key", data.godaddy_key);
                }
                if (data.godaddy_secret) {
                  setGoDaddySecret(data.godaddy_secret);
                  localStorage.setItem("ms-godaddy-secret", data.godaddy_secret);
                }
                if (data.supabase_url) {
                  setSupabaseUrl(data.supabase_url);
                  localStorage.setItem("ms-supabase-url", data.supabase_url);
                }
                if (data.supabase_key) {
                  setSupabaseKey(data.supabase_key);
                  localStorage.setItem("ms-supabase-key", data.supabase_key);
                }
              } catch (e) {
                console.error("Failed to save to localStorage", e);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to access localStorage", e);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("ms-theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const LOADING_STEPS = [
    "Initializing neural market scanners...",
    "Scanning industry pain points...",
    "Analyzing B2B market gaps...",
    "Identifying friction in legacy workflows...",
    "Mapping technical feasibility on Lovable.dev...",
    "Generating high-retention SaaS blueprints...",
    "Calculating ROI and MRR estimates...",
    "Refining go-to-market strategies...",
    "Finalizing market signal report..."
  ];

  const RESEARCH_STEPS = [
    "Connecting to global sentiment feeds...",
    "Sifting through reddit complaint clusters...",
    "Analyzing forum threads for validation...",
    "Cross-referencing social media signals...",
    "Finding real-world market validation indicators...",
    "Generating deep insights report..."
  ];

  const formatGeminiError = (err: any) => {
    let msg = err.message || "Unknown error";
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return "Your Gemini API key is missing or invalid. Please configure it in the AI Studio Secrets panel (top right).";
    }
    if (msg.includes("xhr error") || msg.includes("code: 6") || msg.includes("500")) {
      return "The AI took too long to respond (timeout). Please try again.";
    }
    if (msg === "Failed to fetch" || msg.toLowerCase().includes("network error")) {
      return "Network error: Failed to connect to the AI service. This might be due to an ad blocker, firewall, or network issue.";
    }
    if (err instanceof SyntaxError && msg.includes("JSON")) {
      return "The AI generated an incomplete or invalid response. This usually happens if the requested output is too large. Please try again with a more specific niche.";
    }
    return msg;
  };

  const parseJSONResponse = (text: string) => {
    if (!text) return {};
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return JSON.parse(clean.trim());
  };

  const checkDomain = useCallback(async (domain: string) => {
    setDomainStatus(prev => ({ ...prev, [domain]: "checking" }));
    try {
      const data = await checkDomainAction(domain, goDaddyKey, goDaddySecret);
      if (data.error) {
        setDomainStatus(prev => ({ ...prev, [domain]: `error:${data.error}` }));
      } else {
        setDomainStatus(prev => ({ ...prev, [domain]: data.available ? "available" : "taken" }));
      }
    } catch (err: any) { setDomainStatus(prev => ({ ...prev, [domain]: `error:${err.message}` })); }
  }, [goDaddyKey, goDaddySecret]);

  const checkAllDomains = useCallback(async (ideas: any[]) => {
    for (const idea of ideas) { 
      const d1 = toDomain(idea.name);
      const d2 = toDomainHyphen(idea.name);
      await checkDomain(d1); 
      await new Promise(r => setTimeout(r, 300)); 
      if (d1 !== d2) {
        await checkDomain(d2);
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }, [checkDomain]);

  const suggestNichesWithAI = async () => {
    if (!userInterests.trim()) return;
    setIsSuggestingNiches(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `User Background/Interests: "${userInterests}"

Based on this background, suggest 8 highly specific, underserved B2B Micro-SaaS niches where this user could have an advantage or unique insight.
Focus on "Boring" industries (e.g., Construction, Logistics, Legal, Medical, Manufacturing).
Return ONLY a JSON array of strings. 
Example: ["HVAC Inventory Management", "Custom Cabinetry CRM", "Marine Logbook Digitization"]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      });
      const niches = parseJSONResponse(response.text || "[]");
      setSuggestedNiches(niches);
      if (niches.length > 0) {
        setCustomNiche(niches[0]);
        setSelectedNiche("");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(formatGeminiError(e));
    } finally {
      setIsSuggestingNiches(false);
    }
  };

  const loadSavedKits = async () => {
    const supabase = getSupabase(supabaseUrl, supabaseKey);
    if (!supabase) return;
    setLoadingSavedKits(true);
    try {
      const { data, error } = await supabase.from('launch_kits').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('Could not find the table')) {
          console.warn("Supabase warning: 'launch_kits' table not found. Please create it if you want to save kits.");
          setSavedKits([]);
          return;
        }
        throw error;
      }
      setSavedKits(data || []);
    } catch (e) {
      console.error("Failed to load saved kits", e);
    } finally {
      setLoadingSavedKits(false);
    }
  };

  const saveKitToSupabase = async (idea: any, kit: any, roi: any) => {
    const supabase = getSupabase(supabaseUrl, supabaseKey);
    if (!supabase) {
      toast.error("Please configure Supabase URL and Key in settings first.");
      return;
    }
    const loadingToast = toast.loading("Saving kit to Supabase...");
    try {
      // Check for duplicates
      const isDuplicateLocal = savedKits.some(k => k.idea?.name === idea.name);
      
      if (isDuplicateLocal) {
        toast("This Launch Kit has already been entered into the database.", { icon: 'ℹ️', id: loadingToast });
        return;
      }

      // Also check DB to be safe (in case another user added it or local state is stale)
      const { data: existing, error: checkError } = await supabase
        .from('launch_kits')
        .select('id, idea')
        .limit(1000); // Fetching a batch to check manually in case JSON querying isn't set up right
        
      if (!checkError && existing) {
        const isDuplicateDb = existing.some(k => k.idea?.name === idea.name);
        if (isDuplicateDb) {
          toast("This Launch Kit has already been entered into the database.", { icon: 'ℹ️', id: loadingToast });
          return;
        }
      }

      const { error } = await supabase.from('launch_kits').insert([{
        idea,
        kit,
        roi
      }]);
      if (error) {
        if (error.message?.includes('Could not find the table')) {
          toast.error("The 'launch_kits' table does not exist in your Supabase database. Please create it to save kits.", { id: loadingToast });
          return;
        }
        throw error;
      }
      toast.success("Launch Kit saved successfully!", { id: loadingToast });
      loadSavedKits();
    } catch (e: any) {
      console.error("Failed to save kit", e);
      toast.error(`Failed to save kit: ${e.message}`, { id: loadingToast });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text p-4 md:p-8 flex items-center justify-center font-ms">
        <div className="text-ms-green animate-pulse">Loading Micro-SaaS Signal Engine...</div>
      </div>
    );
  }

  const niche = customNiche.trim() || selectedNiche;

  const sendViaResend = async (idea: any, kit: any, roi: any, toEmail: string, idx: number) => {
    try {
      const { buildEmailHtml } = await import("@/lib/email-builder");
      const res = await sendEmailAction(toEmail, `🚀 Launch Kit: ${idea.name} — Micro-SaaS Blueprint`, buildEmailHtml(idea, kit, roi), localResendKey);
      if (res.error) {
        setEmailModal({ idea, kit, roi });
      } else {
        setEmailSentFor(prev => ({ ...prev, [idx]: toEmail }));
      }
    } catch { setEmailModal({ idea, kit, roi }); }
  };

  const generateLaunchKit = async (idea: any, idx: number) => {
    setLaunchKits(prev => ({ ...prev, [idx]: { loading: true, data: null, error: null } }));
    const sp = `You are MakerAI — expert at turning micro-SaaS ideas into complete launch kits for solo non-technical founders using Lovable.dev.
Return ONLY valid JSON matching the schema.
Rules:
1. lovablePrompt MUST be a comprehensive, production-ready instruction for Lovable.dev (app.lovable.dev). It must include:
   - Tech stack: React, Tailwind, Lucide icons, Supabase, Stripe, Resend.
   - Core functional requirements (3-5 key features).
   - Database schema requirements (tables and fields).
   - Branding guidelines (color palette, typography vibe).
2. buildRoadmap MUST be a highly detailed 4-week execution map:
   - Week 1: "Foundations & Auth" (Supabase setup, authentication, core DB tables, landing page shell).
   - Week 2: "The Core Engine" (Building the primary value-add feature, parser, AI agent, or dashboard).
   - Week 3: "Commerce & Comms" (Stripe Payment Links/Checkout integration, Resend email automation for notifications).
   - Week 4: "Polishing & GTM" (UI/UX final touches, error handling, domain connecting, and first 10 cold emails sent).
3. marketingAssets: All copy must be industry-specific, authoritative, and convert-focused.`;
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Name: ${idea.name}\nTagline: ${idea.tagline}\nDescription: ${idea.description}\nTarget: ${idea.targetAudience}\nPain: ${idea.painSolved}\nFeatures: ${idea.keyFeatures?.join(", ")}\nGTM: ${idea.gtmChannel || "cold outreach"}\nPrice: ${idea.pricingTiers?.[1]?.price || "$99/mo"}`,
        config: {
          systemInstruction: sp,
          responseMimeType: "application/json",
          responseSchema: launchKitSchema
        }
      });
      
      const parsed = parseJSONResponse(response.text || "{}");
      setLaunchKits(prev => ({ ...prev, [idx]: { loading: false, data: parsed, error: null } }));
    } catch (err: any) { 
      setLaunchKits(prev => ({ ...prev, [idx]: { loading: false, data: null, error: formatGeminiError(err) } })); 
    }
  };

  const runGenerate = async () => {
    if (!niche) { setError("Select or type a niche first."); return; }
    setLoading(true); setError(""); setResult(null); setDomainStatus({}); setLaunchKits({}); setDeepResearch({}); setEmailSentFor({});
    setView("loading");
    let mi = 0; setLoadingMsg(LOADING_STEPS[0]); setLoadingProgress(15);
    const interval = setInterval(() => { 
      mi = (mi + 1) % LOADING_STEPS.length; 
      setLoadingMsg(LOADING_STEPS[mi]); 
      setLoadingProgress(prev => Math.min(95, prev + 15));
    }, 1800);
    const sp = `You are an elite micro-SaaS researcher specialising in boring, high-retention B2B opportunities in legacy industries.
${userInterests ? `The user has the following background/interests: "${userInterests}". Tailor your suggestions to leverage this context if applicable, or find high-value niches that align with their strengths.` : ''}
Return ONLY valid JSON matching the schema.
Exactly 1 saasIdea, 1 targetAudience, 1 topPainPoint. Build costs: Lovable.dev Pro $50/mo. Simple=1-3 days=$50-150. Moderate=3-7 days=$150-300. Complex=$300-600. Monthly ops=$50-120 (Lovable+Supabase+APIs).

CRITICAL INSTRUCTIONS FOR IDEA GENERATION:
1. Provide a concise description (max 80 words) that elaborates on the exact problem it solves, the workflow it replaces, and its core value proposition.
2. Include its genesis (how the idea originated) and marketAnalysis (why it's a good market). If competitionLevel is 'high' or 'medium', provide a competitionReason explaining why it's competitive.

SPECIAL INSTRUCTIONS FOR REFINED OUTPUT:
- GTM PLAYBOOK: Must be an extremely specific, actionable playbook. Avoid generic terms. Include specific details about the outreach message content, the exact value proposition mentioned, and the specific trial or pilot offer.
- COMPETITOR ANALYSIS: Name 2-3 direct/indirect competitors. Include established 'giants' (e.g. Calendly, Acuity) and modern 'niche AI' players (e.g. Motion, Reclaim). Detail their strengths AND specific user-documented weaknesses (e.g. "Complexity Exhaustion" for non-tech users, "Personalization Chasm" in link-sharing).
- UNIQUE SELLING PROPOSITION (USP): Suggest a USP specifically designed to exploit those weaknesses (e.g. Conversational SMS scheduling that requires ZERO links, or white-labeled 'Receptionist' interface).
- MARKET VALIDATION: Provide 3+ distinct 'marketValidation.indicators' based on documented user frustrations from Reddit/Forums (e.g. '30+ comments in r/legaladvice about scheduling link drop-offs'). 
- GO/NO-GO: Provide a refined 'goNoGoScore' (1-10) and 'goNoGoReason' based on this enhanced validation.
- INDUSTRY INSIGHTS: Detail 3-5 typical challenges and 2-3 common software adoption hurdles founders will face.
- KEY FEATURES: Extract EXACTLY 3-5 of the most critical MVP features that directly address the core pain point. These must be specific and actionable.`;
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: redditText ? `Niche: ${niche}\n\nContext:\n${redditText.slice(0, 6000)}` : `Niche: ${niche}`,
        config: {
          systemInstruction: sp,
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: ideaGenerationSchema
        }
      });
      
      const parsed = parseJSONResponse(response.text || "{}");
      setResult(parsed); setView("results"); setExpandedIdea(0);
      if (parsed.saasIdeas?.length) {
        checkAllDomains(parsed.saasIdeas);
        // Automatically trigger validation and research for all ideas
        parsed.saasIdeas.forEach((idea: any, idx: number) => {
          runAIMarketValidation(idea, idx);
          runDeepResearch(idea, idx);
        });
      }
    } catch (err: any) { 
      setError(`Generation failed: ${formatGeminiError(err)}`); 
      setView("niche"); 
    }
    finally { clearInterval(interval); setLoading(false); }
  };

  const generateMoreIdeas = async () => {
    if (!niche || !result) return;
    setLoadingMore(true);
    let mi = 0; setLoadingMsg("Generating 3 more ideas..."); setLoadingProgress(15);
    const interval = setInterval(() => { 
      mi = (mi + 1) % LOADING_STEPS.length; 
      setLoadingMsg(LOADING_STEPS[mi]); 
      setLoadingProgress(prev => Math.min(95, prev + 15));
    }, 1800);
    
    const existingIdeaNames = result.saasIdeas?.map((i: any) => i.name).join(", ");
    
    // Collect research findings
    const validationFindings = Object.entries(aiMarketValidation)
      .filter(([_, v]) => v.data)
      .map(([idx, v]) => `Validation for ${result.saasIdeas[idx]?.name || 'Idea'}: ${v.data}`)
      .join("\n\n");
      
    const deepResearchFindings = Object.entries(deepResearch)
      .filter(([_, v]) => v.data)
      .map(([idx, v]) => `Deep Research for ${result.saasIdeas[idx]?.name || 'Idea'}: ${v.data}`)
      .join("\n\n");

    const researchContext = `
Market Validation Findings:
${validationFindings || "None yet."}

Deep Research Findings:
${deepResearchFindings || "None yet."}
    `.trim();
    
    const sp = `You are an elite micro-SaaS researcher specialising in boring, high-retention B2B opportunities in legacy industries.
Return ONLY valid JSON matching the schema.
Exactly 3 saasIdeas. Build costs: Lovable.dev Pro $50/mo. Simple=1-3 days=$50-150. Moderate=3-7 days=$150-300. Complex=$300-600. Monthly ops=$50-120 (Lovable+Supabase+APIs).

CRITICAL INSTRUCTIONS:
1. Incorporate findings from the provided research context into the new ideas. Focus on solving the specific, documented pain points found in complaints and forum discussions.
2. Provide a concise description (max 80 words) for each.
3. Include genesis and marketAnalysis. 

SPECIAL INSTRUCTIONS FOR REFINED OUTPUT:
- GTM PLAYBOOK: Must be an extremely specific, actionable playbook. Avoid generic terms.
- COMPETITOR ANALYSIS: Name 2-3 direct/indirect competitors (e.g. Calendly, Acuity, Motion, Reclaim). Detail their strengths AND specific user-documented weaknesses (e.g. "Complexity Exhaustion" or "Personalization Chasm").
- UNIQUE SELLING PROPOSITION (USP): Suggest a USP specifically designed to exploit those weaknesses.
- MARKET VALIDATION: Provide 3+ distinct 'marketValidation.indicators' (e.g. '30+ comments in r/legaladvice about scheduling link drop-offs'). 
- GO/NO-GO: Provide a refined 'goNoGoScore' (1-10) and 'goNoGoReason' based on this enhanced validation.
- INDUSTRY INSIGHTS: Detail 3-5 typical challenges and 2-3 common software adoption hurdles.
- KEY FEATURES: Extract EXACTLY 3-5 of the most critical MVP features that directly address the core pain point. These must be specific and actionable.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Niche: ${niche}

Research Context:
${researchContext}

Existing ideas to avoid: ${existingIdeaNames}

Generate 3 MORE completely different SaaS ideas for this niche that solve the pain points found in research.`,
        config: {
          systemInstruction: sp,
          temperature: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: moreIdeasSchema
        }
      });
      
      const parsed = parseJSONResponse(response.text || "{}");
      if (parsed.saasIdeas?.length) {
        const startIndex = result?.saasIdeas?.length || 0;
        setResult((prev: any) => ({
          ...prev,
          saasIdeas: [...(prev?.saasIdeas || []), ...parsed.saasIdeas]
        }));
        checkAllDomains(parsed.saasIdeas);
        // Automatically trigger validation and research for NEW ideas
        parsed.saasIdeas.forEach((idea: any, idx: number) => {
          runAIMarketValidation(idea, startIndex + idx);
          runDeepResearch(idea, startIndex + idx);
        });
      }
    } catch (err: any) { 
      toast.error(`Failed to generate more ideas: ${formatGeminiError(err)}`); 
    }
    finally { clearInterval(interval); setLoadingMore(false); }
  };

  const resetAll = () => { setView("niche"); setResult(null); setExpandedIdea(null); setExpandedAbout(null); setSelectedNiche(""); setCustomNiche(""); setRedditText(""); setDomainStatus({}); setError(""); setLaunchKits({}); setDeepResearch({}); setEmailModal(null); setEmailSentFor({}); };

  const runAskAi = async () => {
    if (!askAiInput.trim()) return;
    setIsAskingAi(true);
    setLoading(true); setError(""); setResult(null); setDomainStatus({}); setLaunchKits({}); setDeepResearch({}); setEmailSentFor({}); setAiMarketValidation({});
    setView("loading");
    let mi = 0; setLoadingMsg(LOADING_STEPS[0]); setLoadingProgress(15);
    const interval = setInterval(() => { 
      mi = (mi + 1) % LOADING_STEPS.length; 
      setLoadingMsg(LOADING_STEPS[mi]); 
      setLoadingProgress(prev => Math.min(95, prev + 15));
    }, 1800);

    const sp = `You are an elite micro-SaaS researcher specialising in boring, high-retention B2B opportunities in legacy industries.
${userInterests ? `The user has the following background/interests: "${userInterests}". Tailor the solution to leverage this context if applicable.` : ''}
Return ONLY valid JSON matching the schema.
Rules:
- Generate exactly 1 highly specific, underserved B2B micro-SaaS idea based on this user input/problem description: "${askAiInput}".
- The idea MUST solve a painful, expensive problem for a specific industry audience.
- COMPETITOR ANALYSIS: Name 2-3 direct/indirect competitors, detail their strengths AND specific user-documented weaknesses.
- UNIQUE SELLING PROPOSITION (USP): Suggest a USP specifically designed to exploit those weaknesses.
- MARKET VALIDATION: Provide 3+ distinct 'marketValidation.indicators' based on high-signal data (e.g. reddit complaints, forum threads).
- GO/NO-GO: Provide a refined 'goNoGoScore' (1-10) and 'goNoGoReason' based on this validation.
- INDUSTRY INSIGHTS: Detail 3-5 typical challenges and 2-3 software adoption hurdles.
- MVP FEATURES: Extract EXACTLY 3-5 critical MVP features that directly address the core pain point.
- Ensure the output strictly matches the ideaGenerationSchema.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Generate a single, detailed micro-SaaS idea for this problem: ${askAiInput}. Focus on high-signal market validation and deep competitive analysis.`,
        config: {
          systemInstruction: sp,
          responseMimeType: "application/json",
          responseSchema: ideaGenerationSchema
        }
      });
      
      const parsed = parseJSONResponse(response.text || "{}");
      setResult(parsed);
      setView("results");
      if (parsed.saasIdeas?.length) {
        checkAllDomains(parsed.saasIdeas);
        parsed.saasIdeas.forEach((idea: any, idx: number) => {
          runAIMarketValidation(idea, idx);
          runDeepResearch(idea, idx);
        });
      }
    } catch (err: any) { 
      setError(formatGeminiError(err)); 
      setView("niche");
    }
    finally { clearInterval(interval); setLoading(false); setIsAskingAi(false); }
  };

  const runAIMarketValidation = async (idea: any, idx: number) => {
    setAiMarketValidation(prev => ({ ...prev, [idx]: { loading: true, data: null, error: null } }));
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Perform a comprehensive market validation for the following B2B micro-SaaS idea:
Name: ${idea.name}
Description: ${idea.description}
Pain Solved: ${idea.painSolved}
Target Audience: ${idea.targetAudience}

Use Google Search to find:
1. Recent forum discussions (Reddit, specialized forums) related to this pain point.
2. Social media sentiment and complaints.
3. Competitor analysis (who is already doing this, what are their weaknesses).

Based on your findings, provide:
- A summary of forum discussions and social media sentiment.
- A brief competitor analysis.
- A 'go/no-go' score (1-10).
- A brief reasoning for the score.

Format the output nicely in Markdown.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      setAiMarketValidation(prev => ({ ...prev, [idx]: { loading: false, data: response.text, error: null } }));
    } catch (err: any) {
      setAiMarketValidation(prev => ({ ...prev, [idx]: { loading: false, data: null, error: formatGeminiError(err) } }));
    }
  };

  const runDeepResearch = async (idea: any, idx: number) => {
    setDeepResearch(prev => ({ ...prev, [idx]: { loading: true, data: null, error: null, chunks: [] } }));
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Search the web for people in the "${niche}" industry complaining about this pain point: "${idea.painSolved}" or asking for an app that does "${idea.description}". Provide a concise summary of the search results, prioritizing and highlighting specific examples of user complaints and validation points found online. Do not output raw text, format it nicely.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setDeepResearch(prev => ({ ...prev, [idx]: { loading: false, data: response.text, chunks, error: null } }));
    } catch (err: any) {
      let msg = formatGeminiError(err);
      const lowerMsg = msg.toLowerCase();
      
      if (lowerMsg.includes("429") || lowerMsg.includes("rate limit") || lowerMsg.includes("quota")) {
        msg = "API Rate Limit Exceeded: The AI service is currently receiving too many requests. Please wait a moment and try again.";
      } else if (lowerMsg.includes("api key") || lowerMsg.includes("unauthorized") || lowerMsg.includes("401") || lowerMsg.includes("403")) {
        msg = "Your Gemini API key is missing or invalid. Please configure it in the AI Studio Secrets panel (top right).";
      }
      
      setDeepResearch(prev => ({ ...prev, [idx]: { loading: false, data: null, error: msg, chunks: [] } }));
    }
  };

  return (
    <div className="flex min-h-screen bg-ms-bg text-ms-text font-ms overflow-hidden relative">
      <OnboardingTour />

      {/* Side Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(80,230,160,0.008)_3px,rgba(80,230,160,0.008)_4px)]" />

      {/* NEW COLLAPSIBLE SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        className="flex flex-col border-r border-ms-border bg-ms-panel relative z-50 overflow-hidden shrink-0"
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-4 border-b border-ms-border shrink-0 overflow-hidden bg-ms-panel/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ms-green flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(80,230,160,0.3)]">
              <Zap className="w-6 h-6 text-ms-bg fill-ms-bg" strokeWidth={2.5} />
            </div>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-ms-green whitespace-nowrap overflow-hidden tracking-tighter text-[15px]"
              >
                SIGNAL ENGINE
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col gap-1 px-3">
          {/* Main Action */}
          <SidebarItem 
            icon={<Plus className="w-5 h-5" strokeWidth={2.5} />} 
            label="New Niche" 
            isOpen={sidebarOpen} 
            active={view === "niche"}
            onClick={resetAll}
            color="#5ce6a0"
          />
          
          <SidebarItem 
            icon={<Database className="w-5 h-5" strokeWidth={2.5} />} 
            label="Saved Kits" 
            isOpen={sidebarOpen} 
            active={view === "saved"}
            onClick={() => { setView("saved"); loadSavedKits(); }}
          />

          <div className="h-4" />
          <div className={`px-3 mb-2 font-bold text-[10px] text-ms-text-muted tracking-widest uppercase transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            Explore
          </div>

          <SidebarItem 
            icon={<Info className="w-5 h-5" strokeWidth={2.5} />} 
            label="About" 
            isOpen={sidebarOpen} 
            onClick={() => window.location.href = "/about"}
          />

          <div className="h-4" />
          <div className={`px-3 mb-2 font-bold text-[10px] text-ms-text-muted tracking-widest uppercase transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            System
          </div>

          <SidebarItem 
            icon={<User className="w-5 h-5" strokeWidth={2.5} />} 
            label="Profile" 
            isOpen={sidebarOpen} 
            onClick={() => window.location.href = "/profile"}
          />

          {(role === 'admin' || role === 'owner') && (
            <SidebarItem 
              icon={<Settings className="w-5 h-5" strokeWidth={2.5} />} 
              label="Settings" 
              isOpen={sidebarOpen} 
              onClick={() => window.location.href = "/settings"}
            />
          )}

          <SidebarItem 
            icon={<HelpCircle className="w-5 h-5" strokeWidth={2.5} />} 
            label="Help" 
            isOpen={sidebarOpen} 
            onClick={startTour}
          />

          <SidebarItem 
            icon={theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={2.5} /> : <Moon className="w-5 h-5" strokeWidth={2.5} />} 
            label={theme === "dark" ? "Light Mode" : "Dark Mode"} 
            isOpen={sidebarOpen} 
            onClick={toggleTheme}
          />
        </div>

        {/* Status / Bottom Action */}
        <div className="p-3 border-t border-ms-border">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center h-10 hover:bg-ms-panel-light transition-colors text-ms-text-muted hover:text-ms-green rounded-md border border-transparent hover:border-ms-border"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" strokeWidth={2.5} /> : <ChevronRight className="w-5 h-5" strokeWidth={2.5} />}
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative">
        {emailModal && <EmailModal idea={emailModal.idea} kit={emailModal.kit} roi={emailModal.roi || {}} hasServerResend={serverConfig.hasResend || !!localResendKey} localResendKey={localResendKey} onClose={() => setEmailModal(null)} />}

        {showCompareModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ms-bg/95 backdrop-blur-sm overflow-y-auto">
            <div className="bg-ms-bg border border-ms-green w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(80,230,160,0.15)] flex flex-col relative mt-auto mb-auto">
              <div className="sticky top-0 bg-ms-bg/95 backdrop-blur-md border-b border-ms-green/50 p-4 flex justify-between items-center z-[10]">
                <div className="font-ms text-ms-green font-bold tracking-wider flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  <span>◈ IDEA COMPARISON</span>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="text-ms-green hover:text-ms-green-light border border-ms-green hover:bg-ms-green hover:text-ms-bg transition-colors cursor-pointer px-3 py-1 font-ms text-[11px] font-bold uppercase">✕ Close</button>
              </div>
              
              <div className="p-4 md:p-6">
                <div className={`grid grid-cols-1 ${selectedForCompare.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 md:gap-6`}>
                  {selectedForCompare.map(idx => {
                    const idea = result?.saasIdeas?.[idx];
                    if (!idea) return null;
                    const d = DEMAND_CFG[(idea.demandLevel || "").toLowerCase()] || DEMAND_CFG.medium;
                    const c = COMP_CFG[(idea.competitionLevel || "").toLowerCase()] || COMP_CFG.medium;
                    const roiRaw = typeof idea.roiEstimate === 'string' ? { assumptions: idea.roiEstimate } : (idea.roiEstimate || {});
                    const roiPct = parseFloat(String(roiRaw.roiMonth1Pct ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
                    const roiColor = roiPct > 100 ? "#5ce6a0" : roiPct > 0 ? "#ffc857" : "#ff6b6b";

                    return (
                      <div key={idx} className="flex flex-col gap-4 border border-ms-border p-5 bg-ms-panel relative">
                        {/* Name & Tagline */}
                        <div>
                          <div className="w-8 h-8 absolute top-0 -translate-y-1/2 left-4 bg-ms-green text-ms-bg flex items-center justify-center font-ms text-[11px] font-bold border border-ms-green">{String(idx + 1).padStart(2, "0")}</div>
                          <div className="font-ms text-[16px] text-white font-bold mb-2 mt-2 leading-[1.3]">{idea.name}</div>
                          <div className="font-ms text-[11px] text-ms-text-muted pb-4 border-b border-ms-border/50 leading-[1.5]">{idea.tagline}</div>
                        </div>
                        
                        {/* Compare Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <div>
                            <div className="font-ms text-[10px] text-ms-text-muted mb-1.5 opacity-80 uppercase tracking-tighter">Boring Score</div>
                            <BoringScore score={idea.boringScore} />
                          </div>
                          <div>
                            <div className="font-ms text-[10px] text-ms-text-muted mb-1.5 opacity-80 uppercase tracking-tighter">ROI Mo.1</div>
                            <div className="font-ms text-[16px] font-bold leading-none mt-2" style={{ color: roiColor }}>{roiRaw.roiMonth1Pct || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <div className="font-ms text-[10px] text-ms-text-muted mb-1.5 opacity-80 uppercase tracking-tighter">Demand</div>
                            <Tag label={d.label} color={d.color} bg={d.bg} />
                          </div>
                          <div>
                            <div className="font-ms text-[10px] text-ms-text-muted mb-1.5 opacity-80 uppercase tracking-tighter">Competition</div>
                            <Tag label={c.label} color={c.color} />
                          </div>
                        </div>

                        {/* MVP Features */}
                        <div className="pt-4 border-t border-ms-border/50 flex-1">
                          <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-3">KEY MVP FEATURES</div>
                          <ul className="list-disc pl-4 m-0 font-ms text-[12px] text-ms-text-light flex flex-col gap-2">
                            {Array.isArray(idea.keyFeatures) ? idea.keyFeatures.map((kf: any, j: number) => {
                               const label = typeof kf === 'string' ? kf : kf?.name || kf?.feature || JSON.stringify(kf);
                               return <li key={j} className="leading-[1.5] marker:text-ms-green/50">{label}</li>;
                            }) : <span className="text-ms-text-muted italic">No key features identified.</span>}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-ms-border px-4 md:px-7 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-ms-panel/95 backdrop-blur-md">
          <div className="flex-1 min-w-0">
            <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1 font-bold flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>◈ MICRO-SAAS SIGNAL ENGINE v5.2</span>
              {view !== "niche" && (
                <span className="flex items-center gap-1 text-ms-text-muted ml-2 border-l border-ms-border pl-2">
                  <FolderSearch className="w-3 h-3" />
                  {niche.toUpperCase()}
                </span>
              )}
            </div>
            <div className="font-ms text-[16px] font-bold text-ms-white flex items-center gap-2 truncate">
              {view === "niche" ? "NEW RESEARCH CAMPAIGN" : (result?.saasIdea || "ANALYZING MARKET GAPS")}
            </div>
          </div>

          <div className="flex items-center gap-3.5 w-full md:w-auto justify-end">
            <div className="flex flex-col items-end gap-1">
              <div className={`font-ms text-[10px] font-bold flex items-center gap-1.5 transition-colors ${loading ? "text-ms-yellow" : result ? "text-ms-green" : "text-ms-text-muted"}`}>
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="inline-block">⟳</motion.span>
                    <span>{loadingMsg.toUpperCase()}</span>
                  </>
                ) : result ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>ANALYSIS COMPLETE</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-ms-green animate-pulse" />
                    <span>ENGINE READY</span>
                  </>
                )}
              </div>
              <div className="font-ms text-[9px] text-ms-text-muted tracking-wider">AI-POWERED MARKET SIGNAL 05.16.26</div>
            </div>

            {view !== "niche" && (
              <button 
                onClick={() => setView("niche")}
                className="flex items-center gap-2 bg-ms-green text-ms-bg px-3 py-1.5 font-bold font-ms text-[11px] hover:bg-ms-green-light transition-colors rounded-sm ml-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>REFINE</span>
              </button>
            )}
          </div>
        </header>

        <div className="max-w-[780px] w-full mx-auto p-4 md:p-7 flex-1 relative z-[1]">

        {/* ══ NICHE VIEW ══ */}
        {view === "niche" && (
          <div>
            <div className="mb-[22px]">
              <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1.5 font-bold">SELECT YOUR NICHE</div>
              <h2 className="font-ms text-[20px] m-0 mb-1.5 text-white font-bold">Who Are You Building For?</h2>
              <p className="font-ms text-[11px] text-ms-text-muted leading-[1.5] m-0">Start with <span className="text-ms-yellow font-bold">🏭 Legacy B2B Industries</span> for the highest retention and lowest competition. Each idea includes a Lovable.dev starter prompt, Stripe + Resend setup, pricing, ROI, and .com availability check.</p>
            </div>

            {/* Personalization Context Section */}
            <div className="mb-8 p-5 bg-ms-panel border-2 border-ms-green/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <User className="w-12 h-12 text-ms-green" />
              </div>
              <div className="font-ms text-[10px] text-ms-green font-bold tracking-[2px] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-ms-green rounded-full animate-pulse" />
                <span>STEP 1: YOUR SIGNAL (CONTEXT)</span>
              </div>
              <div className="flex flex-col gap-4">
                <p className="font-ms text-[11px] text-ms-text-muted m-0 leading-relaxed">
                  Enter your background, industry experience, or interests. Our AI will use this &quot;Signal&quot; to find underserved niches where you have a unique competitive advantage.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    id="user-interests-input"
                    value={userInterests} 
                    onChange={e => setUserInterests(e.target.value)} 
                    placeholder="e.g. 'I'm a former plumber', 'I love fitness', 'Expert in B2B logistics'..." 
                    className="font-ms flex-1 bg-ms-bg border border-ms-border text-ms-text px-4 py-3 text-[13px] outline-none focus:border-ms-green focus:shadow-[0_0_15px_rgba(80,230,160,0.1)] transition-all"
                    onKeyDown={e => e.key === 'Enter' && suggestNichesWithAI()}
                  />
                  <button 
                    id="btn-suggest-niches"
                    onClick={suggestNichesWithAI} 
                    disabled={isSuggestingNiches || !userInterests.trim()}
                    className="font-ms bg-ms-green text-ms-bg px-6 py-3 text-[13px] font-bold hover:bg-ms-green-light transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[160px] shadow-lg active:scale-95"
                  >
                    {isSuggestingNiches ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block font-mono">⟳</motion.span>
                        <span>MAPPING...</span>
                      </div>
                    ) : (
                      "FIND MY NICHES"
                    )}
                  </button>
                </div>

                {suggestedNiches.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-ms-border/50"
                  >
                    <div className="w-full font-ms text-[10px] text-ms-green/70 font-bold mb-1">CRAFTED FOR YOU:</div>
                    {suggestedNiches.map(n => (
                      <button 
                        key={n} 
                        onClick={() => { setCustomNiche(n); setSelectedNiche(""); }}
                        className={`font-ms px-3 py-2 text-[11px] cursor-pointer border transition-all ${customNiche === n ? "bg-ms-green text-ms-bg border-ms-green shadow-[0_0_15px_rgba(80,230,160,0.2)]" : "bg-ms-bg border-ms-border text-ms-text-muted hover:border-ms-green hover:text-ms-green"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-3 font-bold">STEP 2: CONFIRM INDUSTRY</div>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.keys(NICHE_CATEGORIES).map(cat => (
                  <button suppressHydrationWarning key={cat} onClick={() => { setActiveCategory(cat); setSelectedNiche(""); }} 
                    className={`font-ms text-[11px] cursor-pointer px-[13px] py-1.5 border ${activeCategory === cat ? (cat.includes("Legacy") ? "bg-ms-yellow-dark border-ms-yellow text-ms-yellow font-bold" : "bg-ms-panel-light border-ms-green text-ms-green font-bold") : "bg-transparent border-ms-border text-ms-text-muted font-normal"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-4 mb-4.5 flex flex-wrap gap-2 border transition-all duration-180 ${activeCategory.includes("Legacy") ? "border-ms-yellow-dark" : "border-ms-border"} bg-ms-panel`}>
              {(NICHE_CATEGORIES as any)[activeCategory].map((n: string) => {
                const a = selectedNiche === n && !customNiche, isL = activeCategory.includes("Legacy");
                return <button suppressHydrationWarning key={n} onClick={() => { setSelectedNiche(n); setCustomNiche(""); }} 
                  className={`font-ms px-4 py-[9px] text-[12px] cursor-pointer border ${a ? (isL ? "bg-ms-yellow-dark border-ms-yellow text-ms-yellow" : "bg-ms-panel-light border-ms-green text-ms-green") : "bg-transparent border-ms-border-light text-ms-text-muted"}`}>
                  {n}
                </button>;
              })}
            </div>

            <div className="mb-4.5" suppressHydrationWarning>
              <SL>Or Type a Custom Niche</SL>
              <input suppressHydrationWarning value={customNiche} id="custom-niche-input" onChange={e => { setCustomNiche(e.target.value); setSelectedNiche(""); }} placeholder="e.g. Taxidermists, Pool service companies, Farriers…" 
                className={`font-ms w-full box-border bg-ms-panel border ${customNiche ? "border-ms-green" : "border-ms-border"} text-ms-text px-[15px] py-[13px] text-[13px] outline-none mb-3`} />
            </div>

            <div className="mb-4.5" suppressHydrationWarning>
              <SL>Or Ask AI to Generate Ideas</SL>
              <div className="bg-ms-panel border border-ms-border p-4">
                <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-2 flex items-center gap-2">
                  <span>🤖 ASK AI</span>
                </div>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={askAiInput} 
                    onChange={e => setAskAiInput(e.target.value)} 
                    placeholder="Describe a problem you've noticed, a specific industry, or a workflow that needs fixing... (e.g., 'Dentists struggle to manage their online reviews and follow up with patients who leave bad ones.')" 
                    className="font-ms w-full bg-ms-bg border border-ms-border text-ms-text px-3 py-2 text-[12px] outline-none focus:border-ms-green resize-y min-h-[80px]"
                  />
                  {!user ? (
                    <div className="text-ms-text-muted text-[11px] mt-2">
                      <Link href="/profile" className="text-ms-green hover:underline">Log in</Link> to generate ideas.
                    </div>
                  ) : role === 'viewer' ? (
                    <div className="text-ms-text-muted text-[11px] mt-2">Viewer role cannot generate ideas.</div>
                  ) : (
                    <button 
                      onClick={runAskAi} 
                      disabled={isAskingAi || !askAiInput.trim()}
                      className="font-ms bg-ms-green-dark border border-ms-green text-ms-green px-4 py-2 text-[12px] font-bold hover:bg-ms-green hover:text-ms-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
                    >
                      {isAskingAi ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">⟳</motion.span>
                          <span>GENERATING IDEAS...</span>
                        </div>
                      ) : (
                        "GENERATE IDEAS FROM PROBLEM"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {niche && <div className="bg-ms-panel-light border border-ms-green border-l-4 border-l-ms-green px-4 py-2.5 mb-4.5 flex items-center flex-wrap gap-3">
              <span className="font-ms text-[10px] text-ms-green font-bold tracking-[1px]">TARGET NICHE:</span>
              <span className="font-ms text-[13px] text-white font-bold">{niche}</span>
            </div>}

            {/* Reddit */}
            <div className="mb-6">
              <button suppressHydrationWarning onClick={() => setShowReddit(!showReddit)} className={`font-ms bg-transparent border border-ms-border px-3.5 py-2 text-[11px] cursor-pointer ${showReddit ? "text-ms-green" : "text-ms-text-muted"}`}>
                {showReddit ? "▼" : "▶"} Enrich with Reddit / Article Data (Optional)
              </button>
              {showReddit && <div className="mt-2.5" suppressHydrationWarning>
                <div className="font-ms text-[11px] text-ms-text-muted leading-[1.5] mb-2">Paste Reddit JSON, article text, or any market research.</div>
                <textarea suppressHydrationWarning value={redditText} onChange={e => setRedditText(e.target.value)} placeholder="Paste content here…" rows={4} 
                  className={`font-ms w-full box-border bg-ms-panel border ${redditText ? "border-ms-green" : "border-ms-border"} text-ms-text-light p-[13px] text-[12px] resize-y outline-none leading-[1.6]`} />
              </div>}
            </div>

            {error && <div className="font-ms bg-ms-red-dark border border-ms-red-dark text-ms-red px-3.5 py-2.5 text-[12px] mb-4">✕ {error}</div>}
            
            {!user ? (
              <div className="bg-ms-panel border border-ms-border p-4 text-center">
                <p className="text-ms-text-muted text-xs mb-3">You must be logged in to generate ideas.</p>
                <Link href="/profile" className="font-ms inline-block bg-ms-green text-ms-bg px-6 py-2 text-[12px] font-bold no-underline">
                  Log In
                </Link>
              </div>
            ) : role === 'viewer' ? (
              <div className="bg-ms-panel border border-ms-border p-4 text-center">
                <p className="text-ms-text-muted text-xs">Your current role (Viewer) does not allow generating new ideas. Please contact an admin to upgrade your role.</p>
              </div>
            ) : (
              <button suppressHydrationWarning onClick={runGenerate} disabled={loading || !niche} className={`font-ms border-none px-11 py-4 text-[13px] font-bold ${niche && !loading ? "cursor-pointer" : "cursor-default"} ${loading ? "bg-ms-panel-light text-ms-green" : niche ? "bg-ms-green text-ms-bg" : "bg-ms-panel-light text-ms-text-muted"}`}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">⟳</motion.span>
                    <span>{loadingMsg}</span>
                  </div>
                ) : (
                  "⚡  Generate Ideas + Launch Kits →"
                )}
              </button>
            )}
          </div>
        )}

        {/* ══ LOADING VIEW ══ */}
        {view === "loading" && (
          <div className="animate-pulse">
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <div className="h-3 w-32 bg-ms-green/20 rounded mb-2"></div>
                <div className="h-6 w-64 bg-ms-border rounded"></div>
              </div>
            </div>
            
            <div className="bg-ms-panel-light border border-ms-green/30 border-l-4 border-l-ms-green/50 px-4.5 py-3.5 mb-4.5">
              <div className="h-3 w-24 bg-ms-green/20 rounded mb-3"></div>
              <div className="h-4 w-full bg-ms-border rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-ms-border rounded"></div>
            </div>
            
            <div className="bg-ms-panel border border-ms-border px-4 py-3 mb-4.5">
              <div className="h-3 w-16 bg-ms-green/20 rounded mb-2"></div>
              <div className="h-3 w-full bg-ms-border rounded mb-1"></div>
              <div className="h-3 w-5/6 bg-ms-border rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5.5">
              <div>
                <div className="h-3 w-32 bg-ms-green/20 rounded mb-3"></div>
                <div className="flex flex-col gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 h-[60px] rounded"></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="h-3 w-32 bg-ms-green/20 rounded mb-3"></div>
                <div className="flex flex-col gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 h-[36px] rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="h-3 w-48 bg-ms-green/20 rounded mb-3"></div>
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-ms-panel border border-ms-border h-[72px] rounded"></div>
                ))}
              </div>
            </div>
            
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-ms-bg/80 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl bg-ms-panel border-2 border-ms-green p-8 md:p-12 shadow-[0_0_60px_rgba(92,230,160,0.3)] rounded-sm relative overflow-hidden"
              >
                {/* Animated tech grid background */}
                <motion.div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(#5ce6a0 1px, transparent 1px), linear-gradient(90deg, #5ce6a0 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                  animate={{ backgroundPosition: ['0px 0px', '20px 20px'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="flex flex-col gap-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-ms-green font-ms text-lg md:text-xl font-bold">
                      <motion.span 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ⟳
                      </motion.span>
                      <span className="tracking-[2px] uppercase">Processing AI Signal...</span>
                    </div>
                    <div className="text-ms-bg font-ms text-base md:text-lg font-bold bg-ms-green px-3 py-1.5 rounded-sm shadow-[0_0_15px_rgba(80,230,160,0.5)]">
                      {loadingProgress}%
                    </div>
                  </div>

                  <div className="bg-ms-bg/60 backdrop-blur-md border border-ms-green/20 p-6 shadow-inner">
                    <div className="flex flex-col gap-4">
                      {/* Granular Progress Message */}
                      <div className="flex items-center gap-3 border-b border-ms-border/50 pb-4 mb-2">
                        <div className="w-1.5 h-1.5 bg-ms-green rounded-full animate-pulse shadow-[0_0_8px_#5ce6a0]" />
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={loadingMsg}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-ms-green font-bold text-[14px] tracking-tight uppercase"
                          >
                            {loadingMsg}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <ProgressSteps 
                        steps={LOADING_STEPS}
                        isComplete={false}
                        intervalMs={Math.max(800, 15000 / LOADING_STEPS.length)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between font-ms text-[10px] text-ms-text-muted tracking-widest uppercase font-bold">
                      <span>Neural Mapping in Progress</span>
                      <span>{loadingProgress}% Accuracy</span>
                    </div>
                    <div className="h-3 w-full bg-ms-bg border border-ms-border/50 rounded-sm overflow-hidden relative shadow-inner">
                      <motion.div 
                        className="h-full bg-ms-green relative overflow-hidden" 
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* ══ RESULTS VIEW ══ */}
        {view === "results" && result && (
          <div>
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1 font-bold">RESULTS — {(result.niche || niche).toUpperCase()}</div>
                <h2 className="font-ms text-[20px] m-0 text-white font-bold">Boring B2B Opportunity Map</h2>
              </div>
              <div className="flex gap-1.5 items-center flex-wrap">
                <button suppressHydrationWarning onClick={resetAll} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-3 py-[7px] text-[11px] cursor-pointer whitespace-nowrap hover:text-white hover:border-ms-border-light">← New Niche</button>
                <button suppressHydrationWarning onClick={() => setView("niche")} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-3 py-[7px] text-[11px] cursor-pointer whitespace-nowrap hover:text-white hover:border-ms-border-light">✏️ Refine Niche</button>
                <button suppressHydrationWarning onClick={() => checkAllDomains(result.saasIdeas)} className="font-ms bg-ms-panel-light border border-ms-green text-ms-green px-3 py-[7px] text-[11px] cursor-pointer whitespace-nowrap">🌐 Check Domains</button>
              </div>
            </div>

            {result.verdict && <div className="bg-ms-panel-light border border-ms-green border-l-4 border-l-ms-green px-4.5 py-3.5 mb-4.5">
              <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1.5px] mb-1">◈ TOP SIGNAL</div>
              <div className="font-ms text-[14px] text-white leading-[1.6] font-bold">{result.verdict}</div>
            </div>}
            {result.marketSummary && <div className="bg-ms-panel border border-ms-border px-4 py-3 mb-4.5">
              <span className="font-ms text-[10px] text-ms-green font-bold tracking-[1.5px] mr-2.5">MARKET:</span>
              <span className="font-ms text-[13px] text-ms-text leading-[1.7]">{result.marketSummary}</span>
            </div>}

            {/* Audiences + Pain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5.5">
              {Array.isArray(result.targetAudiences) && result.targetAudiences.length > 0 && (
                <div><SL>👤 Target Audiences</SL>
                  <div className="flex flex-col gap-1.5">
                    {result.targetAudiences.map((a: any, i: number) => {
                      if (typeof a === 'string') {
                        return <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 border-l-3 border-l-ms-text-muted">
                          <div className="font-ms text-[12px] text-white font-bold">{a}</div>
                        </div>;
                      }
                      const pc = a.willingnessToPay === "high" ? "#5ce6a0" : a.willingnessToPay === "medium" ? "#ffc857" : "#7a9e7a";
                      return <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 border-l-3" style={{ borderLeftColor: pc }}>
                        <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                          <div className="font-ms text-[12px] text-white font-bold">{a.name}</div>
                          <div className="flex flex-wrap gap-1">
                            <Tag label={(a.size || "").toUpperCase()} color="#6aaa6a" />
                            <Tag label={`${(a.willingnessToPay || "").toUpperCase()} $`} color={pc} tip={`These customers are ${a.willingnessToPay === "high" ? "very likely to pay and have budgets for software" : "moderately open to paying for software"}.`} />
                          </div>
                        </div>
                        <div className="font-ms text-[11px] text-ms-text-light leading-[1.6]">{a.description}</div>
                      </div>;
                    })}
                  </div>
                </div>
              )}
              {Array.isArray(result.topPainPoints) && result.topPainPoints.length > 0 && (
                <div><SL color="#ff9999">🔥 Top Pain Points</SL>
                  <div className="flex flex-col gap-1.5">
                    {result.topPainPoints.map((p: any, i: number) => {
                      if (typeof p === 'string') {
                        return <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 border-l-3 border-l-ms-yellow">
                          <div className="font-ms text-[12px] text-ms-text leading-[1.5] flex-1">{p}</div>
                        </div>;
                      }
                      const d = DEMAND_CFG[p.severity] || DEMAND_CFG.medium;
                      return <div key={i} className="bg-ms-panel border border-ms-border px-3 py-2.5 border-l-3" style={{ borderLeftColor: d.color }}>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <div className="font-ms text-[12px] text-ms-text leading-[1.5] flex-1">{p.pain}</div>
                          <Tag label={d.label} color={d.color} bg={d.bg} tip={d.tip} />
                        </div>
                        {p.audience && <div className="font-ms text-[11px] text-ms-text-muted leading-[1.5]">⟶ {p.audience}</div>}
                        {p.currentWorkaround && <div className="font-ms text-[11px] text-ms-text-muted italic mt-[3px]">Now: {p.currentWorkaround}</div>}
                      </div>;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Idea Landscape Chart */}
            <IdeaLandscapeChart ideas={result.saasIdeas} />

            {/* Local Business Finder */}
            <LocalBusinessFinder niche={niche} />

            {/* IDEA CARDS */}
            {Array.isArray(result.saasIdeas) && result.saasIdeas.length > 0 && (
              <div className="relative">
                {selectedForCompare.length > 0 && (
                  <div className="bg-ms-panel border border-ms-green p-3 mb-4 flex justify-between items-center sticky top-4 z-[10] shadow-[0_0_20px_rgba(80,230,160,0.1)]">
                    <div className="font-ms text-ms-white text-[12px]">
                      <span className="text-ms-green font-bold">{selectedForCompare.length}</span> / 3 selected
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedForCompare([])} className="text-ms-text-muted hover:text-ms-white font-ms text-[11px] px-2 py-1.5 cursor-pointer border border-transparent hover:border-ms-border">
                        Clear
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedForCompare.length < 2) toast.error("Select at least 2 ideas to compare.");
                          else setShowCompareModal(true);
                        }} 
                        className={`font-ms text-[11px] px-4 py-1.5 font-bold transition-colors ${selectedForCompare.length >= 2 ? "bg-ms-green text-ms-bg cursor-pointer hover:bg-ms-green-light" : "bg-ms-panel-light text-ms-text-muted cursor-not-allowed"}`}
                      >
                        Compare Selected
                      </button>
                    </div>
                  </div>
                )}
                
                <SL color="#ffc857">⚡ Micro-SaaS Ideas — Click to Expand</SL>
                <div className="flex flex-col gap-2.5">
                  {result.saasIdeas.map((idea: any, i: number) => {
                    const compLevel = (idea.competitionLevel || "").toLowerCase();
                    const d = DEMAND_CFG[(idea.demandLevel || "").toLowerCase()] || DEMAND_CFG.medium;
                    const c = COMP_CFG[compLevel] || COMP_CFG.medium;
                    const churn = CHURN_CFG[(idea.churnRisk || "").toLowerCase()] || CHURN_CFG.medium;
                    const bldC = COMPLEX_CFG[(idea.buildComplexity || "").toLowerCase()] || COMPLEX_CFG.moderate;
                    const intC = COMPLEX_CFG[(idea.integrationComplexity || "").toLowerCase()] || COMPLEX_CFG.moderate;
                    const isOpen = expandedIdea === i;
                    const roiRaw = typeof idea.roiEstimate === 'string' ? { assumptions: idea.roiEstimate } : (idea.roiEstimate || {});
                    const roi = {
                      buildCostUSD: String(roiRaw.buildCostUSD ?? ""),
                      monthlyExpensesUSD: String(roiRaw.monthlyExpensesUSD ?? ""),
                      realisticMRRMonth1USD: String(roiRaw.realisticMRRMonth1USD ?? ""),
                      roiMonth1Pct: String(roiRaw.roiMonth1Pct ?? ""),
                      breakEvenMonths: String(roiRaw.breakEvenMonths ?? ""),
                      assumptions: String(roiRaw.assumptions ?? ""),
                    };
                    const roiPct = parseFloat(String(roi.roiMonth1Pct ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
                    const roiColor = roiPct > 100 ? "#5ce6a0" : roiPct > 0 ? "#ffc857" : "#ff6b6b";
                    const domain = toDomain(idea.name), domH = toDomainHyphen(idea.name);
                    const domStat = domainStatus[domain];
                    const kit = launchKits[i];

                    return (
                      <div key={i} className={`transition-all duration-180 border ${isOpen ? "bg-ms-panel-light border-ms-green" : "bg-ms-panel border-ms-border"}`}>
                        {/* Header */}
                        <div className="px-4.5 py-3.5 flex flex-col gap-3 cursor-pointer" onClick={() => setExpandedIdea(isOpen ? null : i)}>
                          <div className="flex items-center gap-2.5 w-full justify-between">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <input 
                                type="checkbox" 
                                checked={selectedForCompare.includes(i)} 
                                onChange={(e) => { e.stopPropagation(); toggleCompare(i); }} 
                                onClick={(e) => e.stopPropagation()}
                                className="accent-ms-green mr-2 cursor-pointer w-4 h-4 shrink-0 transition-transform hover:scale-110"
                                title="Select for comparison"
                              />
                              <div className={`w-8 h-8 shrink-0 border flex items-center justify-center font-ms text-[11px] font-bold ${isOpen ? "bg-ms-panel-light border-ms-green text-ms-green" : "bg-ms-panel border-ms-border text-ms-text-muted"}`}>{String(i + 1).padStart(2, "0")}</div>
                              <div className="flex-1 overflow-hidden">
                                <div className="font-ms text-[14px] text-white font-bold mb-0.5 truncate">{idea.name}</div>
                                <div className="font-ms text-[11px] text-ms-text-muted truncate">{idea.tagline}</div>
                              </div>
                            </div>
                            <div className={`font-ms text-[13px] shrink-0 ml-2 ${isOpen ? "text-ms-green" : "text-ms-text-muted"}`}>{isOpen ? "▲" : "▼"}</div>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full pt-2">
                            <div className="flex flex-wrap items-center gap-2.5 w-full">
                              <BoringScore score={idea.boringScore} />
                              <Tag label={churn.label} color={churn.color} bg={churn.bg} tip={churn.tip} />
                              <DomainBadge status={domStat} domain={domain} onCheck={() => checkDomain(domain)} />
                              {roi.roiMonth1Pct && (
                                <div className="ml-auto">
                                  <Tooltip text="ROI = Return On Investment. How much money you make back vs what you spent building it. 100% = got your money back. 300% = tripled it! These are Month 1 numbers — it gets better every month after.">
                                    <div className="bg-ms-panel-light border px-2 py-1.5 text-center cursor-help min-w-[80px]" style={{ borderColor: roiColor }}>
                                      <div className="font-ms text-[9px] font-bold tracking-[1px] mb-0.5" style={{ color: roiColor }}>ROI MO.1 ⓘ</div>
                                      <div className="font-ms text-[13px] font-bold" style={{ color: roiColor }}>{roi.roiMonth1Pct}</div>
                                      <div className="w-full h-[14px] mt-1">
                                        {(() => {
                                          const buildCost = parseFloat((roi.buildCostUSD || "0").replace(/[^0-9.-]+/g,""));
                                          const monthlyExp = parseFloat((roi.monthlyExpensesUSD || "0").replace(/[^0-9.-]+/g,""));
                                          const mrr = parseFloat((roi.realisticMRRMonth1USD || "0").replace(/[^0-9.-]+/g,""));
                                          const chartData = [
                                            { profit: -buildCost },
                                            { profit: -buildCost + mrr - monthlyExp },
                                            { profit: -buildCost + 2*mrr - 2*monthlyExp },
                                            { profit: -buildCost + 3*mrr - 3*monthlyExp },
                                          ];
                                          return (
                                            <ResponsiveContainer width="100%" height="100%">
                                              <AreaChart data={chartData}>
                                                <Area type="monotone" dataKey="profit" stroke={roiColor} strokeWidth={1.5} fill={roiColor} fillOpacity={0.2} isAnimationActive={false} />
                                              </AreaChart>
                                            </ResponsiveContainer>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0 flex-wrap">
                              <Tag label={d.label} color={d.color} bg={d.bg} tip={d.tip} />
                              <Tag label={c.label} color={c.color} tip={c.tip} />
                            </div>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-ms-border p-5">
                            {/* Domain */}
                            {(!domStat?.startsWith("error:") && !domainStatus[domH]?.startsWith("error:")) && (
                              <div className="bg-ms-bg border border-ms-border px-4 py-3 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1.5px] flex items-center gap-2">
                                    <span>🌐 DOMAIN AVAILABILITY</span>
                                  </div>
                                  <a href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="font-ms text-[10px] font-bold text-ms-green hover:text-ms-green-light no-underline whitespace-nowrap">Search on GoDaddy ↗</a>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {Array.from(new Set([domain, domH])).map(d2 => {
                                    const d2Stat = domainStatus[d2];
                                    const isError = d2Stat && d2Stat.startsWith("error:");
                                    return (
                                      <div key={d2} className={`flex flex-col md:flex-row md:items-center justify-between p-3 border ${d2Stat === "available" ? "bg-ms-green-dark/10 border-ms-green/40" : d2Stat === "taken" ? "bg-ms-red-dark/10 border-ms-red/20" : isError ? "bg-ms-red-dark/10 border-ms-red/40" : "bg-ms-panel border-ms-border"} gap-3 transition-colors`}>
                                        <div className="flex items-center gap-3">
                                          <span className="font-ms text-[14px] text-white font-bold">{d2}</span>
                                        </div>
                                        <div className="flex items-center gap-3 self-start md:self-auto">
                                          {d2Stat ? (
                                            <span className={`font-ms text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 ${
                                              d2Stat === "available" ? "bg-ms-green text-ms-bg" : 
                                              d2Stat === "taken" ? "bg-ms-red-dark text-ms-red border border-ms-red/30" : 
                                              isError ? "bg-ms-red-dark text-ms-red border border-ms-red" : 
                                              "text-ms-yellow"
                                            }`}>
                                              {d2Stat === "available" ? "✓ AVAILABLE" : 
                                               d2Stat === "taken" ? "✗ TAKEN" : 
                                               d2Stat === "checking" ? <><span className="inline-block animate-spin">⟳</span> CHECKING…</> : 
                                               "⚠ ERROR"}
                                            </span>
                                          ) : (
                                            <span className="font-ms text-[10px] text-ms-text-muted">WAITING...</span>
                                          )}
                                          {d2Stat && d2Stat !== "checking" && (
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); checkDomain(d2); }}
                                              className="bg-transparent border border-ms-border text-ms-text-muted hover:text-ms-green hover:border-ms-green px-2 py-1 cursor-pointer transition-colors"
                                              title="Re-check domain"
                                            >
                                              <span className="font-ms text-[10px]">↻ RE-CHECK</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* GTM */}
                            {idea.gtmChannel && <div className="bg-ms-yellow-dark border border-ms-yellow-dark border-l-4 border-l-ms-yellow px-3.5 py-2.5 mb-3.5">
                              <div className="font-ms text-[10px] text-ms-yellow font-bold tracking-[1px] mb-[3px]">📣 GO-TO-MARKET CHANNEL</div>
                              <div className="font-ms text-[13px] text-ms-yellow font-bold">{idea.gtmChannel}</div>
                            </div>}

                            {/* Competition Reason */}
                            {(compLevel === 'high' || compLevel === 'medium') && idea.competitionReason && (
                              <div className="bg-ms-panel border border-ms-border border-l-4 px-3.5 py-2.5 mb-3.5" style={{ borderLeftColor: c.color }}>
                                <div className="font-ms text-[10px] font-bold tracking-[1px] mb-[3px]" style={{ color: c.color }}>
                                  ⚔️ COMPETITION ANALYSIS ({compLevel.toUpperCase()})
                                </div>
                                <div className="font-ms text-[13px] text-ms-text leading-[1.6]">
                                  {idea.competitionReason}
                                </div>
                              </div>
                            )}

                            {/* Desc + Pain */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
                              <div><SL>Description</SL><div className="font-ms text-[13px] text-ms-text leading-[1.7]">{idea.description}</div></div>
                              <div><SL color="#ffc857">Pain It Solves</SL><div className="font-ms text-[13px] text-ms-text leading-[1.7]">{idea.painSolved}</div></div>
                            </div>

                            {/* About This Idea */}
                            <div className="mb-3.5">
                              <button suppressHydrationWarning onClick={(e) => { e.stopPropagation(); setExpandedAbout(expandedAbout === i ? null : i); }} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-3 py-1.5 text-[11px] cursor-pointer flex items-center gap-1.5 hover:text-ms-green hover:border-ms-green transition-colors">
                                {expandedAbout === i ? "▼" : "▶"} About This Idea (Genesis, Market Analysis & Deep Research)
                              </button>
                              {expandedAbout === i && (
                                <div className="mt-2.5 p-3.5 bg-ms-panel border border-ms-border">
                                  <div className="mb-4 space-y-4">
                                    <SL color="#5ce6a0">Idea Genesis</SL>
                                    <div className="font-ms text-[12px] text-ms-text-light leading-[1.6]">{idea.genesis || "Genesis information is not available for this idea."}</div>
                                  </div>

                                  {idea.industryInsights && (
                                    <div className="mb-4 border-t border-ms-border pt-4">
                                      <SL color="#ffc857">Industry Insights</SL>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">TYPICAL CHALLENGES</div>
                                          <ul className="list-disc pl-4 m-0 font-ms text-[12px] text-ms-text-light flex flex-col gap-1.5">
                                            {idea.industryInsights.typicalChallenges?.map((tc: string, j: number) => <li key={j} className="leading-relaxed">{tc}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">ADOPTION HURDLES</div>
                                          <ul className="list-disc pl-4 m-0 font-ms text-[12px] text-ms-text-light flex flex-col gap-1.5">
                                            {idea.industryInsights.softwareAdoptionHurdles?.map((ah: string, j: number) => <li key={j} className="leading-relaxed">{ah}</li>)}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="mb-4 border-t border-ms-border pt-4">
                                    <SL color="#ffc857">Market Analysis</SL>
                                    <div className="font-ms text-[12px] text-ms-text-light leading-[1.6]">{idea.marketAnalysis || "Market analysis is not available for this idea."}</div>
                                  </div>
                                  
                                  {idea.competitorAnalysis && (
                                    <div className="mb-4 border-t border-ms-border pt-4">
                                      <SL color="#ff6b6b">Competitor Analysis</SL>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">MAJOR COMPETITORS</div>
                                          <ul className="list-disc pl-4 m-0 font-ms text-[12px] text-ms-text-light">
                                            {idea.competitorAnalysis.majorCompetitors?.map((c: string, j: number) => <li key={j}>{c}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">UNIQUE SELLING PROPOSITION</div>
                                          <div className="font-ms text-[12px] text-ms-green leading-[1.5]">{idea.competitorAnalysis.uniqueSellingProposition}</div>
                                        </div>
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">THEIR STRENGTHS</div>
                                          <div className="font-ms text-[12px] text-ms-text-light leading-[1.5]">{idea.competitorAnalysis.competitorStrengths}</div>
                                        </div>
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">THEIR WEAKNESSES</div>
                                          <div className="font-ms text-[12px] text-ms-text-light leading-[1.5]">{idea.competitorAnalysis.competitorWeaknesses}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {idea.marketValidation && (
                                    <div className="mb-4 border-t border-ms-border pt-4">
                                      <SL color="#5ce6a0">Market Validation</SL>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">INDICATORS</div>
                                          <ul className="list-disc pl-4 m-0 font-ms text-[12px] text-ms-text-light">
                                            {idea.marketValidation.indicators?.map((ind: string, j: number) => <li key={j}>{ind}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">METRICS</div>
                                          <div className="font-ms text-[12px] text-ms-text-light leading-[1.5]">{idea.marketValidation.metrics}</div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                          <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-1">EARLY ADOPTER SIGNALS</div>
                                          <div className="font-ms text-[12px] text-ms-text-light leading-[1.5]">{idea.marketValidation.earlyAdopterSignals}</div>
                                        </div>
                                      </div>
                                      {idea.marketValidation.goNoGoScore && (
                                        <div className="mt-4 bg-ms-yellow-dark/20 border border-ms-yellow-dark px-4 py-3 flex justify-between items-center">
                                          <div className="font-ms text-[11px] text-ms-green">{idea.marketValidation.goNoGoReason}</div>
                                          <div className="text-center shrink-0 ml-4">
                                            <div className="font-ms text-[10px] text-ms-text-muted mb-0.5">GO / NO-GO</div>
                                            <div className={`font-ms text-[28px] font-bold ${parseInt(idea.marketValidation.goNoGoScore) >= 7 ? "text-ms-green" : parseInt(idea.marketValidation.goNoGoScore) >= 5 ? "text-ms-yellow" : "text-ms-red"}`}>{idea.marketValidation.goNoGoScore}/10</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* AI Market Validation */}
                                  <div className="border-t border-ms-border pt-4">
                                    {!aiMarketValidation[i] && <button suppressHydrationWarning onClick={e => { e.stopPropagation(); runAIMarketValidation(idea, i); }} className="font-ms bg-ms-yellow-dark border border-ms-yellow text-ms-yellow px-5 py-2.5 text-[12px] font-bold cursor-pointer w-full hover:bg-ms-yellow hover:text-ms-bg transition-colors">🤖 AI-Powered Market Validation</button>}
                                    {aiMarketValidation[i]?.loading && (
                                      <div className="bg-ms-panel border border-ms-border p-5">
                                        <ProgressSteps 
                                          steps={RESEARCH_STEPS} 
                                          isComplete={!!aiMarketValidation[i].data}
                                          intervalMs={1800}
                                        />
                                        <div className="mt-6 space-y-3 animate-pulse opacity-50">
                                          <div className="h-3 w-full bg-ms-border rounded"></div>
                                          <div className="h-3 w-5/6 bg-ms-border rounded"></div>
                                          <div className="h-3 w-4/6 bg-ms-border rounded"></div>
                                        </div>
                                      </div>
                                    )}
                                    {aiMarketValidation[i]?.error && <div className="bg-ms-red-dark border border-ms-red-dark p-3 flex justify-between items-center"><span className="font-ms text-[12px] text-ms-red">✕ {aiMarketValidation[i].error}</span><button suppressHydrationWarning onClick={e => { e.stopPropagation(); runAIMarketValidation(idea, i); }} className="font-ms bg-transparent border border-ms-red text-ms-red px-3 py-1.5 text-[11px] cursor-pointer">Retry</button></div>}
                                    {aiMarketValidation[i]?.data && (
                                      <div className="bg-ms-panel border border-ms-border p-4">
                                        <div className="flex justify-between items-center mb-3 flex-wrap gap-1.5">
                                          <div className="font-ms text-[11px] text-ms-yellow font-bold tracking-[1px]">🤖 AI MARKET VALIDATION</div>
                                          <button suppressHydrationWarning onClick={e => { e.stopPropagation(); runAIMarketValidation(idea, i); }} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-2.5 py-1 text-[10px] cursor-pointer">↻ Run Again</button>
                                        </div>
                                        <div className="font-ms text-[13px] text-ms-text leading-[1.6] prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-white prose-a:text-ms-green">
                                          <ReactMarkdown>{aiMarketValidation[i].data}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Deep Research */}
                                  <div className="border-t border-ms-border pt-4">
                                    {!deepResearch[i] && <button suppressHydrationWarning onClick={e => { e.stopPropagation(); runDeepResearch(idea, i); }} className="font-ms bg-transparent border border-ms-border text-ms-green px-5 py-2.5 text-[12px] font-bold cursor-pointer w-full hover:bg-ms-panel-light transition-colors">🔍 Deep Research (Find Real Complaints & Validation)</button>}
                                    {deepResearch[i]?.loading && (
                                      <div className="bg-ms-panel border border-ms-border p-5">
                                        <ProgressSteps 
                                          steps={RESEARCH_STEPS} 
                                          isComplete={!!deepResearch[i].data}
                                          intervalMs={2200}
                                        />
                                        <div className="mt-6 space-y-3 animate-pulse opacity-50">
                                          <div className="h-3 w-full bg-ms-border rounded"></div>
                                          <div className="h-3 w-5/6 bg-ms-border rounded"></div>
                                          <div className="h-3 w-4/6 bg-ms-border rounded"></div>
                                        </div>
                                      </div>
                                    )}
                                    {deepResearch[i]?.error && <div className="bg-ms-red-dark border border-ms-red-dark p-3 flex justify-between items-center"><span className="font-ms text-[12px] text-ms-red">✕ {deepResearch[i].error}</span><button suppressHydrationWarning onClick={e => { e.stopPropagation(); runDeepResearch(idea, i); }} className="font-ms bg-transparent border border-ms-red text-ms-red px-3 py-1.5 text-[11px] cursor-pointer">Retry</button></div>}
                                    {deepResearch[i]?.data && (
                                      <div className="bg-ms-panel border border-ms-border p-4">
                                        <div className="flex justify-between items-center mb-3 flex-wrap gap-1.5">
                                          <div className="font-ms text-[11px] text-ms-green font-bold tracking-[1px]">🔍 DEEP RESEARCH RESULTS</div>
                                          <button suppressHydrationWarning onClick={e => { e.stopPropagation(); runDeepResearch(idea, i); }} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-2.5 py-1 text-[10px] cursor-pointer">↻ Research Again</button>
                                        </div>
                                        <div className="font-ms text-[13px] text-ms-text leading-[1.6] prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-white prose-a:text-ms-green">
                                          <ReactMarkdown>{deepResearch[i].data}</ReactMarkdown>
                                        </div>
                                        {deepResearch[i].chunks?.length > 0 && (
                                          <div className="mt-4 pt-3 border-t border-ms-border">
                                            <div className="font-ms text-[10px] text-ms-text-muted font-bold tracking-[1px] mb-2">SOURCES</div>
                                            <ul className="m-0 p-0 pl-4">
                                              {deepResearch[i].chunks.map((chunk: any, cIdx: number) => {
                                                const url = chunk.web?.uri;
                                                const title = chunk.web?.title;
                                                if (!url) return null;
                                                return (
                                                  <li key={cIdx} className="font-ms text-[11px] mb-1">
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-ms-green hover:underline">{title || url}</a>
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 4-col */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
                              <div className="bg-ms-bg border border-ms-border p-2.5"><SL>Target Customer</SL><div className="font-ms text-[11px] text-ms-text-light leading-[1.6]">{idea.targetAudience}</div></div>
                              <div className="bg-ms-bg border border-ms-border p-2.5"><SL color="#ff9999">Reddit Signal</SL><div className="font-ms text-[11px] text-ms-text-light leading-[1.6]">{idea.redditSignal}</div></div>
                              <div className="bg-ms-bg border p-2.5" style={{ borderColor: `${bldC.color}22` }}>
                                <Tooltip text={bldC.buildTip}>
                                  <div className="cursor-help">
                                    <SL color={bldC.color}>🔨 Build ⓘ</SL>
                                    <div className="font-ms text-[13px] font-bold" style={{ color: bldC.color }}>{bldC.label}</div>
                                    <div className="font-ms text-[11px] text-ms-text-muted leading-[1.5] mt-[3px]">Lovable.dev prompting</div>
                                  </div>
                                </Tooltip>
                              </div>
                              <div className="bg-ms-bg border p-2.5" style={{ borderColor: `${intC.color}22` }}>
                                <Tooltip text={intC.integTip}>
                                  <div className="cursor-help">
                                    <SL color={intC.color}>🔌 Integration ⓘ</SL>
                                    <div className="font-ms text-[13px] font-bold" style={{ color: intC.color }}>{intC.label}</div>
                                    <div className="font-ms text-[11px] text-ms-text-muted leading-[1.5] mt-[3px]">Their legacy systems</div>
                                  </div>
                                </Tooltip>
                              </div>
                            </div>

                            {/* ROI */}
                            <div className="bg-ms-bg border p-3.5 mb-3.5" style={{ borderColor: roiColor }}>
                              <div className="flex justify-between items-start mb-2">
                                <Tooltip text="ROI = Return On Investment. How much money you make back vs what you spent. 100% = got your money back. 300% = tripled it! All build costs are based on Lovable.dev subscription time — no developer needed.">
                                  <div className="cursor-help inline-block"><SL color={roiColor}>📊 1-Month ROI ⓘ — Lovable.dev Build Costs</SL></div>
                                </Tooltip>
                                <CopyButton text={`Build Cost: ${roi.buildCostUSD}\nMonthly Ops: ${roi.monthlyExpensesUSD}\nMRR (Month 1): ${roi.realisticMRRMonth1USD}\nBreak-even: ${roi.breakEvenMonths} months\nROI Month 1: ${roi.roiMonth1Pct}\nAssumptions: ${roi.assumptions}`} label="COPY ROI" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[["Build cost (Lovable)", roi.buildCostUSD], ["Monthly ops", roi.monthlyExpensesUSD], ["MRR (Month 1)", roi.realisticMRRMonth1USD]].map(([k, v]) => v ? (
                                  <div key={k} className="text-center relative group">
                                    <div className="font-ms text-[10px] text-ms-text-muted mb-[3px]">{k}</div>
                                    <div className="font-ms text-[15px] text-ms-text font-bold flex items-center justify-center gap-2">
                                      {v}
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={String(v)} />
                                      </div>
                                    </div>
                                  </div>
                                ) : null)}
                              </div>
                              {(() => {
                                const buildCost = parseFloat((roi.buildCostUSD || "0").replace(/[^0-9.-]+/g,""));
                                const monthlyExp = parseFloat((roi.monthlyExpensesUSD || "0").replace(/[^0-9.-]+/g,""));
                                const mrr = parseFloat((roi.realisticMRRMonth1USD || "0").replace(/[^0-9.-]+/g,""));
                                const chartData = [
                                  { month: 'M0', profit: -buildCost },
                                  { month: 'M1', profit: -buildCost + mrr - monthlyExp },
                                  { month: 'M2', profit: -buildCost + 2*mrr - 2*monthlyExp },
                                  { month: 'M3', profit: -buildCost + 3*mrr - 3*monthlyExp },
                                  { month: 'M4', profit: -buildCost + 4*mrr - 4*monthlyExp },
                                  { month: 'M5', profit: -buildCost + 5*mrr - 5*monthlyExp },
                                  { month: 'M6', profit: -buildCost + 6*mrr - 6*monthlyExp },
                                ];
                                
                                return (
                                  <div className="border-t border-ms-border mt-2.5 pt-2.5 flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
                                    <div className="flex gap-6 w-full sm:w-auto">
                                      <div><div className="font-ms text-[10px] text-ms-text-muted">Break-even</div><div className="font-ms text-[13px] text-ms-text font-bold">{roi.breakEvenMonths ? `${roi.breakEvenMonths} months` : "—"}</div></div>
                                      <div><div className="font-ms text-[10px]" style={{ color: roiColor }}>ROI Month 1</div><div className="font-ms text-[22px] font-bold leading-none" style={{ color: roiColor }}>{roi.roiMonth1Pct || "—"}</div></div>
                                    </div>
                                    <div className="flex-1 w-full sm:max-w-[250px] h-[60px] ml-auto">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                          <defs>
                                            <linearGradient id={`colorProfit${i}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor={roiColor} stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor={roiColor} stopOpacity={0}/>
                                            </linearGradient>
                                          </defs>
                                          <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#060f06', border: '1px solid #142014', fontSize: '10px', fontFamily: 'monospace' }}
                                            itemStyle={{ color: roiColor }}
                                            formatter={(value: any) => [`$${Number(value).toFixed(0)}`, 'Cumulative Profit']}
                                            labelStyle={{ color: '#6a8a6a' }}
                                          />
                                          <Area type="monotone" dataKey="profit" stroke={roiColor} strokeWidth={2} fillOpacity={1} fill={`url(#colorProfit${i})`} />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                );
                              })()}
                              {roi.assumptions && <div className="mt-2 font-ms text-[10px] text-ms-text-muted italic border-t border-ms-border pt-2"><strong className="text-ms-text-muted">Assumptions:</strong> {roi.assumptions}</div>}
                            </div>

                            {/* Pricing */}
                            {Array.isArray(idea.pricingTiers) && idea.pricingTiers.length > 0 && <div className="mb-3.5">
                              <SL color="#ffc857">💰 Pricing Tiers</SL>
                              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${idea.pricingTiers.length}, 1fr)` }}>
                                {idea.pricingTiers.map((tier: any, j: number) => {
                                  if (typeof tier === 'string') {
                                    return (
                                      <div key={j} className={`bg-ms-bg border p-3.5 ${j === 1 ? "border-ms-yellow" : "border-ms-border"}`}>
                                        <div className="font-ms text-[12px] text-white font-bold mb-0.5">{tier}</div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={j} className={`bg-ms-bg border p-3.5 ${j === 1 ? "border-ms-yellow" : "border-ms-border"}`}>
                                      {j === 1 && <div className="font-ms text-[9px] text-ms-yellow font-bold tracking-[1px] mb-1">★ RECOMMENDED</div>}
                                      <div className="font-ms text-[12px] text-white font-bold mb-0.5">{tier.name}</div>
                                      <div className={`font-ms text-[20px] font-bold mb-1.5 ${j === 1 ? "text-ms-yellow" : "text-ms-green"}`}>{tier.price}</div>
                                      <div className="font-ms text-[11px] text-ms-text-muted leading-[1.5]">{tier.description}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>}

                            {/* Features */}
                            {Array.isArray(idea.keyFeatures) && idea.keyFeatures.length > 0 && <div className="mb-3.5">
                              <SL>Key Features to Build</SL>
                              <div className="flex gap-2 flex-wrap">
                                {idea.keyFeatures.map((f: any, j: number) => {
                                  const label = typeof f === 'string' ? f : f?.name || f?.feature || JSON.stringify(f);
                                  return <span key={j} className="font-ms bg-ms-panel-light border border-ms-border text-ms-green px-[13px] py-1 text-[11px]">› {label}</span>;
                                })}
                              </div>
                            </div>}

                            {/* Pre-sell */}
                            <div className="mb-3.5">
                              <PreSellChecklist steps={kit?.data?.presellValidation} />
                            </div>

                            {/* Launch Kit */}
                            <div className="border-t border-ms-border pt-4">
                              {!kit && (
                                role === 'viewer' ? (
                                  <div className="bg-ms-panel border border-ms-border p-4 text-center">
                                    <p className="text-ms-text-muted text-xs">Your current role (Viewer) does not allow generating launch kits. Please contact an admin.</p>
                                  </div>
                                ) : (
                                  <button suppressHydrationWarning onClick={e => { e.stopPropagation(); generateLaunchKit(idea, i); }} className="font-ms bg-ms-green-dark border border-ms-green text-ms-green px-7 py-3.5 text-[13px] font-bold cursor-pointer w-full">🚀 Generate Full Launch Kit — Lovable Prompt + Stripe + Resend + Marketing + Sales Script</button>
                                )
                              )}
                              {kit?.loading && (
                                <div className="bg-ms-panel border border-ms-border p-5">
                                  <ProgressSteps 
                                    steps={[
                                      "Analyzing SaaS idea...",
                                      "Generating Lovable.dev prompt...",
                                      "Structuring database schema...",
                                      "Writing marketing copy...",
                                      "Finalizing launch kit..."
                                    ]} 
                                    isComplete={!!kit?.data}
                                    intervalMs={2500}
                                  />
                                  <div className="mt-6 space-y-4 animate-pulse opacity-50">
                                    <div>
                                      <div className="h-3 w-48 bg-ms-green/20 rounded mb-2"></div>
                                      <div className="h-20 w-full bg-ms-border rounded"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="h-3 w-32 bg-ms-green/20 rounded mb-2"></div>
                                        <div className="h-12 w-full bg-ms-border rounded"></div>
                                      </div>
                                      <div>
                                        <div className="h-3 w-32 bg-ms-green/20 rounded mb-2"></div>
                                        <div className="h-12 w-full bg-ms-border rounded"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {kit?.error && <div className="bg-ms-red-dark border border-ms-red-dark p-3 flex justify-between items-center"><span className="font-ms text-[12px] text-ms-red">✕ {kit.error}</span><button suppressHydrationWarning onClick={e => { e.stopPropagation(); generateLaunchKit(idea, i); }} className="font-ms bg-transparent border border-ms-red text-ms-red px-3 py-1.5 text-[11px] cursor-pointer">Retry</button></div>}
                              {kit?.data && (
                                <div>
                                  <div className="flex justify-between items-center mb-2 flex-wrap gap-1.5">
                                    <div className="font-ms text-[11px] text-ms-green font-bold tracking-[1px]">🚀 LAUNCH KIT — {idea.name.toUpperCase()}</div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {emailSentFor[i] && <span className="font-ms text-[10px] text-ms-green bg-ms-green-dark border border-ms-green px-2.5 py-[3px]">✉ Sent to {emailSentFor[i]}</span>}
                                      <button suppressHydrationWarning onClick={e => { e.stopPropagation(); saveKitToSupabase(idea, kit.data, roi); }} className="font-ms bg-transparent border border-ms-border text-ms-green hover:bg-ms-green-dark px-2.5 py-1 text-[10px] cursor-pointer">🗄️ Save to Supabase</button>
                                      <button suppressHydrationWarning onClick={e => { e.stopPropagation(); generateLaunchKit(idea, i); }} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-2.5 py-1 text-[10px] cursor-pointer">↻ Regenerate</button>
                                    </div>
                                  </div>
                                  <LaunchKitPanel kit={kit.data} idea={idea} roi={roi} onEmailClick={() => setEmailModal({ idea, kit: kit.data, roi })} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {loadingMore && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-ms-panel border border-ms-border p-5">
                      <GranularLoader 
                        messages={[
                          "Analyzing existing ideas...",
                          "Brainstorming new angles...",
                          "Validating market demand...",
                          "Structuring new SaaS ideas..."
                        ]} 
                        intervalMs={2500}
                        className="mb-4"
                      />
                      <div className="space-y-6">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="h-5 w-48 bg-ms-border rounded mb-2"></div>
                                <div className="h-3 w-64 bg-ms-border/50 rounded"></div>
                              </div>
                              <div className="h-6 w-16 bg-ms-green/20 rounded"></div>
                            </div>
                            <div className="h-4 w-full bg-ms-border/50 rounded mb-2"></div>
                            <div className="h-4 w-5/6 bg-ms-border/50 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mt-7">
              {!user ? (
                <Link href="/profile" className="font-ms bg-transparent border border-ms-green text-ms-green px-[22px] py-3 text-[12px] font-bold no-underline hover:bg-ms-green-dark flex items-center">
                  Log In to Generate More
                </Link>
              ) : role === 'viewer' ? (
                <button disabled className="font-ms bg-ms-panel-light border border-ms-border text-ms-text-muted px-[22px] py-3 text-[12px] font-bold cursor-not-allowed" title="Viewer role cannot generate ideas">
                  ◈ Generate More Ideas
                </button>
              ) : (
                <button suppressHydrationWarning onClick={generateMoreIdeas} disabled={loadingMore} className={`font-ms bg-transparent border border-ms-green text-ms-green px-[22px] py-3 text-[12px] font-bold ${loadingMore ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-ms-green-dark"}`}>
                  {loadingMore ? (
                    <div className="flex items-center justify-center gap-2">
                       <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">⟳</motion.span>
                       <span>{loadingMsg}</span>
                    </div>
                  ) : (
                    "◈ Generate More Ideas"
                  )}
                </button>
              )}
              <button suppressHydrationWarning onClick={resetAll} className="font-ms bg-transparent border border-ms-green text-ms-green px-[22px] py-3 text-[12px] cursor-pointer font-bold">◈ New Niche</button>
              <button suppressHydrationWarning onClick={() => { setView("niche"); setResult(null); setExpandedIdea(null); setExpandedAbout(null); setDomainStatus({}); setLaunchKits({}); }} className="font-ms bg-transparent border border-ms-border text-ms-text-muted px-[22px] py-3 text-[12px] cursor-pointer">← Refine Niche</button>
            </div>
          </div>
        )}
        {/* ══ SAVED KITS VIEW ══ */}
        {view === "saved" && (
          <div>
            <div className="mb-[22px]">
              <div className="font-ms text-[10px] text-ms-green tracking-[2px] mb-1.5 font-bold">SUPABASE INTEGRATION</div>
              <h2 className="font-ms text-[20px] m-0 mb-1.5 text-white font-bold">Saved Launch Kits</h2>
              <p className="font-ms text-[11px] text-ms-text-muted leading-[1.5] m-0">Your previously generated launch kits stored in Supabase.</p>
            </div>
            
            {loadingSavedKits ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-ms-panel border border-ms-border p-4 animate-pulse">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="h-4 w-48 bg-ms-border rounded mb-2"></div>
                        <div className="h-3 w-64 bg-ms-border/50 rounded"></div>
                      </div>
                      <div className="h-3 w-20 bg-ms-border/50 rounded"></div>
                    </div>
                    <div className="h-8 w-32 bg-ms-green/20 border border-ms-green/30 rounded"></div>
                  </div>
                ))}
              </div>
            ) : savedKits.length === 0 ? (
              <div className="bg-ms-panel border border-ms-border p-5 text-center font-ms text-ms-text-muted text-[13px]">
                No saved kits found. Make sure your Supabase URL and Key are configured in settings.
              </div>
            ) : (
              <div className="space-y-4">
                {savedKits.map((kitItem: any, idx: number) => (
                  <div key={kitItem.id || idx} className="bg-ms-panel border border-ms-border p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-ms text-[14px] text-white font-bold mb-1">{kitItem.idea?.name || "Unknown Idea"}</div>
                        <div className="font-ms text-[11px] text-ms-text-muted">{kitItem.idea?.tagline || ""}</div>
                      </div>
                      <div className="font-ms text-[10px] text-ms-text-muted">
                        {kitItem.created_at ? new Date(kitItem.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button suppressHydrationWarning onClick={() => setEmailModal({ idea: kitItem.idea, kit: kitItem.kit, roi: kitItem.roi })} className="font-ms bg-ms-green-dark border border-ms-green text-ms-green px-3 py-1.5 text-[11px] cursor-pointer">
                        ✉ View & Send Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <div className="border-t border-ms-border px-4 md:px-7 py-3 flex justify-between flex-wrap gap-2 font-ms text-[10px] text-ms-text-muted relative z-[1]">
        <span>MICRO-SAAS SIGNAL ENGINE v5.1 · MAKER EDITION</span>
        <span>FIND MONEY WHERE NO ONE ELSE LOOKS</span>
      </div>
      </div>
    </div>
  );
}
