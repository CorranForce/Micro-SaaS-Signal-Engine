"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SL } from './SharedUI';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ms-panel border border-ms-border p-3 text-ms-text font-ms text-[11px] max-w-[250px] shadow-lg z-50">
        <p className="font-bold text-ms-white mb-1 text-[12px]">{data.fullName}</p>
        {data.tagline && <p className="text-ms-text-muted mb-2 text-[10px] italic">{data.tagline}</p>}
        <div className="mb-2 pb-2 border-b border-ms-border/50">
          <p className="text-[10px] text-ms-text-light line-clamp-3">{data.description}</p>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-ms-text-muted">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.name === "Boring Score" ? `${entry.value}/5` : entry.value === 5 ? "High" : entry.value === 3 ? "Medium" : "Low"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function IdeaLandscapeChart({ ideas }: { ideas: any[] }) {
  if (!ideas || ideas.length === 0) return null;

  const data = ideas.map(idea => {
    const demandScore = idea.demandLevel?.toLowerCase() === 'high' ? 5 : idea.demandLevel?.toLowerCase() === 'medium' ? 3 : 1;
    const compScore = idea.competitionLevel?.toLowerCase() === 'high' ? 5 : idea.competitionLevel?.toLowerCase() === 'medium' ? 3 : 1;
    
    return {
      name: idea.name?.length > 15 ? idea.name.substring(0, 15) + '...' : idea.name,
      fullName: idea.name,
      tagline: idea.tagline,
      description: idea.description,
      "Boring Score": idea.boringScore || 3,
      "Demand": demandScore,
      "Competition": compScore,
    };
  });

  return (
    <div className="mb-6 bg-ms-panel border border-ms-border p-4">
      <SL color="#5ce6a0">📊 Idea Landscape Overview</SL>
      <div className="h-[250px] w-full mt-4 text-[11px] font-ms">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e301e" vertical={false} />
            <XAxis dataKey="name" stroke="#7a9e7a" tick={{ fill: '#7a9e7a' }} axisLine={{ stroke: '#1e301e' }} tickLine={false} />
            <YAxis stroke="#7a9e7a" tick={{ fill: '#7a9e7a' }} axisLine={{ stroke: '#1e301e' }} tickLine={false} ticks={[1, 3, 5]} domain={[0, 5]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0d1f0d' }} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#7a9e7a' }} />
            <Bar dataKey="Boring Score" fill="#5ce6a0" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Demand" fill="#ffc857" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Competition" fill="#ff6b6b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-ms-text-muted mt-2 text-center italic">
        Higher is better for Boring Score and Demand. Lower is better for Competition.
      </div>
    </div>
  );
}
