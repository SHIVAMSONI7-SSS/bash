'use client';

import { useEffect, useRef, useState } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { Bot, Send, User, Loader2, MessageSquare, Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTED = [
    'What are the key trends in this dataset?',
    'Which column has the most variance?',
    'Summarize the data in 3 sentences.',
    'Are there any outliers I should know about?',
];

export default function DataChat() {
    const { summary } = useDataStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    if (Object.keys(summary).length === 0) return null;

    const send = async (text?: string) => {
        const q = (text ?? input).trim();
        if (!q || isLoading) return;

        setInput('');
        const newMessages: Message[] = [...messages, { role: 'user', content: q }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    summary,
                    history: newMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't answer that. (${e.message})` }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const reset = () => setMessages([]);

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">Ask AI about your data</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Groq · Llama 3.3 70B</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors" title="Clear chat">
                        <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-4 flex flex-col gap-3 min-h-[240px] max-h-[480px] overflow-y-auto">

                {/* Empty state */}
                {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-indigo-500" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                            Ask any question about your dataset. I'll analyse the data and give you a clear answer.
                        </p>
                        {/* Suggested chips */}
                        <div className="flex flex-wrap gap-2 justify-center mt-1">
                            {SUGGESTED.map((q) => (
                                <button key={q} onClick={() => send(q)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                                ><Sparkles className="w-3 h-3 inline mr-1 opacity-60" />{q}</button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Conversation */}
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm
                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                                    : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}
                            >
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Bubble */}
                            <div className={`relative max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm'}`}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Ask a question about your data…"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                />
                <button
                    onClick={() => send()}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 transition-all flex items-center justify-center shrink-0 shadow-sm active:scale-95"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>

        </div>
    );
}
