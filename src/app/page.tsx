'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Menggunakan path relatif untuk menghindari error resolusi alias @/
import { supabase } from '../lib/supabase/client';
import {
  BarChart3,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const role = 'umkm'; // Fixed role - app focused on UMKM users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        throw new Error('Kata sandi minimal harus 6 karakter');
      }

      // Mendaftar ke Supabase Auth dengan metadata (full_name & role)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          // Mengarahkan kembali ke callback URL setelah verifikasi email
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // Jika auto-confirm mati di Supabase, arahkan ke login dengan pesan
      router.push('/login?message=Silakan cek email Anda untuk verifikasi akun');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col lg:flex-row font-sans text-slate-200 overflow-x-hidden relative">

      {/* Visual Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '5s' }} />
      </div>

      {/* Sisi Kiri: Branding */}
      <div className="relative w-full lg:w-1/2 flex flex-col justify-center p-10 lg:p-24 z-10">
        <div className={`relative z-20 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-linear-to-br from-emerald-400 to-emerald-600 p-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <BarChart3 className="text-[#020617]" size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              Ardi <span className="text-emerald-500">Analis</span>
            </h1>
          </div>

          <h2 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-8">
            Mulai <br />
            <span className="bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tight">Visi Data</span> <br /> Anda Sekarang.
          </h2>
          <p className="text-slate-400 text-xl max-w-md mb-12 leading-relaxed">
            Platform intelijen data terpadu untuk percepatan ekonomi UMKM Indonesia.
          </p>

          <div className="grid grid-cols-1 gap-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit backdrop-blur-md">
              <ShieldCheck className="text-emerald-500" size={24} />
              <span className="text-sm font-semibold text-slate-200 uppercase tracking-[2px]">Data Terenkripsi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Form Pendaftaran */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16 bg-[#020617]/40 backdrop-blur-3xl lg:border-l border-white/5 z-20 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h3 className="text-4xl font-bold text-white mb-3 tracking-tight">Daftar Akun</h3>
            <p className="text-slate-500 text-lg">Lengkapi profil Anda untuk memulai.</p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center animate-pulse uppercase">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 tracking-[4px] uppercase ml-1">Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ardi Analis"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 tracking-[4px] uppercase ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 tracking-[4px] uppercase ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#020617] font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg active:scale-[0.96] disabled:opacity-70 mt-6 shadow-emerald-500/20"
            >
              {loading ? (
                <div className="w-7 h-7 border-4 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="tracking-[3px] uppercase text-sm">Buat Akun Sekarang</span>
                  <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Sudah ada akun? <Link href="/login" className="text-emerald-500 font-bold hover:underline decoration-2">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}