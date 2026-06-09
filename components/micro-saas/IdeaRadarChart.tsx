"use client";

import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface IdeaRadarChartProps {
  demandLevel: string;
  competitionLevel: string;
  churnRisk: string;
  buildComplexity: string;
  className?: string;
}

export function IdeaRadarChart({ 
  demandLevel, 
  competitionLevel, 
  churnRisk, 
  buildComplexity,
  className = ""
}: IdeaRadarChartProps) {
  const data = useMemo(() => {
    // Map string values to numbers (1-5) for the radar chart
    // High demand is good (5), low demand is bad (1)
    const demandScore = demandLevel?.toLowerCase() === 'high' ? 5 : demandLevel?.toLowerCase() === 'medium' ? 3 : 1;
    // Low competition is good (5), high is bad (1)
    const compScore = competitionLevel?.toLowerCase() === 'low' ? 5 : competitionLevel?.toLowerCase() === 'medium' ? 3 : 1;
    // Low churn is good (5), high is bad (1)
    const churnScore = churnRisk?.toLowerCase() === 'low' ? 5 : churnRisk?.toLowerCase() === 'medium' ? 3 : 1;
    // Simple build is good (5), complex is bad (1)
    const complexityScore = buildComplexity?.toLowerCase() === 'simple' || buildComplexity?.toLowerCase() === 'low' ? 5 : buildComplexity?.toLowerCase() === 'moderate' || buildComplexity?.toLowerCase() === 'medium' ? 3 : 1;

    return [
      { subject: 'Demand', A: demandScore, fullMark: 5 },
      { subject: 'Low Comp.', A: compScore, fullMark: 5 },
      { subject: 'Retention', A: churnScore, fullMark: 5 },
      { subject: 'Simplicity', A: complexityScore, fullMark: 5 },
    ];
  }, [demandLevel, competitionLevel, churnRisk, buildComplexity]);

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#1e301e" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#7a9e7a', fontSize: 10, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Idea Score"
            dataKey="A"
            stroke="#5ce6a0"
            strokeWidth={2}
            fill="#5ce6a0"
            fillOpacity={0.3}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
