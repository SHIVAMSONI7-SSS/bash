import Papa from 'papaparse';

export const MAX_ROWS = 10000;

export interface ParseResult {
    data: any[];
    errors: Papa.ParseError[];
}

export function parseCSVStream(
    file: File,
    onProgress: (progress: number) => void
): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        let rowCount = 0;
        const data: any[] = [];
        const errors: Papa.ParseError[] = [];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            // NOTE: worker:true is NOT used — it doesn't work reliably with Next.js/webpack
            //       and causes "cannot read meta" crashes on abort.
            step: (row, parser) => {
                if (rowCount >= MAX_ROWS) {
                    parser.abort();
                    return;
                }

                // Clean row: drop null/empty properties
                const cleanedRow = Object.fromEntries(
                    Object.entries(row.data as Record<string, any>).filter(
                        ([, v]) => v !== null && v !== '' && v !== undefined
                    )
                );

                if (Object.keys(cleanedRow).length > 0) {
                    data.push(cleanedRow);
                    rowCount++;
                }

                // Update progress every 500 rows
                if (rowCount % 500 === 0) {
                    onProgress(Math.min(95, Math.round((rowCount / MAX_ROWS) * 100)));
                }
            },
            complete: () => {
                onProgress(100);
                resolve({ data, errors });
            },
            error: (error) => {
                // PapaParse fires error + complete when aborted; only reject on real errors
                reject(error);
            }
        });
    });
}
