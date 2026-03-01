export type ColumnType = 'numeric' | 'categorical' | 'date';

export interface ColumnInfo {
    name: string;
    type: ColumnType;
    uniqueCount: number;
}

export interface SummaryStats {
    [colName: string]: {
        min?: number;
        max?: number;
        mean?: number;
        median?: number;
        uniqueCount: number;
        topValues?: { value: string | number; count: number }[];
    }
}

// Helper to determine if a value is a date
const isDate = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    // Basic check for simple date formats like YYYY-MM-DD or extended ISO
    const d = new Date(value);
    return !isNaN(d.getTime()) && value.length > 5; // avoiding matches on numbers parsed as dates
}

export function processData(data: any[]): { columns: ColumnInfo[], summary: SummaryStats } {
    if (data.length === 0) return { columns: [], summary: {} };

    const columns: ColumnInfo[] = [];
    const summary: SummaryStats = {};

    const sampleSize = Math.min(data.length, 100);
    const sample = data.slice(0, sampleSize);

    // Get all keys from the first few rows just in case
    const keys = new Set<string>();
    sample.forEach(row => Object.keys(row).forEach(k => keys.add(k)));

    keys.forEach(key => {
        // Determine type
        let numCount = 0;
        let dateCount = 0;
        let nonNullCount = 0;

        sample.forEach(row => {
            const val = row[key];
            if (val !== null && val !== undefined && val !== '') {
                nonNullCount++;
                if (typeof val === 'number') numCount++;
                else if (isDate(val)) dateCount++;
            }
        });

        let type: ColumnType = 'categorical';
        if (nonNullCount > 0) {
            if (numCount / nonNullCount > 0.8) type = 'numeric';
            else if (dateCount / nonNullCount > 0.8) type = 'date';
        }

        // Generate stats over FULL data
        const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined && v !== '');
        const uniqueValues = new Set(values);

        let stats: any = { uniqueCount: uniqueValues.size };

        if (type === 'numeric') {
            const nums = values.map(Number).filter(n => !isNaN(n));
            if (nums.length > 0) {
                nums.sort((a, b) => a - b);
                stats.min = nums[0];
                stats.max = nums[nums.length - 1];
                stats.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
                stats.median = nums[Math.floor(nums.length / 2)];
            }
        } else {
            // Get top values for categorical
            const counts: Record<string, number> = {};
            values.forEach(v => {
                counts[String(v)] = (counts[String(v)] || 0) + 1;
            });
            stats.topValues = Object.entries(counts)
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // top 5
        }

        columns.push({ name: key, type, uniqueCount: uniqueValues.size });
        summary[key] = stats;
    });

    return { columns, summary };
}
