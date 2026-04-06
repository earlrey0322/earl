"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const icons: Record<string, React.ReactNode> = {
  home: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  bolt: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  battery: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  star: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  cart: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>,
  gear: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  inbox: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
  money: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  gift: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
};

export function DashboardShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
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

  // Handle hash navigation after page load
  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      const sectionId = window.location.hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [loading]);

  function handleLogout() {
    playClick();
    apiFetch("/api/auth/me", { method: "POST" }).catch(() => {});
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  }

  function scrollToSection(sectionId: string) {
    playClick();
    setSidebarOpen(false);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
          <span className="text-green-300 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    customer: "Customer",
    branch_owner: "Branch Owner",
    other_branch: "Other Branch",
    company_owner: "Company Owner",
  };

  const dashboardPath = `/dashboard/${user.role}`;

  // Define sidebar items based on role
  const sidebarItems = (() => {
    const common = [
      { id: "dashboard", label: "Dashboard", icon: "home", section: null },
      { id: "stations", label: "Charging Stations", icon: "bolt", section: "stations" },
      { id: "sessions", label: "Charging Sessions", icon: "battery", section: "sessions" },
    ];

    if (user.role === "company_owner") {
      return [
        ...common,
        { id: "requests", label: "Requests", icon: "inbox", section: "requests" },
        { id: "redemptions", label: "Redemptions", icon: "gift", section: "redemptions" },
        { id: "store-orders", label: "Store Orders", icon: "cart", section: "store-orders" },
        { id: "users", label: "All Users", icon: "users", section: "users-timeline" },
        { id: "revenue", label: "Revenue", icon: "money", section: "revenue" },
      ];
    }

    if (user.role === "branch_owner" || user.role === "other_branch") {
      return [
        ...common,
        { id: "subscription", label: "Subscription", icon: "star", section: "subscription" },
        { id: "monthly-payment", label: "Monthly Fee", icon: "money", section: "monthly-payment" },
        { id: "revenue", label: "Points System", icon: "star", section: "revenue" },
      ];
    }

    // Customer
    return [
      ...common,
      { id: "subscription", label: "Subscription", icon: "star", section: "subscription" },
    ];
  })();

  return (
    <div className="min-h-screen bg-[#0a1f0f]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-card border-b border-green-800/50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); setSidebarOpen(!sidebarOpen); }} className="md:hidden p-2 text-green-300 hover:text-white">
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
                <p className="text-[10px] text-green-400">KLEOXM 111</p>
              </div>
            </div>
            <div className="h-6 w-px bg-green-900 mx-2 hidden md:block" />
            <h2 className="hidden md:block text-sm font-medium text-green-200">{title}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[#0f172a] font-bold text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-[10px] text-green-400">
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
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-[57px] left-0 z-40 w-64 h-[calc(100vh-57px)] bg-[#0a1f0f] border-r border-slate-800 transition-transform overflow-y-auto`}>
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === dashboardPath && (!item.section || window.location.hash === `#${item.section}`);
              
              if (item.section) {
                // Section link - scroll within dashboard
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.section)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left ${isActive ? "bg-amber-400/10 text-amber-400" : "text-green-300 hover:bg-green-950 hover:text-white"}`}
                  >
                    {icons[item.icon]}
                    {item.label}
                  </button>
                );
              }

              // Dashboard link - navigate to dashboard page
              return (
                <Link key={item.id} href={dashboardPath} onClick={() => { playClick(); setSidebarOpen(false); }}>
                  <div className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left ${pathname === dashboardPath && !window.location.hash ? "bg-amber-400/10 text-amber-400" : "text-green-300 hover:bg-green-950 hover:text-white"}`}>
                    {icons[item.icon]}
                    {item.label}
                  </div>
                </Link>
              );
            })}
            <div className="my-2 border-t border-slate-800" />
            <Link href="/dashboard/store" onClick={() => { playClick(); setSidebarOpen(false); }}>
              <div className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left ${pathname === "/dashboard/store" ? "bg-amber-400/10 text-amber-400" : "text-green-300 hover:bg-green-950 hover:text-white"}`}>
                {icons.cart}
                Store
              </div>
            </Link>
            <Link href="/dashboard/settings" onClick={() => { playClick(); setSidebarOpen(false); }}>
              <div className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left ${pathname === "/dashboard/settings" ? "bg-amber-400/10 text-amber-400" : "text-green-300 hover:bg-green-950 hover:text-white"}`}>
                {icons.gear}
                Settings
              </div>
            </Link>
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
