"use client";

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SL } from './SharedUI';

const BAR_CHART_MARGIN = { top: 15, right: 10, left: -10, bottom: 5 };
const AXIS_TICK_STYLE = { fill: '#7a9e7a', fontSize: '10px' };
const AXIS_LINE_STYLE = { stroke: '#1e301e' };
const TOOLTIP_CURSOR_STYLE = { fill: '#0d1f0d' };
const LEGEND_WRAPPER_STYLE = { paddingTop: '10px', fontSize: '11px', color: '#7a9e7a' };

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ms-panel border border-ms-border p-3 text-ms-text font-ms text-[11px] max-w-[250px] shadow-lg z-50">
        <p className="font-bold text-ms-white mb-1 text-[12px]">{data.fullName}</p>
        {data.tagline && <p className="text-ms-text-muted mb-1 text-[10px] italic truncate">{data.tagline}</p>}
        <div className="space-y-1.5 mt-2 border-t border-ms-border/40 pt-2">
          {payload.map((entry: any, index: number) => {
            const val = entry.value;
            const formattedVal = entry.name.includes("ROI") ? `${val}%` : `$${val.toLocaleString()}`;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-ms-text-muted">{entry.name}:</span>
                </div>
                <span className="font-bold text-white">{formattedVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function IdeaRoiChart({ ideas }: { ideas: any[] }) {
  const [chartMode, setChartMode] = useState<'pct' | 'mrr'>('pct');

  const data = useMemo(() => {
    if (!ideas || ideas.length === 0) return [];
    return ideas.map(idea => {
      const roiRaw = typeof idea.roiEstimate === 'string' ? { assumptions: idea.roiEstimate } : (idea.roiEstimate || {});
      
      const roiPct = parseFloat(String(roiRaw.roiMonth1Pct ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
      const mrr = parseFloat(String(roiRaw.realisticMRRMonth1USD ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
      const buildCost = parseFloat(String(roiRaw.buildCostUSD ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
      const expenses = parseFloat(String(roiRaw.monthlyExpensesUSD ?? "0").replace(/[^0-9.\-]/g, "")) || 0;

      return {
        name: idea.name?.length > 15 ? idea.name.substring(0, 15) + '...' : idea.name,
        fullName: idea.name,
        tagline: idea.tagline,
        "Month 1 ROI (%)": roiPct,
        "Est. MRR ($)": mrr,
        "Build Cost ($)": buildCost,
        "Monthly Ops ($)": expenses,
      };
    });
  }, [ideas]);

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-6 bg-ms-panel border border-ms-border p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-ms-border/40 mb-4 animate-fadeIn">
        <SL color="#ffc857">📊 Financial & ROI Projections</SL>
        
        {/* Toggle Controls */}
        <div className="flex bg-ms-bg border border-ms-border p-0.5 rounded gap-0.5 max-w-fit shrink-0">
          <button
            onClick={() => setChartMode('pct')}
            className={`font-ms text-[10px] uppercase font-bold tracking-wider px-3 py-1 cursor-pointer transition-all ${chartMode === 'pct' ? "bg-ms-yellow text-ms-bg" : "text-ms-text-muted hover:text-white bg-transparent"}`}
          >
            ROI %
          </button>
          <button
            onClick={() => setChartMode('mrr')}
            className={`font-ms text-[10px] uppercase font-bold tracking-wider px-3 py-1 cursor-pointer transition-all ${chartMode === 'mrr' ? "bg-ms-yellow text-ms-bg" : "text-ms-text-muted hover:text-white bg-transparent"}`}
          >
            USD Financials
          </button>
        </div>
      </div>

      <div className="h-[250px] w-full text-[11px] font-ms">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={BAR_CHART_MARGIN}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e301e" vertical={false} />
            <XAxis dataKey="name" stroke="#7a9e7a" tick={AXIS_TICK_STYLE} axisLine={AXIS_LINE_STYLE} tickLine={false} />
            
            {chartMode === 'pct' ? (
              <>
                <YAxis 
                  stroke="#7a9e7a" 
                  tick={AXIS_TICK_STYLE} 
                  axisLine={AXIS_LINE_STYLE} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip mode="pct" />} cursor={TOOLTIP_CURSOR_STYLE} />
                <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
                <Bar dataKey="Month 1 ROI (%)" fill="#ffc857" radius={[2, 2, 0, 0]} barSize={40} />
              </>
            ) : (
              <>
                <YAxis 
                  stroke="#7a9e7a" 
                  tick={AXIS_TICK_STYLE} 
                  axisLine={AXIS_LINE_STYLE} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip mode="mrr" />} cursor={TOOLTIP_CURSOR_STYLE} />
                <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
                <Bar dataKey="Build Cost ($)" fill="#ff6b6b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Monthly Ops ($)" fill="#7a9e7a" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Est. MRR ($)" fill="#5ce6a0" radius={[2, 2, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-ms-text-muted mt-3 text-center italic leading-[1.4]">
        {chartMode === 'pct' 
          ? "Month 1 Return on Investment. 100% means breaking even in the first month compared to the build budget." 
          : "Financial comparison. Build Cost (one-time investment), Monthly Ops (monthly run.rate), and Estimated MRR (Month 1 subscription revenue)."}
      </div>
    </div>
  );
}
