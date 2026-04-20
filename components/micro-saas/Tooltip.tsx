"use client";

import { useState } from "react";

export const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex max-w-full"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[9999] bg-ms-border border border-ms-green px-3 py-2 min-w-[190px] max-w-[260px] font-ms text-[11px] text-ms-text leading-relaxed text-center whitespace-normal shadow-[0_4px_18px_rgba(0,0,0,0.7)] rounded-[3px] pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-ms-green" />
        </div>
      )}
    </div>
  );
};
