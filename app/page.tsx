"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  TrendingUp,
  Coins,
  Copy,
  Check,
  Code,
  Database,
  Info,
  Wrench,
  AlertCircle,
  Bookmark,
  Lock,
  Download,
  Globe,
  Brain,
  AlertTriangle,
} from "lucide-react";
import {
  searchSaaSIdeas,
  runDeepThinkingAnalysis,
  generateLaunchKit,
  loginUser,
  registerUser,
  logoutUser,
  getSessionUser,
  loadApiSettings,
  updateApiSettings,
  getRealtimeSuggestions,
  sendLaunchKitEmail,
  addToSupabaseAction,
  syncToSupabaseAction,
  checkDomainAvailabilityAction,
} from "./actions";
// --- Types (shared with server actions and LaunchKitTabs) ---
import type { SaasIdea, LaunchKit, DeepThinkingAnalysis } from "./types";
import { LEGACY_NICHES } from "./lib/niches";
import { generateSqlFallback, escapeHtmlC } from "./lib/launchkit-utils";
import { TypewriterLog } from "./components/TypewriterLog";
import { VisualSchemaDiagram } from "./components/SchemaDiagram";
import { CompareNichesView } from "./components/CompareNichesView";
import { FloatingChatbot } from "./components/FloatingChatbot";
import { AboutTab } from "./components/AboutTab";
import { AuthModal } from "./components/AuthModal";
import { ClearConfirmModal } from "./components/ClearConfirmModal";
import { SettingsPanel, type ApiSettingsState } from "./components/SettingsPanel";
import { SavedKitsTab } from "./components/SavedKitsTab";
import { IdeaCard } from "./components/IdeaCard";

