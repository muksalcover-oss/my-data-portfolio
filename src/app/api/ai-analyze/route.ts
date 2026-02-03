import { NextRequest, NextResponse } from 'next/server';
import { calculateMetrics, type ColumnMapping, type CSVRow } from '@/lib/analysis/calculator';
import { analyzeWithGemini, generateFallbackAnalysis, type AIAnalysisResult } from '@/lib/analysis/gemini-analyzer';

export interface AIAnalyzeRequest {
    data: CSVRow[];
    mapping: ColumnMapping;
    sector?: string;
    fileName?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AIAnalysisResult>> {
    try {
        const body = await request.json() as AIAnalyzeRequest;

        // Validate request
        if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
            return NextResponse.json({
                success: false,
                insights: [],
                summary: '',
                riskAssessment: { level: 'high', factors: [] },
                recommendations: [],
                confidence: 0,
                error: 'No data provided'
            }, { status: 400 });
        }

        if (!body.mapping || !body.mapping.revenue) {
            return NextResponse.json({
                success: false,
                insights: [],
                summary: '',
                riskAssessment: { level: 'high', factors: [] },
                recommendations: [],
                confidence: 0,
                error: 'Column mapping with revenue field is required'
            }, { status: 400 });
        }

        // First calculate metrics
        const metrics = calculateMetrics(body.data, body.mapping, body.sector || 'default');

        // Then run AI analysis
        const aiResult = await analyzeWithGemini({
            metrics,
            dataContext: {
                fileName: body.fileName,
                sector: body.sector,
                rowCount: body.data.length
            }
        });

        return NextResponse.json(aiResult);

    } catch (error) {
        // Log to monitoring service in production (e.g., Sentry)

        // Return fallback analysis on error
        return NextResponse.json({
            success: false,
            insights: [],
            summary: 'Analisis gagal dilakukan.',
            riskAssessment: { level: 'high', factors: ['Error during analysis'] },
            recommendations: ['Pastikan data valid dan coba lagi.'],
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// GET endpoint for health check
export async function GET(): Promise<NextResponse> {
    const hasApiKey = !!process.env.GROQ_API_KEY || !!process.env.NEXT_PUBLIC_GROQ_API_KEY;

    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/ai-analyze',
        methods: ['POST'],
        description: 'AI-powered analysis using Groq (Llama 3.3)',
        groqConfigured: hasApiKey,
        fallbackAvailable: true
    });
}

