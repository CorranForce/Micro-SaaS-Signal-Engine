"use client";

import { useState } from "react";
import { SL } from "./SharedUI";
import { PreSellChecklist } from "./PreSellChecklist";
import { compareCompetitorsAction } from "@/app/actions";
import { apiTracker } from "@/utils/apiTracker";

export const LaunchKitPanel = ({ kit, idea, roi, onEmailClick }: any) => {
  const [tab, setTab] = useState("build");
  const [showExport, setShowExport] = useState(false);
  const [competitors, setCompetitors] = useState<any[] | null>(null);
  const [loadingComp, setLoadingComp] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [compSources, setCompSources] = useState<any[]>([]);

  const tabs = [
    { id: "build", label: "🔨 No-Code Build Plan" },
    { id: "validate", label: "✅ Market Validation" },
    { id: "competitors", label: "🔍 Competitor Match" },
    { id: "marketing", label: "📣 Marketing Assets" },
    { id: "sales", label: "📞 Sales Script" }
  ];

  const handleSearchCompetitors = async () => {
    setLoadingComp(true);
    setCompError(null);
    apiTracker.logAttempt();
    try {
      const nicheQuery = idea.niche || idea.name;
      const res = await compareCompetitorsAction(nicheQuery);
      if (res.error) {
        setCompError(res.error);
        apiTracker.logFailure(new Error(res.error));
      } else {
        setCompetitors(res.competitors || []);
        setCompSources(res.sources || []);
        apiTracker.logSuccess(nicheQuery || "", JSON.stringify(res.competitors || ""));
      }
    } catch (err: any) {
      setCompError(err.message || "An unexpected error occurred.");
      apiTracker.logFailure(err);
    } finally {
      setLoadingComp(false);
    }
  };

  const CopyBtn = ({ text }: { text: string }) => {
    const [cp, setCp] = useState(false);
    return (
      <button suppressHydrationWarning onClick={() => { navigator.clipboard.writeText(text); setCp(true); setTimeout(() => setCp(false), 2000); }} 
        className={`font-ms text-[9px] font-bold px-[9px] py-[3px] cursor-pointer shrink-0 border ${cp ? "bg-ms-green-dark border-ms-green text-ms-green" : "bg-transparent border-ms-border-light text-ms-text-muted"}`}>
        {cp ? "✓ COPIED" : "COPY"}
      </button>
    );
  };

  const handleExport = (format: "json" | "markdown" | "html") => {
    let content = "";
    let mimeType = "";
    let extension = "";

    if (format === "json") {
      content = JSON.stringify({ idea, roi, kit }, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else if (format === "markdown") {
      content = `# Launch Kit: ${idea.name}\n\n## Idea\n**Tagline:** ${idea.tagline}\n**Problem:** ${idea.problem}\n**Solution:** ${idea.solution}\n\n## ROI Estimate\n- Build Cost: ${roi.buildCostUSD}\n- Monthly Expenses: ${roi.monthlyExpensesUSD}\n- MRR (Month 1): ${roi.realisticMRRMonth1USD}\n- Break-even: ${roi.breakEvenMonths} months\n- ROI Month 1: ${roi.roiMonth1Pct}\n\n## Lovable.dev Prompt\n\`\`\`\n${kit.lovablePrompt}\n\`\`\`\n\n## Marketing Assets\n**Landing Headline:** ${kit.marketingAssets?.landingHeadline}\n**Landing Subheadline:** ${kit.marketingAssets?.landingSubheadline}\n**CTA:** ${kit.marketingAssets?.ctaButton}\n\n**Elevator Pitch:**\n> ${kit.marketingAssets?.elevatorPitch}\n\n**Cold Email:**\nSubject: ${kit.marketingAssets?.coldEmail?.subject}\n\n${kit.marketingAssets?.coldEmail?.body}\n\n**Social Post:**\n${kit.marketingAssets?.socialPost}\n\n**Social Content Strategy:**\n${kit.marketingAssets?.socialContentStrategy}\n\n**Blog Post Ideas:**\n${kit.marketingAssets?.blogPostIdeas?.map((idea: string)=> `* ${idea}`).join("\n")}\n`;
      mimeType = "text/markdown";
      extension = "md";
    } else if (format === "html") {
      content = `<!DOCTYPE html><html><head><title>Launch Kit: ${idea.name}</title><style>body{font-family:sans-serif;line-height:1.6;padding:20px;max-width:800px;margin:0 auto;}</style></head><body><h1>Launch Kit: ${idea.name}</h1><h2>Idea</h2><p><strong>Tagline:</strong> ${idea.tagline}</p><p><strong>Problem:</strong> ${idea.problem}</p><p><strong>Solution:</strong> ${idea.solution}</p><h2>ROI Estimate</h2><ul><li>Build Cost: ${roi.buildCostUSD}</li><li>Monthly Expenses: ${roi.monthlyExpensesUSD}</li><li>MRR (Month 1): ${roi.realisticMRRMonth1USD}</li><li>Break-even: ${roi.breakEvenMonths} months</li><li>ROI Month 1: ${roi.roiMonth1Pct}</li></ul><h2>Lovable.dev Prompt</h2><pre><code>${kit.lovablePrompt}</code></pre><h2>Marketing Assets</h2><p><strong>Landing Headline:</strong> ${kit.marketingAssets?.landingHeadline}</p><p><strong>Landing Subheadline:</strong> ${kit.marketingAssets?.landingSubheadline}</p><p><strong>CTA:</strong> ${kit.marketingAssets?.ctaButton}</p><h3>Elevator Pitch</h3><blockquote>${kit.marketingAssets?.elevatorPitch}</blockquote><h3>Cold Email</h3><p><strong>Subject:</strong> ${kit.marketingAssets?.coldEmail?.subject}</p><pre>${kit.marketingAssets?.coldEmail?.body}</pre><h3>Social Post</h3><pre>${kit.marketingAssets?.socialPost}</pre><h3>Social Content Strategy</h3><pre>${kit.marketingAssets?.socialContentStrategy}</pre><h3>Blog Post Ideas</h3><ul>${kit.marketingAssets?.blogPostIdeas?.map((idea: string)=> `<li>${idea}</li>`).join("")}</ul></body></html>`;
      mimeType = "text/html";
      extension = "html";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = String(idea?.name || "idea").replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `launch-kit-${safeName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <div className="border border-ms-border mt-1">
      <div className="flex border-b border-[#1a2e1a] bg-ms-bg items-center">
        <div className="flex flex-1 overflow-x-auto">
          {tabs.map(t => (
            <button suppressHydrationWarning key={t.id} onClick={() => setTab(t.id)} 
              className={`font-ms text-[10px] px-3.5 py-2.5 border-none cursor-pointer whitespace-nowrap ${tab === t.id ? "font-bold bg-ms-panel-light border-b-2 border-b-ms-green text-ms-green" : "font-normal bg-transparent border-b-2 border-b-transparent text-[#4a6a4a]"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <button suppressHydrationWarning onClick={() => setShowExport(!showExport)} className="font-ms text-[10px] font-bold bg-ms-panel border-none border-l border-l-ms-border text-ms-text px-4 py-2.5 cursor-pointer whitespace-nowrap shrink-0 hover:bg-ms-panel-light">
            📥 Export
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-ms-panel border border-ms-border shadow-lg z-10 w-32">
              <button suppressHydrationWarning onClick={() => handleExport("markdown")} className="block w-full text-left font-ms text-[11px] text-ms-text px-3 py-2 hover:bg-ms-panel-light border-none bg-transparent cursor-pointer">Markdown (.md)</button>
              <button suppressHydrationWarning onClick={() => handleExport("html")} className="block w-full text-left font-ms text-[11px] text-ms-text px-3 py-2 hover:bg-ms-panel-light border-none bg-transparent cursor-pointer">HTML (.html)</button>
              <button suppressHydrationWarning onClick={() => handleExport("json")} className="block w-full text-left font-ms text-[11px] text-ms-text px-3 py-2 hover:bg-ms-panel-light border-none bg-transparent cursor-pointer">JSON (.json)</button>
            </div>
          )}
        </div>
        <button suppressHydrationWarning onClick={onEmailClick} className="font-ms text-[10px] font-bold bg-ms-panel-light border-none border-l border-l-ms-border text-ms-green px-4 py-2.5 cursor-pointer whitespace-nowrap shrink-0">
          ✉ Send Kit
        </button>
      </div>

      <div className="p-4.5 bg-ms-bg">
        {/* BUILD */}
        {tab === "build" && (
          <div>
            {kit.lovablePrompt && (
              <div className="bg-ms-yellow-dark border border-ms-yellow-dark border-l-4 border-l-ms-yellow p-4 mb-5">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <SL color="#ffc857">⚡ Lovable.dev Starter Prompt</SL>
                    <div className="font-ms text-[10px] text-[#8a7a40] mt-[-4px]">Copy and paste directly into Lovable.dev to generate your MVP foundation</div>
                  </div>
                  <CopyBtn text={kit.lovablePrompt} />
                </div>
                <div className="bg-ms-yellow-dark border border-[#2a2200] p-3.5 font-mono text-[11px] text-ms-yellow leading-[1.8] whitespace-pre-wrap rounded-[2px]">
                  {kit.lovablePrompt}
                </div>
                <div className="mt-2.5 flex gap-2 items-center">
                  <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="font-ms text-[10px] font-bold text-[#060f06] bg-ms-yellow px-3.5 py-1.5 no-underline">Open Lovable.dev →</a>
                  <span className="font-ms text-[10px] text-[#5a5a30]">$50/mo · No coding required</span>
                </div>
              </div>
            )}
            {Array.isArray(kit.noCodeStack) && kit.noCodeStack.length > 0 && (
              <div className="mb-4.5 w-full">
                <SL>Recommended No-Code Stack</SL>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  {kit.noCodeStack.map((t: any, i: number) => {
                    if (typeof t === 'string') {
                      return (
                        <div key={i} className={`bg-ms-panel border border-ms-border p-3 border-l-3 ${i === 0 ? "border-l-ms-yellow" : "border-l-ms-green"}`}>
                          <div className="font-ms text-[11px] text-ms-text-light leading-[1.6]">{t}</div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`bg-ms-panel border border-ms-border p-3 border-l-3 ${i === 0 ? "border-l-ms-yellow" : "border-l-ms-green"}`}>
                        <div className="flex justify-between items-center mb-1">
                          <div className={`font-ms text-[12px] font-bold ${i === 0 ? "text-ms-yellow" : "text-ms-white"}`}>{t.tool}{i === 0 && <span className="text-[9px] ml-1">⭐</span>}</div>
                          {t.cost && <span className={`font-ms text-[10px] font-bold tracking-[0.5px] px-2 py-[3px] whitespace-nowrap rounded-[2px] border ${i === 0 ? "text-ms-yellow border-ms-yellow" : "text-ms-green border-ms-green"}`}>{t.cost}</span>}
                        </div>
                        <div className="font-ms text-[10px] text-ms-yellow mb-[3px] font-bold">{t.role}</div>
                        <div className="font-ms text-[11px] text-ms-text-light leading-[1.6]">{t.why}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {Array.isArray(kit.buildRoadmap) && kit.buildRoadmap.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-[2px] flex-1 bg-ms-border"></div>
                  <SL>4-WEEK MVP EXECUTION MAP</SL>
                  <div className="h-[2px] flex-1 bg-ms-border"></div>
                </div>
                
                <div className="relative pl-8 border-l border-ms-border/50 ml-4 space-y-8 pb-4">
                  {kit.buildRoadmap.map((week: any, i: number) => {
                    const isLast = i === kit.buildRoadmap.length - 1;
                    const weekTitle = typeof week === 'string' ? `Phase ${i + 1}` : (week.week || `Week ${i + 1}`);
                    const title = typeof week === 'string' ? week : week.title;
                    const tasks = Array.isArray(week.tasks) ? week.tasks : (typeof week.tasks === 'string' ? [week.tasks] : []);

                    return (
                      <div key={i} className="relative">
                        {/* Timeline Node */}
                        <div className="absolute -left-[45px] top-0 w-[24px] h-[24px] bg-ms-bg border-2 border-ms-green flex items-center justify-center rounded-full z-[2] shadow-[0_0_10px_rgba(80,230,160,0.3)]">
                          <div className="w-1.5 h-1.5 bg-ms-green rounded-full"></div>
                        </div>
                        
                        {/* Week Header */}
                        <div className="mb-2">
                          <div className="font-ms text-[10px] text-ms-green font-bold tracking-[2px] uppercase">{weekTitle}</div>
                          <div className="font-ms text-[15px] text-white font-bold mt-1 leading-[1.3]">{title}</div>
                        </div>

                        {/* Task List */}
                        <div className="bg-ms-panel border border-ms-border p-4 relative group hover:border-ms-green/30 transition-colors">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            {tasks.map((t: string, j: number) => (
                              <div key={j} className="flex gap-3 items-start">
                                <span className="text-ms-green text-[12px] mt-0.5 opacity-60">▹</span>
                                <span className="font-ms text-[11px] text-ms-text-light leading-[1.5]">{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VALIDATE */}
        {tab === "validate" && kit.validation && (
          <div>
            <div className="bg-ms-panel border border-ms-border border-l-4 border-l-ms-green px-4 py-3 mb-3.5">
              <SL>Market Size Snapshot</SL>
              <div className="font-ms text-[13px] text-ms-text leading-[1.7]">{kit.validation.marketSizeSnapshot}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3.5">
              <div className="bg-ms-panel border border-ms-border p-3">
                <SL color="#5ce6a0">Proof of Demand</SL>
                {Array.isArray(kit.validation.proofOfDemand) && kit.validation.proofOfDemand.map((p: any, i: number) => {
                  const label = typeof p === 'string' ? p : p?.signal || p?.name || JSON.stringify(p);
                  return <div key={i} className="font-ms text-[11px] text-ms-text-light mb-1 leading-[1.5] flex gap-1.5"><span className="text-ms-green shrink-0">✓</span><span>{label}</span></div>;
                })}
              </div>
              <div className="bg-ms-panel border border-ms-border p-3">
                <SL color="#ff9999">Red Flags</SL>
                {Array.isArray(kit.validation.redFlags) && kit.validation.redFlags.map((r: any, i: number) => {
                  const label = typeof r === 'string' ? r : r?.flag || r?.name || JSON.stringify(r);
                  return <div key={i} className="font-ms text-[11px] text-ms-text-light mb-1 leading-[1.5] flex gap-1.5"><span className="text-ms-red shrink-0">⚠</span><span>{label}</span></div>;
                })}
              </div>
            </div>
            {Array.isArray(kit.validation.testScripts) && kit.validation.testScripts.length > 0 && (
              <div className="mb-3.5">
                <SL color="#ffc857">Validation Interview Questions</SL>
                {kit.validation.testScripts.map((q: any, i: number) => {
                  const label = typeof q === 'string' ? q : q?.script || q?.name || JSON.stringify(q);
                  return <div key={i} className="bg-ms-panel border border-ms-border px-3.5 py-2.5 mb-1.5 font-ms text-[12px] text-ms-text leading-[1.5] italic">&quot;{label}&quot;</div>;
                })}
              </div>
            )}
            {kit.validation.goNoGoScore && (
              <div className="bg-ms-yellow-dark border border-ms-yellow-dark px-4 py-3 flex justify-between items-center">
                <div className="font-ms text-[11px] text-ms-green">{kit.validation.goNoGoReason}</div>
                <div className="text-center shrink-0 ml-4">
                  <div className="font-ms text-[10px] text-ms-text-muted mb-0.5">GO / NO-GO</div>
                  <div className={`font-ms text-[28px] font-bold ${parseInt(kit.validation.goNoGoScore) >= 7 ? "text-ms-green" : parseInt(kit.validation.goNoGoScore) >= 5 ? "text-ms-yellow" : "text-ms-red"}`}>{kit.validation.goNoGoScore}/10</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPETITORS MATCH via Google Search Grounding */}
        {tab === "competitors" && (
          <div className="space-y-5">
            <div className="bg-ms-panel border border-ms-border p-5 rounded">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-ms-border">
                <div>
                  <h3 className="font-ms text-[15px] text-white font-bold m-0 flex items-center gap-2">
                    <span>📡 Live Niche Competitor Sifting Engine</span>
                    <span className="font-ms text-[10px] text-ms-green bg-ms-green-dark/20 border border-ms-green px-2.5 py-0.5 font-normal">
                      GOOGLE GROUNDING
                    </span>
                  </h3>
                  <p className="font-ms text-[11px] text-ms-text-muted m-0 mt-1">
                    Perform deep, live web scans to find and analyze existing real competitors in the &ldquo;{idea.niche || idea.name}&rdquo; niche.
                  </p>
                </div>
              </div>

              {!competitors && !loadingComp && !compError && (
                <div className="border border-ms-border border-dashed p-10 text-center rounded">
                  <div className="text-[32px] mb-2">🔍</div>
                  <div className="font-ms text-[13px] text-white font-bold mb-1">Verify Niche Competitors Side-by-Side</div>
                  <p className="font-ms text-[11px] text-ms-text-muted max-w-md mx-auto mb-4 leading-relaxed">
                    SaaS founders succeed through high market awareness. Run a live search query using Google Search grounding to isolate actual competitor features, strengths, and chinks in their armor.
                  </p>
                  <button
                    onClick={handleSearchCompetitors}
                    className="font-ms text-[11px] font-bold bg-ms-green hover:bg-ms-green-light text-ms-bg px-5 py-2.5 rounded transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    🚀 Run Live Competitor Scan
                  </button>
                </div>
              )}

              {loadingComp && (
                <div className="p-8 text-center bg-ms-bg border border-ms-border">
                  <div className="animate-spin text-ms-green text-[24px] mb-3 inline-block">⟳</div>
                  <div className="font-ms text-[13px] text-white font-bold mb-1">Sifting Niche Competitors...</div>
                  <p className="font-ms text-[11px] text-ms-text-muted">
                    Scanning Google indexing nodes, analyzing product domains, and mapping out side-by-side matrices.
                  </p>
                </div>
              )}

              {compError && (
                <div className="bg-ms-red-dark border border-ms-red-dark text-ms-red p-4 font-ms text-[12px] rounded flex justify-between items-center">
                  <span>✕ Error Scoping Niche Competitors: {compError}</span>
                  <button onClick={handleSearchCompetitors} className="font-ms bg-transparent border border-ms-red text-ms-red px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-all hover:bg-ms-red/10">Retry Scan</button>
                </div>
              )}

              {competitors && competitors.length > 0 && (
                <div className="space-y-5">
                  <div className="overflow-x-auto border border-ms-border rounded bg-ms-bg">
                    <table className="min-w-full divide-y divide-ms-border text-left">
                      <thead className="bg-[#112211]">
                        <tr>
                          <th className="px-4 py-3 font-ms text-[10px] font-bold text-ms-green uppercase tracking-wider w-[18%] border-r border-ms-border">Competitor & URL</th>
                          <th className="px-4 py-3 font-ms text-[10px] font-bold text-ms-green uppercase tracking-wider w-[20%] border-r border-ms-border">Target Audience</th>
                          <th className="px-4 py-3 font-ms text-[10px] font-bold text-ms-green uppercase tracking-wider w-[22%] border-r border-ms-border">Core Offerings</th>
                          <th className="px-4 py-3 font-ms text-[10px] font-bold text-ms-green uppercase tracking-wider w-[20%] border-r border-ms-border">Key Strengths</th>
                          <th className="px-4 py-3 font-ms text-[10px] font-bold text-ms-red uppercase tracking-wider w-[20%]">Chinks in Armor ⚡</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ms-border bg-transparent font-ms text-[12px]">
                        {competitors.map((comp: any, cIdx: number) => {
                          const websiteUrl = comp.website || "";
                          const safeUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
                          return (
                            <tr key={cIdx} className="hover:bg-ms-panel/40 transition-colors">
                              <td className="px-4 py-4.5 align-top border-r border-ms-border">
                                <div className="font-bold text-white mb-1.5">{comp.name}</div>
                                {comp.website && (
                                  <a
                                    href={safeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    referrerPolicy="no-referrer"
                                    className="text-ms-green text-[10px] hover:underline font-mono inline-flex items-center gap-1 break-all"
                                  >
                                    🌐 {websiteUrl.replace(/^https?:\/\//, "")}
                                  </a>
                                )}
                              </td>
                              <td className="px-4 py-4.5 text-ms-text-light leading-relaxed align-top border-r border-ms-border">
                                {comp.targetAudience}
                              </td>
                              <td className="px-4 py-4.5 text-ms-text-light leading-relaxed align-top border-r border-ms-border">
                                {comp.keyFeatures}
                              </td>
                              <td className="px-4 py-4.5 text-ms-green/90 font-medium leading-relaxed align-top border-r border-ms-border">
                                <span className="mr-1">✓</span> {comp.strengths}
                              </td>
                              <td className="px-4 py-4.5 text-ms-yellow leading-relaxed align-top font-medium">
                                <span className="text-ms-red mr-1">⚡</span> {comp.weaknesses}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {compSources && compSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-ms-border bg-ms-bg/40 p-4 rounded-sm">
                      <div className="font-ms text-[10.5px] text-ms-text-muted font-bold tracking-[1.5px] uppercase flex items-center gap-1.5 mb-2">
                        <span>📡 Google Grounding Search Sourced Web Results</span>
                      </div>
                      <ul className="m-0 p-0 pl-4 space-y-1.5 list-disc">
                        {compSources.map((src: any, sIdx: number) => (
                          <li key={sIdx} className="font-ms text-[11px] leading-relaxed text-ms-text-muted">
                            <a href={src.uri} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="text-ms-green hover:underline font-medium">
                              {src.title || src.uri}
                            </a>
                            <span className="text-ms-text-muted font-mono text-[9px] ml-1.5 font-normal">({src.uri})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MARKETING */}
        {tab === "marketing" && kit.marketingAssets && (
          <div>
            <div className="bg-ms-panel border border-ms-border p-4 mb-3">
              <SL color="#5ce6a0">🖥 Landing Page Copy</SL>
              <div className="mb-2.5">
                <div className="font-ms text-[10px] text-ms-text-muted mb-1">HEADLINE</div>
                <div className="flex justify-between items-start gap-2">
                  <div className="font-ms text-[18px] text-white font-bold leading-[1.3] flex-1">{kit.marketingAssets.landingHeadline}</div>
                  <CopyBtn text={kit.marketingAssets.landingHeadline || ""} />
                </div>
              </div>
              <div className="mb-2.5">
                <div className="font-ms text-[10px] text-ms-text-muted mb-1">SUBHEADLINE</div>
                <div className="flex justify-between items-start gap-2">
                  <div className="font-ms text-[13px] text-ms-text leading-[1.7] flex-1">{kit.marketingAssets.landingSubheadline}</div>
                  <CopyBtn text={kit.marketingAssets.landingSubheadline || ""} />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="font-ms text-[10px] text-ms-text-muted">CTA:</div>
                <div className="font-ms text-[12px] text-[#060f06] bg-ms-green px-4.5 py-1.5 font-bold">{kit.marketingAssets.ctaButton}</div>
                <CopyBtn text={kit.marketingAssets.ctaButton || ""} />
              </div>
            </div>
            {kit.marketingAssets.elevatorPitch && <div className="bg-ms-panel border border-ms-border p-3.5 mb-3"><div className="flex justify-between items-center mb-2"><SL color="#ffc857">🎤 30-Second Elevator Pitch</SL><CopyBtn text={kit.marketingAssets.elevatorPitch} /></div><div className="font-ms text-[13px] text-ms-text leading-[1.7] italic border-l-3 border-l-ms-yellow pl-3">&quot;{kit.marketingAssets.elevatorPitch}&quot;</div></div>}
            {kit.marketingAssets.coldEmail && <div className="bg-ms-panel border border-ms-border p-3.5 mb-3"><div className="flex justify-between items-center mb-2"><SL color="#5ce6a0">✉ Cold Outreach Email</SL><CopyBtn text={`Subject: ${kit.marketingAssets.coldEmail.subject}\n\n${kit.marketingAssets.coldEmail.body}`} /></div><div className="font-ms text-[11px] text-ms-text-muted mb-1">SUBJECT:</div><div className="font-ms text-[12px] text-white font-bold mb-2.5">{kit.marketingAssets.coldEmail.subject}</div><div className="font-ms text-[11px] text-ms-text-light leading-[1.8] whitespace-pre-line bg-[#060d06] p-2.5">{kit.marketingAssets.coldEmail.body}</div></div>}
            {kit.marketingAssets.socialPost && <div className="bg-ms-panel border border-ms-border p-3.5 mb-3"><div className="flex justify-between items-center mb-2"><SL color="#a78bfa">📱 Social Post</SL><CopyBtn text={kit.marketingAssets.socialPost} /></div><div className="font-ms text-[13px] text-ms-text leading-[1.7] bg-[#060d06] p-2.5 whitespace-pre-line">{kit.marketingAssets.socialPost}</div></div>}
            
            {kit.marketingAssets.socialContentStrategy && (
              <div className="bg-ms-panel border border-ms-border p-5 mb-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <span className="text-[40px]">🎯</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-ms-border/50">
                  <div className="flex flex-col">
                    <SL color="#a78bfa">🎯 Social Content Strategy</SL>
                    <span className="font-ms text-[10px] text-ms-text-muted">Playbook for organic reach and community building</span>
                  </div>
                  <CopyBtn text={kit.marketingAssets.socialContentStrategy} />
                </div>
                <div className="font-ms text-[13px] text-ms-text leading-[1.8] bg-[#060d06] p-4 whitespace-pre-line border-l-4 border-l-ms-green shadow-inner">
                  {kit.marketingAssets.socialContentStrategy}
                </div>
              </div>
            )}

            {Array.isArray(kit.marketingAssets.blogPostIdeas) && kit.marketingAssets.blogPostIdeas.length > 0 && (
              <div className="bg-ms-panel border border-ms-border p-3.5 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <SL color="#5ce6a0">✍️ Blog Post Ideas</SL>
                  <CopyBtn text={kit.marketingAssets.blogPostIdeas.join("\n")} />
                </div>
                <div className="flex flex-col gap-2">
                  {kit.marketingAssets.blogPostIdeas.map((idea: string, j: number) => (
                    <div key={j} className="font-ms text-[12px] text-ms-text leading-[1.5] bg-[#060d06] p-2.5 border-l-2 border-l-ms-yellow">
                      {idea}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(kit.marketingAssets.objectionHandlers) && kit.marketingAssets.objectionHandlers.length > 0 && <div><SL color="#ff9999">🛡 Objection Handlers</SL>{kit.marketingAssets.objectionHandlers.map((o: any, i: number) => {
              if (typeof o === 'string') {
                return <div key={i} className="bg-ms-panel border border-ms-border p-3 mb-2"><div className="font-ms text-[12px] text-ms-text leading-[1.6]">{o}</div></div>;
              }
              return <div key={i} className="bg-ms-panel border border-ms-border p-3 mb-2"><div className="font-ms text-[11px] text-ms-red mb-1.5 font-bold">&quot;{o.objection}&quot;</div><div className="font-ms text-[12px] text-ms-text leading-[1.6]">→ {o.response}</div></div>;
            })}</div>}
          </div>
        )}

        {/* SALES */}
        {tab === "sales" && kit.salesScript && (
          <div>
            <div className="bg-ms-panel border border-ms-yellow border-l-4 border-l-ms-yellow px-4 py-3 mb-3 font-ms text-[11px] text-[#ffe9a0]">
              💡 Designed for cold calling or walking into the business in person — the primary GTM for legacy B2B.
            </div>
            {[["📞 Cold Call Opener", "#5ce6a0", "opener"], ["🔍 Pain Question", "#ffc857", "painQuestion"], ["🎯 The Pitch", "#a78bfa", "pitch"], ["🤝 Trial Close", "#5ce6a0", "trialClose"], ["✅ The Ask / Close", "#ff9999", "close"], ["📅 Follow-Up", "#7a9e7a", "followUp"]].map(([label, color, key]) => kit.salesScript[key] && (
              <div key={key} className="bg-ms-panel border border-ms-border p-3.5 mb-2.5">
                <div className="flex justify-between items-center mb-2">
                  <SL color={color}>{label}</SL><CopyBtn text={kit.salesScript[key]} />
                </div>
                <div className="font-ms text-[13px] text-ms-text leading-[1.7] italic border-l-3 pl-3 whitespace-pre-line" style={{ borderLeftColor: color }}>&quot;{kit.salesScript[key]}&quot;</div>
              </div>
            ))}
            {Array.isArray(kit.salesScript.tips) && kit.salesScript.tips.length > 0 && <div className="bg-ms-yellow-dark border border-ms-yellow-dark px-3.5 py-3"><SL color="#ffc857">Pro Tips</SL>{kit.salesScript.tips.map((t: any, i: number) => {
              const label = typeof t === 'string' ? t : t?.tip || t?.name || JSON.stringify(t);
              return <div key={i} className="font-ms text-[11px] text-ms-yellow mb-1.5 flex gap-1.5"><span className="text-ms-yellow shrink-0">★</span><span>{label}</span></div>;
            })}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
