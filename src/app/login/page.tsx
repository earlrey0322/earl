"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server returned invalid response");
        setLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      let url = "/dashboard/customer";
      if (data.user?.role === "company_owner") url = "/dashboard/company-owner";
      else if (data.user?.role === "branch_owner" || data.user?.role === "other_branch") url = "/dashboard/branch-owner";

      window.location.href = url;
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://assets.kiloapps.io/user_061af2b2-c2a5-4dde-be2d-578f8d4a3f18/f9f43215-05fa-484b-a516-be2eb8521f47/ad30a66a-ccea-4204-bb5d-83d87e90b9f6.jpg" alt="PSPCS Logo" className="w-24 h-24 mx-auto mb-4 rounded-xl object-contain" />
          <h1 className="text-2xl font-bold text-white">KLEOXM 111</h1>
          <p className="text-amber-400 text-sm">Powered Solar Piso Charging Station</p>
          <p className="text-slate-400 text-sm mt-2">Log in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl p-8 space-y-5" suppressHydrationWarning>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required suppressHydrationWarning
              className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="Enter your username" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required suppressHydrationWarning
              className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="Enter your password" />
          </div>

          <button type="submit" disabled={loading} suppressHydrationWarning
            className="w-full py-3 text-lg font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account? <a href="/signup" className="text-amber-400 hover:underline">Sign Up</a>
          </p>
        </form>
      </div>
    </main>
  );
}
