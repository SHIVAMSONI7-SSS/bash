'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { Sparkles, Loader2, AlertCircle, TrendingUp, AlertTriangle, Lightbulb, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Heuristic icon + accent colour per insight ──────────────────────────────
const INSIGHT_STYLES = [
    { icon: TrendingUp, accent: 'from-indigo-500/20 to-indigo-500/5', badge: 'bg-indigo-500/30 text-indigo-200', label: 'Trend' },
    { icon: AlertTriangle, accent: 'from-pink-500/20 to-pink-500/5', badge: 'bg-pink-500/30 text-pink-200', label: 'Anomaly' },
    { icon: Lightbulb, accent: 'from-yellow-500/20 to-yellow-500/5', badge: 'bg-yellow-500/30 text-yellow-200', label: 'Insight' },
    { icon: BarChart, accent: 'from-emerald-500/20 to-emerald-500/5', badge: 'bg-emerald-500/30 text-emerald-200', label: 'Pattern' },
];

/**
 * Split the raw AI text into distinct insight paragraphs.
 * Handles: numbered lists (1. 2. 3.), bullet lines (* or -), double newlines.
 */
function parseInsights(raw: string): string[] {
    // Try splitting on numbered items: "1.", "2.", "**1.", etc.
    const numbered = raw.split(/\n(?=\*{0,2}\d+[\.\)]\s)/).map(s => s.trim()).filter(Boolean);
    if (numbered.length > 1) return numbered;

    // Try bullet points
    const bullets = raw.split(/\n(?=[*\-•]\s)/).map(s => s.trim()).filter(Boolean);
    if (bullets.length > 1) return bullets;

    // Fall back to double-newline paragraphs
    const paras = raw.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    if (paras.length > 1) return paras;

    // Nothing else; return the raw text as one block
    return [raw.trim()];
}

/** Strip leading markdown bullets / numbers / bold markers for display */
function cleanLine(text: string): string {
    return text
        .replace(/^\*{1,2}\d+[\.\)]\s*\*{0,2}/, '')   // **1. or 1.
        .replace(/^[\*\-•]\s+/, '')                     // bullet
        .replace(/\*\*/g, '')                            // bold markers
        .trim();
}

export default function InsightsPanel() {
    const { summary } = useDataStore();

    const [raw, setRaw] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = async () => {
        if (Object.keys(summary).length === 0) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch insights');
            setRaw(data.insights);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (Object.keys(summary).length === 0) return null;

    const insights = raw ? parseInsights(raw) : [];

    return (
        <div className="relative rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden mt-8 text-white bg-gradient-to-br from-[#1e1b4b] to-[#3b0764]">
            {/* Ambient blobs */}
            <div className="absolute top-0 right-0 -m-16 w-56 h-56 bg-purple-600 rounded-full blur-3xl opacity-25 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -m-16 w-56 h-56 bg-indigo-600 rounded-full blur-3xl opacity-25 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        AI Insights
                    </h2>
                    <p className="text-indigo-300 text-xs mt-0.5">Powered by Groq · Llama 3.3 70B</p>
                </div>

                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="shrink-0 px-5 py-2 bg-white text-indigo-900 font-semibold rounded-xl text-sm
                     shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]
                     hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2"
                >
                    {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Analyzing…</>
                    ) : raw ? 'Refresh Analysis' : 'Generate Insights'}
                </button>
            </div>

            {/* Body */}
            <div className="relative z-10 px-6 py-5">
                <AnimatePresence mode="wait">

                    {/* Error */}
                    {error && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-100 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div><p className="font-semibold mb-0.5">Could not generate insights</p><p className="opacity-75">{error}</p></div>
                        </motion.div>
                    )}

                    {/* Structured insight cards */}
                    {raw && !error && (
                        <motion.div key="cards" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                            {insights.map((text, i) => {
                                const style = INSIGHT_STYLES[i % INSIGHT_STYLES.length];
                                const Icon = style.icon;

                                // Split into first sentence (headline) + rest (body)
                                const cleaned = cleanLine(text);
                                const dotIdx = cleaned.search(/[.!?]\s/);
                                const headline = dotIdx > 0 ? cleaned.slice(0, dotIdx + 1) : cleaned.slice(0, 80);
                                const body = dotIdx > 0 ? cleaned.slice(dotIdx + 1).trim() : '';

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className={`rounded-xl bg-gradient-to-br ${style.accent} border border-white/10 backdrop-blur-sm p-4 flex flex-col gap-3`}
                                    >
                                        {/* Badge + number */}
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge} flex items-center gap-1`}>
                                                <Icon className="w-3 h-3" />
                                                {style.label}
                                            </span>
                                            <span className="text-white/20 font-bold text-xl leading-none">#{i + 1}</span>
                                        </div>

                                        {/* Headline */}
                                        <p className="text-white font-semibold text-sm leading-snug">{headline}</p>

                                        {/* Body */}
                                        {body && (
                                            <p className="text-indigo-200/80 text-xs leading-relaxed">{body}</p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Empty state */}
                    {!raw && !error && !isLoading && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-10 text-center border border-dashed border-indigo-400/25 rounded-xl bg-black/10"
                        >
                            <Sparkles className="w-8 h-8 text-indigo-400/50 mx-auto mb-3" />
                            <p className="text-indigo-300 text-sm max-w-sm mx-auto">
                                Click <strong className="text-white">Generate Insights</strong> to get an AI-powered
                                analysis of your dataset's key trends, anomalies, and patterns.
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
