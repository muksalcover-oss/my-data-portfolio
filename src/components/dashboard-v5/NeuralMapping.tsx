import React from 'react';
import { Settings2, Database, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { MappingState } from '@/types/dashboard';

interface NeuralMappingProps {
    headers: string[];
    mapping: MappingState;
    setMapping: (m: MappingState) => void;
    onConfirm: () => void;
    loading: boolean;
    rowCount: number;
}

export const NeuralMapping: React.FC<NeuralMappingProps> = ({
    headers,
    mapping,
    setMapping,
    onConfirm,
    loading,
    rowCount
}) => {
    return (
        <div className="animate-in-container grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="stagger-card bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-3xl space-y-8">
                <div className="flex items-center gap-3"><Settings2 className="text-emerald-500" size={20} /> <h2 className="text-xl font-black uppercase italic">Neural Mapping</h2></div>
                <div className="grid gap-5">
                    {(['revenue', 'profit', 'region', 'category'] as const).map(f => (
                        <div key={f} className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[3px] ml-1">{f}</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                value={mapping[f]}
                                onChange={e => setMapping({ ...mapping, [f]: e.target.value })}
                            >
                                <option value="">-- PILIH KOLOM --</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
            <div className="stagger-card bg-emerald-500 p-12 rounded-[40px] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Database size={180} /></div>
                <div className="relative z-10 text-[#020617]">
                    <Zap size={56} className="mb-6" />
                    <h3 className="text-4xl font-black uppercase italic leading-none mb-6">Precision <br /> Engine Ready</h3>
                    <p className="font-bold text-xs leading-relaxed opacity-80 italic">Memproses {rowCount} transaksi dengan standar industri UMKM Indonesia.</p>
                </div>
                <button onClick={onConfirm} disabled={loading} className="w-full py-5 bg-[#020617] text-white font-black rounded-2xl uppercase text-[10px] tracking-[4px] flex items-center justify-center gap-3 hover:gap-6 transition-all duration-300">
                    {loading ? <Loader2 className="animate-spin" /> : <>START ANALYSIS <ArrowRight size={16} /></>}
                </button>
            </div>
        </div>
    );
};
