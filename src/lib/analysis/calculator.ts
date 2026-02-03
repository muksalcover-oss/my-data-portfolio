/**
 * ARDI ANALIS - Core Calculation Engine
 * Accurate metrics calculation for CSV data analysis
 */

export type CSVRow = Record<string, string>;

export interface ColumnMapping {
    revenue: string;
    profit?: string;
    region?: string;
    category?: string;
    quantity?: string;
    date?: string;
}

export interface DataMetrics {
    // Core metrics
    totalRevenue: number;
    totalProfit: number;
    transactionCount: number;
    avgTransactionValue: number;

    // Profitability
    profitMargin: number;
    grossProfit: number;

    // Derived business metrics
    estimatedMonthlyCOGS: number;
    estimatedMonthlyOpEx: number;
    netMargin: number;

    // Distribution
    byRegion: Record<string, RegionMetrics>;
    byCategory: Record<string, CategoryMetrics>;

    // Data quality
    confidence: number;
    dataQuality: DataQuality;
    anomalies: Anomaly[];
}

export interface RegionMetrics {
    count: number;
    totalRevenue: number;
    totalProfit: number;
    avgTransaction: number;
    profitMargin: number;
}

export interface CategoryMetrics {
    count: number;
    totalRevenue: number;
    totalProfit: number;
    avgTransaction: number;
    profitMargin: number;
}

export interface DataQuality {
    validRows: number;
    invalidRows: number;
    missingValues: number;
    qualityScore: number; // 0-100
}

export interface Anomaly {
    row: number;
    field: string;
    value: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
}

// Industry standard COGS ratios
const COGS_RATIOS: Record<string, number> = {
    'Electronics': 0.55,
    'Accessories': 0.40,
    'Office': 0.45,
    'Kuliner': 0.35,
    'Jasa': 0.20,
    'Retail': 0.50,
    'default': 0.47
};

// Standard operating expense ratio
const OPEX_RATIO = 0.109; // 10.9% (8% fulfillment + 2.9% payment)

/**
 * Parse numeric value from string, handling various formats
 */
