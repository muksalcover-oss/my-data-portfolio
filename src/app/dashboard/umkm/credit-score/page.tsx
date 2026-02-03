'use client';

import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
    Building2,
    Banknote,
    Calendar,
    Wallet,
    ArrowRight,
    Download,
    AlertCircle
} from 'lucide-react';
import { calculateCreditScore, generateCreditPDF, formatCurrency, BusinessData, CreditScoreResult } from '@/lib/credit-scoring';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CreditScorePage() {
    const [formData, setFormData] = useState<BusinessData>({
        monthlyRevenue: 15_000_000,
        monthlyExpense: 8_000_000,
        debt: 0,
        businessAgeMonths: 24,
        sector: 'F&B (Kuliner)'
    });

    const [result, setResult] = useState<CreditScoreResult | null>(null);

    const handleCalculate = () => {
        const res = calculateCreditScore(formData);
        setResult(res);
    };

    const handleDownload = () => {
        if (!result) return;
        generateCreditPDF('UMKM Anda', formData, result);
    };

    // Chart Config
    const chartData = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                data: [result ? result.score : 0, 850 - (result ? result.score : 0)],
                backgroundColor: [
                    '#10b981', // Emerald 500
                    '#1e293b', // Slate 800
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
            },
        ],
    };

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    <Banknote className="text-emerald-500" size={32} />
                    Financial Inclusion Bridge
                </h1>
                <p className="text-slate-400">
                    Ubah data cashflow Anda menjadi dokumen kelayakan kredit standar bank.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* INPUT SECTION */}
                <div className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-emerald-400" /> Profil Keuangan Bisnis
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sektor Bisnis</label>
                            <select
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                value={formData.sector}
                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                            >
                                <option>F&B (Kuliner)</option>
                                <option>Retail / Toko</option>
                                <option>Jasa</option>
                                <option>Pertanian</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendapatan Bulanan (Rata-rata)</label>
                            <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 focus-within:border-emerald-500 transition-colors">
                                <span className="text-slate-500">Rp</span>
                                <input
                                    type="number"
                                    className="w-full bg-transparent p-3 text-white outline-none"
                                    value={formData.monthlyRevenue}
                                    onChange={(e) => setFormData({ ...formData, monthlyRevenue: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pengeluaran Bulanan</label>
                            <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 focus-within:border-emerald-500 transition-colors">
                                <span className="text-slate-500">Rp</span>
                                <input
                                    type="number"
                                    className="w-full bg-transparent p-3 text-white outline-none"
                                    value={formData.monthlyExpense}
                                    onChange={(e) => setFormData({ ...formData, monthlyExpense: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Utang</label>
                                <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3">
                                    <span className="text-slate-500 text-xs">Rp</span>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent p-3 text-white outline-none"
                                        value={formData.debt}
                                        onChange={(e) => setFormData({ ...formData, debt: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Umur Bisnis</label>
                                <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl px-3">
                                    <input
                                        type="number"
                                        className="w-full bg-transparent p-3 text-white outline-none"
                                        value={formData.businessAgeMonths}
                                        onChange={(e) => setFormData({ ...formData, businessAgeMonths: Number(e.target.value) })}
                                    />
                                    <span className="text-slate-500 text-xs">Bln</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            Analisis Sekarang <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* OUTPUT SECTION */}
                <div className="space-y-6">
                    {/* Card Result */}
                    <div className={`relative p-8 rounded-3xl border transition-all duration-500 overflow-hidden ${result ? 'bg-white text-slate-900 border-white shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-slate-400'}`}>

                        {!result && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                                <AlertCircle size={40} className="mb-2 opacity-50" />
                                <p>Masukkan data untuk melihat skor</p>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold opacity-70">Skor Kesehatan Bisnis</h3>
                                <div className="text-5xl font-black tracking-tighter mt-2">{result?.score || '000'}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold text-white ${result?.riskLevel === 'Low' ? 'bg-emerald-500' : result?.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                GRADE {result?.grade || '-'}
                            </div>
                        </div>

                        {/* Gauge Chart Wrapper */}
                        <div className="h-40 w-40 mx-auto relative mb-6">
                            <Doughnut data={chartData} options={{ cutout: '80%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
                            <div className="absolute inset-0 flex items-center justify-center pt-8 font-black text-xl">
                                {result?.riskLevel || '-'} Risk
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-dashed border-slate-300 pt-4 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium opacity-70">Limit Kredit Maksimal</span>
                                <span className="font-bold text-xl">{formatCurrency(result?.maxLoanLimit || 0)}</span>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-xl text-sm leading-snug">
                                <span className="font-bold">Saran AI:</span> {result?.recommendation}
                            </div>
                        </div>
                    </div>

                    {/* Download Button */}
                    <button
                        disabled={!result}
                        onClick={handleDownload}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} /> Unduh Sertifikat (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
}
