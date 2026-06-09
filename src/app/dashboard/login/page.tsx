"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gray-900 px-6 py-3 mb-5 flex items-center justify-center">
            <Image
              src="/branding/garrincha-white.png"
              alt="GARRINCHA"
              width={140}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard Sign In</h1>
          <p className="text-sm text-gray-500">GARRINCHA World Cup 2026</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@garrincha.be"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
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

        <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
          Authorized personnel only. All sessions are monitored and logged.
        </p>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
