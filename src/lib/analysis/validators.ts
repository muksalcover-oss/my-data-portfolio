/**
 * ARDI ANALIS - Data Validation Engine
 * Validates CSV structure and data quality
 */

export type CSVRow = Record<string, string>;

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    field?: string;
    row?: number;
}

export interface ValidationWarning {
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
}

export interface ColumnMapping {
    revenue: string;
    profit?: string;
    region?: string;
    category?: string;
}

// Common column name patterns for auto-detection
const REVENUE_PATTERNS = ['sales', 'revenue', 'omset', 'penjualan', 'total', 'amount', 'price'];
const PROFIT_PATTERNS = ['profit', 'laba', 'keuntungan', 'margin', 'net'];
const REGION_PATTERNS = ['region', 'wilayah', 'area', 'location', 'lokasi', 'kota', 'city'];
const CATEGORY_PATTERNS = ['category', 'kategori', 'type', 'jenis', 'product', 'produk'];

/**
 * Validate CSV structure - check if required columns exist
 */
export function validateCSVStructure(
    headers: string[],
    mapping: ColumnMapping
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if headers exist
    if (!headers || headers.length === 0) {
        errors.push({
            code: 'NO_HEADERS',
            message: 'CSV file has no headers'
        });
        return { isValid: false, errors, warnings };
    }

    // Check minimum columns
    if (headers.length < 2) {
        errors.push({
            code: 'INSUFFICIENT_COLUMNS',
            message: 'CSV must have at least 2 columns'
        });
    }

    // Check if mapped revenue column exists
    if (!mapping.revenue) {
        errors.push({
            code: 'NO_REVENUE_MAPPING',
            message: 'Revenue column must be mapped'
        });
    } else if (!headers.includes(mapping.revenue)) {
        errors.push({
            code: 'REVENUE_COLUMN_MISSING',
            message: `Revenue column "${mapping.revenue}" not found in CSV`,
            field: mapping.revenue
        });
    }

    // Check optional columns
    if (mapping.profit && !headers.includes(mapping.profit)) {
        errors.push({
            code: 'PROFIT_COLUMN_MISSING',
            message: `Profit column "${mapping.profit}" not found in CSV`,
            field: mapping.profit
        });
    }

    if (mapping.region && !headers.includes(mapping.region)) {
        warnings.push({
            code: 'REGION_COLUMN_MISSING',
            message: `Region column "${mapping.region}" not found`,
            field: mapping.region,
            suggestion: 'Regional analysis will be skipped'
        });
    }

    // Suggest profit column if not mapped
    if (!mapping.profit) {
        warnings.push({
            code: 'NO_PROFIT_COLUMN',
            message: 'No profit column mapped',
            suggestion: 'Profit will be estimated using industry averages (less accurate)'
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate numeric fields in data rows
 */
export function validateNumericFields(
    rows: CSVRow[],
    mapping: ColumnMapping
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    let invalidRevenueCount = 0;
    let negativeRevenueCount = 0;
    let zeroRevenueCount = 0;

    rows.forEach((row, index) => {
        const revenueStr = row[mapping.revenue];
        if (!revenueStr || revenueStr.trim() === '') {
            invalidRevenueCount++;
            return;
        }

        const revenue = parseFloat(revenueStr.replace(/[^0-9.-]/g, ''));

        if (isNaN(revenue)) {
            invalidRevenueCount++;
        } else if (revenue < 0) {
            negativeRevenueCount++;
        } else if (revenue === 0) {
            zeroRevenueCount++;
        }
    });

    // Report issues
    const totalRows = rows.length;
    const invalidPercent = (invalidRevenueCount / totalRows) * 100;

    if (invalidPercent > 50) {
        errors.push({
            code: 'HIGH_INVALID_RATE',
            message: `${invalidPercent.toFixed(1)}% of revenue values are invalid or empty`,
            field: mapping.revenue
        });
    } else if (invalidRevenueCount > 0) {
        warnings.push({
            code: 'SOME_INVALID_VALUES',
            message: `${invalidRevenueCount} rows have invalid revenue values`,
            field: mapping.revenue,
            suggestion: 'These rows will be treated as zero revenue'
        });
    }

    if (negativeRevenueCount > 0) {
        warnings.push({
            code: 'NEGATIVE_VALUES',
            message: `${negativeRevenueCount} rows have negative revenue (returns/refunds?)`,
            field: mapping.revenue,
            suggestion: 'Consider if these should be excluded from analysis'
        });
    }

    if (zeroRevenueCount > totalRows * 0.1) {
        warnings.push({
            code: 'MANY_ZERO_VALUES',
            message: `${zeroRevenueCount} rows have zero revenue (${((zeroRevenueCount / totalRows) * 100).toFixed(1)}%)`,
            field: mapping.revenue,
            suggestion: 'This may indicate data quality issues'
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Overall data quality validation
 */
export function validateDataQuality(
    rows: CSVRow[],
    headers: string[],
    mapping: ColumnMapping
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check row count
    if (rows.length === 0) {
        errors.push({
            code: 'NO_DATA',
            message: 'CSV file contains no data rows'
        });
        return { isValid: false, errors, warnings };
    }

    if (rows.length < 10) {
        warnings.push({
            code: 'SMALL_DATASET',
            message: `Only ${rows.length} rows - analysis may not be statistically significant`,
            suggestion: 'Consider using more data for reliable insights'
        });
    }

    // Check for duplicate headers
    const uniqueHeaders = new Set(headers);
    if (uniqueHeaders.size !== headers.length) {
        warnings.push({
            code: 'DUPLICATE_HEADERS',
            message: 'CSV contains duplicate column names',
            suggestion: 'This may cause mapping issues'
        });
    }

    // Check for empty columns
    headers.forEach(header => {
        const nonEmptyCount = rows.filter(r => r[header] && r[header].trim() !== '').length;
        const emptyPercent = ((rows.length - nonEmptyCount) / rows.length) * 100;

        if (emptyPercent > 80) {
            warnings.push({
                code: 'MOSTLY_EMPTY_COLUMN',
                message: `Column "${header}" is ${emptyPercent.toFixed(0)}% empty`,
                field: header,
                suggestion: 'Consider if this column is needed for analysis'
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Auto-detect column mappings based on header names
 */
export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
    const mapping: Partial<ColumnMapping> = {};

    const lowerHeaders = headers.map(h => h.toLowerCase());

    // Detect revenue column
    for (const pattern of REVENUE_PATTERNS) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.revenue = headers[index];
            break;
        }
    }

    // Detect profit column
    for (const pattern of PROFIT_PATTERNS) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.profit = headers[index];
            break;
        }
    }

    // Detect region column
    for (const pattern of REGION_PATTERNS) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.region = headers[index];
            break;
        }
    }

    // Detect category column
    for (const pattern of CATEGORY_PATTERNS) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.category = headers[index];
            break;
        }
    }

    return mapping;
}

/**
 * Full validation pipeline
 */
export function validateAll(
    rows: CSVRow[],
    headers: string[],
    mapping: ColumnMapping
): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    // Run all validations
    const structureResult = validateCSVStructure(headers, mapping);
    const numericResult = validateNumericFields(rows, mapping);
    const qualityResult = validateDataQuality(rows, headers, mapping);

    // Combine results
    allErrors.push(...structureResult.errors, ...numericResult.errors, ...qualityResult.errors);
    allWarnings.push(...structureResult.warnings, ...numericResult.warnings, ...qualityResult.warnings);

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    };
}
