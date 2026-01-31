"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts'
import {
  Send, ChevronRight, Database, Mail, UploadCloud,
  Activity, BrainCircuit, X, Download, Layers, Cpu, Settings2, Sparkles, Zap, Plus, Trash2, Search
} from 'lucide-react'

// API Key otomatis terisi oleh environment saat runtime
const apiKey = "";

/**
 * ULTRA ROBUST PARSER
 * - Menangani delimiter (;, tab), quoted fields, currency, percent, tanggal sederhana
 * - Mengembalikan headers (UPPERCASE) dan rows dengan deteksi angka/tanggal
 */
const robustParser = (text: string) => {
  const lines = text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.replace(/[;,\t]/g, '').length > 0);

  if (lines.length < 1) return { headers: [], rows: [] };

  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : headerLine.includes(',') ? ',' : '\t';

  const parseLine = (line: string) => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
      } else if (ch === delimiter && !inQuotes) {
        res.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res.map(s => s.trim().replace(/^"|"$/g, ''));
  };

  const headers = parseLine(headerLine).map(h => h.toUpperCase()).filter(h => h !== '');

  const rows = lines.slice(1).map((line, idx) => {
    const values = parseLine(line);
    const rowObj: any = { id: Date.now() + idx };

    headers.forEach((h, i) => {
      const rawVal = (values[i] ?? '').trim();
      // Normalize numeric / percent / currency
      const cleaned = rawVal.replace(/Rp/gi, '').replace(/%/g, '').replace(/\s/g, '');
      // Try numeric
      const numCandidate = Number(cleaned.replace(/\.(?=\d{3,})/g, '').replace(/,/g, ''));
      const dateCandidate = Date.parse(rawVal);

      if (cleaned !== '' && !isNaN(numCandidate) && /[0-9]/.test(cleaned)) {
        rowObj[h] = numCandidate;
      } else if (!isNaN(dateCandidate)) {
        rowObj[h] = new Date(dateCandidate).toISOString();
      } else {
        rowObj[h] = rawVal;
      }
    });

    return rowObj;
  });

  return { headers, rows };
}

// Infer column types & simple stats to help AI make better recommendations
const inferColumnTypes = (headers: string[], rows: any[]) => {
  const out: Record<string, any> = {};
  headers.forEach(h => {
    const vals = rows.map(r => r[h]).filter(v => v !== undefined && v !== null && v !== '');
    const count = vals.length;
    let numCount = 0, dateCount = 0;
    let sum = 0, min = Infinity, max = -Infinity;
    const uniq = new Set<any>();

    vals.forEach(v => {
      if (typeof v === 'number') {
        numCount++; sum += v; min = Math.min(min, v); max = Math.max(max, v); uniq.add(v);
      } else if (typeof v === 'string') {
        const n = Number(v.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(n) && /[0-9]/.test(v)) { numCount++; sum += n; min = Math.min(min, n); max = Math.max(max, n); uniq.add(n); }
        else if (!isNaN(Date.parse(v))) { dateCount++; uniq.add(v); }
        else { uniq.add(v); }
      }
    });

    const uniqCount = uniq.size;
    const type = (numCount / Math.max(1, count) > 0.6) ? 'number' : (dateCount / Math.max(1, count) > 0.6) ? 'date' : (uniqCount <= Math.max(1, count * 0.2) ? 'category' : 'string');

    out[h] = {
      type,
      count,
      uniqCount,
      min: min === Infinity ? null : min,
      max: max === -Infinity ? null : max,
      mean: numCount ? (sum / numCount) : null,
    };
  });
  return out;
}

