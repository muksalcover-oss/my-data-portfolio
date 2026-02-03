import React, { useState } from 'react';
import { Sliders, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { Metrics } from '@/types/dashboard';

interface SimulationPanelProps {
    metrics: Metrics;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({ metrics }) => {
    const [revenueGrowth, setRevenueGrowth] = useState(10);
    const [costReduction, setCostReduction] = useState(5);
    const [marketShare, setMarketShare] = useState(0);

    const simulatedRevenue = metrics.totalRevenue * (1 + revenueGrowth / 100);
    const simulatedCOGS = metrics.cogs * (1 - costReduction / 100);
    const simulatedOpEx = metrics.opex * (1 + marketShare / 100); // More share might mean more marketing spend
    const simulatedProfit = simulatedRevenue - simulatedCOGS - simulatedOpEx;
    const simulatedMargin = (simulatedProfit / simulatedRevenue) * 100;

    const profitDiff = simulatedProfit - metrics.totalProfit;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Control Panel */}
            <div className="lg:col-span-4 space-y-6">
                <div className="stagger-card bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><Sliders size={20} /></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Simulator Controls</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                <label>Revenue Growth</label>
                                <span className="text-blue-400">+{revenueGrowth}%</span>
                            </div>
                            <input
                                type="range" min="-50" max="100" value={revenueGrowth}
                                onChange={(e) => setRevenueGrowth(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                <label>Cost Reduction (COGS)</label>
                                <span className="text-emerald-400">{costReduction}%</span>
                            </div>
                            <input
                                type="range" min="-20" max="50" value={costReduction}
                                onChange={(e) => setCostReduction(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                            />
                            <p className="text-[9px] text-slate-600 italic leading-relaxed">
                                Optimasi biaya produksi/pembelian barang. Hati-hati, pengurangan ekstrem bisa menurunkan kualitas.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                <label>Market Expansion Cost</label>
                                <span className="text-yellow-400">+{marketShare}% OpEx</span>
                            </div>
                            <input
                                type="range" min="0" max="100" value={marketShare}
                                onChange={(e) => setMarketShare(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => { setRevenueGrowth(10); setCostReduction(5); setMarketShare(0); }}
                        className="mt-8 w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw size={14} /> Reset Simulation
                    </button>
                </div>
            </div>

            {/* Result Panel */}
            <div className="lg:col-span-8">
                <div className="stagger-card bg-emerald-500 p-12 rounded-[50px] relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><TrendingUp size={200} /></div>

                    <div className="relative z-10 text-[#020617]">
                        <h3 className="text-lg font-black uppercase tracking-[5px] mb-2 opacity-60">Projected Outcome</h3>
                        <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-6xl font-black italic tracking-tighter">
                                Rp {simulatedProfit.toLocaleString()}
                            </span>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${profitDiff >= 0 ? 'bg-[#020617]/10' : 'bg-red-500/20 text-red-800'}`}>
                                {profitDiff >= 0 ? '+' : ''}{profitDiff.toLocaleString()}
                                {profitDiff < 0 && <AlertTriangle size={12} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#020617]/5 p-6 rounded-3xl backdrop-blur-sm border border-[#020617]/5">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">Simulated Revenue</p>
                                <p className="text-xl font-black font-mono">Rp {simulatedRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-[#020617]/5 p-6 rounded-3xl backdrop-blur-sm border border-[#020617]/5">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">Simulated Margin</p>
                                <p className="text-xl font-black font-mono">{simulatedMargin.toFixed(2)}%</p>
                            </div>
                            <div className="bg-[#020617]/5 p-6 rounded-3xl backdrop-blur-sm border border-[#020617]/5">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">Efficiency Rating</p>
                                <p className="text-xl font-black font-mono">{simulatedMargin > 25 ? 'A+' : simulatedMargin > 15 ? 'B' : 'C'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insight */}
                <div className="mt-6 p-8 bg-white/5 border border-white/10 rounded-[40px] flex items-start gap-4 animate-in slide-in-from-bottom-2">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><RefreshCw size={20} className="animate-spin-slow" /></div>
                    <div>
                        <h4 className="text-white font-bold text-sm mb-1">AI Prediction Logic</h4>
                        <p className="text-slate-500 text-xs italic leading-relaxed">
                            Simulasi ini menggunakan model linear sederhana untuk proyeksi jangka pendek.
                            {revenueGrowth > 20 && " PERINGATAN: Pertumbuhan revenue di atas 20% mungkin memerlukan penambahan modal kerja yang signifikan."}
                            {costReduction > 10 && " PERINGATAN: Pengurangan HPP di atas 10% berisiko menurunkan kepuasan pelanggan."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
