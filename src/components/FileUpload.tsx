'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { parseCSVStream } from '@/lib/csvParser';
import { processData } from '@/lib/dataProcessor';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isProcessing, progress, setIsProcessing, setProgress, setRawData, setColumns, setSummary } = useDataStore();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        setError(null);
        setIsProcessing(true);
        setProgress(0);

        try {
            // 1. Parse CSV
            const result = await parseCSVStream(file, (p) => setProgress(p));

            // 2. Process Data
            const { columns, summary } = processData(result.data);

            // 3. Update Store
            setRawData(result.data);
            setColumns(columns);
            setSummary(summary);

        } catch (err: any) {
            setError(err.message || 'Error processing file');
        } finally {
            setIsProcessing(false);
            setProgress(100);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-10">
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Processing Document...</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "linear", duration: 0.1 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-200 ease-in-out ${isDragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                    } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <motion.div
                        animate={{ y: isDragging ? -10 : 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <UploadCloud className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-500" />
                    </motion.div>
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        CSV files only (Max 10,000 rows processed)
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                />
            </label>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 flex items-center gap-2"
                >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </motion.div>
            )}
        </div>
    );
}
