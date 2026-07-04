"use client";

import React, { useState } from "react";
import { Code, Wrench, Calendar, Mail, Users, Database, Copy, Check } from "lucide-react";
import type { LaunchKit } from "./types";

type SchemaTable = { name: string; fields: string[]; purpose: string };

interface LaunchKitTabsProps {
  kit: LaunchKit | null | undefined;
  onCopy: (text: string, label: string) => void;
  copiedText: string | null;
  generateSqlFallback?: (tables: SchemaTable[]) => string;
  VisualSchemaDiagram?: React.ComponentType<{ tables: SchemaTable[] }>;
  inlineMode?: boolean;
}

export function LaunchKitTabs({
  kit,
  onCopy,
  copiedText,
  generateSqlFallback,
  VisualSchemaDiagram,
  inlineMode,
}: LaunchKitTabsProps) {
  const [kitTab, setKitTab] = useState("prompt");

  if (!kit) return null;

  const renderPrompt = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-ms-bg/50 border border-ms-border px-4 py-3 rounded">
        <div>
          <h4 className="text-xs font-bold text-white uppercase font-ms">AI App Builder Starter Prompt</h4>
          <p className="text-[10px] text-ms-text-muted mt-0.5">Copy and paste this directly into your favorite AI tool.</p>
        </div>
        <button
          onClick={() => onCopy(kit.lovablePrompt || "", "vibe-prompt")}
          className="px-3 py-1.5 bg-ms-green text-ms-bg font-ms font-bold text-xs rounded hover:bg-[#00d066] transition-all flex items-center gap-1"
        >
          {copiedText === "vibe-prompt" ? <><Check className="w-3 h-3" /> COPIED</> : <><Copy className="w-3 h-3" /> COPY</>}
        </button>
      </div>
      <div className="bg-ms-bg border border-ms-border p-4 rounded text-xs font-ms text-ms-text-muted leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap select-all scrollbar-thin">
        {kit.lovablePrompt}
      </div>
    </div>
  );

  const renderStack = () => (
    <div className="space-y-4">
      <h4 className="text-xs font-bold font-ms text-ms-yellow tracking-wider uppercase mb-2">Core Tech Stack Integrations</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kit.noCodeStack?.map((tool: any, idx: number) => (
          <div key={idx} className="bg-ms-bg border border-ms-border p-4 rounded-lg flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-white text-sm mb-1">{tool.tool}</h5>
              <span className="text-[10px] text-ms-green font-ms uppercase tracking-wider block mb-2">{tool.role}</span>
              <p className="text-xs text-ms-text-muted leading-relaxed">{tool.why}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-ms-border/50 text-right">
              <span className="text-[10px] font-mono text-ms-yellow">{tool.cost}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-4">
      <h4 className="text-xs font-bold font-ms text-ms-yellow tracking-wider uppercase mb-2">4-Week Execution Plan</h4>
      <div className="space-y-4">
        {kit.buildRoadmap?.map((week: any, idx: number) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-4 bg-ms-bg border border-ms-border p-4 rounded-lg">
            <div className="w-24 shrink-0">
              <span className="text-sm font-bold text-ms-green uppercase">{week.week}</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-white mb-2">{week.title}</h5>
              <ul className="space-y-1.5">
                {week.tasks.map((task: string, tIdx: number) => (
                  <li key={tIdx} className="text-xs text-ms-text-muted flex items-start gap-2">
                    <span className="text-ms-border mt-0.5">•</span>
                    <span className="leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      <div className="bg-ms-bg border border-ms-border p-5 rounded-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ms-green to-transparent"></div>
        <span className="text-[10px] text-ms-green font-ms uppercase font-bold tracking-wider mb-2 block">Hero Section Copy</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          &ldquo;{kit.marketingAssets?.landingHeadline}&rdquo;
        </h2>
        <p className="text-sm text-ms-text-muted max-w-xl mx-auto italic">
          &ldquo;{kit.marketingAssets?.landingSubheadline}&rdquo;
        </p>
        <div className="mt-4">
          <span className="text-xs bg-ms-border text-white px-2 py-1 rounded inline-block mt-1 font-bold">
            {kit.marketingAssets?.ctaButton}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-ms-bg border border-ms-border p-4 rounded-lg relative group">
          <button
            onClick={() => onCopy(`Subject: ${kit.marketingAssets?.coldEmail?.subject}\n\n${kit.marketingAssets?.coldEmail?.body}`, "cold-email")}
            className="absolute top-3 right-3 text-ms-text-muted hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-ms-green font-ms uppercase font-bold tracking-wider mb-2 block">Cold Outreach Email</span>
          <div className="bg-ms-card p-3 rounded border border-ms-border mb-3">
            <span className="text-[10px] text-ms-text-muted uppercase font-ms block">Subject:</span>
            <span className="text-xs text-white font-bold block mt-0.5">{kit.marketingAssets?.coldEmail?.subject}</span>
          </div>
          <pre className="text-xs text-ms-text-muted font-sans whitespace-pre-wrap leading-relaxed mt-1.5 bg-ms-card p-3 rounded border border-ms-border select-all">
            {kit.marketingAssets?.coldEmail?.body}
          </pre>
        </div>

        <div className="bg-ms-bg border border-ms-border p-4 rounded-lg space-y-4">
          {kit.pricingTiers && (
            <>
              <span className="text-[10px] text-ms-green font-ms uppercase font-bold tracking-wider block">Pricing Tiers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kit.pricingTiers.map((tier: any, i: number) => (
                  <div key={i} className="bg-ms-card p-3 rounded border border-ms-border">
                    <div className="font-bold text-white text-sm">{tier.name}</div>
                    <div className="text-ms-green font-mono text-xs my-1">{tier.price}</div>
                    <ul className="text-[10px] text-ms-text-muted space-y-1 mt-2 list-disc list-inside">
                      {tier.features?.map((f: string, j: number) => <li key={j}>{f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-4">
      <h4 className="text-xs font-bold font-ms text-ms-yellow tracking-wider uppercase mb-2">Sales Methodology</h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-ms-bg border border-ms-border p-4 rounded-lg">
            <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Introduction / Opener</span>
            <p className="text-xs text-ms-text leading-relaxed mt-1">{kit.salesScript?.introduction}</p>
          </div>
          <div className="bg-ms-bg border border-ms-border p-4 rounded-lg">
            <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Discovery Questions</span>
            <ul className="space-y-1.5 mt-1">
              {kit.salesScript?.discoveryQuestions?.map((q: string, idx: number) => (
                <li key={idx} className="text-xs text-ms-text-muted italic">&ldquo;{q}&rdquo;</li>
              ))}
            </ul>
          </div>
          <div className="bg-ms-bg border border-ms-border p-4 rounded-lg">
            <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Pitch Value Props</span>
            <ul className="space-y-1.5 mt-1">
              {kit.salesScript?.pitchValueProps?.map((p: string, idx: number) => (
                <li key={idx} className="text-xs text-ms-text flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-ms-green mt-0.5 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-ms-bg border border-ms-border p-4 rounded-lg">
            <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Objection Handling</span>
            <ul className="space-y-2.5 mt-1.5">
              {kit.salesScript?.objectionHandling?.map((o: string, idx: number) => (
                <li key={idx} className="bg-ms-card p-2 rounded border border-ms-border/50">
                  <span className="text-[10px] text-ms-yellow block font-bold mb-0.5">They say:</span>
                  <span className="text-xs text-white block mb-1">{o.split(/They say:|You say:/i)[1]?.trim() || o}</span>
                  <span className="text-[10px] text-ms-green block font-bold mb-0.5">You say:</span>
                  <span className="text-xs text-ms-text-muted block">{o.split(/You say:/i)[1]?.trim() || o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-ms-bg border border-ms-border p-4 rounded-lg">
            <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Closing Call to Action</span>
            <p className="text-xs text-ms-text leading-relaxed mt-1 font-bold">{kit.salesScript?.callToAction}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ms-border pb-3">
        <div>
          <h4 className="text-xs font-bold font-ms text-ms-yellow tracking-wider uppercase mb-1">Database Schema Requirements</h4>
          <p className="text-xs text-ms-text-muted">{kit.databaseRequirements?.schemaDescription}</p>
        </div>
        <button
          onClick={() => {
            const sqlCode =
              kit.databaseRequirements?.sqlSchema ||
              (kit.databaseRequirements?.tables && generateSqlFallback
                ? generateSqlFallback(kit.databaseRequirements.tables)
                : "");
            onCopy(sqlCode, "sql-schema");
          }}
          className="px-3 py-1.5 bg-ms-bg border border-ms-border text-ms-green hover:text-white hover:border-ms-green transition-colors text-xs font-ms font-bold rounded flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          {copiedText === "sql-schema" ? <Check className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
          {copiedText === "sql-schema" ? "COPIED SQL" : "COPY SQL SCRIPT"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">PostgreSQL Setup Script</span>
          <div className="p-4 bg-black/40 font-mono text-[11px] text-ms-green leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar whitespace-pre rounded border border-ms-border">
            {kit.databaseRequirements?.sqlSchema ||
              (kit.databaseRequirements?.tables && generateSqlFallback
                ? generateSqlFallback(kit.databaseRequirements.tables)
                : "-- No SQL provided")}
          </div>
        </div>
        <div className="space-y-4">
          <span className="text-[10px] text-ms-green font-ms uppercase font-bold block tracking-wider">Visual Entity-Relationship Diagram</span>
          {kit.databaseRequirements?.tables && VisualSchemaDiagram && (
            <VisualSchemaDiagram tables={kit.databaseRequirements.tables} />
          )}
          {!VisualSchemaDiagram && (
            <div className="grid grid-cols-1 gap-3">
              {kit.databaseRequirements?.tables?.map((table: any, idx: number) => (
                <div key={idx} className="bg-ms-bg p-3 rounded border border-ms-border">
                  <div className="text-xs font-bold text-ms-yellow mb-2 border-b border-ms-border/30 pb-1">{table.name}</div>
                  <div className="space-y-1">
                    {table.fields.map((field: string, fIdx: number) => (
                      <div key={fIdx} className="text-[10px] font-mono flex items-center justify-between">
                        <span className="text-white">{field.split(" ")[0]}</span>
                        <span className="text-ms-text-muted opacity-60 ml-2 text-right">{field.split(" ").slice(1).join(" ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inlineMode) {
    return (
      <div className="mt-6 w-full max-w-full space-y-12">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Calendar className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Roadmap</h3>
          </div>
          {renderRoadmap()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Mail className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Marketing Assets</h3>
          </div>
          {renderMarketing()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Code className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Vibe Prompt</h3>
          </div>
          {renderPrompt()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Wrench className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Tech Stack</h3>
          </div>
          {renderStack()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Users className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Outreach & Sales</h3>
          </div>
          {renderSales()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ms-border">
            <Database className="w-5 h-5 text-ms-green" />
            <h3 className="text-base font-bold text-white uppercase font-ms tracking-wider">Database Schema</h3>
          </div>
          {renderDatabase()}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full max-w-full overflow-hidden">
      {/* Tabs Bar */}
      <div className="flex overflow-x-auto pb-2 border-b border-ms-border mb-6 gap-1 scrollbar-none">
        {[
          { id: "prompt", label: "⚡ VIBE PROMPT", icon: <Code className="w-3.5 h-3.5" /> },
          { id: "stack", label: "🛠️ TECH STACK", icon: <Wrench className="w-3.5 h-3.5" /> },
          { id: "roadmap", label: "📅 ROADMAP", icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: "marketing", label: "📢 MARKETING", icon: <Mail className="w-3.5 h-3.5" /> },
          { id: "sales", label: "💼 OUTREACH", icon: <Users className="w-3.5 h-3.5" /> },
          { id: "database", label: "🗄️ DATABASE", icon: <Database className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setKitTab(t.id)}
            className={`px-4 py-2.5 rounded text-xs font-ms flex items-center gap-1.5 whitespace-nowrap transition-all border ${
              kitTab === t.id
                ? "bg-ms-green-dark border-ms-green text-ms-green font-bold"
                : "bg-ms-bg border-transparent text-ms-text-muted hover:text-white hover:border-ms-border"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="space-y-6">
        {kitTab === "prompt" && renderPrompt()}
        {kitTab === "stack" && renderStack()}
        {kitTab === "roadmap" && renderRoadmap()}
        {kitTab === "marketing" && renderMarketing()}
        {kitTab === "sales" && renderSales()}
        {kitTab === "database" && renderDatabase()}
      </div>
    </div>
  );
}
