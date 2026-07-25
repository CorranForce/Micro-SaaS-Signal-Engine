"use client";

import type { ComponentType, Dispatch, SetStateAction } from "react";
import { Bookmark, Search, Check, Copy, Download } from "lucide-react";
import { LaunchKitTabs } from "../LaunchKitTabs";
import type { SaasIdea, LaunchKit, SavedIdea } from "../types";
import type { SchemaTable } from "../lib/launchkit-utils";

interface SavedKitsTabProps {
  savedIdeas: SavedIdea[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  expandedSavedIdeas: Record<number, boolean>;
  setExpandedSavedIdeas: Dispatch<SetStateAction<Record<number, boolean>>>;
  compactMode: boolean;
  copiedText: string | null;
  onCopy: (text: string, label: string) => void;
  onDelete: (saved: SavedIdea) => void;
  onClearAll: () => void;
  onExportPdf: (index: number, idea: SaasIdea, kit: LaunchKit) => void;
  isExporting: boolean;
  generateSqlFallback?: (tables: SchemaTable[]) => string;
  VisualSchemaDiagram?: ComponentType<{ tables: SchemaTable[] }>;
}

export function SavedKitsTab({
  savedIdeas,
  searchQuery,
  setSearchQuery,
  expandedSavedIdeas,
  setExpandedSavedIdeas,
  compactMode,
  copiedText,
  onCopy,
  onDelete,
  onClearAll,
  onExportPdf,
  isExporting,
  generateSqlFallback,
  VisualSchemaDiagram,
}: SavedKitsTabProps) {
  const filteredSavedIdeas = savedIdeas.filter((saved) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const idea = saved.idea;
    return (
      idea.name.toLowerCase().includes(query) ||
      idea.tagline.toLowerCase().includes(query) ||
      idea.problem.toLowerCase().includes(query) ||
      idea.solution.toLowerCase().includes(query) ||
      idea.targetAudience.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-ms-border pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">Your Saved Launch Kits</h2>
          <p className="text-xs text-ms-text-muted font-ms mt-0.5">
            Access saved B2B idea specs and copy development prompts instantly.
          </p>
        </div>
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs font-ms rounded transition-all"
        >
          CLEAR ALL
        </button>
      </div>

      {savedIdeas.length === 0 ? (
        <div className="py-24 text-center bg-ms-card border border-ms-border rounded-lg">
          <Bookmark className="w-12 h-12 text-ms-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Saved Kits Yet</h3>
          <p className="text-sm text-ms-text-muted max-w-sm mx-auto leading-relaxed">
            Go to the Find Ideas tab, generate B2B opportunity specs, and save
            them. They will appear here safely.
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-ms-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search saved kits by name, niche, problem, or solution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ms-bg border border-ms-border rounded pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ms-border-active transition-colors"
            />
          </div>
          {filteredSavedIdeas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ms-text-muted">
                No saved kits match your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSavedIdeas.map((saved) => {
                // Original index preserves correct mapping and toggling.
                const originalIdx = savedIdeas.findIndex((s) => s === saved);
                return (
                  <div
                    key={originalIdx}
                    className={`bg-ms-card border border-ms-border ${compactMode ? "p-4" : "p-6"} rounded-lg relative flex flex-col justify-between`}
                  >
                    <div>
                      <div
                        className={`flex justify-between items-start gap-4 ${compactMode ? "mb-2" : "mb-3"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`${compactMode ? "text-[10px]" : "text-xs"} text-ms-green bg-ms-green-dark border border-ms-green/20 px-2 py-0.5 rounded font-ms font-bold uppercase`}
                          >
                            {saved.idea.buildComplexity} BUILD
                          </span>
                          {saved.idea.hotnessScore && (
                            <span
                              className={`${compactMode ? "text-[10px]" : "text-xs"} text-orange-400 bg-orange-900/30 border border-orange-500/30 px-2 py-0.5 rounded font-ms font-bold uppercase flex items-center gap-1`}
                              title={`Market Demand: ${saved.idea.marketDemandScore}/10`}
                            >
                              HOTNESS{" "}
                              {Array.from({ length: saved.idea.hotnessScore }).map(
                                (_, i) => (
                                  <span
                                    key={i}
                                    className="text-orange-500 text-sm leading-none -mt-[2px]"
                                  >
                                    🔥
                                  </span>
                                ),
                              )}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-ms-text-muted font-ms">
                          Saved {saved.savedAt}
                        </span>
                      </div>

                      <h3
                        className={`${compactMode ? "text-sm" : "text-base"} font-bold text-white mb-1`}
                      >
                        {saved.idea.name}
                      </h3>
                      <p
                        className={`${compactMode ? "text-[10px]" : "text-xs"} text-ms-yellow italic ${compactMode ? "mb-2" : "mb-3"}`}
                      >
                        &ldquo;{saved.idea.tagline}&rdquo;
                      </p>

                      <div
                        className={`space-y-3 ${compactMode ? "text-[10px] p-2" : "text-xs p-3"} text-ms-text-muted leading-relaxed bg-ms-bg rounded border border-ms-border mb-4`}
                      >
                        <p>
                          <strong>Problem:</strong> {saved.idea.problem}
                        </p>
                        <p>
                          <strong>Solution:</strong> {saved.idea.solution}
                        </p>
                        <p>
                          <strong>Target Customer:</strong>{" "}
                          {saved.idea.targetAudience}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setExpandedSavedIdeas((prev) => ({
                            ...prev,
                            [originalIdx]: !prev[originalIdx],
                          }))
                        }
                        className="flex-1 py-2.5 bg-ms-green text-ms-bg font-ms font-bold text-xs rounded hover:bg-[#00d066] transition-all"
                      >
                        {expandedSavedIdeas[originalIdx] ? "HIDE KIT" : "VIEW KIT"}
                      </button>

                      {saved.kit && (
                        <button
                          onClick={() =>
                            onCopy(
                              saved.kit?.lovablePrompt || "",
                              `copied-saved-prompt-${originalIdx}`,
                            )
                          }
                          className="px-4 py-2 bg-ms-bg border border-ms-border text-xs font-ms text-white hover:border-ms-green rounded transition-colors flex items-center justify-center gap-1.5"
                        >
                          {copiedText === `copied-saved-prompt-${originalIdx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-ms-green" /> COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> PROMPT
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(saved)}
                        className="px-3 py-2 border border-ms-border text-red-400 hover:border-red-500/40 rounded text-xs transition-colors"
                      >
                        DELETE
                      </button>
                    </div>

                    {expandedSavedIdeas[originalIdx] && saved.kit && (
                      <div className="mt-6 border-t border-ms-border pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Saved Launch Kit
                          </h3>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                              onClick={() =>
                                onExportPdf(originalIdx, saved.idea, saved.kit!)
                              }
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
                          </div>
                        </div>
                        <LaunchKitTabs
                          kit={saved.kit}
                          onCopy={onCopy}
                          copiedText={copiedText}
                          generateSqlFallback={generateSqlFallback}
                          VisualSchemaDiagram={VisualSchemaDiagram}
                          inlineMode={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
