"use client";

import React, { useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { SL } from './SharedUI';

interface Idea {
  name: string;
  tagline?: string;
  description?: string;
  demandLevel?: string;
  competitionLevel?: string;
  boringScore?: number;
  marketValidation?: {
    goNoGoScore?: number;
  };
}

interface MarketDemandSaturationChartProps {
  ideas: Idea[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Determine quadrant label
    let quadrantName = "";
    let quadrantDesc = "";
    let colorClass = "";
    
    if (data.demand >= 50 && data.saturation < 50) {
      quadrantName = "SaaS Sweet Spot ✨";
      quadrantDesc = "High demand, low competition. Move fast!";
      colorClass = "text-ms-green";
    } else if (data.demand >= 50 && data.saturation >= 50) {
      quadrantName = "Crowded Market 🔥";
      quadrantDesc = "High validation but highly contested. Needs strong USP.";
      colorClass = "text-ms-yellow";
    } else if (data.demand < 50 && data.saturation < 50) {
      quadrantName = "Niche Wilderness 🌲";
      quadrantDesc = "Low competition, but may struggle with buyer intent.";
      colorClass = "text-ms-text-muted";
    } else {
      quadrantName = "High Risk Area ⚠️";
      quadrantDesc = "Low demand, high saturation. Proceed with extreme caution.";
      colorClass = "text-red-400";
    }

    return (
      <div className="bg-ms-panel border border-ms-border p-3 text-ms-text font-ms text-[11px] max-w-[280px] shadow-lg z-50">
        <p className="font-bold text-ms-white mb-0.5 text-[12px]">{data.fullName}</p>
        {data.tagline && <p className="text-ms-text-muted mb-2 text-[10px] italic">{data.tagline}</p>}
        
        <div className="space-y-1 py-2 border-t border-b border-ms-border/40 my-2">
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-ms-text-muted">Market Demand Score:</span>
            <span className="font-bold text-ms-green">{data.demand}% ({data.demandOrg})</span>
          </div>
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-ms-text-muted">Competitor Saturation:</span>
            <span className="font-bold text-orange-400">{data.saturation}% ({data.competitionOrg})</span>
          </div>
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-ms-text-muted">Go/No-Go Score:</span>
            <span className="font-bold text-ms-green">{data.score}/10</span>
          </div>
        </div>

        <div className="pt-1">
          <p className={`font-bold text-[11px] mb-0.5 ${colorClass}`}>{quadrantName}</p>
          <p className="text-[10px] text-ms-text-muted leading-relaxed">{quadrantDesc}</p>
        </div>
      </div>
    );
  }
  return null;
};

const AXIS_TICK_STYLE = { fill: '#7a9e7a', fontSize: '10px', fontFamily: 'monospace' };
const AXIS_LINE_STYLE = { stroke: '#1e301e' };
const TOOLTIP_CURSOR_STYLE = { stroke: '#1e301e', strokeDasharray: '3 3' };

export function MarketDemandSaturationChart({ ideas }: MarketDemandSaturationChartProps) {
  const data = useMemo(() => {
    if (!ideas || ideas.length === 0) return [];
    
    return ideas.filter(Boolean).map((idea, index) => {
      const dLVal = (idea.demandLevel || "").toLowerCase();
      const cLVal = (idea.competitionLevel || "").toLowerCase();
      
      // Map base levels: High=80%, Medium=50%, Low=20%
      const baseDemand = dLVal === "high" ? 80 : dLVal === "medium" ? 50 : 20;
      const baseSat = cLVal === "high" ? 80 : cLVal === "medium" ? 50 : 20;
      
      // Jitter logic based on index or properties to spread dots beautifully
      const seedName = idea.name || "";
      const charSum = seedName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterX = ((charSum + index * 17) % 25) - 12; // -12% to +12%
      const jitterY = ((charSum + index * 31) % 25) - 12; // -12% to +12%
      
      // Incorporate goNoGoScore & boringScore to slightly tilt placement toward precise validation
      const scoreWeight = idea.marketValidation?.goNoGoScore ? (idea.marketValidation.goNoGoScore - 5) * 2 : 0;
      const boringWeight = idea.boringScore ? (idea.boringScore - 3) * 3 : 0;

      const demand = Math.min(95, Math.max(5, baseDemand + jitterY + scoreWeight));
      const saturation = Math.min(95, Math.max(5, baseSat + jitterX - boringWeight));
      
      return {
        id: index,
        name: idea.name?.length > 15 ? idea.name.substring(0, 15) + '...' : idea.name,
        fullName: idea.name,
        tagline: idea.tagline,
        description: idea.description,
        demand: Math.round(demand),
        saturation: Math.round(saturation),
        demandOrg: idea.demandLevel || 'Medium',
        competitionOrg: idea.competitionLevel || 'Low',
        score: idea.marketValidation?.goNoGoScore || 7,
      };
    });
  }, [ideas]);

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-6 bg-ms-panel border border-ms-border p-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
        <SL color="#5ce6a0">🎯 Demand vs. Saturation Matrix</SL>
        <span className="font-mono text-[9px] text-ms-green bg-ms-panel-light border border-ms-green/20 px-1.5 py-0.5 self-start">
          QUADRANT VIEW
        </span>
      </div>
      
      <p className="font-ms text-[11px] text-ms-text-muted mb-4 leading-relaxed">
        Plotting generated SaaS ideas across <strong className="text-ms-white">Market Interest</strong> (Demand, Y) vs. <strong className="text-ms-white">Competition Pressure</strong> (Saturation, X). Move mouse over points to analyze coordinates.
      </p>

      {/* Grid Canvas */}
      <div className="h-[280px] w-full mt-4 text-[11px] font-ms relative">
        {/* Quadrant Legend Boxes in background */}
        <div className="absolute inset-0 pointer-events-none flex flex-wrap opacity-5" style={{ margin: "15px 10px 30px 40px" }}>
          <div className="w-1/2 h-1/2 bg-ms-green border-r border-b border-ms-border/40 flex items-start p-2 font-mono text-[9px] font-bold text-ms-green">
            SWEET SPOT (HIGH YIELD, LOW SATURATION)
          </div>
          <div className="w-1/2 h-1/2 bg-ms-yellow border-b border-ms-border/40 flex items-start justify-end p-2 font-mono text-[9px] font-bold text-ms-yellow">
            CROWDED BATTLEGROUND
          </div>
          <div className="w-1/2 h-1/2 bg-ms-border border-r flex items-end p-2 font-mono text-[9px] font-bold text-ms-text-muted">
            NICHE WILDERNESS
          </div>
          <div className="w-1/2 h-1/2 bg-red-900/30 flex items-end justify-end p-2 font-mono text-[9px] font-bold text-red-400">
            HIGH RISK / SATURATED
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2b1c" />
            <XAxis 
              type="number" 
              dataKey="saturation" 
              name="Competitor Saturation" 
              unit="%" 
              domain={[0, 100]}
              ticks={[20, 50, 80, 100]}
              stroke="#7a9e7a" 
              tick={AXIS_TICK_STYLE} 
              axisLine={AXIS_LINE_STYLE}
              tickLine={false}
            />
            <YAxis 
              type="number" 
              dataKey="demand" 
              name="Market Demand" 
              unit="%" 
              domain={[0, 100]}
              ticks={[20, 50, 80, 100]}
              stroke="#7a9e7a" 
              tick={AXIS_TICK_STYLE} 
              axisLine={AXIS_LINE_STYLE}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={TOOLTIP_CURSOR_STYLE} />
            
            {/* Horizontal Demand Median Line */}
            <ReferenceLine y={50} stroke="#1e301e" strokeWidth={1.5} strokeDasharray="2 4" />
            {/* Vertical Saturation Median Line */}
            <ReferenceLine x={50} stroke="#1e301e" strokeWidth={1.5} strokeDasharray="2 4" />
            
            <Scatter name="SaaS Options" data={data}>
              {data.map((entry) => {
                // color-code cells by quadrant
                let fill = "#ffc857"; // default crowded yellow
                if (entry.demand >= 50 && entry.saturation < 50) {
                  fill = "#5ce6a0"; // Sweet spot green
                } else if (entry.demand >= 50 && entry.saturation >= 50) {
                  fill = "#ffc857"; // Crowded validation yellow
                } else if (entry.demand < 50 && entry.saturation < 50) {
                  fill = "#7a9e7a"; // Unproven niche gray
                } else {
                  fill = "#ff6b6b"; // Low demand, high competition red
                }
                return (
                  <Cell 
                    key={`cell-${entry.id}`} 
                    fill={fill} 
                    stroke="#0d1f0d" 
                    strokeWidth={1.5}
                    className="cursor-pointer transition-transform duration-300 hover:scale-125"
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Axis Helper Footnotes */}
      <div className="flex justify-between items-center text-[9px] font-mono text-ms-text-muted mt-4 border-t border-ms-border/30 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ms-green inline-block" />
          <span>SaaS Sweet Spot (✨ Target Quadrant)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ms-yellow inline-block" />
          <span>Crowded (Needs Differentiation)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span>High Risk (Lower Priority)</span>
        </div>
      </div>
    </div>
  );
}
