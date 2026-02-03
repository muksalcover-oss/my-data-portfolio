import React, { useState } from 'react';
import { Sparkles, Activity, Loader2, AlertTriangle, CheckCircle2, Send, Bot } from 'lucide-react';
import { FinancialReportGenerator } from '@/components/dashboard/FinancialReportGenerator';
import { AIResult, Metrics } from '@/types/dashboard';

interface AnalysisTerminalProps {
    loading: boolean;
    useFallback: boolean;
    aiResult: AIResult | null;
    metrics: Metrics;
    creditScore: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

export const AnalysisTerminal: React.FC<AnalysisTerminalProps> = ({
    loading,
    useFallback,
    aiResult,
    metrics,
    creditScore
}) => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || !GROQ_API_KEY) return;

        const userMsg = chatInput;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const context = `Context Bisnis: Revenue Rp ${metrics.totalRevenue}, Profit Rp ${metrics.totalProfit}, Margin ${metrics.profitMargin}%.`;

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'Anda adalah asisten bisnis cerdas. Jawab pendek, padat, dan profesional.' },
                        { role: 'system', content: context },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini.";
                setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error koneksi ke AI." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6">
            {/* AI & Credit Hub */}
            <div className="stagger-card bg-white/5 border border-white/10 p-12 rounded-[50px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={140} className="text-emerald-500" /></div>
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 animate-pulse"><Sparkles size={24} /></div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">AI Analysis</h3>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4"><Loader2 className="animate-spin text-emerald-500" size={32} /> <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">THINKING...</p></div>
                ) : (
                    <div className="space-y-8">
                        {useFallback && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <Activity size={16} className="text-yellow-500" />
                                <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Mode Analisis Lokal Aktif</p>
                            </div>
                        )}

                        {/* AI Summary */}
                        <div className="p-6 bg-white/[0.03] rounded-[30px] border border-white/5 leading-relaxed text-slate-300 font-medium italic text-sm">
                            {aiResult?.summary || "Groq AI is analyzing patterns..."}
                        </div>

                        {/* Chat Interface - NEWLY RESTORED */}
                        <div className="bg-black/20 rounded-[30px] border border-white/5 p-6 h-[400px] flex flex-col">
                            <div className="flex items-center gap-2 mb-4 opacity-50">
                                <Bot size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Co-Pilot Chat</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                {messages.length === 0 && (
                                    <div className="text-center text-slate-600 text-xs italic mt-20">
                                        Tanyakan sesuatu tentang data Anda...<br />
                                        "Bagaimana cara menaikkan profit?"
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-emerald-500 text-[#020617] rounded-tr-sm font-bold' : 'bg-white/10 text-slate-200 rounded-tl-sm'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && <div className="flex justify-start"><div className="bg-white/10 p-4 rounded-2xl rounded-tl-sm"><Loader2 size={14} className="animate-spin text-slate-400" /></div></div>}
                            </div>

                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Ketik pertanyaan..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:bg-white/10 transition-all outline-none"
                                />
                                <button type="submit" disabled={!chatInput.trim() || chatLoading} className="absolute right-2 top-2 p-1.5 bg-emerald-500 text-[#020617] rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                                    <Send size={14} />
                                </button>
                            </form>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <FinancialReportGenerator metrics={metrics} />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                <div className="stagger-card bg-red-500/5 border border-red-500/10 p-10 rounded-[40px] relative overflow-hidden group">
                    <AlertTriangle className="absolute top-6 right-6 text-red-500/10" size={60} />
                    <h3 className="text-lg font-black text-white italic uppercase mb-8 flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Anomalies</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                        {metrics?.anomalies?.length > 0 ? metrics.anomalies.map((ano, i) => (
                            <div key={i} className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Row #{ano.row}</span> <span className="px-2 py-0.5 bg-red-500/20 rounded text-[7px] font-black text-red-500 uppercase">{ano.severity}</span></div>
                                <p className="text-xs font-bold text-red-200">{ano.issue}</p>
                                <p className="text-[9px] text-red-500/50 font-mono italic mt-1">{ano.field} → {ano.value}</p>
                            </div>
                        )) : <div className="py-20 text-center opacity-30 italic text-xs tracking-[3px]">NO CRITICAL ISSUES.</div>}
                    </div>
                </div>

                <div className="stagger-card bg-emerald-500 p-10 rounded-[40px] text-[#020617] shadow-xl relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><CheckCircle2 size={180} /></div>
                    <h3 className="text-2xl font-black italic uppercase leading-none mb-6">Strategies</h3>
                    <div className="space-y-4 relative z-10">
                        {aiResult?.recommendations ? aiResult.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 bg-black/5 rounded-2xl border border-black/5 backdrop-blur-sm">
                                <span className="bg-[#020617] text-white w-6 h-6 flex items-center justify-center rounded-lg text-[9px] font-black font-mono shrink-0">{i + 1}</span>
                                <p className="text-xs font-bold leading-tight">{rec}</p>
                            </div>
                        )) : <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 bg-black/10 rounded-xl animate-pulse" />)}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
