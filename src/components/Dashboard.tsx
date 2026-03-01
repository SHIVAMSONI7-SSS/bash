'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { Plus, BarChart3, Database } from 'lucide-react';
import dynamic from 'next/dynamic';
import ChartCard from './ChartCard';
import DataTable from './DataTable';
import InsightsPanel from './InsightsPanel';
import DataChat from './DataChat';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-load react-rnd to avoid SSR issues
const Rnd = dynamic(() => import('react-rnd').then((mod) => mod.Rnd), { ssr: false });

const DEFAULT_HEIGHT = 400;
const GAP = 16;
const CANVAS_PADDING = 16;

export default function Dashboard() {
    const { rawData, charts, addChart, updateChart, columns } = useDataStore();
    const [resizingId, setResizingId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Canvas auto-grows to fit all cards
    const canvasMinHeight = useMemo(() => {
        if (charts.length === 0) return 480;
        return Math.max(...charts.map((c) => c.y + c.height + GAP * 3));
    }, [charts]);

    const handleAddChart = useCallback(() => {
        const firstCat = columns.find(c => c.type === 'categorical' || c.type === 'date')?.name || columns[0]?.name || '';
        const firstNum = columns.find(c => c.type === 'numeric')?.name || columns[1]?.name || '';

        // Read the ACTUAL canvas width so cards never overflow or overlap
        const canvasWidth = canvasRef.current?.clientWidth ?? 900;
        // Each card = half the canvas width minus gaps
        const colWidth = Math.floor((canvasWidth - CANVAS_PADDING * 2 - GAP) / 2);

        const idx = charts.length;
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        addChart({
            type: 'bar',
            xAxis: firstCat,
            yAxis: firstNum,
            x: CANVAS_PADDING + col * (colWidth + GAP),
            y: CANVAS_PADDING + row * (DEFAULT_HEIGHT + GAP),
            width: colWidth,
            height: DEFAULT_HEIGHT,
        });
    }, [charts, columns, addChart]);

    if (rawData.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-12 space-y-12">

            {/* ── Visualizations Canvas ── */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-500" />
                            Visualizations
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Drag to reposition · Drag corner to resize
                        </p>
                    </div>
                    <button
                        onClick={handleAddChart}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Chart</span>
                    </button>
                </div>

                {charts.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center flex flex-col items-center">
                        <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No charts yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
                            Create a chart to start exploring. Drag to move, drag corners to resize.
                        </p>
                        <button onClick={handleAddChart} className="px-6 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 transition-all">
                            Create Chart
                        </button>
                    </div>
                ) : (
                    <div
                        ref={canvasRef}
                        className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_#334155_1px,_transparent_1px)] [background-size:24px_24px]"
                        style={{ minHeight: `${canvasMinHeight}px` }}
                    >
                        <AnimatePresence>
                            {charts.map((config) => (
                                <Rnd
                                    key={config.id}
                                    position={{ x: config.x, y: config.y }}
                                    size={{ width: config.width, height: config.height }}
                                    minWidth={280}
                                    minHeight={240}
                                    bounds="parent"
                                    dragHandleClassName="drag-handle"
                                    enableResizing={{ bottom: true, right: true, bottomRight: true, top: false, left: false, topLeft: false, topRight: false, bottomLeft: false }}
                                    resizeHandleStyles={{
                                        bottomRight: { width: '20px', height: '20px', bottom: 0, right: 0, borderBottomRightRadius: '12px', cursor: 'se-resize' },
                                        bottom: { cursor: 's-resize' },
                                        right: { cursor: 'e-resize' },
                                    }}
                                    resizeHandleComponent={{
                                        bottomRight: (
                                            <div className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-1 pr-1">
                                                <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400 dark:text-slate-500">
                                                    <path d="M9 1L9 9L1 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M5 5L9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        ),
                                    }}
                                    style={{ zIndex: resizingId === config.id ? 20 : 10 }}
                                    onDragStop={(_e, d) => updateChart(config.id, { x: d.x, y: d.y })}
                                    onResizeStart={() => setResizingId(config.id)}
                                    onResize={(_e, _dir, ref, _delta, pos) => updateChart(config.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y })}
                                    onResizeStop={() => setResizingId(null)}
                                >
                                    <motion.div className="h-full w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                        <ChartCard config={config} isResizing={resizingId === config.id} />
                                    </motion.div>
                                </Rnd>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* ── AI Insights ── */}
            <section><InsightsPanel /></section>

            {/* ── AI Data Chat ── */}
            <section><DataChat /></section>

            {/* ── Data Table ── */}
            <section>
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Database className="w-6 h-6 text-indigo-500" />
                        Raw Data Explorer
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Search, sort, and paginate through your dataset</p>
                </div>
                <DataTable />
            </section>

        </motion.div>
    );
}
