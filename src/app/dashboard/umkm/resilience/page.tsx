'use client';

import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import {
    ShieldAlert,
    Droplets,
    TrendingUp,
    AlertTriangle,
    Info
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function ResiliencePage() {
    const [cashOnHand, setCashOnHand] = useState(50_000_000);
    const [monthlyRevenue, setMonthlyRevenue] = useState(25_000_000);
    const [monthlyExpense, setMonthlyExpense] = useState(18_000_000);

    // Scenarios
    const [floodDays, setFloodDays] = useState(0); // 0 - 30 days
    const [costIncrease, setCostIncrease] = useState(0); // 0 - 50%

    const simulationData = useMemo(() => {
        const months = ['Bulan 1', 'Bulan 2', 'Bulan 3', 'Bulan 4', 'Bulan 5', 'Bulan 6'];
        const baselineSeries = [];
        const shockSeries = [];

        let currentCashBaseline = cashOnHand;
        let currentCashShock = cashOnHand;

        // Daily revenue calculation
        const dailyRevenue = monthlyRevenue / 30;

        for (let i = 0; i < 6; i++) {
            // Baseline (Normal)
            currentCashBaseline += (monthlyRevenue - monthlyExpense);
            baselineSeries.push(currentCashBaseline);

            // Shock (Only affects Month 1 for flood, Permanent for cost)
            let revenueThisMonth = monthlyRevenue;
            const expenseThisMonth = monthlyExpense * (1 + costIncrease / 100);

            if (i === 0) {
                // Flood happens in Month 1
                const lostRevenue = dailyRevenue * floodDays;
                revenueThisMonth -= lostRevenue;
            }

            currentCashShock += (revenueThisMonth - expenseThisMonth);
            shockSeries.push(currentCashShock);
        }

        // Determine survival
        const runwayMonth = shockSeries.findIndex(cash => cash < 0);
        const isBankrupt = runwayMonth !== -1;

        return {
            labels: months,
            datasets: [
                {
                    label: 'Skenario Normal',
                    data: baselineSeries,
                    borderColor: '#10b981', // Emerald 500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Skenario Krisis',
                    data: shockSeries,
                    borderColor: '#ef4444', // Red 500
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                }
            ],
            isBankrupt,
            runwayMonth
        };
    }, [cashOnHand, monthlyRevenue, monthlyExpense, floodDays, costIncrease]);

    const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    <ShieldAlert className="text-blue-500" size={32} />
                    Climate-Resilient Business
                </h1>
                <p className="text-slate-400">
                    Simulasikan guncangan eksternal untuk menguji ketahanan cashflow Anda.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Base Data */}
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-sm">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-400" /> Data Keuangan
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase">Kas Saat Ini</label>
                                <input type="number" value={cashOnHand} onChange={(e) => setCashOnHand(Number(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase">Pendapatan / Bulan</label>
                                <input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase">Pengeluaran / Bulan</label>
                                <input type="number" value={monthlyExpense} onChange={(e) => setMonthlyExpense(Number(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Scenarios */}
                    <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl backdrop-blur-sm">
                        <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} /> Skenario Bencana
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white flex items-center gap-2"><Droplets size={14} className="text-blue-400" /> Banjir (Stop Operasi)</span>
                                    <span className="font-bold text-blue-400">{floodDays} Hari</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={floodDays}
                                    onChange={(e) => setFloodDays(Number(e.target.value))}
                                    className="w-full h-2 bg-blue-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white flex items-center gap-2"><TrendingUp size={14} className="text-red-400" /> Inflasi Bahan Baku</span>
                                    <span className="font-bold text-red-400">+{costIncrease}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={costIncrease}
                                    onChange={(e) => setCostIncrease(Number(e.target.value))}
                                    className="w-full h-2 bg-red-950 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-sm h-[400px]">
                        <Line
                            data={{ labels: simulationData.labels, datasets: simulationData.datasets }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                scales: {
                                    y: {
                                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                        ticks: { color: '#94a3b8' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8' }
                                    }
                                },
                                plugins: {
                                    legend: { labels: { color: '#e2e8f0' } }
                                }
                            }}
                        />
                    </div>

                    {/* Insight Alert */}
                    {simulationData.isBankrupt ? (
                        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4 animate-pulse">
                            <AlertTriangle className="text-red-500 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-red-400 text-lg">Bahaya! Kas akan habis dalam {simulationData.runwayMonth + 1} bulan.</h4>
                                <p className="text-red-300 text-sm mt-1">
                                    Skenario ini terlalu berat untuk struktur keuangan Anda saat ini. Pertimbangkan untuk menyiapkan Dana Darurat minimal {formatIDR(monthlyExpense * 3)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-4">
                            <ShieldAlert className="text-emerald-500 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-emerald-400 text-lg">Bisnis Anda Tangguh!</h4>
                                <p className="text-emerald-300 text-sm mt-1">
                                    Meskipun terkena dampak, Anda masih memiliki cadangan kas positif hingga 6 bulan ke depan. Pertahankan rasio ini.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
