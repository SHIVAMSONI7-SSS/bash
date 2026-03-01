'use client';

import { useState, useMemo } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ROWS_PER_PAGE = 50;

export default function DataTable() {
    const { rawData, columns } = useDataStore();

    const [page, setPage] = useState(0);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const totalPages = Math.ceil(rawData.length / ROWS_PER_PAGE);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else setSortKey(null);
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setPage(0);
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return rawData;

        return [...rawData].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const comparison = valA > valB ? 1 : -1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [rawData, sortKey, sortDirection]);

    // Fast but simple client-side search across all columns
    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedData;
        const lowerSearch = searchTerm.toLowerCase();

        return sortedData.filter(row => {
            return Object.values(row).some(val =>
                val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
            );
        });
    }, [sortedData, searchTerm]);

    const filteredTotalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const activePage = Math.min(page, Math.max(0, filteredTotalPages - 1));

    const pageData = useMemo(() => {
        const start = activePage * ROWS_PER_PAGE;
        return filteredData.slice(start, start + ROWS_PER_PAGE);
    }, [filteredData, activePage]);

    if (rawData.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8 max-w-[90vw] mx-auto">
            {/* Table Header/Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Data Explorer</h2>
                    <span className="text-sm px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {filteredData.length.toLocaleString()} rows
                    </span>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-4 pr-10 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar" style={{ maxWidth: '100vw' }}>
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 w-full">
                        <tr>
                            <th className="px-6 py-4 font-medium sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-20 w-16">
                                #
                            </th>
                            {columns.map((col) => (
                                <th
                                    key={col.name}
                                    className={cn(
                                        "px-6 py-4 font-medium cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group select-none relative",
                                        sortKey === col.name ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200" : ""
                                    )}
                                    onClick={() => handleSort(col.name)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[200px]" title={col.name}>{col.name}</span>
                                        <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors ml-auto shrink-0">
                                            {sortKey === col.name ? (
                                                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {pageData.length > 0 ? (
                            pageData.map((row, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors"
                                >
                                    <td className="px-6 py-3 font-medium text-slate-400 dark:text-slate-500 sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                                        {activePage * ROWS_PER_PAGE + i + 1}
                                    </td>
                                    {columns.map(col => {
                                        const val = row[col.name];
                                        const isNum = col.type === 'numeric';
                                        return (
                                            <td
                                                key={col.name}
                                                className={cn(
                                                    "px-6 py-3 border-l-[1px] border-slate-50 dark:border-slate-800/50",
                                                    isNum ? "font-mono tabular-nums text-right text-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-400 max-w-xs truncate"
                                                )}
                                                title={val !== null ? String(val) : ''}
                                            >
                                                {val === null || val === undefined || val === ''
                                                    ? <span className="text-slate-300 dark:text-slate-600 italic">-</span>
                                                    : isNum && typeof val === 'number'
                                                        ? Number.isInteger(val) ? val : parseFloat(val.toFixed(4))
                                                        : String(val)
                                                }
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                                    No matching data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {filteredTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 absolute bottom-0 w-full or sticky sm:static">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing <span className="font-medium text-slate-700 dark:text-slate-200">{activePage * ROWS_PER_PAGE + 1}</span> to <span className="font-medium text-slate-700 dark:text-slate-200">{Math.min((activePage + 1) * ROWS_PER_PAGE, filteredData.length)}</span> of <span className="font-medium text-slate-700 dark:text-slate-200">{filteredData.length}</span> results
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={activePage === 0}
                            className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(filteredTotalPages - 1, p + 1))}
                            disabled={activePage >= filteredTotalPages - 1}
                            className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
