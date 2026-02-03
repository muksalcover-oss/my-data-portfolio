import React from 'react';
import { FileSpreadsheet, ShieldCheck, Lock } from 'lucide-react';

interface DataUploaderProps {
    onFileSelect: (file: File) => void;
    loading: boolean;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
    onFileSelect,
    loading,
    isDragging,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
}) => {
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="py-24 text-center animate-in fade-in duration-700">
            <div
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`group block max-w-xl mx-auto border-2 border-dashed rounded-[50px] bg-white/[0.02] p-20 cursor-pointer transition-all duration-300 ${isDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-105'
                    : 'border-white/10 hover:border-emerald-500/40'
                    }`}
            >
                <label className="cursor-pointer block">
                    <input type="file" className="hidden" onChange={handleFileInputChange} accept=".csv" />
                    <div className={`bg-emerald-500/10 w-20 h-20 rounded-[25px] flex items-center justify-center mx-auto mb-8 transition-transform duration-500 ${isDragging ? 'scale-125 animate-bounce' : 'group-hover:scale-110'
                        }`}>
                        <FileSpreadsheet className="text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic mb-3">
                        {isDragging ? 'Lepaskan File!' : 'Sync Core Intelligence'}
                    </h2>
                    <p className="text-slate-500 text-sm italic mb-10">
                        {isDragging ? 'Drop CSV file di sini...' : 'Drag & drop atau klik untuk upload CSV'}
                    </p>
                    <div className={`inline-flex px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-xl transition-all ${isDragging
                        ? 'bg-white text-emerald-600 shadow-white/20'
                        : 'bg-emerald-500 text-[#020617] shadow-emerald-500/20'
                        }`}>
                        {loading ? 'PROCESSING...' : isDragging ? 'DROP HERE' : 'LOAD DATASET'}
                    </div>
                </label>
            </div>

            {/* Privacy Badge */}
            <div className="mt-12 max-w-xl mx-auto">
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <ShieldCheck className="text-emerald-500" size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                            <Lock size={10} /> Privacy-First Architecture
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            Data Anda tersimpan <span className="text-white font-bold">100% di browser Anda</span>. Tidak ada yang dikirim ke server kami.
                            Developer dan user lain <span className="text-emerald-400 font-bold">tidak bisa mengakses</span> data Anda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
