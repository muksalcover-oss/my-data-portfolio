'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert,
    CloudRain,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    Cpu,
    Target
} from 'lucide-react';

/**
 * STRESS TEST SIMULATOR - EMERGENCY TERMINAL
 * Desain ulang dengan Mission Critical Cards dan Survival Time Terminal.
 */

export default function ResiliencePage() {
    const [loading, setLoading] = useState(true);
    const [scenario, setScenario] = useState<'none' | 'logistics' | 'inflation' | 'blackout'>('none');

    // Financial Parameters
    const [cashOnHand, setCashOnHand] = useState(50000000);
    const [monthlyRevenue, setMonthlyRevenue] = useState(25000000);
    const [monthlyExpense, setMonthlyExpense] = useState(18000000);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Calculate survival days based on scenario
    const survivalAnalysis = useMemo(() => {
        let impactMultiplier = 1;
        let revenueReduction = 0;
        let expenseIncrease = 0;

        switch (scenario) {
            case 'logistics':
                revenueReduction = 0.6; // 60% revenue loss
                expenseIncrease = 0.1; // 10% expense increase
                break;
            case 'inflation':
                revenueReduction = 0.1;
                expenseIncrease = 0.4; // 40% expense increase
                break;
            case 'blackout':
                revenueReduction = 0.85; // 85% revenue loss
                expenseIncrease = 0.05;
                break;
            default:
                return { survivalDays: 999, isCritical: false };
        }

        const adjustedRevenue = monthlyRevenue * (1 - revenueReduction);
        const adjustedExpense = monthlyExpense * (1 + expenseIncrease);
        const dailyBurn = (adjustedExpense - adjustedRevenue) / 30;

        if (dailyBurn <= 0) return { survivalDays: 999, isCritical: false };

        const survivalDays = Math.max(0, Math.floor(cashOnHand / dailyBurn));
        return { survivalDays, isCritical: survivalDays < 30 };
    }, [scenario, cashOnHand, monthlyRevenue, monthlyExpense]);

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <Cpu className="text-red-500 animate-spin" size={48} />
                <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse rounded-full" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[8px] text-red-500/60 leading-none">Initializing Stress Test</p>
                <p className="text-[8px] font-mono text-slate-700 uppercase">Risk_Engine_Sync: ACTIVE</p>
            </div>
        </div>
    );

    const scenarios = [
        { id: 'logistics' as const, label: 'Disrupsi Logistik', icon: CloudRain, color: 'text-blue-400', desc: 'Arus kas terhenti akibat keterlambatan supply chain regional.' },
        { id: 'inflation' as const, label: 'Hiper-Inflasi Baku', icon: TrendingUp, color: 'text-yellow-400', desc: 'Lonjakan harga vendor 40% menekan profit margin bersih.' },
        { id: 'blackout' as const, label: 'Shutdown Regional', icon: ShieldAlert, color: 'text-red-400', desc: 'Penurunan drastis traffic transaksi fisik hingga 85%.' }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10 font-sans selection:bg-red-500/30 overflow-x-hidden relative">
            {/* Background Cyber-Aura */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-500 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 blur-[150px] rounded-full opacity-50" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                {/* Header */}
                <div className="mb-8 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <Target className="text-red-500" size={18} />
                        </div>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[4px]">Intel-Module: STRESS_TEST</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                        Global <span className="text-red-500">Resilience</span> Terminal
                    </h1>
                    <p className="text-slate-500 text-xs italic mt-3 font-medium">Simulasikan guncangan eksternal untuk menguji ketahanan cashflow bisnis Anda.</p>
                </div>

                {/* Financial Parameters */}
                <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px] mb-8 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={14} /> Financial Base Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'Kas Saat Ini', val: cashOnHand, set: setCashOnHand, max: 200000000, color: 'accent-emerald-500' },
                            { label: 'Revenue / Bulan', val: monthlyRevenue, set: setMonthlyRevenue, max: 100000000, color: 'accent-blue-500' },
                            { label: 'Expense / Bulan', val: monthlyExpense, set: setMonthlyExpense, max: 80000000, color: 'accent-red-500' }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.label}</label>
                                    <span className="font-mono text-white font-bold text-sm bg-white/5 px-3 py-1 rounded-xl border border-white/5">Rp {item.val.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range" min="0" max={item.max} step={1000000}
                                    value={item.val} onChange={(e) => item.set(Number(e.target.value))}
                                    className={`w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer ${item.color}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scenario Selector */}
                <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] backdrop-blur-3xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldAlert size={180} className="text-red-500" /></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Select Crisis Scenario</h2>
                            </div>
                            <p className="text-slate-600 text-[9px] font-mono uppercase tracking-[5px]">Core_Environment: Stress_Test_v1.2</p>
                        </div>
                        <div className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[9px] font-black uppercase tracking-widest italic">
                            Real-time risk projection active
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {scenarios.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setScenario(s.id)}
                                className={`p-10 rounded-[40px] border transition-all text-left group/card relative overflow-hidden ${scenario === s.id
                                        ? 'bg-white/10 border-white/30 scale-[1.03] shadow-2xl'
                                        : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                                    }`}
                            >
                                <div className={`p-5 rounded-2xl w-fit mb-8 transition-transform group-hover/card:scale-110 ${scenario === s.id ? 'bg-emerald-500 text-[#020617]' : 'bg-white/5 text-slate-400'}`}>
                                    <s.icon size={26} />
                                </div>
                                <p className="text-lg font-black text-white mb-3 uppercase italic tracking-tighter leading-none">{s.label}</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic font-medium">{s.desc}</p>
                                {scenario === s.id && <div className="absolute top-6 right-6 bg-emerald-500 w-2 h-2 rounded-full shadow-[0_0_15px_#10b981]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result - Emergency Terminal */}
                {scenario !== 'none' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="lg:col-span-8 bg-red-500/5 border border-red-500/20 p-12 rounded-[45px] flex flex-col md:flex-row items-center justify-between group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.03] to-transparent animate-pulse" />
                            <div className="flex gap-10 items-center relative z-10 mb-8 md:mb-0">
                                <div className="w-28 h-28 rounded-[35px] bg-red-500 flex items-center justify-center text-[#020617] shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                                    <AlertTriangle size={52} />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                                        {survivalAnalysis.isCritical ? 'Critical' : 'Warning'}<br /> Exposure!
                                    </h3>
                                    <p className="text-red-400/80 text-xs font-bold uppercase tracking-widest italic">Survival_Time Window:</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right relative z-10">
                                <p className="text-9xl font-black text-white italic tracking-tighter leading-none">
                                    {survivalAnalysis.survivalDays > 365 ? '∞' : survivalAnalysis.survivalDays}
                                    <span className="text-2xl uppercase tracking-[12px] ml-2">Hari</span>
                                </p>
                                <div className="mt-6 flex items-center justify-center md:justify-end gap-3 text-red-500">
                                    <ArrowUpRight size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Execute Op-Ex Cut Immediately</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 p-12 rounded-[45px] backdrop-blur-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu size={100} /></div>
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[4px] mb-10 italic">Neural Recommendation</h4>
                            <div className="space-y-6">
                                {[
                                    { label: 'Asset Liquidation', msg: 'Konversi stok non-esensial ke aset likuid segera.' },
                                    { label: 'Debt Restructure', msg: 'Negosiasi grace period cicilan minimal 3 bulan.' },
                                    { label: 'Buffer Activation', msg: 'Aktifkan emergency cash reserve layer_02.' }
                                ].map((rec, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{rec.label}</p>
                                        <div className="flex gap-4 items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/10 mt-1.5 group-hover:bg-emerald-500 transition-colors shadow-[0_0_10px_#10b981]" />
                                            <p className="text-[11px] text-slate-500 group-hover:text-slate-200 transition-colors italic leading-relaxed">{rec.msg}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
