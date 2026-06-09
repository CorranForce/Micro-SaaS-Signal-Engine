"use client";

import { useState } from "react";
import { Tooltip } from "./Tooltip";

export const CopyButton = ({ text, label }: { text: string, label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`font-ms text-[9px] px-1.5 py-0.5 border cursor-pointer transition-colors ${copied ? "bg-ms-green-dark border-ms-green text-ms-green" : "bg-transparent border-ms-border text-ms-text-muted hover:text-ms-green hover:border-ms-green"}`}
      title="Copy to clipboard"
    >
      {copied ? "✓ COPIED" : label || "COPY"}
    </button>
  );
};

export const Tag = ({ label, color, bg, tip }: { label: string, color: string, bg?: string, tip?: string }) => {
  const el = (
    <span 
      className="font-ms text-[10px] font-bold tracking-[0.5px] px-2 py-[3px] rounded-[2px] inline-block max-w-full break-words"
      style={{ color, background: bg || "transparent", border: `1px solid ${color}`, cursor: tip ? "help" : "default" }}
    >
      {label}{tip ? " ⓘ" : ""}
    </span>
  );
  return tip ? <Tooltip text={tip}>{el}</Tooltip> : el;
};

export const SL = ({ children, color = "#5ce6a0" }: { children: React.ReactNode, color?: string }) => (
  <div className="font-ms text-[10px] font-bold tracking-[1.5px] mb-2 uppercase" style={{ color }}>
    {children}
  </div>
);

export const BoringScore = ({ score }: { score: number | string }) => {
  const n = Math.min(5, Math.max(1, parseInt(String(score)) || 3));
  const color = n >= 4 ? "#5ce6a0" : n === 3 ? "#ffc857" : "#ff6b6b";
  return (
    <Tooltip text="High boring score means the problem is unsexy but highly valuable (B2B goldmine). Low score means it's a crowded, trendy space. 5 yawns = almost nobody else is building it — less competition, stickier customers, and a much higher chance of success!">
      <div className="group flex flex-col items-center min-w-[64px] cursor-help p-1 rounded hover:bg-ms-panel-light transition-colors">
        <div className="font-ms text-[9px] text-ms-text-muted font-bold tracking-[1px] mb-[2px]">BORING SCORE ⓘ</div>
        <div className="text-[13px] tracking-[1px] flex gap-[1px]">
          {Array.from({ length: n }).map((_, i) => (
            <span 
              key={i} 
              className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
              style={{ transitionDelay: `${i * 75}ms` }}
            >
              🥱
            </span>
          ))}
        </div>
        <div className="font-ms text-[9px] font-bold mt-0.5" style={{ color }}>{n}/5</div>
      </div>
    </Tooltip>
  );
};

export const MetricGauge = ({ label, level, max = 3, color, valueText, tip }: { label: string, level: number, max?: number, color: string, valueText: string, tip?: string }) => {
  const content = (
    <div className="flex flex-col items-center justify-center min-w-[70px] cursor-help p-1.5 rounded hover:bg-ms-panel-light transition-colors group">
      <div className="font-ms text-[9px] font-bold tracking-[1px] mb-1.5 text-ms-text-muted text-center uppercase">{label} {tip ? "ⓘ" : ""}</div>
      <div className="flex gap-[3px]">
        {Array.from({ length: max }).map((_, i) => (
          <div 
            key={i} 
            className="w-[12px] h-[10px] transition-all duration-300 group-hover:scale-y-125" 
            style={{ backgroundColor: i < level ? color : "#1e301e", borderRadius: 1 }} 
          />
        ))}
      </div>
      <div className="font-ms text-[9px] font-bold mt-1.5 text-center uppercase" style={{ color }}>{valueText}</div>
    </div>
  );
  return tip ? <Tooltip text={tip}>{content}</Tooltip> : content;
};

export const DomainBadge = ({ status, domain, onCheck }: { status?: string, domain: string, onCheck?: () => void }) => {
  const isError = status?.startsWith("error:");
  const baseStatus = isError ? "error" : (status || "none");
  
  if (isError) {
    return (
      <a 
        href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="font-ms text-[10px] text-ms-green hover:underline flex items-center gap-1 border border-ms-border px-2 py-1 rounded-[2px] bg-ms-panel"
      >
        Search on GoDaddy ↗
      </a>
    );
  }

  const cfg = {
    checking: { color:"#9ab09a", bg:"#0a100a", border:"#223822", icon:"⟳", text:"CHECKING…" },
    available:{ color:"#4ade80", bg:"#064e3b", border:"#4ade80", icon:"✓", text:"AVAILABLE" },
    taken:    { color:"#f87171", bg:"#450a0a", border:"#f87171", icon:"✗", text:"TAKEN"     },
    error:    { color:"#facc15", bg:"#422006", border:"#facc15", icon:"?", text:"ERROR"   },
    none:     { color:"#9ab09a", bg:"transparent", border:"#223822", icon:"○", text:".COM?"  },
  }[baseStatus] || { color:"#9ab09a", bg:"transparent", border:"#223822", icon:"○", text:".COM?"  };

  const tooltipText = isError 
    ? `Domain check failed: ${status?.replace("error:", "")}` 
    : "Checks if this .com web address is still available to buy — usually about $12/year. Green = grab it now!";

  return (
    <div className="flex items-center gap-1">
      <Tooltip text={tooltipText}>
        <div className="flex flex-col items-center px-2.5 py-1 rounded-[2px] min-w-[80px] cursor-help" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <div className="font-ms text-[9px] font-bold tracking-[1px] flex items-center gap-1" style={{ color: cfg.color }}>
            <span className={status === "checking" ? "animate-spin inline-block" : ""}>{cfg.icon}</span>
            <span>{cfg.text}</span>
          </div>
          <div className="font-ms text-[9px] text-ms-text-muted mt-[1px] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">{domain}</div>
        </div>
      </Tooltip>
      {onCheck && status !== "checking" && (
        <button 
          onClick={(e) => { e.stopPropagation(); onCheck(); }}
          className="bg-transparent border border-ms-border text-ms-text-muted hover:text-ms-green hover:border-ms-green px-1.5 py-1 rounded-[2px] cursor-pointer transition-colors"
          title="Re-check domain"
        >
          <span className="font-ms text-[10px]">↻</span>
        </button>
      )}
    </div>
  );
};
