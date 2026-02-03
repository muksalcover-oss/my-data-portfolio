'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Sparkles, Layout, BarChart3, List, PieChart, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { FinancialReportGenerator } from './FinancialReportGenerator';

interface SplitViewIntelligenceProps {
    contextData: {
        totalRevenue: number;
        totalProfit: number;
        profitMargin: number;
        transactionCount: number;
        anomalies: { row: number; field: string; value: number; issue: string; severity: string }[];
        confidence: number;
        quality: number;
        cogs: number;
        opex: number;
    };
    aiResult?: {
        summary: string;
        recommendations: string[];
    };
    creditScore: number;
    useFallback: boolean;
    loading: boolean;
}

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

interface CanvasData {
    title: string;
    table: Record<string, string | number>[];
    chart: { name: string; value: number }[];
}

interface ParsedNumber {
    label: string;
    value: string;
    rawValue: number;
}

// Parse numbers from AI response for table
function parseNumbersFromText(text: string): ParsedNumber[] {
    const patterns = [
        /([A-Za-z\s]+?):\s*Rp\s?([\d.,]+)/gi,
        /([A-Za-z\s]+?):\s*([\d.,]+)(?:\s*%)?/gi,
    ];

    const results: ParsedNumber[] = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
            const label = match[1]?.trim() || 'Nilai';
            const valueStr = match[2]?.replace(/\./g, '').replace(',', '.') || '0';
            const rawValue = parseFloat(valueStr);

            if (!isNaN(rawValue) && rawValue !== 0 && !seen.has(label.toLowerCase())) {
                seen.add(label.toLowerCase());
                results.push({
                    label: label.charAt(0).toUpperCase() + label.slice(1),
                    value: formatCurrency(rawValue),
                    rawValue
                });
            }
        }
    }

    return results;
}

function formatCurrency(num: number): string {
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(2)}M`;
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(2)}Jt`;
    if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
    return `Rp ${num.toLocaleString('id-ID')}`;
}

