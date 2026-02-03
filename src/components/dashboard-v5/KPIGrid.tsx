import React from 'react';
import { DollarSign, CheckCircle2, TrendingUp, Layers, Activity } from 'lucide-react';
import { Metrics } from '@/types/dashboard';

interface KPIGridProps {
    metrics: Metrics;
    onReload: () => void;
    rowCount: number;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ metrics, onReload, rowCount }) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="stagger-card bg-white/5 border border-white/10 rounded-[40px] p-10 relative overflow-hidden group">
                    <DollarSign className="absolute top-4 right-4 text-emerald-500/10" size={80} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Total Revenue</p>
                    <p className="text-3xl font-mono font-black text-white italic">Rp {metrics.totalRevenue.toLocaleString()}</p>
                    <div className="mt-6 flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase">Confidence: {metrics.confidence}%</span>
                    </div>
                </div>
                <div className="stagger-card bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-10 relative overflow-hidden">
                    <TrendingUp className="absolute top-4 right-4 text-emerald-500/10" size={80} />
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-3 italic">Net Profit (Actual)</p>
                    <p className="text-3xl font-mono font-black text-emerald-400 italic">Rp {metrics.totalProfit.toLocaleString()}</p>
                    <p className="mt-6 text-[9px] font-black uppercase text-slate-500 tracking-widest italic">Avg Margin: <span className="text-white">{metrics.profitMargin.toFixed(2)}%</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="stagger-card bg-white/5 border border-white/10 p-10 rounded-[40px]">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-8 italic flex items-center gap-2"><Layers size={16} className="text-blue-500" /> Cost Allocation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase"><span>COGS Estimate</span> <span>{Math.round((metrics.cogs / metrics.totalRevenue) * 100)}%</span></div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(metrics.cogs / metrics.totalRevenue) * 100}%` }} /></div>
                            <p className="text-md font-mono font-bold">Rp {metrics.cogs.toLocaleString()}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase"><span>Operating Exp</span> <span>10.9%</span></div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '10.9%' }} /></div>
                            <p className="text-md font-mono font-bold">Rp {metrics.opex.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="stagger-card bg-white/5 border border-white/10 rounded-[40px] p-10 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                    <div className="relative z-10">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-10 italic">Data Quality Terminal</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-[9px] font-black text-slate-600 uppercase italic">Valid Rows</span> <span className="text-xs font-black text-white">{rowCount}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-[9px] font-black text-slate-600 uppercase italic">Integrity</span> <span className="text-xs font-black text-emerald-500">{metrics.quality}%</span></div>
                        </div>
                    </div>
                    <button onClick={onReload} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[3px] hover:bg-white/10 transition-all text-slate-400 mt-10">RE-LOAD DATASET</button>
                </div>
            </div>
        </div>
    );
};
