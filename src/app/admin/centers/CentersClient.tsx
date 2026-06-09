"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AddCenterButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", country: "Belgium" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create center.");

      setSuccess(`Center "${form.name}" created successfully.`);
      setForm({ name: "", city: "", country: "Belgium" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors";

  return (
    <>
      <button
        onClick={() => { setError(null); setSuccess(null); setOpen(true); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Add Center
      </button>

      {success && !open && (
        <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 text-green-700 text-sm rounded-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-5 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-gray-900">Add New Center</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Center name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="e.g. GARRINCHA Bruges"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="e.g. Bruges"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="e.g. Belgium"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 text-green-700 text-sm rounded-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