// Extract first balanced JSON object from a text reply (simple brace matching)
const extractJsonFromText = (text: string) => {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      try {
        const jsonStr = text.slice(start, i + 1);
        return JSON.parse(jsonStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

// Sanitize a row: normalize numbers, percentages, currency, dates
const sanitizeRow = (row: Record<string, any>) => {
  const out: Record<string, any> = {};
  Object.entries(row).forEach(([k, v]) => {
    if (v === null || v === undefined) { out[k] = v; return; }
    const s = String(v).trim();
    // percent
    if (/^-?\d+[.,]?\d*%$/.test(s)) {
      out[k] = Number(s.replace(/%/g, '').replace(/,/g, '.'));
      return;
    }
    // currency Rp or leading currency symbols
    const cleaned = s.replace(/Rp|IDR|\$/gi, '').replace(/\s/g, '').replace(/\.(?=\d{3,})/g, '').replace(/,/g, '.');
    if (cleaned !== '' && /^-?\d+(\.\d+)?$/.test(cleaned)) {
      out[k] = Number(cleaned);
      return;
    }
    // iso-like date
    const d = Date.parse(s);
    if (!isNaN(d) && s.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/)) {
      out[k] = new Date(d).toISOString();
      return;
    }
    // fallback keep as string
    out[k] = s;
  });
  return out;
}

const sanitizeRows = (rows: any[]) => rows.map(r => ({ id: r.id ?? Date.now() + Math.random(), ...sanitizeRow(r) }));

// Suggested meta type
type SuggestedMeta = { type?: string; x?: string; y?: string; chart?: string; confidence?: number; summary?: string; insights?: string[] };


export default function App() {
  const [activePage, setActivePage] = useState<'landing' | 'lab' | 'archive'>('landing');
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

  // Data States
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [xAxisKey, setXAxisKey] = useState<string>("");
  const [yAxisKey, setYAxisKey] = useState<string>("");

  // UI & System States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [view, setView] = useState<'visual' | 'matrix'>('visual');
  const [aiInsight, setAiInsight] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [globalMultiplier, setGlobalMultiplier] = useState(100);
  const [logs, setLogs] = useState<string[]>(["Neural Core Standby.", "Ready for data injection."]);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // Preview & suggested meta from AI
  const [suggestedMeta, setSuggestedMeta] = useState<SuggestedMeta | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Simple in-page toast notifications
  const [toasts, setToasts] = useState<{ id: number; type: 'info'|'error'|'warn'|'success'; message: string }[]>([]);
  const addToast = (message: string, type: 'info'|'error'|'warn'|'success' = 'info', timeout = 4000) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [{ id, type, message }, ...prev]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), timeout);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, isChatOpen]);

  const addLog = (msg: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 6));

  // Data Processor untuk Visualisasi (Limit 50 data point agar performa stabil)
  const processedData = useMemo(() => {
    if (!yAxisKey) return data.slice(0, 50);
    return data.map(d => ({
      ...d,
      [yAxisKey]: typeof d[yAxisKey] === 'number' ? parseFloat(((d[yAxisKey] * globalMultiplier) / 100).toFixed(2)) : d[yAxisKey]
    })).slice(0, 50);
  }, [data, globalMultiplier, yAxisKey]);

  const stats = useMemo(() => {
    if (data.length === 0 || !yAxisKey) return { avg: "0", max: "0", count: 0 };
    const values = data.map(d => Number(d[yAxisKey])).filter(v => !isNaN(v));
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return {
        avg: avg.toLocaleString('id-ID'),
        max: (values.length > 0 ? Math.max(...values) : 0).toLocaleString('id-ID'),
        count: data.length
    };
  }, [data, yAxisKey]);

  // --- AI CORE ---
  // Client-side proxy call to server-side route /api/ai
  const callAI = async (prompt: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        const contentType = res.headers.get('content-type') || '';
        let body: any = null;
        if (contentType.includes('application/json')) body = await res.json();
        else body = await res.text();

        if (!res.ok) {
          const msg = body?.error || body?.message || body || 'AI proxy error';
          throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }

        if (body?.error) throw new Error(body.error);

        // body may be string or object { text }
        if (typeof body === 'string') return body;
        return body.text || null;
      } catch (e) {
        if (i === retries - 1) throw e
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
      }
    }
  };


  // Get suggested meta from AI without applying it (used for preview)
  const getAIMeta = async (rows: any[], h: string[]) : Promise<SuggestedMeta> => {
    setIsAiLoading(true);
    addLog("Querying AI for dataset schema...");

    const sampleRows = [...rows.slice(0, 5), ...rows.slice(Math.max(0, rows.length - 5), rows.length)].slice(0, 10);
    const sample = sampleRows.map(r => {
      const { id, ...rest } = r;
      return JSON.stringify(rest);
    }).join("\n");

    const colMeta = inferColumnTypes(h, rows);
    const statsSnippet = h.map(col => `${col}: type=${colMeta[col].type}, uniq=${colMeta[col].uniqCount}, mean=${colMeta[col].mean ?? '-'}, min=${colMeta[col].min ?? '-'}, max=${colMeta[col].max ?? '-'}`).join("; ");

    const prompt = `Anda adalah analis data otomatis. Jawab hanya JSON murni tanpa penjelasan lain. Format respon:\n{ "type":"...", "x":"...", "y":"...", "chart":"bar|line|area|scatter|table", "confidence":0.0-1.0, "summary":"...", "insights":["...","..."] }\n\nHeaders: ${h.join(", ")}\nColumnStats: ${statsSnippet}\nSampleRows:\n${sample}\n\nTugas: 1) Sebutkan jenis dataset singkat. 2) Pilih kolom terbaik untuk X (kategori/tanggal) dan Y (numerik). 3) Pilih tipe chart yang cocok. 4) Berikan ringkasan dan 2 insight. Jika ragu, set confidence rendah. Bahasa: Indonesia.`;

    const response = await callAI(prompt);
    if (!response) throw new Error('Empty AI response');

    let meta: any = extractJsonFromText(response || "");
    if (!meta) {
      const cleaned = response.replace(/```json|```/g, "").trim();
      try { meta = JSON.parse(cleaned); } catch (e) { meta = null; }
    }

    if (!meta) throw new Error('Invalid AI response');

    // Normalize
    if (meta.x) meta.x = meta.x.toString().toUpperCase();
    if (meta.y) meta.y = meta.y.toString().toUpperCase();

    return meta as SuggestedMeta;
  };

  // Existing convenience function that applies AI suggestions immediately
  const autonomousDiscovery = async (rows: any[], h: string[]) => {
    try {
      const meta = await getAIMeta(rows, h);
      // Validate and apply
      const colMeta = inferColumnTypes(h, rows);
      const guessedX = meta.x?.toString().toUpperCase();
      const guessedY = meta.y?.toString().toUpperCase();
      const validX = guessedX && h.includes(guessedX) ? guessedX : (h.find(k => colMeta[k].type === 'date') || h[0]);
      const validY = guessedY && h.includes(guessedY) ? guessedY : (h.find(k => colMeta[k].type === 'number') || h[h.length - 1]);

      setXAxisKey(validX);
      setYAxisKey(validY);
      if (meta.chart && ['bar','line','area'].includes(meta.chart)) setChartType(meta.chart as any);

      const conf = meta.confidence ?? 0.5;
      setAiInsight(`${meta.summary || ''}\n\nSTRATEGI:\n• ${meta.insights?.[0] || '-'}\n• ${meta.insights?.[1] || '-'}`);
      addLog(`AI Context: ${meta.type || 'Unknown'} recognized. (conf=${conf})`);
      if (conf < 0.5) addToast('AI low confidence — verified with heuristics.', 'warn');
      else addToast('AI suggested mapping applied (confidence: ' + Math.round((conf as number) * 100) + '%).', 'success');
    } catch (err) {
      // fallback
      const colMeta2 = inferColumnTypes(h, rows);
      const numKey = h.find(k => colMeta2[k].type === 'number') || h[h.length - 1];
      const dateKey = h.find(k => colMeta2[k].type === 'date') || h[0];
      setXAxisKey(dateKey);
      setYAxisKey(numKey);
      setAiInsight("Analisis otomatis selesai menggunakan pemetaan manual dan heuristik (kolom tanggal/angka dipilih).\nPeriksa rekomendasi dan jalankan ulang AI bila perlu.");
      addLog("Neural link fallback applied.");
      addToast('Analisis AI gagal — fallback heuristik diterapkan.', 'warn');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Preview accept / reject handlers
  const acceptSuggestion = () => {
    if (!suggestedMeta) return;
    const h = headers;
    const rows = data;
    const colMeta = inferColumnTypes(h, rows);
    const guessedX = suggestedMeta.x?.toString().toUpperCase();
    const guessedY = suggestedMeta.y?.toString().toUpperCase();
    const validX = guessedX && h.includes(guessedX) ? guessedX : (h.find(k => colMeta[k].type === 'date') || h[0]);
    const validY = guessedY && h.includes(guessedY) ? guessedY : (h.find(k => colMeta[k].type === 'number') || h[h.length - 1]);

    setXAxisKey(validX);
    setYAxisKey(validY);
    if (suggestedMeta.chart && ['bar','line','area'].includes(suggestedMeta.chart)) setChartType(suggestedMeta.chart as any);
    setAiInsight(`${suggestedMeta.summary || ''}\n\nSTRATEGI:\n• ${suggestedMeta.insights?.[0] || '-'}\n• ${suggestedMeta.insights?.[1] || '-'}`);
    addLog('AI suggestion applied by user.');
    addToast('AI suggestion applied.', 'success');
    setSuggestedMeta(null);
    setShowPreview(false);
  };

  const rejectSuggestion = () => {
    setSuggestedMeta(null);
    setShowPreview(false);
    addToast('AI suggestion dismissed.', 'info');
  };

  // Quick test helper to verify AI connectivity and inspect response
  const testAI = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const resp = await callAI('Ping. Reply briefly with PONG and a short status.');
      addToast('AI Reply: ' + (String(resp).slice(0, 200)), 'success');
      addLog('AI Test response: ' + String(resp).slice(0, 200));
    } catch (err: any) {
      const msg = err?.message || String(err);
      addToast('AI Test failed: ' + msg, 'error');
      addLog('AI Test failed: ' + msg);
    } finally {
      setIsAiLoading(false);
    }
  };


  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      addLog('Error: Only CSV files supported.');
      addToast('Hanya file CSV yang didukung.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // allow up to 10MB for parsing with worker
      addLog('Error: File too large (max 10MB).');
      addToast('File terlalu besar (maks 10MB). Pertimbangkan membagi dataset.', 'error');
      return;
    }

    setIsAnalyzing(true);

    // When using web worker, do NOT pass functions (e.g., transformHeader) because they cannot be cloned.
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: async (results: any) => {
        try {
          // Raw rows keep original header keys; we'll normalize headers and map keys to UPPERCASE here
          const rawRows = (results.data || []).map((r: any, i: number) => ({ id: r.id ?? Date.now() + i, ...r })) as any[];
          if (rawRows.length === 0) {
            addLog('Error: Invalid CSV.');
            addToast('CSV tidak valid atau kosong.', 'error');
            setIsAnalyzing(false);
            return;
          }

          const fields = results.meta?.fields || Object.keys(rawRows[0] || {}).filter(k => k !== 'id');
          const hdrs = fields.map((f: string) => (f || '').toString().toUpperCase()).filter(Boolean);

          const rows = rawRows.map((r: any, idx: number) => {
            const obj: any = { id: r.id ?? Date.now() + idx };
            Object.entries(r).forEach(([k, v]) => {
              obj[(k || '').toString().toUpperCase()] = v;
            });
            return obj;
          });

          const sanitized = sanitizeRows(rows);

          setHeaders(hdrs);
          setData(sanitized);
          addToast(`Dataset dimuat — ${sanitized.length} baris.`, 'success');

          // Get AI suggestion but do not apply automatically; open preview
          try {
            const meta = await getAIMeta(sanitized, hdrs);
            setSuggestedMeta(meta);
            setShowPreview(true);
          } catch (err) {
            addToast('AI suggestion gagal — menggunakan heuristik sementara.', 'warn');
            // apply heuristics fallback automatically
            autonomousDiscovery(sanitized, hdrs);
          }
        } finally {
          setIsAnalyzing(false);
        }
      },
      error: (err: any) => {
        addLog('Error: PapaParse failed.');
        addToast('Gagal mem-parsing CSV (PapaParse).', 'error');
        setIsAnalyzing(false);
      }
    });
  };

  const askData = async () => {
    if (!userQuery.trim() || isQueryLoading) return;
    const q = userQuery; setUserQuery("");
    setChatHistory(p => [...p, {role: 'user', text: q}]);
    setIsQueryLoading(true);
    const prompt = `Dataset Context: Kolom [${headers.join(", ")}]. Sampel Data [${yAxisKey} vs ${xAxisKey}]: ${data.slice(0, 10).map(d => `${d[xAxisKey]}: ${d[yAxisKey]}`).join("; ")}. Pertanyaan User: ${q}. Jawab singkat dan padat.`;
    try {
      const ans = await callAI(prompt);
      setChatHistory(p => [...p, {role: 'ai', text: ans}]);
    } catch (err) {
      setChatHistory(p => [...p, {role: 'ai', text: "Neural link timeout."}]);
      addToast('Permintaan AI gagal / timeout.', 'error');
    } finally { setIsQueryLoading(false); }
  };

  // Matrix Grid Handlers
  const addRow = () => {
    const newRow: any = { id: Date.now() };
    headers.forEach(h => newRow[h] = "");
    setData([newRow, ...data]);
  };

  const addColumn = () => {
    const name = prompt("Enter Column Name:");
    if (name && !headers.includes(name.toUpperCase())) {
        const up = name.toUpperCase();
        setHeaders([...headers, up]);
        setData(data.map(d => ({ ...d, [up]: "" })));
    }
  };

  const deleteColumn = (col: string) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter(h => h !== col));
    setData(data.map(d => {
        const { [col]: _, ...rest } = d;
        return rest;
    }));
  };

  const landingProjects = [
    { id: '01', title: 'Retail Flow Analysis', tag: 'Agnostic', desc: 'Analisis pola transaksi dari dataset retail Kaggle.' },
    { id: '02', title: 'UMKM Disaster Impact', tag: 'Custom', desc: 'Studi kasus kerugian UMKM pasca bencana banjir.' },
    { id: '03', title: 'Supply Chain Tracker', tag: 'Dynamic', desc: 'Pemetaan logistik dengan variabel kolom dinamis.' },
    { id: '04', title: 'Inventory Outliers', tag: 'Statistical', desc: 'Deteksi anomali pada stok gudang harian.' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans antialiased selection:bg-blue-100">
      {/* GLOBAL NAVBAR */}
      <nav className="fixed top-0 w-full z-[100] px-8 h-20 flex justify-between items-center backdrop-blur-xl bg-white/70 border-b border-slate-100 no-print">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActivePage('landing')}>
          <div className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-lg">D.</div>
          <span className="font-black text-xs tracking-widest uppercase text-slate-800">Intelligence.Lab</span>
        </div>
        <div className="flex gap-10 items-center text-slate-400">
          <span onClick={() => setActivePage('archive')} className={`text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${activePage === 'archive' ? 'text-blue-600' : 'hover:text-slate-900'}`}>Case Studies</span>
          <span onClick={() => setActivePage('lab')} className={`text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${activePage === 'lab' ? 'text-blue-600' : 'hover:text-slate-900'}`}>Laboratory</span>
          <button onClick={() => window.location.href="mailto:tsumendra2@gmail.com"} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"><Mail size={12} /> Connect</button>
        </div>
      </nav>

      <main className="pt-20">
        {/* Toasts */}
        <div className="fixed top-24 right-8 z-50 flex flex-col gap-3">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg max-w-xs break-words ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'warn' ? 'bg-yellow-400 text-slate-900' : 'bg-white text-slate-900 border'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 text-xs font-black uppercase">{t.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Preview Modal */}
        {showPreview && (
          <PreviewModal meta={suggestedMeta} onAccept={acceptSuggestion} onReject={rejectSuggestion} sampleRows={data.slice(0,5)} headers={headers} />
        )}

        <AnimatePresence mode="wait">
          {activePage === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-8 md:px-20 py-24 max-w-7xl mx-auto space-y-12">
              <div className="flex items-center gap-4"><div className="w-12 h-[2px] bg-blue-600" /><span className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px]">Agnostic Neural Engine</span></div>
              <h1 className="text-[10vw] md:text-[8vw] font-black tracking-tighter leading-[0.85] uppercase text-slate-900">Infinite <br /> <span className="text-slate-200">Processing</span> <br /> Capability.</h1>
              <p className="text-2xl font-light text-slate-500 italic max-w-2xl leading-tight">"Sistem intelijen yang secara mandiri beradaptasi dengan konteks dataset apapun tanpa konfigurasi manual."</p>
              <div className="flex justify-start pt-6">
                <button onClick={() => setActivePage('lab')} className="bg-slate-900 text-white px-10 py-5 rounded-full font-black uppercase text-xs hover:bg-blue-600 shadow-2xl flex items-center gap-4 transition-all">Launch Intelligence Lab <ChevronRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {activePage === 'lab' && (
            <motion.div key="lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 printable-area text-slate-800">
              <div className="lg:col-span-3 space-y-6 no-print">
                <section className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-4 text-center">Data Vitals</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <KPICard label="Entries" value={stats.count} sub="Total Rows" />
                    <KPICard label="Average" value={stats.avg} sub="Market Mean" />
                    <KPICard label="Peak" value={stats.max} sub="Record High" />
                    <KPICard label="Neural Link" value="ACTIVE" sub="Agnostic AI" />
                  </div>
                </section>
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group text-left">
                   <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-400 animate-pulse"><BrainCircuit size={40} /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2"><Sparkles size={14} /> Neural Summary</h4>
                   <div className="text-xs leading-relaxed text-slate-300 min-h-[160px] whitespace-pre-wrap font-medium">
                      {isAiLoading ? (
                        <div className="space-y-4">
                           <div className="h-2 bg-slate-800 rounded w-full animate-pulse" />
                           <div className="h-2 bg-slate-800 rounded w-4/5 animate-pulse" />
                           <div className="h-2 bg-slate-800 rounded w-2/3 animate-pulse" />
                           <span className="text-[9px] font-black uppercase opacity-40">AI Deep Scanning...</span>
                        </div>
                      ) : (aiInsight || "Sistem menunggu input dataset untuk memulai analisis mandiri.")}
                   </div>
                   <div className="flex gap-3">
                     <button onClick={() => autonomousDiscovery(data, headers)} disabled={data.length === 0 || isAiLoading} className="w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Zap size={14} /> Recalibrate Intelligence</button>
                     <button onClick={() => testAI()} disabled={isAiLoading} className="py-4 px-4 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-100 border border-slate-100">Test AI</button>
                   </div>
                </section>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 font-mono text-[9px] text-slate-400 shadow-sm text-left">
                   <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="font-bold uppercase tracking-widest">System_Console.log</span></div>
                   <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide">{logs.map((l, i) => (<div key={i} className={i === 0 ? "text-blue-600 font-bold" : ""}>{l}</div>))}</div>
                </div>
              </div>

              <div className="lg:col-span-9 bg-white border border-slate-100 rounded-[3.5rem] p-8 md:p-14 shadow-sm min-h-[800px] relative text-slate-900">
                <AnimatePresence>{isAnalyzing && (<motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-white/95 z-[200] rounded-[3.5rem] flex flex-col items-center justify-center gap-6"><div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /><span className="text-xs font-black uppercase text-blue-600 animate-pulse tracking-widest">Injecting Neural Matrix...</span></motion.div>)}</AnimatePresence>

                {data.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 space-y-12">
                     <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300"><UploadCloud size={48} /></div>
                     <div className="text-center space-y-4">
                        <h3 className="text-4xl font-black uppercase tracking-tight text-slate-900">Neural Gateway</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">Impor dataset UMKM atau Retail Kaggle. AI akan mengenali konteks dan memetakan variabel secara otomatis.</p>
                     </div>
                     <label className="bg-slate-900 text-white px-16 py-6 rounded-full text-xs font-black uppercase tracking-widest cursor-pointer shadow-2xl hover:bg-blue-600 transition-all hover:scale-105 active:scale-95">Select Dataset (CSV)<input type="file" accept=".csv" className="hidden" onChange={handleUpload} /></label>
                  </div>
                ) : (
                  <div className="flex flex-col h-full text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 border-b border-slate-50 pb-8">
                       <div className="space-y-1">
                          <h2 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-3">Vision Terminal <Zap className="text-blue-600 fill-blue-600" size={20} /></h2>
                          <div className="flex flex-wrap gap-4 mt-6 no-print text-left">
                             <AxisBox label="LABEL" val={xAxisKey} options={headers} set={setXAxisKey} />
                             <AxisBox label="VALUE" val={yAxisKey} options={headers} set={setYAxisKey} />
                          </div>
                       </div>
                       <div className="flex gap-4 items-center no-print">
                          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {['bar', 'line', 'area'].map(t => (<button key={t} onClick={() => setChartType(t as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${chartType === t ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>))}
                          </div>
                          <button onClick={() => window.print()} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 border border-slate-100 transition-all"><Download size={20} /></button>
                       </div>
                    </div>

                    <div className="flex-grow min-h-[500px] mb-12">
                      {view === 'visual' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                            <defs><linearGradient id="luxeG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                            <Tooltip content={<AdvancedTooltip yKey={yAxisKey} />} cursor={{fill: 'rgba(0,0,0,0.02)', radius: 10}} />
                            <ReferenceLine y={parseFloat(stats.avg.replace(/\./g, '').replace(/,/g, '.'))} stroke="#e2e8f0" strokeDasharray="5 5" />
                            {chartType === 'area' && <Area type="monotone" dataKey={yAxisKey} stroke="none" fill="url(#luxeG)" animationDuration={1000} />}
                            {chartType === 'bar' && (
                              <Bar dataKey={yAxisKey} radius={[12, 12, 12, 12]} barSize={45} animationDuration={1000}>
                                {processedData.map((e, i) => (<Cell key={i} fill={Number(e[yAxisKey]) > parseFloat(stats.avg.replace(/\./g, '')) ? "#2563eb" : "#EEF2FF"} className="transition-all duration-700" />))}
                              </Bar>
                            )}
                            {chartType === 'line' && <Line type="monotone" dataKey={yAxisKey} stroke="#1d4ed8" strokeWidth={5} dot={{r: 6, fill: '#1d4ed8', strokeWidth: 0}} activeDot={{r: 10, stroke: '#fff', strokeWidth: 4}} animationDuration={1000} />}
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col no-print text-slate-800">
                           <div className="flex justify-between items-center mb-8">
                              <div className="flex gap-3">
                                 <button onClick={addColumn} className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-200 transition-all"><Plus size={14} /> Add Variable</button>
                                 <button onClick={addRow} className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all"><Plus size={14} /> Add Entry</button>
                              </div>
                              <span className="text-[10px] font-black uppercase text-slate-300 italic">Double click header to delete variable.</span>
                           </div>
                           <div className="flex-grow overflow-y-auto border border-slate-100 rounded-[2.5rem] scrollbar-hide text-left">
                              <table className="w-full text-left border-collapse text-[11px] font-bold">
                                 <thead className="bg-slate-50 uppercase text-slate-400 sticky top-0 z-10">
                                    <tr>
                                       {headers.map(h => (<th key={h} onDoubleClick={() => deleteColumn(h)} className="px-8 py-6 cursor-pointer hover:text-red-500 transition-colors">{h}</th>))}
                                       <th className="px-8 py-6 text-right w-20">#</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {data.slice(0, 100).map((row) => (
                                       <tr key={row.id} className="border-b border-slate-50 hover:bg-blue-50 group transition-all text-left">
                                          {headers.map(h => (
                                            <td key={h} className="px-8 py-4">
                                                <input
                                                    type={typeof row[h] === 'number' ? 'number' : 'text'}
                                                    className="bg-transparent border-none p-0 w-full outline-none focus:text-blue-600 font-black uppercase text-slate-800"
                                                    value={row[h]}
                                                    onChange={(e) => setData(p => p.map(d => d.id === row.id ? {...d, [h]: isNaN(Number(e.target.value)) || e.target.value === "" ? e.target.value : Number(e.target.value)} : d))}
                                                />
                                            </td>
                                          ))}
                                          <td className="px-8 py-4 text-right"><button onClick={() => setData(p => p.filter(d => d.id !== row.id))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"><Trash2 size={16} /></button></td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 no-print flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                       <div className="space-y-4 w-full md:w-auto text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Stress-Test / Multiplier</p>
                          <div className="flex items-center gap-6">
                             <input type="range" min="0" max="300" value={globalMultiplier} onChange={(e) => setGlobalMultiplier(parseInt(e.target.value))} className="w-72 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                             <span className="text-blue-600 font-black text-lg">{globalMultiplier}%</span>
                          </div>
                       </div>
                       <div className="flex gap-4 w-full md:w-auto">
                          <button onClick={() => setView(view === 'visual' ? 'matrix' : 'visual')} className="flex-1 md:flex-initial bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
                             {view === 'visual' ? <><Settings2 size={16} /> Open Data Matrix</> : <><Activity size={16} /> Back to Terminal</>}
                          </button>
                          <button onClick={() => { if(confirm("Reset all data?")) setData([]); }} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"><X size={20} /></button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activePage === 'archive' && (
             <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-8 md:px-20 py-32 max-w-7xl mx-auto space-y-24 text-left">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                   <h2 className="text-7xl font-black tracking-tighter uppercase leading-none underline decoration-blue-600 decoration-8 underline-offset-[12px] text-slate-900 text-left">Dataset <br /> Case Studies.</h2>
                   <div className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 border-r border-slate-100 pr-6 italic font-bold">Vault v4.2</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   {landingProjects.map(p => (
                      <motion.div key={p.id} whileHover={{ y: -10 }} onClick={() => setSelectedArchiveId(p.id)} className="group cursor-pointer border-b border-slate-100 pb-16 transition-all text-slate-800 hover:border-blue-600 text-left">
                         <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 block text-left">{p.id} / Research Case</span>
                         <h3 className="text-4xl font-black tracking-tighter uppercase group-hover:text-blue-600 transition-colors leading-tight mb-6 text-left">{p.title}</h3>
                         <p className="text-slate-500 text-sm mb-8 font-medium text-left">{p.desc}</p>
                         <div className="flex justify-between items-center"><span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{p.tag}</span><ChevronRight size={16} /></div>
                      </motion.div>
                   ))}
                </div>
                <AnimatePresence>
                   {selectedArchiveId && (
                      <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 text-slate-900" onClick={() => setSelectedArchiveId(null)}>
                         <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-12 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedArchiveId(null)} className="absolute top-8 right-8"><X size={20} /></button>
                            <div className="space-y-8">
                               <h3 className="text-5xl font-black tracking-tighter uppercase leading-none">{landingProjects.find(p => p.id === selectedArchiveId)?.title}</h3>
                               <p className="text-xl text-slate-600 font-medium italic">Detailed report of {landingProjects.find(p => p.id === selectedArchiveId)?.desc}</p>
                               <div className="pt-8 border-t border-slate-100 flex gap-6">
                                  <button onClick={() => { setActivePage('lab'); setSelectedArchiveId(null); }} className="bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase shadow-lg">Try in Lab</button>
                                  <button onClick={() => setSelectedArchiveId(null)} className="border-b-2 border-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest">Close</button>
                               </div>
                            </div>
                         </motion.div>
                      </div>
                   )}
                </AnimatePresence>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI CHAT FLOATING */}
      {activePage === 'lab' && data.length > 0 && (
        <div className="fixed bottom-10 right-10 z-[110] no-print">
          <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-16 h-16 bg-blue-600 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-blue-500/40">
            {isChatOpen ? <X size={24} /> : <Search size={24} />}
          </button>
          <AnimatePresence>
            {isChatOpen && (
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }} className="absolute bottom-20 right-0 w-[420px] h-[600px] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden text-slate-800">
                 <div className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-white/5"><span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-400"><BrainCircuit size={16} /> Ask Neural Data / v4.2</span><button onClick={() => setIsChatOpen(false)} className="opacity-50 hover:opacity-100"><X size={20} /></button></div>
                 <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-slate-50/50 scrollbar-hide text-left text-slate-800">
                    {chatHistory.length === 0 && <div className="text-center py-20 opacity-20 text-[10px] font-black uppercase tracking-widest">Neural Link Established.<br/>Waiting for query...</div>}
                    {chatHistory.map((c, i) => (<div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-5 rounded-[1.8rem] text-[13px] font-bold leading-relaxed shadow-sm ${c.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-800 font-bold'}`}>{c.text}</div></div>))}
                    {isQueryLoading && <div className="flex justify-start"><div className="bg-white p-5 rounded-3xl animate-pulse text-[11px] font-black text-blue-600 tracking-widest">THINKING...</div></div>}<div ref={chatEndRef} />
                 </div>
                 <div className="p-6 bg-white border-t border-slate-100">
                    <div className="flex gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        <input type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askData()} placeholder="Ask specific patterns..." className="flex-grow bg-transparent px-4 py-2 text-sm font-bold outline-none text-slate-800 placeholder:text-slate-300" />
                        <button onClick={askData} className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-90"><Send size={18} /></button>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <footer className="py-24 border-t border-slate-100 flex flex-col items-center gap-4 text-slate-300 font-black no-print"><span className="text-[11px] uppercase italic tracking-[1em]">Core.Engine.2026</span><a href="mailto:tsumendra2@gmail.com" className="text-slate-900 border-b-2 border-blue-600 italic tracking-tighter">tsumendra2@gmail.com</a></footer>
      <style jsx global>{` @media print { .no-print { display: none !important; } .printable-area { padding: 0 !important; width: 100% !important; margin: 0 !important; } body { background: white !important; } } `}</style>
    </div>
  );
}

// Preview modal for AI suggestion
const PreviewModal = ({ meta, onAccept, onReject, sampleRows, headers }: { meta: SuggestedMeta | null; onAccept: () => void; onReject: () => void; sampleRows: any[]; headers: string[] }) => {
  if (!meta) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-black">AI Suggestion</h3>
            <p className="text-sm text-slate-500 mt-1">Confidence: <span className="font-bold">{Math.round((meta.confidence ?? 0) * 100)}%</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onReject} className="px-4 py-2 rounded-lg border">Dismiss</button>
            <button onClick={onAccept} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Apply</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Type</p>
            <div className="text-sm font-bold">{meta.type || '-'}</div>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Suggested X</p>
            <div className="text-sm font-bold">{meta.x || '-'}</div>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Suggested Y</p>
            <div className="text-sm font-bold">{meta.y || '-'}</div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-black uppercase text-slate-400 mb-2">Summary</p>
          <div className="text-sm text-slate-700 font-medium">{meta.summary || '-'}</div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-black uppercase text-slate-400 mb-2">Sample Rows</p>
          <div className="overflow-auto border rounded-md p-3 bg-slate-50 text-xs">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 text-[10px]"><tr>{headers.slice(0,6).map(h => <th key={h} className="pr-4">{h}</th>)}</tr></thead>
              <tbody>
                {sampleRows.slice(0,5).map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-100"><td className="pr-4" colSpan={headers.length}>{JSON.stringify(r)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onReject} className="px-4 py-2 rounded-lg border">Dismiss</button>
          <button onClick={onAccept} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Apply Suggestion</button>
        </div>
      </div>
    </div>
  );
};

// SUB-COMPONENTS
type AxisBoxProps = { label: string; val: string; options: string[]; set: (v: string) => void };

const AxisBox = ({ label, val, options, set }: AxisBoxProps) => (
  <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-left">
    <span className="opacity-50">{label}:</span>
    <select value={val} onChange={(e) => set(e.target.value)} className="bg-transparent text-blue-600 outline-none cursor-pointer font-black border-none p-0 focus:ring-0">
      {options.map((h: string) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  </div>
);

const KPICard = ({ label, value, sub, isTrend }: any) => (
  <div className="space-y-1.5 group text-left">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">{label}</p>
    <div className="flex items-baseline justify-start gap-1 text-left text-slate-900">
      {isTrend ? (
        <div className={`text-2xl font-black flex items-center gap-1 ${value === 'UP' ? 'text-green-500' : value === 'DOWN' ? 'text-red-500' : 'text-slate-300'}`}>
          <span className="text-lg">{value === 'UP' ? '↑' : value === 'DOWN' ? '↓' : '•'}</span> <span className="text-xl tracking-tighter">{value}</span>
        </div>
      ) : (
        <span className="text-2xl font-black tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-none text-left">{value}</span>
      )}
    </div>
    <p className="text-[8px] font-black text-slate-300 uppercase italic tracking-tighter text-left">{sub}</p>
  </div>
);

const AdvancedTooltip = ({ active, payload, yKey }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 p-8 rounded-[2.5rem] min-w-[240px] text-slate-900 backdrop-blur-xl text-left">
      <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-[0.3em] border-b border-slate-50 pb-3 text-left">{payload[0].payload.label || "Data Observation"}</p>
      <div className="flex items-baseline gap-1.5 mb-2 text-left">
          <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter text-left">{val.toLocaleString('id-ID')}</p>
          <span className="text-xs font-black text-slate-300 uppercase text-left">Points</span>
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Metric: {yKey}</p>
    </div>
  );
};