export function SplitViewIntelligence({
    contextData,
    aiResult,
    creditScore,
    useFallback,
    loading
}: SplitViewIntelligenceProps) {
    const [chatInput, setChatInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: 'ai', text: `Sistem presisi aktif. Revenue Rp ${contextData.totalRevenue.toLocaleString()}, Profit Margin ${contextData.profitMargin.toFixed(2)}%. Mau gue analisis apa?` }
    ]);
    const [canvasData, setCanvasData] = useState<CanvasData>({
        title: 'Precision Snapshot',
        table: [],
        chart: []
    });
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Initialize canvas with metrics data
    useEffect(() => {
        setCanvasData({
            title: 'Financial Overview',
            table: [
                { Metrik: 'Total Revenue', Nilai: `Rp ${contextData.totalRevenue.toLocaleString()}` },
                { Metrik: 'Total Profit', Nilai: `Rp ${contextData.totalProfit.toLocaleString()}` },
                { Metrik: 'Profit Margin', Nilai: `${contextData.profitMargin.toFixed(2)}%` },
                { Metrik: 'COGS', Nilai: `Rp ${contextData.cogs.toLocaleString()}` },
                { Metrik: 'Operating Expense', Nilai: `Rp ${contextData.opex.toLocaleString()}` },
            ],
            chart: [
                { name: 'Revenue', value: contextData.totalRevenue },
                { name: 'Profit', value: contextData.totalProfit },
                { name: 'COGS', value: contextData.cogs },
                { name: 'OpEx', value: contextData.opex },
            ]
        });
    }, [contextData]);

    const callArdiAI = async (prompt: string) => {
        setIsAiThinking(true);
        try {
            const systemInstruction = `Anda adalah Ardi AI, analis bisnis senior Indonesia. Berikan respon teks singkat dan to the point.
            Jika ada perhitungan numerik, gunakan format "Label: Rp nilai" agar sistem bisa parse otomatis.
            DATA CONTEXT: Revenue Rp ${contextData.totalRevenue.toLocaleString()}, Profit Rp ${contextData.totalProfit.toLocaleString()}, Margin ${contextData.profitMargin.toFixed(2)}%, Transaksi ${contextData.transactionCount}.`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemInstruction },
                        ...chatHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiText = data.choices?.[0]?.message?.content || 'Maaf, terjadi kesalahan.';
                setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);

                // Parse numbers and update canvas table
                const parsedNumbers = parseNumbersFromText(aiText);
                if (parsedNumbers.length > 0) {
                    setCanvasData(prev => ({
                        ...prev,
                        title: 'AI Analysis Result',
                        table: parsedNumbers.map(n => ({ Metrik: n.label, Nilai: n.value })),
                        chart: parsedNumbers.map(n => ({ name: n.label, value: n.rawValue }))
                    }));
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'ai', text: 'Koneksi bermasalah. Coba lagi.' }]);
            }
        } catch {
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Neural brain sedang sinkronisasi. Coba lagi.' }]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isAiThinking) return;
        const msg = chatInput;
        setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
        setChatInput('');
        callArdiAI(msg);
    };

    const maxChartValue = Math.max(...(canvasData.chart?.map(x => x.value) || [1]));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[750px] animate-in slide-in-from-bottom-6 duration-700">

            {/* PANEL KIRI: AI CHAT (Teks Saja) */}
            <div className="lg:col-span-4 bg-[#030816] border border-white/10 rounded-[45px] flex flex-col overflow-hidden relative shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-emerald-500" size={18} />
                        <h3 className="text-xs font-black uppercase tracking-[4px] italic">Ardi Intel Hub</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-emerald-500/60 tracking-widest">ACTIVE</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {chatHistory.map((chat, i) => (
                        <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed ${chat.role === 'user'
                                    ? 'bg-emerald-500 text-[#020617] font-bold rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                                }`}>
                                <p className="italic">{chat.text}</p>
                            </div>
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none animate-pulse">
                                <Loader2 className="animate-spin text-emerald-500" size={14} />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleChatSubmit} className="p-6 bg-[#030816] border-t border-white/5">
                    <div className="relative group">
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Instruksikan AI analis..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-14 text-xs focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 italic"
                        />
                        <button type="submit" disabled={isAiThinking} className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500 text-[#020617] p-2.5 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>

            {/* PANEL KANAN: DYNAMIC CANVAS (Tabel & Chart) */}
            <div className="lg:col-span-8 space-y-6 flex flex-col">

                {/* Bagian Tabel Data */}
                <div className="flex-[3] bg-white/5 border border-white/10 rounded-[45px] p-8 flex flex-col backdrop-blur-3xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <List size={100} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{canvasData.title}</h4>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[3px] mt-2 italic">Dataset Projection Terminal</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-500">
                            <Layout size={18} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto rounded-3xl border border-white/5 bg-black/20 scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#030816] z-20">
                                <tr>
                                    {canvasData.table && canvasData.table.length > 0 && Object.keys(canvasData.table[0]).map(h => (
                                        <th key={h} className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-[11px]">
                                {canvasData.table && canvasData.table.length > 0 ? canvasData.table.map((row, i) => (
                                    <tr key={i} className="hover:bg-emerald-500/[0.03] transition-colors group/row">
                                        {Object.values(row).map((v, j) => (
                                            <td key={j} className="p-5 font-mono font-medium text-slate-400 border-b border-white/5 group-hover/row:text-emerald-400 transition-colors italic">{String(v)}</td>
                                        ))}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-32 text-center text-slate-700 italic text-sm tracking-[5px] uppercase opacity-30">
                                            Awaiting AI pattern projections...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bagian Chart AI */}
                <div className="flex-[2] bg-white/5 border border-white/10 rounded-[45px] p-8 flex flex-col relative overflow-hidden backdrop-blur-md">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="text-emerald-500" size={16} />
                            <h5 className="text-[10px] font-black uppercase tracking-[3px] italic">Visual Distribution Profile</h5>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 rounded text-[8px] font-black text-emerald-500 border border-emerald-500/20">AGENT_VIZ_ACTIVE</div>
                    </div>

                    <div className="flex-1 flex items-end gap-5 px-6 pb-4">
                        {canvasData.chart && canvasData.chart.length > 0 ? canvasData.chart.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="text-[8px] font-black text-emerald-400 mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    {d.value.toLocaleString()}
                                </div>
                                <div
                                    className="w-full bg-emerald-500/10 border-t-2 border-emerald-500/40 rounded-t-2xl hover:bg-emerald-500/30 transition-all duration-700 relative shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                                    style={{ height: `${Math.min(100, (d.value / maxChartValue) * 100)}%`, minHeight: '20px' }}
                                />
                                <div className="mt-5 text-[8px] font-black text-slate-600 uppercase tracking-tighter rotate-[-25deg] origin-center whitespace-nowrap italic">{d.name}</div>
                            </div>
                        )) : (
                            <div className="w-full flex flex-col items-center justify-center opacity-10 gap-4">
                                <PieChart size={48} />
                                <p className="text-[10px] font-black uppercase tracking-[10px] italic">No visual data mapped</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    <FinancialReportGenerator metrics={contextData} />
                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Credit Score</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400 italic">{creditScore}</span>
                    </div>
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Anomalies</span>
                        </div>
                        <span className="text-xl font-black text-red-400 italic">{contextData.anomalies?.length || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
