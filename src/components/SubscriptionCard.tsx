"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

function playClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playSuccess() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch {}
}

export function SubscriptionCard({
  role,
  isSubscribed,
  onSubscribe,
}: {
  role: string;
  isSubscribed: boolean;
  onSubscribe?: () => void;
}) {
  const [showGcash, setShowGcash] = useState(false);
  const [processing, setProcessing] = useState(false);

  const roleDetails: Record<string, { title: string; freeFeatures: string[]; premiumFeatures: string[] }> = {
    customer: {
      title: "Customer",
      freeFeatures: [
        "View PSPCS (KLEOXM 111) stations only",
        "Basic charging calculator",
        "3 charging sessions per day",
      ],
      premiumFeatures: [
        "View ALL brands of charging stations",
        "Unlimited charging sessions per day",
        "Priority notifications",
        "Detailed charging history",
      ],
    },
    branch_owner: {
      title: "Branch/Station Owner",
      freeFeatures: [
        "Register 1 charging station",
        "Basic station monitoring",
        "View station on map",
      ],
      premiumFeatures: [
        "Register unlimited stations",
        "Full analytics dashboard",
        "Real-time monitoring",
        "Manage station markers on map",
        "Customer session reports",
      ],
    },
    company_owner: {
      title: "Company Owner",
      freeFeatures: [
        "View all branch owners",
        "View all customers",
        "Basic reports",
      ],
      premiumFeatures: [
        "Full subscription analytics",
        "Revenue tracking from GCash",
        "Branch performance reports",
        "Customer growth metrics",
        "Priority support",
      ],
    },
  };

  const details = roleDetails[role] || roleDetails.customer;

  async function handleSubscribe() {
    playClick();
    setShowGcash(true);
  }

  async function confirmPayment() {
    setProcessing(true);
    try {
      const res = await apiFetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ gcashNumber: "09469086926" }),
      });

      if (res.ok) {
        playSuccess();
        alert(
          "Subscription activated! Payment directed to GCash: 09469086926 (Earl Christian Rey)"
        );
        onSubscribe?.();
      }
    } catch {
      alert("Error processing subscription. Please try again.");
    }
    setProcessing(false);
    setShowGcash(false);
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${isSubscribed ? "bg-gradient-to-r from-amber-400/20 to-orange-500/20" : "bg-slate-800/50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{details.title} Plan</h3>
            <p className="text-sm text-slate-400">
              {isSubscribed ? "Premium Active" : "Free Plan"}
            </p>
          </div>
          {isSubscribed && (
            <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">
              ★ PREMIUM
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="p-6 space-y-4">
        {/* Free Features */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
            {isSubscribed ? "Included" : "Current Plan (Free)"}
          </h4>
          <ul className="space-y-2">
            {(isSubscribed ? details.premiumFeatures : details.freeFeatures).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {!isSubscribed && (
          <>
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">
                Premium Features (₱50/month)
              </h4>
              <ul className="space-y-2">
                {details.premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {!showGcash ? (
              <button
                onClick={handleSubscribe}
                className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-[1.02]"
              >
                Upgrade to Premium — ₱50/month
              </button>
            ) : (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3 slide-in">
                <h4 className="text-sm font-bold text-blue-400">GCash Payment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white font-bold">₱50.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GCash Number</span>
                    <span className="text-white font-bold">09469086926</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name</span>
                    <span className="text-white font-bold">Earl Christian Rey</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-bold">1 Month</span>
                  </div>
                </div>
                <a
                  href="https://www.gcash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Open GCash to Pay
                </a>
                <button
                  onClick={confirmPayment}
                  disabled={processing}
                  className="w-full py-2 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  {processing ? "Processing..." : "I've Paid — Activate Premium"}
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setShowGcash(false);
                  }}
                  className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {isSubscribed && (
          <div className="text-center py-3 bg-amber-400/5 rounded-xl">
            <p className="text-sm text-amber-400 font-medium">Premium Active</p>
            <p className="text-xs text-slate-500 mt-1">
              GCash: 09469086926 (Earl Christian Rey)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
