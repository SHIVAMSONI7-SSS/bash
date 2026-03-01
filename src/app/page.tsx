'use client';

import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';
import { useDataStore } from '@/store/useDataStore';
import { Download, FileSpreadsheet, Sparkles, Database, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { rawData, reset } = useDataStore();
  const hasData = rawData.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-500/20 shadow-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-899 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
              Lumina CSV
            </span>
          </div>

          <AnimatePresence>
            {hasData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={reset}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Start Over
                </button>
                <button
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg shadow-sm transition-all text-slate-700 dark:text-slate-300 active:scale-95"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <div className="text-center max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles className="w-3 h-3" /> AI-Powered Analytics
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
                Turn your raw CSVs into
                <span className="block text-indigo-600 dark:text-indigo-400 mt-2">Actionable Intelligence</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Upload massive datasets instantly. Generate stunning dashboards, deep-dive tables, and instant AI insights directly in your browser without leaving a footprint.
              </p>
            </div>

            <FileUpload />

            {/* Features preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full max-w-4xl text-center">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">Blazing Fast Parsing</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Client-side streaming processes up to 10k rows instantly without server lag.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 mx-auto bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">Dynamic Dashboards</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Auto-detect data types and build interactive, presentation-ready charts.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 mx-auto bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">Grok AI Insights</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Automatically analyze statistical summaries to find hidden trends and anomalies.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <Dashboard />
        )}
      </div>
    </main>
  );
}