export default function MicroSaaSSignalEngine() {
  const [mounted, setMounted] = useState<boolean>(false);
  // Navigation
  const [activeTab, setActiveTab] = useState<
    "find" | "compare" | "saved" | "about" | "settings"
  >("find");

  // Input states
  const [selectedNiche, setSelectedNiche] = useState<string>("hvac");
  const [customNiche, setCustomNiche] = useState<string>("");
  const [mrrTarget, setMrrTarget] = useState<number>(5000);
  const [additionalContext, setAdditionalContext] = useState<string>("");

  // UI state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [generatedIdeas, setGeneratedIdeas] = useState<SaasIdea[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Launch Kit state
  const [activeIdeaIndex, setActiveIdeaIndex] = useState<number | null>(null);
  const [launchKits, setLaunchKits] = useState<
    Record<
      number,
      { loading: boolean; data: LaunchKit | null; error: string | null }
    >
  >({});
  // Saved Ideas (Durable persistence via localStorage)
  const [savedIdeas, setSavedIdeas] = useState<
    { idea: SaasIdea; kit: LaunchKit | null; savedAt: string }[]
  >([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSavedIdeas, setExpandedSavedIdeas] = useState<Record<number, boolean>>({});
  const [savedKitsSearchQuery, setSavedKitsSearchQuery] = useState("");

  // Gemini Skills Features state
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [useHighThinking, setUseHighThinking] = useState<boolean>(false);
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState<
    Record<number, boolean>
  >({});
  const [deepAnalysisData, setDeepAnalysisData] = useState<
    Record<number, DeepThinkingAnalysis>
  >({});
  // Set when the server served locally synthesized content instead of live
  // Gemini output, so the UI never passes template copy off as AI research.
  const [degradedNotice, setDegradedNotice] = useState<string | null>(null);

  // Real-time suggestions state
  const [realtimeKeywords, setRealtimeKeywords] = useState<string[]>([]);
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const finalNiche =
      customNiche ||
      LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
      selectedNiche ||
      "General B2B";

    if (!finalNiche) return;

    // Only show the loading state once the debounced request actually fires,
    // and ignore stale responses so an earlier slow call can't overwrite a
    // newer result.
    let cancelled = false;
    const delayDebounceFn = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const data = await getRealtimeSuggestions(
          finalNiche,
          additionalContext,
        );
        if (!cancelled && data) {
          setRealtimeKeywords(data.keywords || []);
          setRealtimeSuggestions(data.suggestions || []);
        }
      } catch (err: any) {
        if (
          err?.message === "Failed to fetch" ||
          err?.message?.includes("fetch") ||
          err?.message?.includes("unexpected response")
        ) {
          // Ignore harmless network drop during dev rebuilds
        } else {
          console.error("Error fetching real-time suggestions:", err);
        }
      } finally {
        if (!cancelled) setIsSuggestionsLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
    };
  }, [selectedNiche, customNiche, additionalContext]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Card-specific actions loading state
  const [isEmailingCard, setIsEmailingCard] = useState<Record<number, boolean>>(
    {},
  );
  const [emailCardStatus, setEmailCardStatus] = useState<
    Record<number, { success: boolean; message: string } | null>
  >({});
  const [isSavingToSupabase, setIsSavingToSupabase] = useState<
    Record<number, boolean>
  >({});
  const [supabaseCardStatus, setSupabaseCardStatus] = useState<
    Record<number, { success: boolean; message: string; sql?: string } | null>
  >({});

  // Domain checking states
  const [domainCheckStatus, setDomainCheckStatus] = useState<
    Record<
      string,
      {
        checking?: boolean;
        available?: boolean;
        error?: string;
        price?: number;
      }
    >
  >({});

  // Expanded cards state
  const [expandedIdeas, setExpandedIdeas] = useState<Record<number, boolean>>(
    {},
  );

  // Authentication states
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] =
    useState<boolean>(false);
  const [isAuthRegister, setIsAuthRegister] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // API Settings states
  const [apiSettings, setApiSettings] = useState<ApiSettingsState>({
    supabaseUrl: "",
    supabaseAnonKey: "",
    resendApiKey: "",
    godaddyApiKey: "",
    godaddyApiSecret: "",
    compactMode: false,
    fontFamily: "inter",
    fontSize: "base",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load Saved Ideas & Session on Mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("workspace_state");
    if (savedWorkspace) {
      try {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.selectedNiche) setSelectedNiche(parsed.selectedNiche);
        if (parsed.customNiche) setCustomNiche(parsed.customNiche);
        if (parsed.mrrTarget) setMrrTarget(parsed.mrrTarget);
        if (parsed.additionalContext)
          setAdditionalContext(parsed.additionalContext);
        if (parsed.generatedIdeas && parsed.generatedIdeas.length > 0) {
          setGeneratedIdeas(parsed.generatedIdeas);
          if (parsed.terminalLogs) setTerminalLogs(parsed.terminalLogs);
        }
      } catch (e) {
        console.error("Error parsing workspace state", e);
      }
    }

    setMounted(true);
    const saved = localStorage.getItem("saved_micro_saas");
    if (saved) {
      try {
        setSavedIdeas(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved ideas", e);
      }
    }

    // Check user session
    const savedSessionUser = localStorage.getItem("session_user");
    if (savedSessionUser) {
      setCurrentUser(savedSessionUser);
    }
    getSessionUser().then((email) => {
      setCurrentUser(email);
      if (email) {
        localStorage.setItem("session_user", email);
      } else {
        localStorage.removeItem("session_user");
      }
    });

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Auto-save workspace state
  useEffect(() => {
    if (!mounted) return;
    const stateToSave = {
      selectedNiche,
      customNiche,
      mrrTarget,
      additionalContext,
      generatedIdeas,
      terminalLogs,
    };
    localStorage.setItem("workspace_state", JSON.stringify(stateToSave));
  }, [
    mounted,
    selectedNiche,
    customNiche,
    mrrTarget,
    additionalContext,
    generatedIdeas,
    terminalLogs,
  ]);

  // Sync API Settings fetch with Operator Login
  useEffect(() => {
    if (currentUser?.toLowerCase() === "corranforce@gmail.com") {
      setIsLoadingSettings(true);
      loadApiSettings()
        .then((settings: any) => {
          if (settings.error) {
            setSettingsMessage({ type: "error", text: settings.error });
            return;
          }
          setApiSettings({
            ...settings,
            compactMode: settings.compactMode ?? false,
            fontFamily: settings.fontFamily || "inter",
            fontSize: settings.fontSize || "base",
          });
          setSettingsMessage(null);
        })
        .catch((err) => {
          setSettingsMessage({
            type: "error",
            text: err.message || "Failed to load credentials.",
          });
        })
        .finally(() => {
          setIsLoadingSettings(false);
        });
    }
  }, [currentUser]);

  // Auth form submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmittingAuth(true);

    try {
      const res = isAuthRegister
        ? await registerUser(authEmail, authPassword)
        : await loginUser(authEmail, authPassword);

      if (res.success && res.email) {
        setCurrentUser(res.email);
        localStorage.setItem("session_user", res.email);
        setAuthSuccess(
          isAuthRegister
            ? "Account successfully generated! Connecting..."
            : "Access cipher verified. Initializing session...",
        );
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthSuccess(null);
        }, 1200);
      } else {
        setAuthError(
          res.error ||
            "Authentication failed. Double check your credentials.",
        );
      }
    } catch (err: any) {
      setAuthError(
        err.message || "Authentication failed. Double check your credentials.",
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      localStorage.removeItem("session_user");
      if (activeTab === "settings") {
        setActiveTab("find");
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.toLowerCase() !== "corranforce@gmail.com") {
      setSettingsMessage({
        type: "error",
        text: "Operator authorization mismatch.",
      });
      return;
    }
    setIsSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res: any = await updateApiSettings(apiSettings);
      if (res.success) {
        setSettingsMessage({
          type: "success",
          text: "API configurations successfully integrated.",
        });
      } else if (res.error) {
        setSettingsMessage({
          type: "error",
          text: res.error,
        });
      }
    } catch (err: any) {
      setSettingsMessage({
        type: "error",
        text: err.message || "Failed to synchronize credentials.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Sync Saved Ideas to localStorage
  const saveToLocalStorage = (newSaved: typeof savedIdeas) => {
    setSavedIdeas(newSaved);
    localStorage.setItem("saved_micro_saas", JSON.stringify(newSaved));
  };

  useEffect(() => {
    if (!currentUser || savedIdeas.length === 0) return;

    const syncedKey = `synced_ideas_${currentUser.toLowerCase()}`;

    const syncInterval = setInterval(async () => {
      try {
        // Track what has already been synced locally so the background job
        // doesn't re-send (or duplicate) rows every 30 seconds.
        let synced: string[] = [];
        try {
          synced = JSON.parse(localStorage.getItem(syncedKey) || "[]");
        } catch {
          synced = [];
        }
        const unsynced = savedIdeas.filter(
          (s) => !synced.includes(s.idea.name),
        );
        if (unsynced.length === 0) return;

        const res = await syncToSupabaseAction(unsynced);
        if (res.success) {
          localStorage.setItem(
            syncedKey,
            JSON.stringify([...synced, ...unsynced.map((s) => s.idea.name)]),
          );
          if (('count' in res) && (res.count ?? 0) > 0) {
            console.log(
              `Synced ${res.count} saved ideas to Supabase in the background.`,
            );
          }
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [currentUser, savedIdeas]);

  // Log scrolling removed because we prepend logs
  useEffect(() => {
    // No-op
  }, [terminalLogs]);

  // Handle PDF Export
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPdf = async (
    index: number,
    providedIdea?: SaasIdea,
    providedKit?: LaunchKit
  ) => {
    const idea = providedIdea || generatedIdeas[index];
    const kit = providedKit || launchKits[index]?.data;
    if (!idea || !kit) return;

    try {
      setIsExporting(true);
      const html2pdfModule = await import("html2pdf.js");
      // html2pdf.js can be tricky with exports, try both default and direct
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const container = document.createElement("div");
      container.style.padding = "40px";
      container.style.fontFamily = "'Inter', sans-serif";
      container.style.color = "#000";
      container.style.backgroundColor = "#fff";
      container.style.lineHeight = "1.6";
      container.style.width = "800px";

      // Escape everything — kit content is model-generated and must not
      // reach innerHTML raw (same rule as the email builder in actions.ts).
      const esc = escapeHtmlC;

      let html = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #00f076; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #111;">${esc(idea.name)}</h1>
          <p style="font-size: 16px; margin: 0; color: #555; font-style: italic;">"${esc(idea.tagline)}"</p>
        </div>

        <h2 style="font-size: 20px; color: #222; margin-top: 20px;">Opportunity Spec</h2>
        <p><strong>Problem:</strong> ${esc(idea.problem)}</p>
        <p><strong>Solution:</strong> ${esc(idea.solution)}</p>
        <p><strong>Target Customer:</strong> ${esc(idea.targetAudience)}</p>
        <p><strong>Pain Solved:</strong> ${esc(idea.painSolved || "")}</p>
        <p><strong>Build Complexity:</strong> ${esc(idea.buildComplexity)}</p>
        ${idea.hotnessScore ? `<p><strong>Hotness Score:</strong> ${esc(idea.hotnessScore.toString())}/5 Flames</p>` : ''}
        ${idea.marketDemandScore ? `<p><strong>Market Demand Score:</strong> ${esc(idea.marketDemandScore.toString())}/10</p>` : ''}
        <p><strong>MRR Target:</strong> ${esc(idea.roi?.realisticMRRMonth1USD || "")}</p>
        <p><strong>Estimated Build Cost:</strong> ${esc(idea.roi?.buildCostUSD || "")}</p>
        <p><strong>Projected 1-Month ROI:</strong> ${esc(idea.roi?.roiMonth1Pct || "")}</p>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">1. Vibe-Coding Prompt</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${esc(kit.lovablePrompt)}</div>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">2. Build Roadmap</h2>
      `;

      kit.buildRoadmap.forEach((week) => {
        html += `
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin: 0 0 5px 0;">${esc(week.week)}</h3>
            <p style="margin: 0; font-size: 14px; font-weight: bold;">${esc(week.title)}</p>
            <ul style="margin: 5px 0 0 20px; font-size: 13px;">
              ${week.tasks.map((f: string) => `<li>${esc(f)}</li>`).join("")}
            </ul>
          </div>
        `;
      });

      html += `
        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">3. No-Code Tech Stack</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="padding: 8px;">Role</th>
              <th style="padding: 8px;">Tool</th>
              <th style="padding: 8px;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${kit.noCodeStack
              .map(
                (stack) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold;">${esc(stack.role)}</td>
                <td style="padding: 8px;">${esc(stack.tool)}</td>
                <td style="padding: 8px; color: #555;">${esc(stack.cost)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2 style="font-size: 20px; color: #222; margin-top: 30px; margin-bottom: 10px;">4. Marketing & Outreach</h2>
        <h3 style="font-size: 16px; margin: 0 0 5px 0;">Landing Page Headline</h3>
        <p style="font-size: 18px; font-weight: bold; background: #f0fdf4; padding: 10px; border-left: 4px solid #00f076;">${esc(kit.marketingAssets.landingHeadline)}</p>

        <h3 style="font-size: 16px; margin: 15px 0 5px 0;">Cold Email Template</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 14px; white-space: pre-wrap;"><strong>Subject:</strong> ${esc(kit.marketingAssets.coldEmail.subject)}

${esc(kit.marketingAssets.coldEmail.body)}</div>

        <div style="page-break-before: always;"></div>

        <h2 style="font-size: 20px; color: #222; margin-bottom: 10px;">5. Database Schema</h2>
        <p style="font-size: 14px;">${esc(kit.databaseRequirements.schemaDescription)}</p>
      `;

      if (kit.databaseRequirements.sqlSchema) {
        html += `
          <div style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${esc(kit.databaseRequirements.sqlSchema)}</div>
        `;
      } else if (kit.databaseRequirements.tables) {
        // Fallback for older kits
        const fallbackSql = generateSqlFallback(
          kit.databaseRequirements.tables,
        );
        html += `
          <div style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${esc(fallbackSql)}</div>
        `;
      }

      container.innerHTML = html;

      const opt = {
        margin: 15,
        filename: `${idea.name.toLowerCase().replace(/\s+/g, "-")}-launch-kit.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy Button
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAppendContext = (text: string) => {
    setAdditionalContext((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (/[.,!?;]$/.test(trimmed)) {
        return `${trimmed} ${text}`;
      }
      return `${trimmed}, ${text}`;
    });
  };

  const selectedNicheNameForUI =
    customNiche ||
    LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
    selectedNiche ||
    "General B2B";

  const exportNichesToCSV = () => {
    const headers = ["ID", "Name", "Description"];
    const rows = LEGACY_NICHES.map((n) => [
      n.id,
      `"${n.name.replace(/"/g, '""')}"`,
      `"${n.desc.replace(/"/g, '""')}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "boring-b2b-niches.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run the crawler simulator and request ideas from Gemini
  const handleDiscover = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(true);
    setScanProgress(0);
    setGeneratedIdeas([]);
    setErrorMessage(null);
    setActiveIdeaIndex(null);
    setLaunchKits({});
    setTerminalLogs([]);
    // Deep-audit results are keyed by position in generatedIdeas, so they must
    // be cleared with the ideas themselves — otherwise the previous run's
    // audit renders under whatever idea lands at the same index.
    setDeepAnalysisData({});
    setDeepAnalysisLoading({});
    setDegradedNotice(null);

    const selectedNicheName = selectedNicheNameForUI;

    const mockLogs = [
      `[INIT] Booting B2B Opportunity Scraper Engine v2.1...`,
      `[CONNECT] Establishing tunnel to Google AI Studio Sandbox...`,
      `[SCANNING] Crawling online directories & niche industry subreddits for: "${selectedNicheName}"...`,
      `[ANALYZE] Parsing negative reviews for legacy software used by ${selectedNicheName} teams...`,
      `[COMPILING] Identifying key friction points: manual entry, missing mobile compliance, paper tickets...`,
      `[VALUATION] Calculating ROI metrics using MRR goal: $${mrrTarget}/mo...`,
      `[GENERATE] Formulating bespoke B2B Micro-SaaS ideas via Gemini 3.5...`,
      `[FINALIZE] Mapping technical feasibility and available dotcom domains...`,
    ];

    // Log typing simulation
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        setTerminalLogs((prev) => [mockLogs[currentLogIndex], ...prev]);
        setScanProgress(
          Math.floor(((currentLogIndex + 1) / mockLogs.length) * 100),
        );
        currentLogIndex++;
      } else {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        triggerGeminiCall();
      }
    }, 700);
    scanIntervalRef.current = interval;
  };

  const triggerGeminiCall = async () => {
    const finalNiche =
      customNiche ||
      LEGACY_NICHES.find((n) => n.id === selectedNiche)?.name ||
      selectedNiche;
    try {
      if (useHighThinking) {
        setTerminalLogs((prev) => [
          `[HIGH THINKING MODE] Requesting High Thinking Level reasoning for deep market analysis...`,
          ...prev,
        ]);
      }
      if (useSearchGrounding) {
        setTerminalLogs((prev) => [
          `[SEARCH GROUNDING] Live Google Search Grounding requested...`,
          ...prev,
        ]);
      }

      const res = await searchSaaSIdeas(finalNiche, additionalContext, {
        useSearchGrounding,
        useHighThinking,
      });

      if (res.success && res.data?.saasIdeas) {
        setGeneratedIdeas(res.data.saasIdeas);
        setDegradedNotice(res.degraded ? res.notice || null : null);
        if (res.degraded) {
          setTerminalLogs((prev) => [
            `[DEGRADED] Gemini unreachable (${res.error || "unknown error"}) — showing locally synthesized template blueprints, NOT live research.`,
            ...prev,
          ]);
        } else {
          if (res.notice) {
            setTerminalLogs((prev) => [`[WARN] ${res.notice}`, ...prev]);
          }
          setTerminalLogs((prev) => [
            `[SUCCESS] 3 Premium B2B blueprints loaded via ${res.modelUsed || "Gemini"}! 🎉`,
            ...prev,
          ]);
        }
      } else {
        throw new Error(
          res.error || "Invalid output received. Please try again.",
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "An error occurred during SaaS idea generation.",
      );
      setTerminalLogs((prev) => [
        `[ERROR] Scrape failed: ${err.message || "Unknown error"}`,
        ...prev,
      ]);
    } finally {
      setIsScanning(false);
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleRunDeepAnalysis = async (idea: SaasIdea, index: number) => {
    setDeepAnalysisLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await runDeepThinkingAnalysis(idea);
      if (res.success && res.data) {
        const analysis = res.data;
        setDeepAnalysisData((prev) => ({ ...prev, [index]: analysis }));
        if (res.degraded && res.notice) {
          setDegradedNotice(res.notice);
        }
      } else {
        alert(res.error || "Failed to execute deep strategic analysis.");
      }
    } catch (err: any) {
      console.error("Deep analysis error:", err);
      alert(err.message || "Failed to execute deep strategic analysis.");
    } finally {
      setDeepAnalysisLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleEmailCard = async (idea: SaasIdea, index: number) => {
    // Check server-side session cookies first instead of relying solely on client state
    let activeUser = currentUser;
    if (!activeUser) {
      activeUser = await getSessionUser();
      if (activeUser) {
        setCurrentUser(activeUser);
        localStorage.setItem("session_user", activeUser);
      }
    }

    if (!activeUser) {
      setShowAuthModal(true);
      return;
    }

    setIsEmailingCard((prev) => ({ ...prev, [index]: true }));
    setEmailCardStatus((prev) => ({ ...prev, [index]: null }));

    try {
      const kitData = launchKits[index]?.data || null;
      const res = await sendLaunchKitEmail(idea, kitData);

      if (res.success) {
        setEmailCardStatus((prev) => ({
          ...prev,
          [index]: {
            success: true,
            message: `Sent blueprint email to ${activeUser}! 📬`,
          },
        }));
      } else {
        if (res.reason === "AUTH_REQUIRED") {
          setCurrentUser(null);
          localStorage.removeItem("session_user");
          setShowAuthModal(true);
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: res.error || "Session expired. Please log in again.",
            },
          }));
        } else if (res.reason && res.reason.includes("RESEND_API_KEY")) {
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: `Resend API Key is missing. Configure RESEND_API_KEY in the Secrets section.`,
            },
          }));
        } else {
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: res.error || "Failed to send email.",
            },
          }));
        }
      }
    } catch (err: any) {
      setEmailCardStatus((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: err.message || "Failed to dispatch email.",
        },
      }));
    } finally {
      setIsEmailingCard((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSupabaseCard = async (idea: SaasIdea, index: number) => {
    setIsSavingToSupabase((prev) => ({ ...prev, [index]: true }));
    setSupabaseCardStatus((prev) => ({ ...prev, [index]: null }));

    try {
      const kitData = launchKits[index]?.data || null;
      const res = await addToSupabaseAction(idea, kitData);

      if (res.success) {
        setSupabaseCardStatus((prev) => ({
          ...prev,
          [index]: {
            success: true,
            message: "Blueprint pushed to Supabase table 'saved_ideas'! 🚀",
          },
        }));
      } else {
        if (('reason' in res) && res.reason === "SUPABASE_CONFIG_MISSING") {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message:
                "Supabase config missing! Save your URL/Key under Settings first.",
            },
          }));
        } else if (('reason' in res) && res.reason === "TABLE_NOT_FOUND") {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message:
                res.error ||
                "Table 'saved_ideas' not found (or schema cache needs reload). Click copy below to see the required SQL schema.",
              sql: ('sql' in res) ? res.sql : undefined,
            },
          }));
        } else {
          setSupabaseCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: res.error || "Failed to save to Supabase.",
            },
          }));
        }
      }
    } catch (err: any) {
      setSupabaseCardStatus((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: err.message || "Failed to save to Supabase.",
        },
      }));
    } finally {
      setIsSavingToSupabase((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleCheckDomain = async (domain: string) => {
    if (domainCheckStatus[domain]?.checking) return;

    setDomainCheckStatus((prev) => ({ ...prev, [domain]: { checking: true } }));

    try {
      const res = await checkDomainAvailabilityAction(domain);
      if (res.success) {
        setDomainCheckStatus((prev) => ({
          ...prev,
          [domain]: {
            checking: false,
            available: res.available,
            price: res.price,
          },
        }));
      } else {
        setDomainCheckStatus((prev) => ({
          ...prev,
          [domain]: {
            checking: false,
            error: res.error,
          },
        }));
      }
    } catch (err: any) {
      setDomainCheckStatus((prev) => ({
        ...prev,
        [domain]: {
          checking: false,
          error: err.message || "Failed to check domain.",
        },
      }));
    }
  };

  // Generate Launch Kit for a specific idea
  const handleGenerateKit = async (idea: SaasIdea, index: number) => {
    setLaunchKits((prev) => ({
      ...prev,
      [index]: { loading: true, data: null, error: null },
    }));
    setEmailCardStatus((prev) => ({
      ...prev,
      [index]: null,
    }));
    setActiveIdeaIndex(index);

    try {
      const res = await generateLaunchKit(idea);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to generate Launch Kit.");
      }
      const data = res.data;
      setLaunchKits((prev) => ({
        ...prev,
        [index]: { loading: false, data: data, error: null },
      }));

      // Trigger automatic email dispatch if user is logged in.
      // Status is surfaced through emailCardStatus, which the card renders.
      let activeUser = currentUser;
      if (!activeUser) {
        activeUser = await getSessionUser();
        if (activeUser) {
          setCurrentUser(activeUser);
          localStorage.setItem("session_user", activeUser);
        }
      }

      if (activeUser) {
        try {
          const emailRes = await sendLaunchKitEmail(idea, data);
          if (emailRes.success) {
            setEmailCardStatus((prev) => ({
              ...prev,
              [index]: {
                success: true,
                message: `Launch Kit successfully emailed to ${activeUser}! 📬`,
              },
            }));
          } else {
            if (emailRes.reason === "AUTH_REQUIRED") {
              setCurrentUser(null);
              localStorage.removeItem("session_user");
            } else if (emailRes.reason && emailRes.reason.includes("RESEND_API_KEY")) {
              setEmailCardStatus((prev) => ({
                ...prev,
                [index]: {
                  success: false,
                  message: `Launch Kit ready! (Configure RESEND_API_KEY in secrets to receive emails) ⚙️`,
                },
              }));
            } else {
              setEmailCardStatus((prev) => ({
                ...prev,
                [index]: {
                  success: false,
                  message: `Could not email kit: ${emailRes.error || "Unknown delivery error"}`,
                },
              }));
            }
          }
        } catch (emailErr: any) {
          console.error("Error sending Launch Kit email:", emailErr);
          setEmailCardStatus((prev) => ({
            ...prev,
            [index]: {
              success: false,
              message: `Failed to dispatch email: ${emailErr.message || "Unknown error"}`,
            },
          }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setLaunchKits((prev) => ({
        ...prev,
        [index]: {
          loading: false,
          data: null,
          error: err.message || "Failed to generate Launch Kit.",
        },
      }));
    }
  };

  // Toggle saving an idea
  const toggleSaveIdea = (idea: SaasIdea, kit: LaunchKit | null) => {
    const isAlreadySaved = savedIdeas.some((s) => s.idea.name === idea.name);
    if (isAlreadySaved) {
      const updated = savedIdeas.filter((s) => s.idea.name !== idea.name);
      saveToLocalStorage(updated);
    } else {
      const updated = [
        ...savedIdeas,
        { idea, kit, savedAt: new Date().toLocaleDateString() },
      ];
      saveToLocalStorage(updated);
    }
  };

  const isSaved = (ideaName: string) => {
    return savedIdeas.some((s) => s.idea.name === ideaName);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ms-bg text-ms-text font-sans flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded border-4 border-ms-green border-t-transparent animate-spin mb-4"></div>
        <p className="text-xs font-ms text-ms-green animate-pulse">
          BOOTING RADAR SYSTEM v2.1...
        </p>
      </div>
    );
  }


  return (
    <div
      ref={pageTopRef}
      className="min-h-screen bg-ms-bg text-ms-text font-sans"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          html {
            font-size: ${apiSettings.fontSize === "sm" ? "14px" : apiSettings.fontSize === "lg" ? "18px" : apiSettings.fontSize === "xl" ? "20px" : "16px"} !important;
          }
          ${
            apiSettings.fontFamily
              ? `
            body, .font-sans, .font-ms {
              font-family: ${
                apiSettings.fontFamily === "mono"
                  ? "var(--font-mono), monospace"
                  : apiSettings.fontFamily === "firaCode"
                  ? "var(--font-fira-code), monospace"
                  : apiSettings.fontFamily === "roboto"
                  ? "var(--font-roboto), sans-serif"
                  : apiSettings.fontFamily === "jakarta"
                  ? "var(--font-jakarta), sans-serif"
                  : "var(--font-inter), sans-serif"
              } !important;
            }
          `
              : ""
          }
        `,
        }}
      />

      {/* Visual Ambient Grid Header */}
      <header className="border-b border-ms-border bg-ms-bg/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-ms-green-dark border border-ms-green rounded flex items-center justify-center font-ms text-ms-green text-xl font-bold green-glow shrink-0">
              🛠️
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Signal Engine{" "}
                <span className="text-xs bg-ms-green-dark text-ms-green border border-ms-green px-1.5 py-0.5 rounded font-ms">
                  BETA
                </span>
              </h1>
              <p className="text-xs text-ms-text-muted font-ms">
                Micro-SaaS Signal Engine & Launch Kit Generator
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
            <nav className="flex items-center gap-2 border border-ms-border p-1 bg-ms-card rounded w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("find")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "find"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                FIND IDEAS
              </button>
              <button
                onClick={() => setActiveTab("compare")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "compare"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                COMPARE
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "saved"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                SAVED KITS ({savedIdeas.length})
              </button>
              {currentUser?.toLowerCase() === "corranforce@gmail.com" && (
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                    activeTab === "settings"
                      ? "bg-ms-green text-ms-bg font-bold"
                      : "text-ms-text-muted hover:text-white"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  API SETTINGS
                </button>
              )}
              <button
                onClick={() => setActiveTab("about")}
                className={`px-3 py-1.5 rounded text-xs font-ms flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === "about"
                    ? "bg-ms-green text-ms-bg font-bold"
                    : "text-ms-text-muted hover:text-white"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                METHODOLOGY
              </button>
            </nav>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentUser ? (
                <div className="flex items-center gap-2.5 bg-ms-card border border-ms-border pl-3 pr-2 py-1 rounded w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-white leading-tight font-ms truncate max-w-[120px] sm:max-w-[160px]">
                      {currentUser}
                    </span>
                    <span className="text-[8px] text-ms-green font-ms leading-tight uppercase">
                      {currentUser.toLowerCase() === "corranforce@gmail.com"
                        ? "Operator"
                        : "Crew"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-ms-text-muted hover:text-red-400 transition-colors text-[9px] font-ms border border-ms-border hover:border-red-900 bg-ms-bg rounded uppercase"
                    title="Terminate Session"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthRegister(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-ms-green-dark border border-ms-green hover:bg-ms-green hover:text-ms-bg transition-all text-xs font-ms text-ms-green font-bold rounded flex items-center justify-center gap-1.5 green-glow"
                >
                  <Lock className="w-3 h-3" />
                  AUTHENTICATE
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        {activeTab === "find" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Input form & Scanner terminal */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Research Controls */}
              <div className="bg-ms-card border border-ms-border p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-ms-green/5 blur-xl pointer-events-none rounded-full"></div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="text-ms-green font-ms text-sm font-bold">
                    01.
                  </div>
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase font-ms">
                    Configure Radar
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Target Niche / Industry
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {LEGACY_NICHES.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setSelectedNiche(n.id);
                            setCustomNiche("");
                            setAdditionalContext("");
                          }}
                          className={`p-2.5 text-left border rounded text-xs transition-all ${
                            selectedNiche === n.id && !customNiche
                              ? "border-ms-green bg-ms-green-dark/30 text-white"
                              : "border-ms-border bg-ms-bg text-ms-text-muted hover:border-ms-border-active hover:text-ms-text"
                          }`}
                        >
                          <div className="text-sm mb-1">{n.icon}</div>
                          <div className="font-bold truncate">{n.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="relative mt-2">
                      <select
                        value={selectedNiche}
                        onChange={(e) => {
                          setSelectedNiche(e.target.value);
                          setCustomNiche("");
                          setAdditionalContext("");
                        }}
                        className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs font-ms text-white focus:outline-none focus:border-ms-green"
                      >
                        <option value="">-- Or Select More Niches --</option>
                        {LEGACY_NICHES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.icon} {n.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Or type a custom B2B niche..."
                        value={customNiche}
                        onChange={(e) => {
                          if (customNiche === "") {
                            setAdditionalContext("");
                          }
                          setCustomNiche(e.target.value);
                        }}
                        className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs font-ms text-white placeholder-gray-600 focus:outline-none focus:border-ms-green"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Target MRR (Monthly Income)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="2000"
                        max="25000"
                        step="1000"
                        value={mrrTarget}
                        onChange={(e) => setMrrTarget(parseInt(e.target.value))}
                        className="flex-1 accent-ms-green h-1 bg-ms-border rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-ms text-xs font-bold text-ms-green bg-ms-green-dark border border-ms-green/40 px-2 py-1 rounded">
                        ${mrrTarget.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-ms text-ms-text-muted uppercase mb-1.5">
                      Additional Context / Custom Constraints
                    </label>
                    <textarea
                      placeholder="e.g., 'Must fit on a mobile app', 'Must connect with quickbooks', 'I want something related to heavy scheduling'."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                      className="w-full bg-ms-bg border border-ms-border rounded p-2.5 text-xs font-ms text-white placeholder-gray-600 focus:outline-none focus:border-ms-green"
                    />

                    {/* Real-time suggestions panel */}
                    <div className="mt-2.5 space-y-3">
                      {(realtimeKeywords.length > 0 ||
                        isSuggestionsLoading) && (
                        <div className="bg-ms-bg/50 border border-ms-border/50 rounded-lg p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-ms-text-muted font-ms font-bold uppercase tracking-wider flex items-center gap-1">
                              <Coins className="w-3 h-3 text-ms-yellow" />
                              High-Profit Focus Keywords
                            </span>
                            {isSuggestionsLoading && (
                              <span className="flex items-center gap-1 text-[10px] text-ms-green font-ms font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 bg-ms-green rounded-full animate-ping"></span>
                                AI Refining...
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {realtimeKeywords.map((kw, idx) => {
                              const isAlreadyPresent = additionalContext
                                .toLowerCase()
                                .includes(kw.toLowerCase());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleAppendContext(kw)}
                                  className={`px-2 py-1 text-[10px] font-ms rounded border transition-all duration-200 text-left flex items-center gap-1 ${
                                    isAlreadyPresent
                                      ? "bg-ms-green/20 border-ms-green text-ms-green font-bold shadow-[0_0_10px_rgba(0,240,118,0.15)] cursor-default"
                                      : "bg-ms-card border-ms-border text-ms-text-muted hover:border-ms-yellow hover:text-white"
                                  }`}
                                  disabled={isAlreadyPresent}
                                >
                                  {isAlreadyPresent && (
                                    <Check className="w-2.5 h-2.5 text-ms-green" />
                                  )}
                                  {kw}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Angles / Completions */}
                          {realtimeSuggestions.length > 0 && (
                            <div className="pt-2 border-t border-ms-border/40 space-y-1.5">
                              <span className="text-[10px] text-ms-text-muted font-ms font-bold uppercase tracking-wider block">
                                Recommended angles (Click to append):
                              </span>
                              <div className="space-y-1">
                                {realtimeSuggestions.map((sug, idx) => {
                                  const isAlreadyPresent = additionalContext
                                    .toLowerCase()
                                    .includes(sug.toLowerCase());
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleAppendContext(sug)}
                                      className={`w-full text-left p-1.5 rounded text-[10px] font-ms border transition-all flex items-center gap-1.5 ${
                                        isAlreadyPresent
                                          ? "bg-ms-green-dark/10 border-ms-green/20 text-ms-text-muted cursor-default"
                                          : "bg-ms-card/40 border-ms-border/30 text-ms-text-muted hover:border-ms-green hover:text-white"
                                      }`}
                                      disabled={isAlreadyPresent}
                                    >
                                      <span className="text-ms-green text-xs font-bold font-mono">
                                        +
                                      </span>
                                      <span className="truncate">{sug}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Intelligence & Grounding Mode Selector */}
                  <div className="bg-ms-bg/60 border border-ms-border rounded-lg p-3 space-y-2.5">
                    <div className="text-[10px] text-ms-green font-ms font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-ms-green" />
                      Gemini Intelligence Controls
                    </div>

                    {/* Search Grounding Toggle */}
                    <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded border border-ms-border/50 bg-ms-card/50 hover:border-ms-green/50 transition-all">
                      <input
                        type="checkbox"
                        checked={useSearchGrounding}
                        onChange={(e) => setUseSearchGrounding(e.target.checked)}
                        className="mt-0.5 accent-ms-green"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white font-ms">
                          <Globe className="w-3 h-3 text-cyan-400" />
                          Google Search Grounding
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 py-0.5 rounded font-mono">
                            GEMINI_MODEL
                          </span>
                        </div>
                        <p className="text-[10px] text-ms-text-muted mt-0.5 leading-snug">
                          Ground output with real-time web search trends and live software competitor market data.
                        </p>
                      </div>
                    </label>

                    {/* High Thinking Mode Toggle */}
                    <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded border border-ms-border/50 bg-ms-card/50 hover:border-ms-green/50 transition-all">
                      <input
                        type="checkbox"
                        checked={useHighThinking}
                        onChange={(e) => setUseHighThinking(e.target.checked)}
                        className="mt-0.5 accent-ms-green"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white font-ms">
                          <Brain className="w-3 h-3 text-purple-400" />
                          High Thinking Level
                          <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1 py-0.5 rounded font-mono">
                            GEMINI_MODEL_PRO
                          </span>
                        </div>
                        <p className="text-[10px] text-ms-text-muted mt-0.5 leading-snug">
                          Enable High Thinking reasoning for complex market friction, unit economics, and unit risks.
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleDiscover}
                    disabled={isScanning}
                    className="w-full py-3.5 bg-ms-green text-ms-bg font-bold font-ms text-sm uppercase tracking-wide hover:bg-[#00d066] transition-all flex items-center justify-center gap-2 rounded shadow-lg disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isScanning ? "Scraping Markets..." : "Scan Legacy Markets"}
                  </button>
                </div>
              </div>

              {/* Terminal Logs Viewport */}
              <div className="bg-ms-bg border border-ms-border rounded-lg p-4 font-ms text-xs h-64 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-ms-border pb-2 mb-2 text-[10px] text-ms-text-muted uppercase">
                  <span>
                    🛰️ Scan Activity Feed{" "}
                    <span className="text-gray-600 normal-case">
                      (simulated visualization)
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-ms-green animate-pulse" : "bg-red-500"}`}
                    ></span>
                    {isScanning ? "ACTIVE SCAN" : "IDLE"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 text-[11px] pr-2 scrollbar-thin">
                  {terminalLogs.length === 0 ? (
                    <div className="text-gray-600 italic">
                      No scanner actions initiated. Await inputs.
                    </div>
                  ) : (
                    terminalLogs.map((log, i) => {
                      if (!log || typeof log !== "string") return null;
                      let color = "text-ms-text-muted";
                      if (log.startsWith("[INIT]")) color = "text-gray-500";
                      if (
                        log.startsWith("[SCANNING]") ||
                        log.startsWith("[CRAWL]")
                      )
                        color = "text-blue-400";
                      if (log.startsWith("[FOUND]"))
                        color = "text-ms-yellow font-bold";
                      if (log.startsWith("[SUCCESS]"))
                        color = "text-ms-green font-bold";
                      if (log.startsWith("[ERROR]"))
                        color = "text-red-400 font-bold";
                      // Logs are prepended, so an entry's distance from the
                      // END of the array is its stable identity — index keys
                      // would make every row re-run its typing animation.
                      return (
                        <TypewriterLog
                          key={terminalLogs.length - 1 - i}
                          text={log}
                          color={color}
                        />
                      );
                    })
                  )}
                </div>

                {isScanning && (
                  <div className="mt-3 border-t border-ms-border pt-2">
                    <div className="flex justify-between text-[10px] text-ms-text-muted mb-1">
                      <span>CRAWLING HIGH-FIDELITY B2B FORUMS</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-ms-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-ms-green h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Ideas Grid & Active Launch Kit details */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Error Handler */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-500/50 rounded-lg p-4 text-sm text-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Generative AI Error</div>
                    <p className="text-xs text-red-300 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Welcome Screen (If no ideas generated yet) */}
              {generatedIdeas.length === 0 && !isScanning && !errorMessage && (
                <div className="bg-ms-card border border-ms-border rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 bg-ms-green-dark/30 border border-ms-green/40 rounded-full flex items-center justify-center text-3xl mb-6 green-glow">
                    🔬
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Acreage of Boring B2B Markets Await
                  </h3>
                  <p className="text-sm text-ms-text-muted max-w-lg mb-6 leading-relaxed">
                    Most SaaS builders compete for flashy consumer apps or
                    general tools. True, highly profitable niches lie in offline
                    B2B sectors. Select an industry above to begin.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                    {LEGACY_NICHES.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setSelectedNiche(n.id);
                          setCustomNiche("");
                          setAdditionalContext("");
                        }}
                        className="p-3 bg-ms-bg border border-ms-border hover:border-ms-green rounded text-left transition-all group hover:bg-ms-green-dark/15"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{n.icon}</span>
                          <span className="text-xs font-bold text-white block truncate group-hover:text-ms-green transition-colors">
                            {n.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={exportNichesToCSV}
                    className="mt-8 flex items-center justify-center gap-2 px-5 py-2 border border-ms-border rounded text-xs font-bold font-ms text-ms-text-muted hover:text-white hover:border-ms-border-active transition-colors"
                  >
                    <Download size={14} /> EXPORT NICHES CSV
                  </button>
                </div>
              )}

              {/* Degraded-mode banner: the server serves synthesized template
                  content when Gemini is unreachable. Say so, loudly — these
                  numbers are not market research. */}
              {degradedNotice && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-700/60 bg-amber-950/30 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-ms font-bold uppercase tracking-wider text-amber-300">
                      Offline / Template Mode
                    </div>
                    <p className="text-[11px] text-amber-100/90 mt-0.5 leading-snug">
                      {degradedNotice}
                    </p>
                  </div>
                </div>
              )}

              {/* Ideas Display Grid */}
              {generatedIdeas.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-ms-border pb-3">
                    <h2 className="font-ms text-sm tracking-wider uppercase text-ms-yellow font-bold">
                      02. Selected Blueprints
                    </h2>
                    <span className="text-xs text-ms-text-muted font-ms">
                      3 underserved ideas found
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    {generatedIdeas.map((idea, index) => (
                      <IdeaCard
                        key={index}
                        idea={idea}
                        index={index}
                        kitEntry={launchKits[index]}
                        compactMode={apiSettings.compactMode}
                        expanded={!!expandedIdeas[index]}
                        onToggleExpanded={() =>
                          setExpandedIdeas((prev) => ({
                            ...prev,
                            [index]: !prev[index],
                          }))
                        }
                        isEmailing={!!isEmailingCard[index]}
                        emailStatus={emailCardStatus[index] || null}
                        onDismissEmailStatus={() =>
                          setEmailCardStatus((prev) => ({ ...prev, [index]: null }))
                        }
                        onEmail={() => handleEmailCard(idea, index)}
                        isSavingToSupabase={!!isSavingToSupabase[index]}
                        supabaseStatus={supabaseCardStatus[index] || null}
                        onDismissSupabaseStatus={() =>
                          setSupabaseCardStatus((prev) => ({
                            ...prev,
                            [index]: null,
                          }))
                        }
                        onSupabase={() => handleSupabaseCard(idea, index)}
                        isSaved={isSaved(idea.name)}
                        onToggleSave={() =>
                          toggleSaveIdea(idea, launchKits[index]?.data || null)
                        }
                        domainCheckStatus={domainCheckStatus}
                        onCheckDomain={handleCheckDomain}
                        onGenerateKit={() => handleGenerateKit(idea, index)}
                        onExportPdf={() => handleExportPdf(index)}
                        isExporting={isExporting}
                        onCopy={handleCopy}
                        copiedText={copiedText}
                        generateSqlFallback={generateSqlFallback}
                        VisualSchemaDiagram={VisualSchemaDiagram}
                        onRunDeepAnalysis={() => handleRunDeepAnalysis(idea, index)}
                        isDeepAnalyzing={!!deepAnalysisLoading[index]}
                        deepAnalysis={deepAnalysisData[index]}
                      />
                    ))}
                  </div>
                </div>
              )}

                            </div>
            </div>
        )}

        {/* COMPARE NICHES TAB */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center border-b border-ms-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Niche Comparison Engine
                  <span className="text-[10px] font-ms bg-ms-yellow/15 text-ms-yellow border border-ms-yellow/40 px-2 py-0.5 rounded uppercase tracking-wider">
                    Simulated Data
                  </span>
                </h2>
                <p className="text-xs text-ms-text-muted font-ms mt-0.5">
                  Illustrative side-by-side comparison. Metrics are generated
                  placeholders, not live market data — validate niches with
                  real research before committing.
                </p>
              </div>
            </div>
            <CompareNichesView
              generatedIdeas={generatedIdeas}
              savedIdeas={savedIdeas}
            />
          </div>
        )}

        {/* SAVED KITS TAB */}
        {activeTab === "saved" && (
          <SavedKitsTab
            savedIdeas={savedIdeas}
            searchQuery={savedKitsSearchQuery}
            setSearchQuery={setSavedKitsSearchQuery}
            expandedSavedIdeas={expandedSavedIdeas}
            setExpandedSavedIdeas={setExpandedSavedIdeas}
            compactMode={apiSettings.compactMode}
            copiedText={copiedText}
            onCopy={handleCopy}
            onDelete={(saved) => {
              const updated = savedIdeas.filter(
                (s) => s.idea.name !== saved.idea.name,
              );
              saveToLocalStorage(updated);
            }}
            onClearAll={() => setShowClearConfirmModal(true)}
            onExportPdf={handleExportPdf}
            isExporting={isExporting}
            generateSqlFallback={generateSqlFallback}
            VisualSchemaDiagram={VisualSchemaDiagram}
          />
        )}

        {/* ABOUT / METHODOLOGY TAB */}
        {activeTab === "about" && <AboutTab />}

        {/* API SETTINGS TAB (operator-only form; access-denied view for others) */}
        {activeTab === "settings" && (
          <SettingsPanel
            isOperator={currentUser?.toLowerCase() === "corranforce@gmail.com"}
            currentUser={currentUser}
            apiSettings={apiSettings}
            setApiSettings={setApiSettings}
            settingsMessage={settingsMessage}
            isLoadingSettings={isLoadingSettings}
            isSavingSettings={isSavingSettings}
            onSave={handleSaveSettings}
            onBack={() => setActiveTab("find")}
          />
        )}
      </main>

      {/* Retro Status Footer bar */}
      <footer className="border-t border-ms-border bg-ms-bg/50 px-4 py-3 mt-12 text-center text-[10px] text-ms-text-muted font-ms">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>SYSTEM ONLINE • MEM: 98.4% • CLOUD SANDBOX: ACTIVE</span>
          <span className="flex items-center gap-1.5">
            Powered by{" "}
            <span className="text-ms-green font-bold">Gemini 3.5 Flash</span>{" "}
            Server API proxy
          </span>
        </div>
      </footer>

      {/* AUTHENTICATION OVERLAY DIALOG */}
      {showAuthModal && (
        <AuthModal
          isRegister={isAuthRegister}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          error={authError}
          success={authSuccess}
          isSubmitting={isSubmittingAuth}
          onSubmit={handleAuthSubmit}
          onClose={() => {
            setShowAuthModal(false);
            setAuthError(null);
            setAuthSuccess(null);
          }}
          onToggleMode={() => {
            setIsAuthRegister(!isAuthRegister);
            setAuthError(null);
            setAuthSuccess(null);
          }}
        />
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <ClearConfirmModal
          onCancel={() => setShowClearConfirmModal(false)}
          onConfirm={() => {
            saveToLocalStorage([]);
            setShowClearConfirmModal(false);
          }}
        />
      )}

      <FloatingChatbot />
    </div>
  );
}
