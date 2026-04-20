"use client";

import { useState } from "react";
import { SL } from "./SharedUI";

const GENERIC_PRESELL = [
  "Identified 3+ specific businesses to contact",
  "Described the problem back to a real owner",
  "Got verbal confirmation the problem costs them money",
  "Quoted a price — they didn't immediately say no",
  "Received written or verbal commitment to pay before building",
];

export const PreSellChecklist = ({ steps }: { steps?: any[] }) => {
  const items = (steps && steps.length > 0) ? steps : GENERIC_PRESELL;
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const done = Object.values(checks).filter(Boolean).length;
  return (
    <div className="bg-ms-panel border border-ms-border border-l-4 border-l-ms-yellow px-4 py-3.5">
      <div className="flex justify-between items-center mb-2.5">
        <SL color="#ffc857">✋ Pre-Sell Validation</SL>
        <span className={`font-ms text-[10px] font-bold ${done === items.length ? "text-ms-green" : "text-ms-yellow"}`}>
          {done}/{items.length} {done === items.length ? "✓ READY TO BUILD" : "— Don't code yet!"}
        </span>
      </div>
      {items.map((s, i) => {
        const label = typeof s === 'string' ? s : s?.name || s?.step || JSON.stringify(s);
        return (
          <div key={i} onClick={() => setChecks(p => ({ ...p, [i]: !p[i] }))} className="flex gap-2.5 cursor-pointer mb-2 items-start">
            <div className={`w-[15px] h-[15px] shrink-0 mt-[1px] border-2 flex items-center justify-center ${checks[i] ? "border-ms-green bg-ms-green-dark" : "border-ms-border-light bg-transparent"}`}>
              {checks[i] && <span className="text-ms-green text-[9px] font-bold">✓</span>}
            </div>
            <span className={`font-ms text-[11px] leading-[1.5] ${checks[i] ? "text-ms-text-muted line-through" : "text-ms-text-light no-underline"}`}>{label}</span>
          </div>
        );
      })}
      {done < items.length && <div className="mt-2 font-ms text-[10px] text-ms-text-muted italic">&quot;Do not write a single line of code until they explicitly agree to pay.&quot;</div>}
    </div>
  );
};
