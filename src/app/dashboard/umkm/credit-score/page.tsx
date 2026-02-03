'use client';

import { useState, useEffect } from 'react';
import {
    Target,
    DollarSign,
    Activity,
    TrendingUp,
    Scale,
    FileText,
    Cpu
} from 'lucide-react';
import { calculateCreditScore, generateCreditPDF, BusinessData, CreditScoreResult } from '@/lib/credit-scoring';

/**
 * FINANCIAL BRIDGE - PRECISION COMMAND CENTER
 * Desain ulang dengan Radial Precision Gauge dan Cyber-Intel aesthetic.
 */

export default function CreditScorePage() {
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState(75000000);
    const [debt, setDebt] = useState(15000000);
    const [cash, setCash] = useState(40000000);
    const [expense, setExpense] = useState(45000000);
    const [businessAge, setBusinessAge] = useState(24);
    const [result, setResult] = useState<CreditScoreResult | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Auto-calculate on parameter change
    useEffect(() => {
        const formData: BusinessData = {
            monthlyRevenue: revenue,
            monthlyExpense: expense,
            debt: debt,
            businessAgeMonths: businessAge,
            sector: 'F&B (Kuliner)'
        };
        const res = calculateCreditScore(formData);
        setResult(res);
    }, [revenue, debt, cash, expense, businessAge]);

    const handleDownload = () => {
        if (!result) return;
        const formData: BusinessData = {
            monthlyRevenue: revenue,
            monthlyExpense: expense,
            debt: debt,
            businessAgeMonths: businessAge,
            sector: 'F&B (Kuliner)'
        };
        generateCreditPDF('UMKM Anda', formData, result);
    };

    // Credit Score Display
    const creditScore = result?.score || 0;
    const scoreStatus = creditScore > 750 ? 'ELITE' : creditScore > 600 ? 'STABLE' : 'HIGH_RISK';
    const scoreColor = creditScore > 750 ? 'text-emerald-500' : creditScore > 600 ? 'text-yellow-500' : 'text-red-500';
    const scoreBg = creditScore > 750 ? 'bg-emerald-500/10' : creditScore > 600 ? 'bg-yellow-500/10' : 'bg-red-500/10';

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <Cpu className="text-emerald-500 animate-spin" size={48} />
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[8px] text-emerald-500/60 leading-none">Initializing Financial Bridge</p>
                <p className="text-[8px] font-mono text-slate-700 uppercase">Neural_Credit_Sync: ACTIVE</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
            {/* Background Cyber-Aura */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 blur-[150px] rounded-full opacity-50" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Target className="text-emerald-500" size={18} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[4px]">Intel-Module: CREDIT_SCORE</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                        Financial <span className="text-emerald-500">Bridge</span>
                    </h1>
                    <p className="text-slate-500 text-xs italic mt-3 font-medium">Ubah data cashflow menjadi dokumen kelayakan kredit standar bank.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Control Panel */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[45px] backdrop-blur-3xl relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700"><DollarSign size={150} /></div>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[4px] mb-12 flex items-center gap-3">
                                <Activity className="text-emerald-500" size={14} /> Neural Parameter Input
                            </h3>

                            <div className="space-y-12">
                                {[
                                    { label: 'Pendapatan Bulanan', val: revenue, set: setRevenue, max: 200000000, step: 1000000, color: 'accent-emerald-500' },
                                    { label: 'Total Cicilan/Utang', val: debt, set: setDebt, max: 100000000, step: 500000, color: 'accent-red-500' },
                                    { label: 'Cadangan Kas Aktif', val: cash, set: setCash, max: 100000000, step: 1000000, color: 'accent-blue-500' },
                                    { label: 'Pengeluaran Bulanan', val: expense, set: setExpense, max: 150000000, step: 1000000, color: 'accent-yellow-500' }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.label}</label>
                                            <span className="font-mono text-white font-bold text-sm bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">Rp {item.val.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max={item.max} step={item.step}
                                            value={item.val} onChange={(e) => item.set(Number(e.target.value))}
                                            className={`w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer ${item.color}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/5 p-8 rounded-[35px] flex items-center gap-5 group hover:bg-white/[0.08] transition-all">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Growth Index</p>
                                    <p className="text-lg font-black text-white italic">+{((revenue - expense) / revenue * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-8 rounded-[35px] flex items-center gap-5 group hover:bg-white/[0.08] transition-all">
                                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform"><Scale size={24} /></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">DTI Analysis</p>
                                    <p className="text-lg font-black text-white italic">{Math.round((debt / revenue) * 100)}% <span className="text-[10px] text-slate-500 uppercase not-italic ml-2">Ratio</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Gauge */}
                    <div className="lg:col-span-5 bg-emerald-500 p-[2px] rounded-[45px] shadow-[0_0_40px_rgba(16,185,129,0.15)] group relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#020617] m-[1px] rounded-[44px] flex flex-col items-center justify-center p-12 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            {/* Gauge SVG */}
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <circle cx="128" cy="128" r="112" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                                    <circle
                                        cx="128" cy="128" r="112"
                                        stroke="currentColor" strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={703}
                                        strokeDashoffset={703 - (703 * (creditScore / 850))}
                                        className={`${scoreColor} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-8xl font-black italic tracking-tighter text-white leading-none">{creditScore}</span>
                                    <div className={`mt-3 px-4 py-1 rounded-full ${scoreBg} border border-current`}>
                                        <span className={`text-[10px] font-black uppercase tracking-[4px] ${scoreColor}`}>{scoreStatus}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-3 relative z-10">
                                <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Inclusion Index Terminal</h4>
                                <p className="text-slate-500 text-[11px] leading-relaxed max-w-[220px] mx-auto italic font-medium">
                                    {result?.recommendation || 'Masukkan parameter untuk melihat rekomendasi AI.'}
                                </p>
                                <p className="text-xs text-white font-bold">Limit Kredit: <span className="text-emerald-400">Rp {(result?.maxLoanLimit || 0).toLocaleString()}</span></p>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full mt-12 py-5 bg-emerald-500 text-[#020617] font-black rounded-[22px] uppercase text-[10px] tracking-[4px] hover:bg-emerald-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(16,185,129,0.2)]"
                            >
                                <FileText size={16} /> DOWNLOAD FINANCIAL PASSPORT
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
