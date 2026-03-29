"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-fetch";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export function DashboardShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    apiFetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        if (data.user) setUser(data.user);
        else window.location.href = "/login";
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    playClick();
    apiFetch("/api/auth/me", { method: "POST" }).catch(() => {});
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  }

  function scrollTo(id: string) {
    playClick();
    setSidebarOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goHome() {
    playClick();
    setSidebarOpen(false);
    window.location.href = `/dashboard/${user?.role || "customer"}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
          <span className="text-slate-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    customer: "Customer",
    branch_owner: "Branch Owner",
    company_owner: "Company Owner",
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); setSidebarOpen(!sidebarOpen); }} className="md:hidden p-2 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-[#0f172a]">K</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-amber-400">PSPCS</h1>
                <p className="text-[10px] text-slate-500">KLEOXM 111</p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block" />
            <h2 className="hidden md:block text-sm font-medium text-slate-300">{title}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[#0f172a] font-bold text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-[10px] text-slate-500">
                  {roleLabels[user.role]}
                  {user.isSubscribed && <span className="ml-1 text-amber-400">★</span>}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-[57px] left-0 z-40 w-64 h-[calc(100vh-57px)] bg-[#0f172a] border-r border-slate-800 transition-transform overflow-y-auto`}>
          <nav className="p-4 space-y-1">
            <SidebarBtn onClick={goHome} label="Dashboard" icon="home" />
            <SidebarBtn onClick={() => scrollTo("stations")} label="Charging Stations" icon="bolt" />
            <SidebarBtn onClick={() => scrollTo("sessions")} label="Charging Sessions" icon="battery" />
            <SidebarBtn onClick={() => scrollTo("subscription")} label="Subscription" icon="star" />
            {user.role === "company_owner" && (
              <SidebarBtn onClick={() => scrollTo("users")} label="Manage Users" icon="users" />
            )}
            <div className="my-2 border-t border-slate-800" />
            <SidebarBtn onClick={() => { playClick(); setSidebarOpen(false); window.location.href = "/dashboard/settings"; }} label="Settings" icon="gear" />
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarBtn({ onClick, label, icon }: { onClick: () => void; label: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    bolt: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    battery: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    star: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    gear: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  };

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all text-left">
      {icons[icon]}
      {label}
    </button>
  );
}
