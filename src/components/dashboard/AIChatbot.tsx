'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Loader2, Bot, User } from 'lucide-react';

interface AIChatbotProps {
    contextData: {
        totalRevenue?: number;
        totalProfit?: number;
        profitMargin?: number;
        transactionCount?: number;
        anomalies?: unknown[];
    };
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function AIChatbot({ contextData }: AIChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Halo! Saya Ardi, asisten bisnis AI kamu. Ada yang bisa saya bantu analisis dari data kamu?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Construct system prompt with data context
            const systemPrompt = `
        Anda adalah "Ardi", konsultan bisnis AI profesional untuk UMKM.
        
        DATA BISNIS SAAT INI (Live Context):
        - Total Revenue: Rp ${contextData?.totalRevenue?.toLocaleString() || 0}
        - Total Profit: Rp ${contextData?.totalProfit?.toLocaleString() || 0}
        - Margin: ${contextData?.profitMargin?.toFixed(2) || 0}%
        - Transaksi: ${contextData?.transactionCount || 0}
        - Anomali: ${contextData?.anomalies?.length || 0} ditemukan
        
        ATURAN PENTING:
        1. HANYA jawab pertanyaan seputar bisnis, data di atas, strategi ekonomi, dan keuangan.
        2. JIKA user mengirim kata kasar, hinaan, atau pertanyaan di luar topik bisnis, TOLAK dengan sopan: "Maaf, saya hanya bisa membantu analisis bisnis Anda."
        3. Gunakan bahasa Indonesia yang profesional tapi ramah.
        4. Berikan jawaban yang SINGKAT, PADAT, dan ACTIONABLE (maksimal 2-3 paragraf).
        5. Jika ada data numerik, tulis dengan format: "Label: Rp nilai" agar mudah dibaca.
      `;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const aiReply = data.choices[0].message.content;

            setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, saya sedang mengalami gangguan koneksi. Coba lagi nanti.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-emerald-500 hover:bg-emerald-400 text-[#020617] rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-110 z-50 group"
            >
                <MessageCircle size={28} className="animate-pulse" />
                <span className="absolute right-full mr-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Tanya Ardi AI
                </span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'w-72 h-16' : 'w-[350px] md:w-[400px] h-[500px]'}`}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Bot size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">Ardi AI</h3>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg">
                        <Minimize2 size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-700' : 'bg-emerald-500/20'}`}>
                                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-emerald-500" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-none'
                                    : 'bg-white/10 text-slate-200 rounded-tl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Bot size={14} className="text-emerald-500" />
                                </div>
                                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none">
                                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanya tentang performa bisnis..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-2 p-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#020617] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
