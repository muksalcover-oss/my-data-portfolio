'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    ShieldAlert,
    LogOut,
    Landmark,
    UserCircle,
    Menu,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleLinkClick = () => {
        setIsMobileOpen(false);
        onClose?.();
    };

    // Close mobile menu on route change - using callback ref pattern
    useEffect(() => {
        // Use requestAnimationFrame to avoid synchronous setState
        const frame = requestAnimationFrame(() => {
            setIsMobileOpen(false);
        });
        return () => cancelAnimationFrame(frame);
    }, [pathname]);

    const navContent = (
        <>
            {/* Branding */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                    Ardi <span className="text-emerald-500">Analis</span>
                </h1>
                {/* Close button for mobile */}
                <button
                    onClick={() => { setIsMobileOpen(false); onClose?.(); }}
                    className="lg:hidden p-2 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Menu Utama
                </div>

                <Link
                    href="/dashboard"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </Link>

                {/* UMKM Section */}
                <div className="mt-8 px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <UserCircle size={12} /> Area UMKM
                </div>

                <Link
                    href="/dashboard/umkm/credit-score"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/umkm/credit-score')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Landmark size={20} />
                    <span className="font-medium">Cek Kelayakan Kredit</span>
                </Link>

                <Link
                    href="/dashboard/umkm/resilience"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/umkm/resilience')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <ShieldAlert size={20} />
                    <span className="font-medium">Simulasi Ketahanan</span>
                </Link>
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                >
                    <LogOut size={20} />
                    <span>Keluar</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-emerald-500 text-[#020617] rounded-xl shadow-lg shadow-emerald-500/30"
            >
                <Menu size={24} />
            </button>

            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-[#020617] border-r border-white/5 z-40 flex-col hidden lg:flex">
                {navContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-[#020617] border-r border-white/5 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {navContent}
            </aside>
        </>
    );
}
