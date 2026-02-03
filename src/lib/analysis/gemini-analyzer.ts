/**
 * ARDI ANALIS - Groq AI Analyzer
 * AI-powered analysis using Groq's free Llama API
 */

import type { DataMetrics } from './calculator';

export interface AIAnalysisRequest {
    metrics: DataMetrics;
    dataContext?: {
        fileName?: string;
        sector?: string;
        rowCount?: number;
    };
}

export interface AIInsight {
    category: 'revenue' | 'profitability' | 'risk' | 'opportunity' | 'data_quality';
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
    recommendation?: string;
}

export interface AIAnalysisResult {
    success: boolean;
    insights: AIInsight[];
    summary: string;
    riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
    };
    recommendations: string[];
    confidence: number;
    error?: string;
}

// Groq API configuration (OpenAI-compatible endpoint)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Build prompt for AI analysis
 */
function buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { metrics, dataContext } = request;

    return `Anda adalah analis bisnis UMKM Indonesia yang ahli. Analisis data berikut dan berikan insight dalam format JSON.

DATA BISNIS:
- Total Revenue: Rp ${metrics.totalRevenue.toLocaleString('id-ID')}
- Total Profit: Rp ${metrics.totalProfit.toLocaleString('id-ID')}
- Profit Margin: ${metrics.profitMargin.toFixed(2)}%
- Net Margin: ${metrics.netMargin.toFixed(2)}%
- Jumlah Transaksi: ${metrics.transactionCount}
- Rata-rata Transaksi: Rp ${metrics.avgTransactionValue.toLocaleString('id-ID')}
- COGS (Estimasi): Rp ${metrics.estimatedMonthlyCOGS.toLocaleString('id-ID')}
- OpEx (Estimasi): Rp ${metrics.estimatedMonthlyOpEx.toLocaleString('id-ID')}
- Gross Profit: Rp ${metrics.grossProfit.toLocaleString('id-ID')}
- Data Quality Score: ${metrics.dataQuality.qualityScore}%
- Anomalies Detected: ${metrics.anomalies.length}
${dataContext?.sector ? `- Sektor: ${dataContext.sector}` : ''}
${dataContext?.fileName ? `- Dataset: ${dataContext.fileName}` : ''}

DISTRIBUSI PER REGION:
${Object.entries(metrics.byRegion).map(([region, data]) =>
        `- ${region}: ${data.count} transaksi, Revenue Rp ${data.totalRevenue.toLocaleString('id-ID')}, Margin ${data.profitMargin.toFixed(1)}%`
    ).join('\n') || 'Tidak ada data region'}

DISTRIBUSI PER KATEGORI:
${Object.entries(metrics.byCategory).map(([cat, data]) =>
        `- ${cat}: ${data.count} transaksi, Revenue Rp ${data.totalRevenue.toLocaleString('id-ID')}, Margin ${data.profitMargin.toFixed(1)}%`
    ).join('\n') || 'Tidak ada data kategori'}

Berikan analisis dalam format JSON berikut (HANYA JSON, tanpa markdown):
{
  "summary": "Ringkasan singkat kondisi bisnis dalam 1-2 kalimat bahasa Indonesia",
  "insights": [
    {
      "category": "revenue|profitability|risk|opportunity|data_quality",
      "title": "Judul insight singkat",
      "description": "Penjelasan detail",
      "confidence": 0-100,
      "actionable": true/false,
      "recommendation": "Saran aksi jika actionable"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["faktor risiko 1", "faktor risiko 2"]
  },
  "recommendations": [
    "Rekomendasi 1 dalam bahasa Indonesia",
    "Rekomendasi 2 dalam bahasa Indonesia",
    "Rekomendasi 3 dalam bahasa Indonesia"
  ],
  "confidence": 0-100
}`;
}

/**
 * Parse AI response to structured result
 */
function parseAIResponse(text: string): Partial<AIAnalysisResult> {
    try {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
    } catch {
        // Fallback to manual parsing
        return {
            summary: text.slice(0, 200),
            insights: [],
            recommendations: [],
            confidence: 50
        };
    }
}

/**
 * Generate fallback analysis when AI is unavailable
 */
