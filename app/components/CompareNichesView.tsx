"use client";

import { useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { LEGACY_NICHES } from "../lib/niches";

export function CompareNichesView() {
  const [niche1, setNiche1] = useState<string>("Dental Practices");
  const [niche2, setNiche2] = useState<string>("HVAC Services");

  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const getMetrics = (name: string) => {
    const hash = hashCode(name);
    const mrr = 5000 + (hash % 15000); // 5k to 20k
    const buildScore = (hash % 10) + 1; // 1 to 10
    const growth = 5 + (hash % 30); // 5% to 35%

    // Generate some chart data
    let base = 30 + (hash % 20);
    const data = [
      { month: "Jan", demand: base },
      { month: "Feb", demand: (base += hash % 5) },
      { month: "Mar", demand: (base -= hash % 3) },
      { month: "Apr", demand: (base += 5 + (hash % 8)) },
      { month: "May", demand: (base += 2 + (hash % 6)) },
      { month: "Jun", demand: (base += 8 + (hash % 10)) },
    ];

    return { mrr, buildScore, growth, data };
  };

  const metrics1 = getMetrics(niche1);
  const metrics2 = getMetrics(niche2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
            Niche 1
          </label>
          <select
            value={niche1}
            onChange={(e) => setNiche1(e.target.value)}
            className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
          >
            {LEGACY_NICHES.map((n) => (
              <option key={`n1-${n.id}`} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-ms-text-muted font-bold font-ms uppercase tracking-wider">
            Niche 2
          </label>
          <select
            value={niche2}
            onChange={(e) => setNiche2(e.target.value)}
            className="bg-ms-bg border border-ms-border text-white text-sm font-ms rounded px-3 py-2 focus:outline-none focus:border-ms-green w-full"
          >
            {LEGACY_NICHES.map((n) => (
              <option key={`n2-${n.id}`} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-ms-card border border-ms-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left font-ms text-ms-text-muted">
          <thead className="text-[10px] text-white uppercase bg-ms-bg/80 border-b border-ms-border">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider">Metric</th>
              <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-green w-1/3">
                {niche1}
              </th>
              <th className="px-6 py-4 font-bold tracking-wider border-l border-ms-border text-ms-yellow w-1/3">
                {niche2}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ms-border">
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Growth Trend (6Mo)
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <span className="text-ms-green font-bold">
                  +{metrics1.growth}%
                </span>
                <div className="h-16 mt-2 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics1.data}>
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#00f076"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <span className="text-ms-yellow font-bold">
                  +{metrics2.growth}%
                </span>
                <div className="h-16 mt-2 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics2.data}>
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#ffeb3b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </td>
            </tr>
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Avg MRR Potential
              </td>
              <td className="px-6 py-4 border-l border-ms-border text-white">
                ${metrics1.mrr.toLocaleString()}/mo
              </td>
              <td className="px-6 py-4 border-l border-ms-border text-white">
                ${metrics2.mrr.toLocaleString()}/mo
              </td>
            </tr>
            <tr className="hover:bg-ms-bg/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white text-xs">
                Build Complexity
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ms-green"
                      style={{ width: `${(metrics1.buildScore / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px]">{metrics1.buildScore}/10</span>
                </div>
              </td>
              <td className="px-6 py-4 border-l border-ms-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-ms-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ms-yellow"
                      style={{ width: `${(metrics2.buildScore / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px]">{metrics2.buildScore}/10</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
