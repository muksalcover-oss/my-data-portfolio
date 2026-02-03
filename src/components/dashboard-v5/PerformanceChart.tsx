import React from 'react';
import { LineChart } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PerformanceChartProps {
    trendData: Array<{ label: string; revenue: number; profit: number }>;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ trendData }) => {
    return (
        <div className="stagger-card bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><LineChart size={20} /></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Revenue & Profit Trend</h3>
            </div>
            <div className="h-[250px] w-full">
                <Line
                    data={{
                        labels: trendData.map(d => d.label),
                        datasets: [
                            {
                                label: 'Revenue',
                                data: trendData.map(d => d.revenue),
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Profit',
                                data: trendData.map(d => d.profit),
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10, family: 'monospace' } } },
                            tooltip: {
                                backgroundColor: '#020617',
                                borderColor: '#334155',
                                borderWidth: 1,
                                padding: 10,
                                titleColor: '#fff',
                                bodyColor: '#cbd5e1'
                            }
                        },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
                        }
                    }}
                />
            </div>
        </div>
    );
};
