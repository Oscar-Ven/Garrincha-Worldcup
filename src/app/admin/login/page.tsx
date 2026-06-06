"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = searchParams.get("next") ?? "/admin";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Invalid credentials.");
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Service temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 relative overflow-hidden font-sans">
      {/* Background artwork */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-lime-500/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/branding/garrincha-white.png"
            alt="GARRINCHA"
            width={160}
            height={42}
            className="h-10 w-auto mb-4"
            priority
          />
          <div className="px-3 py-1 border border-lime-400/20 bg-lime-400/15">
            <span className="text-lime-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Manager & Owner Portal
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/40 border border-zinc-950 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-xl font-black text-white uppercase tracking-tight mb-6">
            Authorized Sign-In
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@garrincha.be"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 border border-red-900/50 bg-red-900/10 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] hover:shadow-[0_0_30px_rgba(163,230,53,0.35)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Note / Disclaimer */}
        <p className="mt-6 text-center text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed">
          Authorized personnel only. All access, sessions, and operations are monitored and logged.
        </p>
      </div>
    </div>
  );
}
