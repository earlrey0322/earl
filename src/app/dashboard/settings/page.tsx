"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

interface UserData {
  id: number; email: string; fullName: string; role: string;
  phoneBrand: string | null; contactNumber: string | null; address: string | null;
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", contactNumber: "", address: "", phoneBrand: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    apiFetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (data.user) {
        setUserData(data.user);
        setForm({
          fullName: data.user.fullName || "",
          email: data.user.email || "",
          password: "",
          contactNumber: data.user.contactNumber || "",
          address: data.user.address || "",
          phoneBrand: data.user.phoneBrand || "",
        });
      }
    }).catch(() => {});
  }, []);

  async function handleSave() {
    playClick();
    setMessage(""); setError("");
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setMessage("Profile updated successfully!"); }
      else { setError(data.error || "Update failed"); }
    } catch { setError("Network error"); }
  }

  async function handleDelete() {
    playClick();
    try {
      const res = await apiFetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) {
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/";
      }
    } catch { setError("Delete failed"); }
  }

  return (
    <DashboardShell title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>

          {message && <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">{message}</div>}
          {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password (leave blank to keep current)</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="New password" className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number</label>
              <input type="tel" value={form.contactNumber} onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
            </div>
            {userData?.role === "customer" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Brand</label>
                <select value={form.phoneBrand} onChange={(e) => setForm((p) => ({ ...p, phoneBrand: e.target.value }))} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400">
                  <option value="">Select phone brand</option>
                  {["Apple iPhone","Samsung Galaxy","Xiaomi","Huawei","OPPO","Vivo","Realme","OnePlus","Nokia","Google Pixel","Infinix","Tecno","Other"].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleSave} className="w-full py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg hover:shadow-lg transition-all">
              Save Changes
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-red-500/20">
          <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-400 mb-4">Once you delete your account, there is no going back.</p>
          {!showDelete ? (
            <button onClick={() => { playClick(); setShowDelete(true); }} className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-all">
              Delete Account
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all">
                Confirm Delete
              </button>
              <button onClick={() => { playClick(); setShowDelete(false); }} className="px-4 py-2 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-800 transition-all">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