export function generateFallbackAnalysis(metrics: DataMetrics): AIAnalysisResult {
    const insights: AIInsight[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];

    // Revenue analysis
    if (metrics.totalRevenue > 0) {
        insights.push({
            category: 'revenue',
            title: 'Performa Revenue',
            description: `Total revenue Rp ${metrics.totalRevenue.toLocaleString('id-ID')} dengan ${metrics.transactionCount} transaksi.`,
            confidence: 90,
            actionable: false
        });
    }

    // Profitability analysis
    if (metrics.profitMargin < 10) {
        insights.push({
            category: 'profitability',
            title: 'Margin Profit Rendah',
            description: `Profit margin ${metrics.profitMargin.toFixed(1)}% di bawah rata-rata industri (15-20%).`,
            confidence: 85,
            actionable: true,
            recommendation: 'Evaluasi struktur biaya dan cari peluang efisiensi.'
        });
        recommendations.push('Lakukan negosiasi ulang dengan supplier untuk menurunkan COGS.');
        riskFactors.push('Margin profit rendah');
    } else if (metrics.profitMargin > 25) {
        insights.push({
            category: 'profitability',
            title: 'Margin Profit Sehat',
            description: `Profit margin ${metrics.profitMargin.toFixed(1)}% menunjukkan bisnis yang sehat.`,
            confidence: 85,
            actionable: true,
            recommendation: 'Pertahankan dan pertimbangkan ekspansi.'
        });
    }

    // Data quality analysis
    if (metrics.dataQuality.qualityScore < 80) {
        insights.push({
            category: 'data_quality',
            title: 'Kualitas Data Perlu Ditingkatkan',
            description: `Skor kualitas data ${metrics.dataQuality.qualityScore}% menunjukkan ada ${metrics.dataQuality.invalidRows} baris tidak valid.`,
            confidence: 95,
            actionable: true,
            recommendation: 'Bersihkan data dan pastikan format konsisten.'
        });
        recommendations.push('Validasi dan bersihkan data input untuk analisis lebih akurat.');
        riskFactors.push('Kualitas data rendah');
    }

    // Anomaly analysis
    if (metrics.anomalies.length > 10) {
        insights.push({
            category: 'risk',
            title: 'Banyak Anomali Terdeteksi',
            description: `Ditemukan ${metrics.anomalies.length} anomali yang perlu diperiksa.`,
            confidence: 80,
            actionable: true,
            recommendation: 'Review transaksi yang flagged sebagai anomali.'
        });
        riskFactors.push('Anomali data tinggi');
    }

    // Opportunity analysis based on region/category performance
    const topRegion = Object.entries(metrics.byRegion).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)[0];
    if (topRegion) {
        insights.push({
            category: 'opportunity',
            title: 'Region Top Performer',
            description: `${topRegion[0]} adalah region dengan revenue tertinggi (Rp ${topRegion[1].totalRevenue.toLocaleString('id-ID')}).`,
            confidence: 88,
            actionable: true,
            recommendation: 'Fokuskan resource marketing di region ini.'
        });
        recommendations.push(`Perkuat penetrasi pasar di region ${topRegion[0]}.`);
    }

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskFactors.length >= 3 || metrics.profitMargin < 5) {
        riskLevel = 'high';
    } else if (riskFactors.length >= 1 || metrics.profitMargin < 10) {
        riskLevel = 'medium';
    }

    // Summary
    const summary = `Bisnis mencatat revenue Rp ${metrics.totalRevenue.toLocaleString('id-ID')} dengan margin ${metrics.profitMargin.toFixed(1)}%. ` +
        (riskLevel === 'high' ? 'Perlu perhatian pada beberapa area risiko.' :
            riskLevel === 'medium' ? 'Kondisi cukup stabil dengan ruang perbaikan.' :
                'Kondisi bisnis sehat secara keseluruhan.');

    return {
        success: true,
        insights,
        summary,
        riskAssessment: {
            level: riskLevel,
            factors: riskFactors
        },
        recommendations: recommendations.length > 0 ? recommendations : ['Pertahankan kinerja saat ini.', 'Monitor tren secara berkala.'],
        confidence: metrics.confidence
    };
}

/**
 * Main function: Analyze data with Groq AI (Llama 3)
 */
export async function analyzeWithAI(
    request: AIAnalysisRequest,
    apiKey?: string
): Promise<AIAnalysisResult> {
    const groqApiKey = apiKey || process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    // If no API key, use fallback analysis
    if (!groqApiKey) {
        console.warn('No GROQ_API_KEY found, using fallback analysis');
        return generateFallbackAnalysis(request.metrics);
    }

    try {
        const prompt = buildAnalysisPrompt(request);

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Free tier model
                messages: [
                    {
                        role: 'system',
                        content: 'Anda adalah analis bisnis UMKM Indonesia yang ahli. Selalu berikan respons dalam format JSON yang valid.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', errorText);
            return {
                ...generateFallbackAnalysis(request.metrics),
                error: `Groq API error: ${response.status}`
            };
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            return {
                ...generateFallbackAnalysis(request.metrics),
                error: 'Empty response from Groq'
            };
        }

        const parsed = parseAIResponse(generatedText);

        return {
            success: true,
            insights: parsed.insights || [],
            summary: parsed.summary || 'Analisis berhasil dilakukan.',
            riskAssessment: parsed.riskAssessment || { level: 'medium', factors: [] },
            recommendations: parsed.recommendations || [],
            confidence: parsed.confidence || request.metrics.confidence
        };

    } catch (error) {
        console.error('Groq analysis error:', error);
        return {
            ...generateFallbackAnalysis(request.metrics),
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Backward compatibility alias
export const analyzeWithGemini = analyzeWithAI;
