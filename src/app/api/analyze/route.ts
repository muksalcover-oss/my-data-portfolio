import { NextRequest, NextResponse } from 'next/server';
import { calculateMetrics, metricsToBusinessProfile, type ColumnMapping, type CSVRow } from '@/lib/analysis/calculator';
import { validateAll } from '@/lib/analysis/validators';

export interface AnalyzeRequest {
    data: CSVRow[];
    headers: string[];
    mapping: ColumnMapping;
    sector?: string;
}

export interface AnalyzeResponse {
    success: boolean;
    metrics?: ReturnType<typeof calculateMetrics>;
    businessProfile?: ReturnType<typeof metricsToBusinessProfile>;
    validation?: ReturnType<typeof validateAll>;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
    try {
        const body = await request.json() as AnalyzeRequest;

        // Validate request
        if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No data provided'
            }, { status: 400 });
        }

        if (!body.mapping || !body.mapping.revenue) {
            return NextResponse.json({
                success: false,
                error: 'Column mapping with revenue field is required'
            }, { status: 400 });
        }

        const headers = body.headers || Object.keys(body.data[0]);

        // Run validation
        const validation = validateAll(body.data, headers, body.mapping);

        if (!validation.isValid) {
            return NextResponse.json({
                success: false,
                validation,
                error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`
            }, { status: 400 });
        }

        // Calculate metrics
        const metrics = calculateMetrics(body.data, body.mapping, body.sector || 'default');

        // Generate business profile
        const businessProfile = metricsToBusinessProfile(metrics, 'API Analysis');

        return NextResponse.json({
            success: true,
            metrics,
            businessProfile,
            validation
        });

    } catch (error) {
        console.error('Analysis API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// GET endpoint for health check
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/analyze',
        methods: ['POST'],
        description: 'Analyze CSV data and return metrics'
    });
}
