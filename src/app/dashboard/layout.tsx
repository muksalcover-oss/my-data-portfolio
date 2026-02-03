'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#000000] text-slate-200 font-sans selection:bg-emerald-500/30">
            <Sidebar />
            <main className="lg:ml-64 min-h-screen relative z-0">
                {/* Background Ambient */}
                <div className="fixed inset-0 z-[-1] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                </div>

                {children}
            </main>
        </div>
    );
}
