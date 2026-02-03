import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipe data untuk input scoring
export interface BusinessData {
    monthlyRevenue: number;
    monthlyExpense: number;
    debt: number;
    businessAgeMonths: number;
    sector: string;
}

export interface CreditScoreResult {
    score: number; // 300 - 850
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    maxLoanLimit: number;
    recommendation: string;
    riskLevel: 'Low' | 'Medium' | 'High';
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Algoritma Scoring Sederhana
export const calculateCreditScore = (data: BusinessData): CreditScoreResult => {
    let score = 300; // Base score

    // 1. Cashflow Capacity (Max 250 points)
    const netIncome = data.monthlyRevenue - data.monthlyExpense;
    const debtToIncomeRatio = data.debt > 0 ? data.monthlyRevenue / data.debt : 10; // Higher is better

    if (netIncome > 10_000_000) score += 250;
    else if (netIncome > 5_000_000) score += 150;
    else if (netIncome > 0) score += 50;

    // 2. Debt Service Ratio (Max 150 points)
    if (debtToIncomeRatio > 5) score += 150;
    else if (debtToIncomeRatio > 2) score += 100;
    else score += 50;

    // 3. Business Stability (Max 150 points)
    if (data.businessAgeMonths > 24) score += 150;
    else if (data.businessAgeMonths > 12) score += 100;
    else score += 50;

    // Cap at 850
    if (score > 850) score = 850;

    // Grade & Limit logic
    let grade: CreditScoreResult['grade'] = 'E';
    let maxLoanLimit = 0;
    let riskLevel: CreditScoreResult['riskLevel'] = 'High';
    let recommendation = 'Perbaiki cashflow Anda sebelum mengajukan pinjaman.';

    if (score >= 750) {
        grade = 'A';
        riskLevel = 'Low';
        maxLoanLimit = netIncome * 12; // 1 Tahun Net Income
        recommendation = 'Kondisi bisnis sangat sehat. Sangat direkomendasikan untuk ekspansi.';
    } else if (score >= 650) {
        grade = 'B';
        riskLevel = 'Low';
        maxLoanLimit = netIncome * 8;
        recommendation = 'Bisnis sehat. Layak mendapatkan akses modal kerja.';
    } else if (score >= 550) {
        grade = 'C';
        riskLevel = 'Medium';
        maxLoanLimit = netIncome * 4;
        recommendation = 'Cukup sehat, namun perlu hati-hati dengan rasio utang.';
    } else if (score >= 450) {
        grade = 'D';
        riskLevel = 'High';
        maxLoanLimit = netIncome * 2;
        recommendation = 'Berisiko. Fokus pada efisiensi biaya operasional.';
    }

    return { score, grade, maxLoanLimit, recommendation, riskLevel };
};

export const generateCreditPDF = (businessName: string, businessData: BusinessData, scoreResult: CreditScoreResult) => {

    const doc = new jsPDF();

    // Color Palette
    const primaryColor = [16, 185, 129] as [number, number, number]; // Emerald 500
    const darkColor = [2, 6, 23] as [number, number, number]; // Slate 950

    // Header Background
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SERTIFIKAT KELAYAKAN KREDIT', 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Emerald Text
    doc.text('Powered by Ardi Analis - Financial Inclusion Bridge', 105, 28, { align: 'center' });

    // Business Info Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Profil Bisnis', 14, 55);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const infoData = [
        ['Nama Bisnis', businessName],
        ['Sektor', businessData.sector],
        ['Lama Operasi', `${businessData.businessAgeMonths} Bulan`],
        ['Pendapatan Bulanan', formatCurrency(businessData.monthlyRevenue)],
        ['Biaya Operasional', formatCurrency(businessData.monthlyExpense)],
    ];

    autoTable(doc, {
        startY: 60,
        head: [],
        body: infoData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });

    // Score Result Section (Visual Emphasis)
    const tableState = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    const currentY = tableState.finalY + 15;

    doc.setFillColor(240, 253, 244); // Very light emerald
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(14, currentY, 182, 50, 3, 3, 'FD');

    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.text('Skor Kredit Bisnis Anda', 20, currentY + 12);

    doc.setFontSize(36);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${scoreResult.score}`, 20, currentY + 30);

    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text(`/ 850`, 60, currentY + 30);

    // Grade Badge
    doc.setFillColor(...primaryColor);
    doc.circle(160, currentY + 25, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(scoreResult.grade, 160, currentY + 32, { align: 'center' });
    doc.setFontSize(8);
    doc.text('GRADE', 160, currentY + 14, { align: 'center' });

    // Analysis Details
    const detailY = currentY + 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Analisis Kelayakan', 14, detailY);

    const analysisData = [
        ['Limit Kredit Maksimal', formatCurrency(scoreResult.maxLoanLimit)],
        ['Tingkat Risiko', scoreResult.riskLevel],
        ['Rekomendasi AI', scoreResult.recommendation],
    ];

    autoTable(doc, {
        startY: detailY + 5,
        body: analysisData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    // Footer Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem Ardi Analis berdasarkan data input user.', 14, 280);
    doc.text('Validitas data bergantung pada kebenaran input pengguna. Bukan jaminan persetujuan bank.', 14, 285);

    doc.save(`Credit_Score_${businessName.replace(/\s+/g, '_')}.pdf`);
};
