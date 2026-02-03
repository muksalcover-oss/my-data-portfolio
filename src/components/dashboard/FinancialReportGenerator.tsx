'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, Loader2 } from 'lucide-react';

interface ReportProps {
    metrics: {
        totalRevenue: number;
        totalProfit: number;
        profitMargin: number;
        confidence: number;
        quality: number;
        transactionCount: number;
        cogs: number;
        opex: number;
    };
    businessName?: string;
    ownerName?: string;
}

export const FinancialReportGenerator: React.FC<ReportProps> = ({
    metrics,
    businessName = "UMKM Mitra Ardi"
}) => {
    const [generating, setGenerating] = useState(false);

    const generatePDF = () => {
        setGenerating(true);
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // --- Header ---
        doc.setFillColor(2, 6, 23); // Corporate Dark
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("LAPORAN KINERJA FINANSIAL", 105, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text("Dianalisis oleh Ardi Precision Engine", 105, 26, { align: 'center' });

        // --- Business Info ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.text(`Nama Bisnis: ${businessName}`, 14, 55);
        doc.text(`Tanggal Laporan: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 14, 62);
        doc.text(`ID Laporan: ARDI-${Date.now().toString().slice(-6)}`, 14, 69);

        // --- Executive Summary ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Ringkasan Eksekutif", 14, 85);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryText = `Berdasarkan analisis terhadap ${metrics.transactionCount} transaksi, bisnis ini mencatatkan pendapatan total Rp ${metrics.totalRevenue.toLocaleString('id-ID')} dengan laba bersih (Net Profit) Rp ${metrics.totalProfit.toLocaleString('id-ID')}. Margin keuntungan tercatat sebesar ${metrics.profitMargin.toFixed(2)}%, yang mengindikasikan efisiensi operasional ${metrics.profitMargin > 20 ? 'SANGAT BAIK' : 'STABIL'}.`;
        doc.text(doc.splitTextToSize(summaryText, 180), 14, 92);

        // --- Financial Table ---
        autoTable(doc, {
            startY: 110,
            head: [['Metric Indikator', 'Nilai (IDR)', 'Keterangan']],
            body: [
                ['Total Revenue (Omzet)', `Rp ${metrics.totalRevenue.toLocaleString('id-ID')}`, 'Volume transaksi kotor'],
                ['Cost of Goods Sold (HPP)', `(Rp ${metrics.cogs.toLocaleString('id-ID')})`, 'Estimasi rata-rata industri'],
                ['Operating Expenses (OpEx)', `(Rp ${metrics.opex.toLocaleString('id-ID')})`, 'Fix 10.9% overhead'],
                ['Net Profit (Laba Bersih)', `Top ${metrics.totalProfit.toLocaleString('id-ID')}`, 'Take home pay aktual'],
            ],
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] },
            bodyStyles: { textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [241, 245, 249] },
            columnStyles: {
                1: { fontStyle: 'bold', halign: 'right' }
            }
        });

        // --- Health Metrics ---
        // Get final Y position from autoTable
        const tableState = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
        const finalY = tableState.finalY + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Indikator Kesehatan Data", 14, finalY);

        const healthData = [
            ['Data Confidence', `${metrics.confidence}%`, metrics.confidence > 80 ? 'HIGH' : 'MEDIUM'],
            ['Data Quality Score', `${metrics.quality}%`, metrics.quality > 80 ? 'CLEAN' : 'NOISY'],
            ['Margin Efficiency', `${metrics.profitMargin.toFixed(1)}%`, metrics.profitMargin > 15 ? 'HEALTHY' : 'LOW MARGIN'],
        ];

        autoTable(doc, {
            startY: finalY + 5,
            body: healthData,
            theme: 'grid',
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
        });

        // --- Footer Disclaimer ---
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Laporan ini dihasilkan secara otomatis dari data transaksi yang diunggah pengguna.", 105, 280, { align: 'center' });
        doc.text("Dapat digunakan sebagai lampiran pendukung untuk administrasi internal atau pengajuan kerjasama.", 105, 284, { align: 'center' });

        doc.save(`Laporan-Keuangan-${Date.now()}.pdf`);
        setGenerating(false);
    };

    return (
        <button
            onClick={generatePDF}
            disabled={generating}
            className="group relative flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
        >
            {generating ? (
                <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Generating PDF...</span>
                </>
            ) : (
                <>
                    <FileText size={16} className="text-emerald-500" />
                    <span>Download Laporan Keuangan (PDF)</span>
                    <Download size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </>
            )}
        </button>
    );
};
