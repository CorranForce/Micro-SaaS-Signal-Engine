"use client";

import type { ComponentType } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Database,
  Bookmark,
  Info,
  CheckCircle2,
  ArrowRight,
  Download,
  ChevronUp,
  ChevronDown,
  Globe,
  Brain,
  Cpu,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { LaunchKitTabs } from "../LaunchKitTabs";
import type { SaasIdea, LaunchKit, DeepThinkingAnalysis } from "../types";
import type { SchemaTable } from "../lib/launchkit-utils";

type KitEntry =
  | { loading: boolean; data: LaunchKit | null; error: string | null }
  | undefined;

interface IdeaCardProps {
  idea: SaasIdea;
  index: number;
  kitEntry: KitEntry;
  compactMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  isEmailing: boolean;
  emailStatus: { success: boolean; message: string } | null;
  onDismissEmailStatus: () => void;
  onEmail: () => void;
  isSavingToSupabase: boolean;
  supabaseStatus: { success: boolean; message: string; sql?: string } | null;
  onDismissSupabaseStatus: () => void;
  onSupabase: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  domainCheckStatus: Record<
    string,
    { checking?: boolean; available?: boolean; error?: string; price?: number }
  >;
  onCheckDomain: (domain: string) => void;
  onGenerateKit: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  onCopy: (text: string, label: string) => void;
  copiedText: string | null;
  generateSqlFallback?: (tables: SchemaTable[]) => string;
  VisualSchemaDiagram?: ComponentType<{ tables: SchemaTable[] }>;
  onRunDeepAnalysis?: () => void;
  isDeepAnalyzing?: boolean;
  deepAnalysis?: DeepThinkingAnalysis;
}

