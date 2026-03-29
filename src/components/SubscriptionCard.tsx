"use client";

import { useState } from "react";
import { PLANS } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export function SubscriptionCard({
  role, isSubscribed, onSubscribe,
}: {
  role: string; isSubscribed: boolean; onSubscribe?: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const freeFeatures: Record<string, string[]> = {
    customer: ["View KLEOXM 111 stations only", "Basic charging calculator", "3 sessions per day"],
    branch_owner: ["Register 1 station", "Basic monitoring"],
    company_owner: ["View all users", "Basic reports"],
  };
  const premiumFeatures: Record<string, string[]> = {
    customer: ["View ALL companies' stations", "Unlimited sessions", "Full history"],
    branch_owner: ["Unlimited stations", "Full analytics", "Priority support"],
    company_owner: ["Full analytics", "Manage all subscriptions", "Revenue tracking"],
  };

  const features = isSubscribed ? premiumFeatures[role] || premiumFeatures.customer : freeFeatures[role] || freeFeatures.customer;

  async function handleSubscribe(planId: string) {
    playClick();
    setProcessing(true);
    try {
      const res = await apiFetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Subscribed! Pay ₱${data.gcashDetails?.amount || "?"} to GCash: ${data.gcashDetails?.number || "09469086926"} (${data.gcashDetails?.name || "Earl Christian Rey"})`);
        onSubscribe?.();
      }
    } catch { alert("Error. Try again."); }
    setProcessing(false);
    setSelectedPlan(null);
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className={`p-6 ${isSubscribed ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20" : "bg-slate-800/50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{role === "customer" ? "Customer" : role === "branch_owner" ? "Branch Owner" : "Company Owner"} Plan</h3>
            <p className="text-sm text-slate-400">{isSubscribed ? "Premium Active" : "Free Plan"}</p>
          </div>
          {isSubscribed && <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">★ PREMIUM</div>}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{isSubscribed ? "Premium Features" : "Current Plan"}</h4>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {!isSubscribed && (
          <>
            <h4 className="text-xs font-bold text-amber-400 uppercase">Choose a Plan</h4>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={processing}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedPlan === plan.id
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <div className="text-sm font-bold text-white">{plan.label}</div>
                  <div className="text-lg font-bold text-amber-400">₱{plan.price}</div>
                </button>
              ))}
            </div>

            {selectedPlan && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-blue-400">GCash Payment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="text-white">{PLANS.find((p) => p.id === selectedPlan)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-bold">₱{PLANS.find((p) => p.id === selectedPlan)?.price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">GCash</span><span className="text-white font-bold">09469086926</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">Earl Christian Rey</span></div>
                </div>
                <a href="https://www.gcash.com" target="_blank" rel="noopener noreferrer" className="block w-full py-2 text-center text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-500">
                  Open GCash
                </a>
                <button onClick={() => handleSubscribe(selectedPlan)} disabled={processing}
                  className="w-full py-2 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">
                  {processing ? "Processing..." : "I Paid — Activate"}
                </button>
                <button onClick={() => setSelectedPlan(null)} className="w-full py-2 text-sm text-slate-400">Cancel</button>
              </div>
            )}
          </>
        )}

        {isSubscribed && (
          <div className="text-center py-3 bg-amber-400/5 rounded-xl">
            <p className="text-sm text-amber-400 font-medium">Premium Active</p>
            <p className="text-xs text-slate-500 mt-1">GCash: 09469086926 (Earl Christian Rey)</p>
          </div>
        )}
      </div>
    </div>
  );
}
