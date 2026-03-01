import { create } from 'zustand';
import { ColumnInfo } from '@/lib/dataProcessor';

export interface ChartConfig {
    id: string;
    type: 'bar' | 'line' | 'pie';
    xAxis: string;
    yAxis: string;
    // Layout (position + size on the canvas)
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DataState {
    rawData: any[];
    columns: ColumnInfo[];
    summary: Record<string, any>;
    isProcessing: boolean;
    progress: number;
    charts: ChartConfig[];

    setRawData: (data: any[]) => void;
    setColumns: (columns: ColumnInfo[]) => void;
    setSummary: (summary: Record<string, any>) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setProgress: (progress: number) => void;

    addChart: (config: Omit<ChartConfig, 'id'>) => void;
    updateChart: (id: string, config: Partial<Omit<ChartConfig, 'id'>>) => void;
    removeChart: (id: string) => void;

    reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
    rawData: [],
    columns: [],
    summary: {},
    isProcessing: false,
    progress: 0,
    charts: [],

    setRawData: (data) => set({ rawData: data }),
    setColumns: (columns) => set({ columns }),
    setSummary: (summary) => set({ summary }),
    setIsProcessing: (isProcessing) => set({ isProcessing }),
    setProgress: (progress) => set({ progress }),

    addChart: (config) =>
        set((state) => ({
            charts: [
                ...state.charts,
                { ...config, id: Math.random().toString(36).substring(7) },
            ],
        })),

    updateChart: (id, config) =>
        set((state) => ({
            charts: state.charts.map((c) => (c.id === id ? { ...c, ...config } : c)),
        })),

    removeChart: (id) =>
        set((state) => ({
            charts: state.charts.filter((c) => c.id !== id),
        })),

    reset: () =>
        set({
            rawData: [],
            columns: [],
            summary: {},
            isProcessing: false,
            progress: 0,
            charts: [],
        }),
}));