export function IdeaCard({
  idea,
  index,
  kitEntry,
  compactMode,
  expanded,
  onToggleExpanded,
  isEmailing,
  emailStatus,
  onDismissEmailStatus,
  onEmail,
  isSavingToSupabase,
  supabaseStatus,
  onDismissSupabaseStatus,
  onSupabase,
  isSaved,
  onToggleSave,
  domainCheckStatus,
  onCheckDomain,
  onGenerateKit,
  onExportPdf,
  isExporting,
  onCopy,
  copiedText,
  generateSqlFallback,
  VisualSchemaDiagram,
  onRunDeepAnalysis,
  isDeepAnalyzing,
  deepAnalysis,
}: IdeaCardProps) {
  const isKitLoaded = !!kitEntry?.data;
  const isKitLoading = !!kitEntry?.loading;

  return (
    <motion.div
      whileHover={{
        scale: 1.015,
        boxShadow:
          "0 12px 30px -10px rgba(0, 255, 128, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.4)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-ms-card border rounded-lg flex flex-col transition-all relative animate-fade-in ${
        compactMode ? "p-3 pb-6" : "p-5 pb-8"
      } ${
        expanded
          ? "border-ms-green green-glow"
          : "border-ms-border hover:border-ms-border-active"
      }`}
      style={{ animationFillMode: "both", animationDelay: `${index * 150}ms` }}
    >
      <div
        className={`flex flex-col md:flex-row justify-between ${compactMode ? "gap-4" : "gap-6"}`}
      >
        <div className="flex-1">
          <div className="flex justify-between items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`${compactMode ? "text-[10px]" : "text-xs"} text-ms-green bg-ms-green-dark border border-ms-green/30 px-2 py-0.5 rounded font-ms font-bold uppercase`}
              >
                {idea.buildComplexity} BUILD
              </span>
              {idea.hotnessScore && (
                <span
                  className={`${compactMode ? "text-[10px]" : "text-xs"} text-orange-400 bg-orange-900/30 border border-orange-500/30 px-2 py-0.5 rounded font-ms font-bold uppercase flex items-center gap-1`}
                  title={`Market Demand: ${idea.marketDemandScore}/10`}
                >
                  HOTNESS{" "}
                  {Array.from({ length: idea.hotnessScore }).map((_, i) => (
                    <span
                      key={i}
                      className="text-orange-500 text-sm leading-none -mt-[2px]"
                    >
                      🔥
                    </span>
                  ))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 md:hidden">
              <button
                onClick={onEmail}
                disabled={isEmailing}
                className="text-ms-text-muted hover:text-ms-green disabled:opacity-50 transition-colors p-1"
                title="Email Idea"
              >
                {isEmailing ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onSupabase}
                disabled={isSavingToSupabase}
                className="text-ms-text-muted hover:text-cyan-400 disabled:opacity-50 transition-colors p-1"
                title="Push to Supabase"
              >
                {isSavingToSupabase ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onToggleSave}
                className="text-ms-text-muted hover:text-ms-yellow transition-colors p-1"
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? "fill-ms-yellow text-ms-yellow" : ""}`}
                />
              </button>
            </div>
          </div>

          <h3
            className={`${compactMode ? "text-sm" : "text-base"} font-bold text-white mb-1 leading-tight`}
          >
            {idea.name}
          </h3>
          <p
            className={`${compactMode ? "text-[10px]" : "text-xs"} text-ms-yellow italic mb-2`}
          >
            &ldquo;{idea.tagline}&rdquo;
          </p>

          <p
            className={`${compactMode ? "text-[10px]" : "text-xs"} text-ms-text-muted leading-relaxed mb-3`}
          >
            {idea.solution}
          </p>

          {/* Google Search Grounding Sources */}
          {idea.groundingSources && idea.groundingSources.length > 0 && (
            <div className="mt-3 bg-cyan-950/20 border border-cyan-800/40 p-2.5 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-ms font-bold text-cyan-400 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Google Search Grounding Sources
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {idea.groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-ms text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-800/60 px-2 py-1 rounded flex items-center gap-1 transition-colors truncate max-w-xs"
                  >
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{source.title || source.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-ms-border pt-3 md:pt-0 md:pl-6 space-y-3">
          <div className="hidden md:flex items-center gap-3.5 justify-end mb-1">
            <button
              onClick={onEmail}
              disabled={isEmailing}
              className="text-ms-text-muted hover:text-ms-green disabled:opacity-50 transition-colors flex items-center gap-1.5 text-[10px] font-ms font-bold uppercase"
            >
              {isEmailing ? (
                <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              Email
            </button>

            <button
              onClick={onSupabase}
              disabled={isSavingToSupabase}
              className="text-ms-text-muted hover:text-cyan-400 disabled:opacity-50 transition-colors flex items-center gap-1.5 text-[10px] font-ms font-bold uppercase"
            >
              {isSavingToSupabase ? (
                <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              Supabase
            </button>

            <button
              onClick={onToggleSave}
              className="text-ms-text-muted hover:text-ms-yellow transition-colors flex items-center gap-1 text-[10px] font-ms font-bold uppercase"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isSaved ? "fill-ms-yellow text-ms-yellow" : ""}`}
              />
              {isSaved ? "Saved" : "Save Idea"}
            </button>
          </div>

          {/* ROI Bento Panel */}
          <div className="bg-ms-bg p-2.5 rounded border border-ms-border grid grid-cols-3 gap-1.5 text-center">
            <div>
              <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                BUILD
                <div className="relative group">
                  <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                    Estimated upfront cost utilizing no-code platforms and AI
                    development tools (e.g. database setup, hosting, API fees).
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-white">
                {idea.roi.buildCostUSD}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                MRR TARGET
                <div className="relative group">
                  <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                    Projected Monthly Recurring Revenue based on early traction
                    and realistic average revenue per user (ARPU) in this niche.
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-ms-green">
                {idea.roi.realisticMRRMonth1USD}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-ms-text-muted font-ms flex items-center justify-center gap-1">
                1-MO ROI
                <div className="relative group">
                  <Info className="w-2.5 h-2.5 cursor-help hover:text-white transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-ms-card border border-ms-border text-[10px] text-left text-white rounded hidden group-hover:block z-10 shadow-lg font-sans normal-case">
                    Return on Investment percentage after month one, estimated
                    based on projected MRR relative to upfront build cost.
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-ms-yellow">
                {idea.roi.roiMonth1Pct}
              </div>
            </div>
          </div>

          {/* Domain Checker */}
          {idea.domains && idea.domains.length > 0 && (
            <div className="bg-ms-bg/50 p-2.5 rounded border border-ms-border">
              <div className="text-[10px] text-ms-text-muted font-ms font-bold tracking-wider uppercase mb-2">
                Available Domains
              </div>
              <div className="space-y-1.5">
                {idea.domains.map((dom, domIdx) => {
                  const status = domainCheckStatus[dom.domain];
                  return (
                    <div
                      key={domIdx}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="font-mono text-white truncate flex-1">
                        {dom.domain}
                      </div>
                      {status ? (
                        <div className="flex items-center gap-1.5">
                          {status.checking ? (
                            <div className="w-3 h-3 rounded-full border border-ms-text-muted border-t-transparent animate-spin" />
                          ) : status.available ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-ms font-bold text-ms-green uppercase">
                                Avail{" "}
                                {status.price
                                  ? `($${(status.price / 1000000).toFixed(2)})`
                                  : ""}
                              </span>
                              <a
                                href={`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(dom.domain)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-ms font-bold text-ms-bg bg-ms-green hover:bg-green-400 uppercase px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                              >
                                Buy
                              </a>
                            </div>
                          ) : (
                            <span
                              className="text-[10px] font-ms font-bold text-ms-yellow uppercase"
                              title={status.error || "Taken"}
                            >
                              Taken
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onCheckDomain(dom.domain)}
                          className="text-[10px] font-ms font-bold text-cyan-400 hover:text-cyan-300 uppercase px-2 py-0.5 border border-cyan-500/30 rounded transition-colors"
                        >
                          Check
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card Level Action Status Messages */}
          {(emailStatus || supabaseStatus) && (
            <div className="space-y-1.5 mt-1">
              {emailStatus && (
                <div
                  className={`p-2 rounded border text-[10px] font-ms flex items-center justify-between gap-1.5 ${
                    emailStatus.success
                      ? "bg-ms-green-dark/15 border-ms-green/30 text-ms-green"
                      : "bg-ms-yellow/15 border-ms-yellow/30 text-ms-yellow"
                  }`}
                >
                  <span className="truncate">{emailStatus.message}</span>
                  <button
                    onClick={onDismissEmailStatus}
                    className="text-[9px] opacity-60 hover:opacity-100 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
              {supabaseStatus && (
                <div
                  className={`p-2 rounded border text-[10px] font-ms space-y-1.5 ${
                    supabaseStatus.success
                      ? "bg-ms-green-dark/15 border-ms-green/30 text-ms-green"
                      : "bg-ms-yellow/15 border-ms-yellow/30 text-ms-yellow"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate flex-1">
                      {supabaseStatus.message}
                    </span>
                    <button
                      onClick={onDismissSupabaseStatus}
                      className="text-[9px] opacity-60 hover:opacity-100 font-bold self-start mt-0.5"
                    >
                      ✕
                    </button>
                  </div>
                  {supabaseStatus.sql && (
                    <div className="space-y-1 pt-1 border-t border-ms-border/30">
                      <textarea
                        readOnly
                        value={supabaseStatus.sql}
                        className="w-full h-24 font-mono text-[9px] bg-black/60 text-ms-green border border-ms-border/40 rounded p-1.5 focus:outline-none select-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(supabaseStatus.sql || "");
                          alert("SQL schema copied!");
                        }}
                        className="px-2 py-0.5 bg-ms-border/60 hover:bg-ms-border text-[9px] rounded text-white font-ms transition-all"
                      >
                        Copy SQL
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onGenerateKit}
            disabled={isKitLoading}
            className={`w-full py-2.5 text-xs font-ms font-bold tracking-wider uppercase rounded flex items-center justify-center gap-1.5 transition-all ${
              isKitLoaded
                ? "bg-ms-green-dark border border-ms-green text-ms-green"
                : "bg-ms-green text-ms-bg hover:bg-[#00d066]"
            }`}
          >
            {isKitLoading ? (
              <span className="animate-pulse">BUILDING KIT...</span>
            ) : isKitLoaded ? (
              <>
                LAUNCH KIT ACTIVE{" "}
                <CheckCircle2 className="w-3.5 h-3.5 text-ms-green" />
              </>
            ) : (
              <>
                GENERATE LAUNCH KIT <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className={`${compactMode ? "mt-4 pt-4 space-y-4" : "mt-6 pt-6 space-y-6"} border-t border-ms-border`}
        >
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${compactMode ? "gap-4" : "gap-6"}`}
          >
            <div>
              <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
                PAIN SOLVED
              </h4>
              <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
                {idea.painSolved}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
                TARGET CUSTOMER
              </h4>
              <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
                {idea.targetAudience}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-ms-text-muted uppercase mb-2">
              GTM CHANNEL
            </h4>
            <p className="text-xs text-white bg-ms-bg p-3 rounded border border-ms-border leading-relaxed">
              {idea.gtmChannel}
            </p>
          </div>

          {/* Strategic Deep Audit (Gemini 3.1 Pro High Thinking) */}
          <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-800/40 pb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider font-ms">
                  High Thinking Strategic Audit
                </h4>
                <span className="text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono">
                  gemini-3.1-pro-preview
                </span>
              </div>

              {!deepAnalysis && onRunDeepAnalysis && (
                <button
                  onClick={onRunDeepAnalysis}
                  disabled={isDeepAnalyzing}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-ms font-bold text-[10px] rounded uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isDeepAnalyzing ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Deep Reasoning in progress...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Run Deep Strategic Audit</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {deepAnalysis ? (
              <div className="space-y-4 pt-1">
                {/* Reasoning Summary */}
                <div className="bg-purple-950/40 p-3 rounded border border-purple-800/30">
                  <h5 className="text-[10px] font-bold text-purple-300 uppercase font-ms mb-1">
                    Reasoning & Market Mechanics
                  </h5>
                  <p className="text-xs text-purple-100 leading-relaxed font-sans">
                    {deepAnalysis.reasoningSummary}
                  </p>
                </div>

                {/* Threat Matrix */}
                {deepAnalysis.threatMatrix && (
                  <div>
                    <h5 className="text-[10px] font-bold text-purple-300 uppercase font-ms mb-2">
                      Threat & Friction Matrix
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-ms-bg p-2.5 rounded border border-purple-800/30">
                        <span className="text-[9px] text-red-400 font-bold block uppercase mb-1">
                          Competitor Risk
                        </span>
                        <p className="text-[11px] text-gray-200">
                          {deepAnalysis.threatMatrix.competitorRisk}
                        </p>
                      </div>
                      <div className="bg-ms-bg p-2.5 rounded border border-purple-800/30">
                        <span className="text-[9px] text-amber-400 font-bold block uppercase mb-1">
                          Regulatory/Legal Risk
                        </span>
                        <p className="text-[11px] text-gray-200">
                          {deepAnalysis.threatMatrix.regulatoryRisk}
                        </p>
                      </div>
                      <div className="bg-ms-bg p-2.5 rounded border border-purple-800/30">
                        <span className="text-[9px] text-blue-400 font-bold block uppercase mb-1">
                          Execution Friction
                        </span>
                        <p className="text-[11px] text-gray-200">
                          {deepAnalysis.threatMatrix.executionFriction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Moats & Elasticity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deepAnalysis.distributionMoats &&
                    deepAnalysis.distributionMoats.length > 0 && (
                      <div className="bg-ms-bg p-3 rounded border border-purple-800/30">
                        <h5 className="text-[10px] font-bold text-purple-300 uppercase font-ms mb-1.5">
                          Defensible Distribution Moats
                        </h5>
                        <ul className="space-y-1">
                          {deepAnalysis.distributionMoats.map((m, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-gray-200 flex items-start gap-1.5"
                            >
                              <span className="text-purple-400 font-bold">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {deepAnalysis.pricingElasticity && (
                    <div className="bg-ms-bg p-3 rounded border border-purple-800/30">
                      <h5 className="text-[10px] font-bold text-purple-300 uppercase font-ms mb-1.5">
                        Pricing Elasticity Analysis
                      </h5>
                      <p className="text-[11px] text-gray-200 leading-relaxed">
                        {deepAnalysis.pricingElasticity}
                      </p>
                    </div>
                  )}
                </div>

                {/* Technical Architecture */}
                {deepAnalysis.technicalArchitecture && (
                  <div className="bg-ms-bg p-3 rounded border border-purple-800/30">
                    <h5 className="text-[10px] font-bold text-purple-300 uppercase font-ms mb-1">
                      Recommended Technical Architecture
                    </h5>
                    <p className="text-[11px] text-gray-200 leading-relaxed font-mono">
                      {deepAnalysis.technicalArchitecture}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-purple-300/70 italic">
                Click &ldquo;Run Deep Strategic Audit&rdquo; to unleash Gemini 3.1 Pro with High Thinking Level to evaluate threat risks, distribution moats, pricing power, and technical architecture.
              </p>
            )}
          </div>

          {isKitLoaded && (
            <div className="mt-6 border-t border-ms-border pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated Launch Kit
                </h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={onExportPdf}
                    disabled={isExporting}
                    className="flex-1 sm:flex-none px-4 py-2 border border-ms-text-muted text-ms-text-muted hover:text-white hover:border-ms-border-active rounded text-xs font-ms font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-text-muted border-t-transparent animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    {isExporting ? "EXPORTING..." : "EXPORT PDF"}
                  </button>
                  <button
                    onClick={onEmail}
                    disabled={isEmailing}
                    className="flex-1 sm:flex-none px-4 py-2 bg-ms-green text-ms-bg font-ms font-bold text-xs rounded hover:bg-[#00d066] transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {isEmailing ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-bg/50 border-t-transparent animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    {isEmailing ? "EMAILING..." : "EMAIL PDF"}
                  </button>
                </div>
              </div>

              {emailStatus && (
                <div
                  className={`mb-4 px-4 py-3 rounded text-xs font-ms flex items-center gap-2 ${
                    emailStatus.success
                      ? "bg-ms-green-dark border border-ms-green text-ms-green"
                      : "bg-red-950 border border-red-500 text-red-400"
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  {emailStatus.message}
                </div>
              )}

              <LaunchKitTabs
                kit={kitEntry?.data}
                onCopy={onCopy}
                copiedText={copiedText}
                generateSqlFallback={generateSqlFallback}
                VisualSchemaDiagram={VisualSchemaDiagram}
              />
            </div>
          )}
          {!isKitLoaded && (
            <div className="text-xs text-ms-text-muted italic text-center py-4 bg-ms-bg rounded border border-ms-border/50">
              Generate a Launch Kit to view Pricing, Validation, Roadmap, Stack,
              and Scripts.
            </div>
          )}
        </div>
      )}

      <button
        onClick={onToggleExpanded}
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-ms-card border border-ms-border rounded-full p-1 text-ms-text-muted hover:text-white hover:border-ms-border-active transition-all"
        title={expanded ? "Collapse Details" : "Expand Details"}
      >
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
    </motion.div>
  );
}
