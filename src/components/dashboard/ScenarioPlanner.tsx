'use client';

import React, { useState, useMemo } from 'react';
import { Send, Loader2, User, UserPlus, Briefcase, TrendingUp, Table2 } from 'lucide-react';

interface ScenarioPlannerProps {
    contextData: {
        totalRevenue?: number;
        totalProfit?: number;
        profitMargin?: number;
    };
}

type Persona = 'investor' | 'competitor' | 'consultant';

interface ParsedNumber {
    label: string;
    value: string;
    rawValue: number;
}

// Parse numbers from AI response text
function parseNumbersFromText(text: string): ParsedNumber[] {
    const patterns = [
        // Pattern: "Label: Rp 1.234.567" or "Label: Rp1.234.567,89"
        /([A-Za-z\s]+?):\s*Rp\s?([\d.,]+)/gi,
        // Pattern: "Label: 1.234.567" (plain number)
        /([A-Za-z\s]+?):\s*([\d.,]+)(?:\s*%)?/gi,
        // Pattern: "Label = Rp 1.234.567"
        /([A-Za-z\s]+?)\s*=\s*Rp\s?([\d.,]+)/gi,
        // Pattern: "+ Rp 1.234.567 (label)"
        /([+-])\s*Rp\s?([\d.,]+)\s*\(([^)]+)\)/gi,
    ];

    const results: ParsedNumber[] = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
            const label = match[1]?.trim() || match[3]?.trim() || 'Nilai';
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
    if (num >= 1000000000) {
        return `Rp ${(num / 1000000000).toFixed(2)}M`;
    } else if (num >= 1000000) {
        return `Rp ${(num / 1000000).toFixed(2)}Jt`;
    } else if (num >= 1000) {
        return `Rp ${(num / 1000).toFixed(0)}rb`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
}

// Clean text by removing extracted numbers for cleaner display
function cleanTextFromNumbers(text: string): string {
    // Remove markdown table syntax if any
    let cleaned = text.replace(/\|[^|]+\|/g, '');
    cleaned = cleaned.replace(/[-|]+/g, '');
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
}

export function ScenarioPlanner({ contextData }: ScenarioPlannerProps) {
    const [persona, setPersona] = useState<Persona>('consultant');
    const [input, setInput] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const presets = {
        investor: "Kritisi cashflow bisnis saya dan potensi risikonya.",
        competitor: "Bagaimana cara kamu mengalahkan bisnis saya dengan harga lebih murah?",
        consultant: "Apa dampak jika biaya operasional naik 20% bulan depan?"
    };

    // Parse numbers from result
    const parsedNumbers = useMemo(() => {
        if (!result) return [];
        return parseNumbersFromText(result);
    }, [result]);

    const handleAnalyze = async () => {
        if (!input.trim() || loading) return;
        setLoading(true);
        setResult(null);

        try {
            const systemPrompts = {
                investor: `Anda adalah "Investor Ventura Modal" yang kritis, tajam, dan tidak basa-basi. 
                   Tugas: Cari kelemahan dalam data keuangan user. Fokus pada margin tipis, cashflow, dan skalabilitas.
                   Gunakan bahasa profesional tapi intimidatif.`,
                competitor: `Anda adalah "Pesaing Bisnis Agresif" yang ingin merebut pasar user.
                     Tugas: Jelaskan strategi Anda untuk "membunuh" bisnis user. Fokus pada perang harga, promosi, dan efisiensi.
                     Gunakan bahasa yang sombong dan menantang.`,
                consultant: `Anda adalah "Konsultan Strategi". Tugas: Analisis skenario "What-If" atau proyeksi masa depan.
                     Berikan analisis logis dampaknya terhadap profit dan revenue.
                     PENTING: Sertakan perhitungan numerik dengan format "Label: Rp nilai" (contoh: Revenue Baru: Rp 12.500.000)`
            };

            const prompt = `
        ATURAN KETAT:
        1. JIKA input user mengandung kata kasar, hinaan, atau tidak relevan dengan bisnis, TOLAK dengan sopan: "Maaf, saya hanya bisa membantu analisis skenario bisnis. Silakan ajukan pertanyaan yang relevan."
        2. HANYA bahas topik bisnis, keuangan, dan strategi.
        3. Sertakan perhitungan numerik dengan format: "Label: Rp nilai" agar sistem dapat menampilkan tabel otomatis.
        
        CONTEXT DATA:
        Revenue: Rp ${contextData?.totalRevenue?.toLocaleString() || 0}
        Profit: Rp ${contextData?.totalProfit?.toLocaleString() || 0}
        Margin: ${contextData?.profitMargin?.toFixed(2) || 0}%
        
        USER SCENARIO/QUESTION: "${input}"
        
        JAWABLAH SEBAGAI ${persona.toUpperCase()} sesuai instruksi: ${systemPrompts[persona]}
      `;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: prompt }],
                    temperature: 0.8,
                    max_tokens: 600
                })
            });

            const data = await response.json();
            setResult(data.choices[0].message.content);
        } catch {
            setResult("Gagal melakukan simulasi. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <Briefcase size={120} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" /> Scenario Simulator
                </h3>

                {/* Persona Selector */}
                <div className="flex bg-black/20 p-1 rounded-2xl mb-6 overflow-x-auto">
                    {(['consultant', 'investor', 'competitor'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => { setPersona(p); setInput(presets[p]); setResult(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${persona === p
                                ? 'bg-emerald-500 text-[#020617] shadow-lg shadow-emerald-500/20'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {p === 'investor' && <Briefcase size={14} />}
                            {p === 'competitor' && <UserPlus size={14} />}
                            {p === 'consultant' && <User size={14} />}
                            {p === 'consultant' ? 'What-If Helper' : p} Mode
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div className="space-y-4">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 outline-none h-24 resize-none"
                        placeholder="Ketik skenario atau pertanyaan simulasi di sini..."
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !input.trim()}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#020617] rounded-xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> START SIMULATION</>}
                    </button>
                </div>

                {/* Result Area */}
                {result && (
                    <div className={`mt-6 rounded-2xl border animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${persona === 'investor' ? 'bg-red-500/10 border-red-500/20' :
                        persona === 'competitor' ? 'bg-purple-500/10 border-purple-500/20' :
                            'bg-emerald-500/10 border-emerald-500/20'
                        }`}>

                        {/* Header */}
                        <div className={`flex items-center gap-2 px-6 py-3 border-b ${persona === 'investor' ? 'border-red-500/20 bg-red-500/5' :
                            persona === 'competitor' ? 'border-purple-500/20 bg-purple-500/5' :
                                'border-emerald-500/20 bg-emerald-500/5'
                            }`}>
                            {persona === 'investor' && <Briefcase size={14} />}
                            {persona === 'competitor' && <UserPlus size={14} />}
                            {persona === 'consultant' && <TrendingUp size={14} />}
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">AI Analysis Result</span>
                        </div>

                        {/* Auto-generated Table for Numbers */}
                        {parsedNumbers.length > 0 && (
                            <div className="px-6 py-4 border-b border-white/5">
                                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                    <Table2 size={12} /> Data Numerik (Auto-Parsed)
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Metrik</th>
                                                <th className="text-right py-2 px-3 font-bold text-slate-400 uppercase tracking-wider">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedNumbers.map((num, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="py-2 px-3 text-slate-300">{num.label}</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{num.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Text Response */}
                        <div className={`px-6 py-4 text-sm leading-relaxed ${persona === 'investor' ? 'text-red-100' :
                            persona === 'competitor' ? 'text-purple-100' : 'text-emerald-100'
                            }`}>
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