export function parseNumeric(value: string | undefined | null): number {
    if (!value) return 0;
    // Remove currency symbols, commas, spaces
    const cleaned = value.toString().replace(/[Rp$,\s]/gi, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Group rows by a field and calculate aggregates
 */
export function groupByField(
    rows: CSVRow[],
    fieldName: string,
    mapping: ColumnMapping
): Record<string, RegionMetrics> {
    const groups: Record<string, CSVRow[]> = {};

    rows.forEach(row => {
        const key = row[fieldName] || 'Unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
    });

    const result: Record<string, RegionMetrics> = {};

    Object.entries(groups).forEach(([key, groupRows]) => {
        const totalRevenue = groupRows.reduce((sum, r) => sum + parseNumeric(r[mapping.revenue]), 0);
        const totalProfit = mapping.profit !== undefined
            ? groupRows.reduce((sum, r) => sum + parseNumeric(r[mapping.profit as string]), 0)
            : totalRevenue * 0.17; // Default 17% margin estimate

        result[key] = {
            count: groupRows.length,
            totalRevenue,
            totalProfit,
            avgTransaction: totalRevenue / groupRows.length,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
        };
    });

    return result;
}

/**
 * Detect anomalies in the data
 */
export function detectAnomalies(
    rows: CSVRow[],
    mapping: ColumnMapping
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Calculate mean and std for revenue
    const revenues = rows.map(r => parseNumeric(r[mapping.revenue])).filter(v => v > 0);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const std = Math.sqrt(revenues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / revenues.length);

    rows.forEach((row, index) => {
        const revenue = parseNumeric(row[mapping.revenue]);
        const profit = mapping.profit ? parseNumeric(row[mapping.profit]) : null;

        // Check for zero/negative revenue
        if (revenue <= 0) {
            anomalies.push({
                row: index + 1,
                field: mapping.revenue,
                value: row[mapping.revenue] || 'empty',
                issue: 'Revenue is zero or negative',
                severity: 'high'
            });
        }

        // Check for outliers (more than 3 std from mean)
        if (revenue > mean + 3 * std || revenue < mean - 3 * std) {
            anomalies.push({
                row: index + 1,
                field: mapping.revenue,
                value: revenue.toString(),
                issue: `Outlier: significantly different from average (${mean.toFixed(2)})`,
                severity: 'medium'
            });
        }

        // Check for profit > revenue (impossible)
        if (profit !== null && profit > revenue) {
            anomalies.push({
                row: index + 1,
                field: mapping.profit!,
                value: profit.toString(),
                issue: 'Profit exceeds revenue (impossible)',
                severity: 'high'
            });
        }

        // Check for negative profit margin below -50%
        if (profit !== null && revenue > 0 && (profit / revenue) < -0.5) {
            anomalies.push({
                row: index + 1,
                field: mapping.profit!,
                value: `${((profit / revenue) * 100).toFixed(1)}%`,
                issue: 'Extremely negative profit margin',
                severity: 'medium'
            });
        }
    });

    return anomalies;
}

/**
 * Assess data quality
 */
export function assessDataQuality(
    rows: CSVRow[],
    mapping: ColumnMapping
): DataQuality {
    let validRows = 0;
    let invalidRows = 0;
    let missingValues = 0;

    rows.forEach(row => {
        const revenue = row[mapping.revenue];
        const hasRevenue = revenue && parseNumeric(revenue) > 0;

        if (hasRevenue) {
            validRows++;
        } else {
            invalidRows++;
        }

        // Check for missing mapped values
        Object.values(mapping).forEach(colName => {
            if (colName && (!row[colName] || row[colName].trim() === '')) {
                missingValues++;
            }
        });
    });

    const qualityScore = Math.round((validRows / rows.length) * 100);

    return { validRows, invalidRows, missingValues, qualityScore };
}

/**
 * Calculate confidence score based on data quality and consistency
 */
export function calculateConfidence(
    rows: CSVRow[],
    mapping: ColumnMapping,
    anomalies: Anomaly[],
    dataQuality: DataQuality
): number {
    let confidence = 100;

    // Penalize for low quality score
    confidence -= (100 - dataQuality.qualityScore) * 0.5;

    // Penalize for anomalies
    const highSeverity = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
    confidence -= highSeverity * 5;
    confidence -= mediumSeverity * 2;

    // Penalize for small dataset
    if (rows.length < 100) confidence -= 10;
    if (rows.length < 50) confidence -= 15;

    // Penalize if no profit column
    if (!mapping.profit) confidence -= 15;

    return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Main calculation function - analyzes CSV data and returns metrics
 */
export function calculateMetrics(
    rows: CSVRow[],
    mapping: ColumnMapping,
    sector: string = 'default'
): DataMetrics {
    if (rows.length === 0) {
        throw new Error('No data rows provided');
    }

    // Core calculations
    const totalRevenue = rows.reduce((sum, r) => sum + parseNumeric(r[mapping.revenue]), 0);
    const transactionCount = rows.length;
    const avgTransactionValue = totalRevenue / transactionCount;

    // Profit calculations
    let totalProfit: number;
    if (mapping.profit) {
        totalProfit = rows.reduce((sum, r) => sum + parseNumeric(r[mapping.profit!]), 0);
    } else {
        // Estimate profit using industry COGS ratio
        const cogsRatio = COGS_RATIOS[sector] || COGS_RATIOS['default'];
        const estimatedCOGS = totalRevenue * cogsRatio;
        const estimatedOpEx = totalRevenue * OPEX_RATIO;
        totalProfit = totalRevenue - estimatedCOGS - estimatedOpEx;
    }

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Cost structure
    const cogsRatio = COGS_RATIOS[sector] || COGS_RATIOS['default'];
    const estimatedMonthlyCOGS = totalRevenue * cogsRatio;
    const estimatedMonthlyOpEx = totalRevenue * OPEX_RATIO;
    const grossProfit = totalRevenue - estimatedMonthlyCOGS;
    const netMargin = ((totalRevenue - estimatedMonthlyCOGS - estimatedMonthlyOpEx) / totalRevenue) * 100;

    // Group analysis
    const byRegion = mapping.region
        ? groupByField(rows, mapping.region, mapping)
        : {};
    const byCategory = mapping.category
        ? groupByField(rows, mapping.category, mapping)
        : {};

    // Quality assessment
    const anomalies = detectAnomalies(rows, mapping);
    const dataQuality = assessDataQuality(rows, mapping);
    const confidence = calculateConfidence(rows, mapping, anomalies, dataQuality);

    return {
        totalRevenue,
        totalProfit,
        transactionCount,
        avgTransactionValue,
        profitMargin,
        grossProfit,
        estimatedMonthlyCOGS,
        estimatedMonthlyOpEx,
        netMargin,
        byRegion,
        byCategory,
        confidence,
        dataQuality,
        anomalies
    };
}

/**
 * Generate business profile from metrics (for dashboard compatibility)
 */
export function metricsToBusinessProfile(metrics: DataMetrics, fileName: string) {
    return {
        name: fileName,
        sector: 'Dataset CSV',
        monthly_revenue: metrics.totalRevenue,
        monthly_debt: metrics.estimatedMonthlyCOGS,
        cash_reserve: metrics.grossProfit,
        isManual: false,
        // Extended metrics
        metrics: {
            profitMargin: metrics.profitMargin,
            netMargin: metrics.netMargin,
            transactionCount: metrics.transactionCount,
            avgTransaction: metrics.avgTransactionValue,
            confidence: metrics.confidence,
            dataQuality: metrics.dataQuality.qualityScore
        }
    };
}
