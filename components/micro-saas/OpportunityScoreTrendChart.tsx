"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SL } from './SharedUI';

const AXIS_TICK_STYLE = { fill: '#7a9e7a', fontSize: '10px' };
const AXIS_LINE_STYLE = { stroke: '#1e301e' };
const TOOLTIP_CURSOR_STYLE = { fill: '#0d1f0d' };
const LEGEND_WRAPPER_STYLE = { paddingTop: '10px', fontSize: '11px', color: '#7a9e7a' };

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ms-panel border border-ms-border p-3 text-ms-text font-ms text-[11px] max-w-[250px] shadow-lg z-50">
        <p className="font-bold text-ms-white mb-1 text-[12px]">{data.fullName}</p>
        {data.tagline && <p className="text-ms-text-muted mb-2 text-[10px] italic">{data.tagline}</p>}
        <div className="space-y-1.5 border-t border-ms-border/40 pt-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-ms-text-muted">Market Opportunity Score:</span>
            <span className="font-bold text-ms-green text-[13px]">{data["Opportunity Score"]}/100</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-ms-text-muted">
            <span>Boring Advantage:</span>
            <span>{data.boringValue}/25</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-ms-text-muted">
            <span>Market Demand Signal:</span>
            <span>{data.demandValue}/25</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-ms-text-muted">
            <span>Competitive Void:</span>
            <span>{data.compValue}/25</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-ms-text-muted">
            <span>Low Churn Retention:</span>
            <span>{data.churnValue}/25</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function OpportunityScoreTrendChart({ ideas }: { ideas: any[] }) {
  const data = useMemo(() => {
    if (!ideas || ideas.length === 0) return [];
    return ideas.filter(Boolean).map(idea => {
      // Aggregate a 100-point composite Opportunity Score:
      // 1. Boring Score (up to 25 points): idea.boringScore (1-5) * 5
      const boringValue = (idea.boringScore || 3) * 5;

      // 2. Demand Level (up to 25 points): High = 25, Medium = 15, Low = 5
      const dLVal = (idea.demandLevel || "").toLowerCase();
      const demandValue = dLVal === "high" ? 25 : dLVal === "medium" ? 15 : 5;

      // 3. Competitive Void (up to 25 points): Low Competition = 25, Medium = 15, High = 5
      const cLVal = (idea.competitionLevel || "").toLowerCase();
      const compValue = cLVal === "low" ? 25 : cLVal === "medium" ? 15 : 5;

      // 4. Low Churn Risk / Retention Quality (up to 25 points): Low Churn = 25, Medium = 15, High = 5
      const chVal = (idea.churnRisk || "").toLowerCase();
      const churnValue = chVal === "low" ? 25 : chVal === "medium" ? 15 : 5;

      const totalScore = boringValue + demandValue + compValue + churnValue;

      return {
        name: idea.name?.length > 15 ? idea.name.substring(0, 15) + '...' : idea.name,
        fullName: idea.name,
        tagline: idea.tagline,
        "Opportunity Score": totalScore,
        boringValue,
        demandValue,
        compValue,
        churnValue
      };
    });
  }, [ideas]);

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-6 bg-ms-panel border border-ms-border p-4">
      <SL color="#5ce6a0">📈 Market Opportunity Score Trends</SL>
      <div className="h-[250px] w-full mt-4 text-[11px] font-ms">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5ce6a0" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#5ce6a0" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e301e" vertical={false} />
            <XAxis dataKey="name" stroke="#7a9e7a" tick={AXIS_TICK_STYLE} axisLine={AXIS_LINE_STYLE} tickLine={false} />
            <YAxis stroke="#7a9e7a" tick={AXIS_TICK_STYLE} axisLine={AXIS_LINE_STYLE} tickLine={false} domain={[0, 100]} ticks={[20, 40, 60, 80, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={TOOLTIP_CURSOR_STYLE} />
            <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />
            <Area type="monotone" dataKey="Opportunity Score" stroke="#5ce6a0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10.5px] text-ms-text-muted mt-3 text-center italic leading-[1.4]">
        Opportunity index mapped across generated options (0-100 scale). Incorporates high-retention industry metrics: Boring Advantage, Market Demand Signal, Competitive Space, and Churn Prevention.
      </div>
    </div>
  );
}
