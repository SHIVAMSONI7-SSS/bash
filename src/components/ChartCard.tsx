'use client';

import { useMemo, useState } from 'react';
import { useDataStore, ChartConfig } from '@/store/useDataStore';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Trash2, BarChart2, TrendingUp, PieChart as PieChartIcon, GripHorizontal } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];

interface ChartCardProps {
    config: ChartConfig;
    isResizing?: boolean;
}

export default function ChartCard({ config, isResizing }: ChartCardProps) {
    const { rawData, columns, updateChart, removeChart } = useDataStore();

    const chartData = useMemo(() => {
        if (!config.xAxis || !config.yAxis) return [];

        if (config.type === 'bar' || config.type === 'pie') {
            const aggregated: Record<string, number> = {};
            rawData.forEach(row => {
                const xVal = row[config.xAxis];
                const yVal = parseFloat(row[config.yAxis]);
                if (xVal !== null && xVal !== undefined && !isNaN(yVal)) {
                    const key = String(xVal);
                    aggregated[key] = (aggregated[key] || 0) + yVal;
                }
            });
            return Object.entries(aggregated)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 20);
        }

        return rawData
            .filter(row => row[config.xAxis] !== null && row[config.yAxis] !== null)
            .map(row => ({
                name: row[config.xAxis],
                value: Number(row[config.yAxis])
            }))
            .slice(0, 500);
    }, [rawData, config.xAxis, config.yAxis, config.type]);

    const xOptions = columns.filter(c => c.type === 'categorical' || c.type === 'date' || c.type === 'numeric');
    const yOptions = columns.filter(c => c.type === 'numeric');

    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
                    Select valid X and Y columns to render chart.
                </div>
            );
        }

        switch (config.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={55} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} width={60} />
                            <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontSize: 12 }} />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} width={60} />
                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontSize: 12 }} />
                            <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontSize: 12 }} />
                            <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: '11px' }} />
                            <Pie data={chartData} cx="50%" cy="45%" innerRadius="30%" outerRadius="55%" paddingAngle={4} dataKey="value">
                                {chartData.map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );
        }
    };

    const activeCls = (active: boolean, active_color = 'text-indigo-600 dark:text-indigo-400') =>
        `p-1.5 rounded-md transition-all ${active ? `bg-white dark:bg-slate-700 shadow-sm ${active_color}` : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`;

    return (
        // The outer div is provided by Rnd; ChartCard itself fills 100% of that space
        <div
            className={`h-full w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 transition-colors duration-150 overflow-hidden
                ${isResizing
                    ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.2)] shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
        >
            {/* ── DRAG HANDLE / Toolbar Row 1 ── */}
            <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing select-none bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
                <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />

                {/* Chart type toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); updateChart(config.id, { type: 'bar' }); }} className={activeCls(config.type === 'bar')} title="Bar"><BarChart2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); updateChart(config.id, { type: 'line' }); }} className={activeCls(config.type === 'line', 'text-pink-600 dark:text-pink-400')} title="Line"><TrendingUp className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); updateChart(config.id, { type: 'pie' }); }} className={activeCls(config.type === 'pie', 'text-purple-600 dark:text-purple-400')} title="Pie"><PieChartIcon className="w-3.5 h-3.5" /></button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                {/* Axis selectors */}
                <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">X:</span>
                    <select onClick={e => e.stopPropagation()} value={config.xAxis} onChange={(e) => updateChart(config.id, { xAxis: e.target.value })} className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[120px]">
                        <option value="" disabled>Select X</option>
                        {xOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Y:</span>
                    <select onClick={e => e.stopPropagation()} value={config.yAxis} onChange={(e) => updateChart(config.id, { yAxis: e.target.value })} className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[120px]">
                        <option value="" disabled>Select Y</option>
                        {yOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                {/* Delete */}
                <button onClick={(e) => { e.stopPropagation(); removeChart(config.id); }} className="ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove chart">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ── Chart Area ── */}
            <div className="flex-1 min-h-0 p-2">
                {renderChart()}
            </div>
        </div>
    );
}
