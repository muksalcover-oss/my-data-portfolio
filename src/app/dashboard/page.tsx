'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, LogOut, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// Components
import { DataUploader } from '@/components/dashboard-v5/DataUploader';
import { NeuralMapping } from '@/components/dashboard-v5/NeuralMapping';
import { KPIGrid } from '@/components/dashboard-v5/KPIGrid';
import { PerformanceChart } from '@/components/dashboard-v5/PerformanceChart';
import { AnalysisTerminal } from '@/components/dashboard-v5/AnalysisTerminal';
import { SimulationPanel } from '@/components/dashboard-v5/SimulationPanel';


// Logic & Types
import { Metrics, AIResult, MappingState } from '@/types/dashboard';
import { performFullAnalysis, generateLocalInsights, parseNumeric } from '@/lib/dashboard-logic';

// --- VISUAL ASSETS ---
declare global {
  interface Window {
    anime: any;
  }
}

const loadAnime = () => {
  return new Promise((resolve) => {
    if (window.anime) return resolve(window.anime);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
    script.onload = () => resolve(window.anime);
    document.head.appendChild(script);
  });
};

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

export default function DashboardPage() {
  const [step, setStep] = useState<'upload' | 'map' | 'analyze'>('upload');
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'simulation'>('overview');

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [mapping, setMapping] = useState<MappingState>({ revenue: '', profit: '', region: '', category: '' });
  const [useFallback, setUseFallback] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- ANIME.JS TRIGGER ---
  useEffect(() => {
    if (step === 'analyze' || step === 'map') {
      loadAnime().then((anime: any) => {
        anime({
          targets: '.stagger-card',
          translateY: [20, 0],
          opacity: [0, 1],
          delay: anime.stagger(100),
          easing: 'easeOutExpo',
          duration: 800
        });
        anime({
          targets: '.animate-in-container',
          scale: [0.95, 1],
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 1000
        });
      });
    }
  }, [step, activeTab]);

  // Session Management
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('ardiAnalis_sessionData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.rawRows && parsed.rawRows.length > 0) {
          setRawRows(parsed.rawRows);
          setHeaders(parsed.headers || []);
          setFileName(parsed.fileName || '');
          setMapping(parsed.mapping || { revenue: '', profit: '', region: '', category: '' });
          setMetrics(parsed.metrics || null);
          setAiResult(parsed.aiResult || null);
          setStep(parsed.step || 'upload');
          setActiveTab(parsed.activeTab || 'overview');
        }
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
  }, []);

  useEffect(() => {
    if (rawRows.length > 0) {
      try {
        const dataToSave = {
          rawRows,
          headers,
          fileName,
          mapping,
          metrics,
          aiResult,
          step,
          activeTab,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('ardiAnalis_sessionData', JSON.stringify(dataToSave));
      } catch (e) {
        console.warn('Failed to save session:', e);
      }
    }
  }, [rawRows, headers, fileName, mapping, metrics, aiResult, step, activeTab]);

  const clearSessionData = () => {
    localStorage.removeItem('ardiAnalis_sessionData');
    setStep('upload');
    setRawRows([]);
    setHeaders([]);
    setFileName('');
    setMapping({ revenue: '', profit: '', region: '', category: '' });
    setMetrics(null);
    setAiResult(null);
  };

  const processFile = (file: File) => {
    if (!file || !file.name.endsWith('.csv')) {
      setErrorMessage("Gunakan file .CSV");
      return;
    }
    setLoading(true);
    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(r => r.trim() !== '');
        if (rows.length < 2) throw new Error("File kosong atau format salah");

        const csvHeaders = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const parsed = rows.slice(1).map(row => {
          // Robust CSV splitting handling quotes
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const obj: Record<string, string> = {};
          csvHeaders.forEach((h, i) => { obj[h] = values[i]?.trim().replace(/"/g, '') || ''; });
          return obj;
        });
        setHeaders(csvHeaders);
        setRawRows(parsed);
        setStep('map');
      } catch {
        setErrorMessage("Gagal baca CSV.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFinalizeMapping = async () => {
    if (!mapping.revenue) { setErrorMessage("Revenue wajib di-map."); return; }
    setLoading(true); setErrorMessage(null);

    try {
      const res = performFullAnalysis(rawRows, mapping);
      setMetrics(res);

      let aiSuccess = false;
      if (GROQ_API_KEY) {
        setErrorMessage("Menghubungi AI Co-Pilot (Groq)...");
        const prompt = `Analisis Bisnis: Rev Rp ${res.totalRevenue.toLocaleString()}, Profit Rp ${res.totalProfit.toLocaleString()}, Margin ${res.profitMargin.toFixed(2)}%. Berikan summary, anomali, dan 3 saran strategi dalam JSON (keys: summary, insights (array of {category, title, description}), recommendations (array string)).`;

        try {
          const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'system', content: 'Anda adalah analis bisnis UMKM Indonesia. Selalu respons dalam JSON valid.' }, { role: 'user', content: prompt }],
              temperature: 0.7, max_tokens: 1024
            })
          });

          if (aiResponse.ok) {
            const data = await aiResponse.json();
            let text = data.choices?.[0]?.message?.content || '';
            text = text.replace(/```json\n?/, '').replace(/```/, '');
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              setAiResult(JSON.parse(jsonMatch[0]));
              aiSuccess = true;
              setErrorMessage(null);
            }
          }
        } catch (e) { console.warn("Groq API Error but continuing..."); }
      }

      if (!aiSuccess) {
        const localRes = generateLocalInsights(res);
        setAiResult(localRes);
        setUseFallback(true);
        setErrorMessage(null);
      }
      setStep('analyze');
    } catch {
      setErrorMessage("Analisis gagal.");
    } finally {
      setLoading(false);
    }
  };

  const creditScore = metrics ? Math.min(850, Math.floor((metrics.totalRevenue / (metrics.cogs || 1)) * 55)) : 0;

  const exportToExcel = () => {
    if (!rawRows.length || !metrics) return;
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Data Transaksi');

    // Summary
    const summaryData = [
      ['LAPORAN ANALISIS BISNIS'], ['File', fileName], ['Tanggal', new Date().toLocaleDateString('id-ID')], [''],
      ['Total Revenue', metrics.totalRevenue], ['Total Profit', metrics.totalProfit], ['Margin', metrics.profitMargin],
      ['AI Summary', aiResult?.summary || '-']
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Analisis');

    XLSX.writeFile(wb, `analisis_${fileName.replace('.csv', '')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const trendData = useMemo(() => {
    if (!rawRows.length || !mapping.revenue) return [];

    // Improved Date detection logic
    const dateColumns = headers.filter(h => /date|tanggal|bulan|month|waktu/i.test(h));

    if (dateColumns.length > 0) {
      const dateCol = dateColumns[0];
      const grouped: Record<string, { revenue: number; profit: number }> = {};

      rawRows.forEach(row => {
        const date = row[dateCol] || 'Uncategorized';
        if (!grouped[date]) grouped[date] = { revenue: 0, profit: 0 };
        grouped[date].revenue += parseNumeric(row[mapping.revenue]);
        grouped[date].profit += mapping.profit ? parseNumeric(row[mapping.profit]) : 0;
      });

      return Object.entries(grouped).slice(0, 12).map(([label, d]) => ({ label, ...d }));
    } else {
      // Simulate monthly if no date
      const chunkSize = Math.ceil(rawRows.length / 6);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map((m, i) => {
        const chunk = rawRows.slice(i * chunkSize, (i + 1) * chunkSize);
        const rev = chunk.reduce((s, r) => s + parseNumeric(r[mapping.revenue]), 0);
        const prof = mapping.profit ? chunk.reduce((s, r) => s + parseNumeric(r[mapping.profit]), 0) : rev * 0.2;
        return { label: m, revenue: rev, profit: prof };
      });
    }
  }, [rawRows, mapping, headers]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500 blur-[120px] rounded-full" />
      </div>

      <header className="border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl p-5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-emerald-500 animate-pulse" size={22} />
          <h1 className="text-lg font-black tracking-widest uppercase italic">Ardi <span className="text-emerald-500">Precision</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 tracking-widest">ENGINE_v5.0_MODULAR</div>
          <button onClick={clearSessionData} className="p-2 hover:text-red-500 transition-colors" title="Reset & Upload Baru"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
            <AlertCircle size={16} /> <p className="font-bold">{errorMessage}</p>
          </div>
        )}

        {step === 'upload' && (
          <DataUploader
            onFileSelect={processFile}
            loading={loading}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        )}

        {step === 'map' && (
          <NeuralMapping
            headers={headers}
            mapping={mapping}
            setMapping={setMapping}
            onConfirm={handleFinalizeMapping}
            loading={loading}
            rowCount={rawRows.length}
          />
        )}

        {step === 'analyze' && metrics && (
          <div className="animate-in-container space-y-8">
            <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
              {['overview', 'intelligence', 'simulation'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-emerald-500 text-[#020617]' : 'text-slate-500'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="stagger-card flex justify-between items-center bg-white/5 p-6 rounded-[30px] border border-white/5">
                    <div>
                      <h3 className="text-xl font-black italic uppercase">Performance Overview</h3>
                      <p className="text-slate-500 text-xs">Real-time analysis from uploaded dataset</p>
                    </div>
                    <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-[#020617] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-emerald-500/20">
                      <Download size={16} /> Export Excel
                    </button>
                  </div>

                  <PerformanceChart trendData={trendData} />
                  <KPIGrid metrics={metrics} onReload={() => setStep('upload')} rowCount={rawRows.length} />
                </div>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <AnalysisTerminal
                loading={loading}
                useFallback={useFallback}
                aiResult={aiResult}
                metrics={metrics}
                creditScore={creditScore}
              />
            )}

            {activeTab === 'simulation' && (
              <SimulationPanel metrics={metrics} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}