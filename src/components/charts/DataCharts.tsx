"use client"

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DataChart({ data, title }: any) {
  if (!data) return <div className="h-[350px] bg-slate-100 rounded-2xl animate-pulse" />;

  return (
    <div className="w-full space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Analytical Output</h3>
          <p className="text-xl font-bold tracking-tight">{title}</p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <div className="w-2 h-2 rounded-full bg-black/10" />
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity={1} />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity={1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
            />
            <Tooltip
              cursor={{fill: '#f1f5f9', radius: 10}}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {payload[0].payload.label}
                      </p>
                      <p className="text-2xl font-black text-blue-700">
                        {payload[0].value}%
                      </p>
                      <p className="text-[10px] font-bold text-slate-600 mt-2 bg-slate-100 px-2 py-1 rounded inline-block">
                        STATUS: {payload[0].payload.status}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={45}>
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 80 ? "url(#barGradient)" : "#E2E8F0"}
                  className="transition-all duration-700 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4 pt-8 border-t border-black/5">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="space-y-1">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.label}</p>
            <p className="text-sm font-bold text-slate-800">{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}