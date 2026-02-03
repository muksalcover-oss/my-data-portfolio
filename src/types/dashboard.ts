export interface Metrics {
    totalRevenue: number;
    totalProfit: number;
    transactionCount: number;
    profitMargin: number;
    cogs: number;
    opex: number;
    confidence: number;
    anomalies: Array<{ row: number; field: string; value: number; issue: string; severity: string }>;
    quality: number;
}

export interface AIResult {
    summary?: string;
    insights?: Array<{ category: string; title: string; description: string }>;
    recommendations?: string[];
    // Sometimes AI returns generic structure, keeping it flexible if needed
    [key: string]: any;
}

export interface MappingState {
    revenue: string;
    profit: string;
    region: string;
    category: string;
}
