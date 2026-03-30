"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

interface SubscriptionRequest {
  id: number;
  plan: string;
  status: string;
  created_at: string;
  reference_number: string;
}

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  subscriptionExpiry: string | null;
}

const PLANS = [
  { id: "1_day", label: "1 Day", days: 1, price: 20 },
  { id: "1_week", label: "1 Week", days: 7, price: 60 },
  { id: "1_month", label: "1 Month", days: 30, price: 100 },
  { id: "3_months", label: "3 Months", days: 90, price: 170 },
  { id: "6_months", label: "6 Months", days: 180, price: 220 },
  { id: "1_year", label: "1 Year", days: 365, price: 300 },
];

export default function SubscriptionPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/subscription-requests").then((r) => r.json()),
    ]).then(([meRes, srRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) setUserData(meRes.value.user);
      if (srRes.status === "fulfilled" && srRes.value.requests) setSubRequests(srRes.value.requests);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userData?.isSubscribed || !userData?.subscriptionExpiry) return;
    const updateTimer = () => {
      const expiry = new Date(userData.subscriptionExpiry!).getTime();
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
      else setTimeLeft(`${minutes}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [userData?.isSubscribed, userData?.subscriptionExpiry]);

  async function requestSubscription() {
    if (!selectedPlan || !referenceNumber.trim()) {
      alert("Please select a plan and enter your GCash reference number");
      return;
    }
    setRequesting(true);
    try {
      const res = await apiFetch("/api/subscription-requests", {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan, referenceNumber: referenceNumber.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Subscription request sent! Waiting for company owner approval.");
        setSelectedPlan(null);
        setReferenceNumber("");
        try {
          const refreshRes = await apiFetch("/api/subscription-requests");
          const refreshData = await refreshRes.json();
          if (refreshData.requests) setSubRequests(refreshData.requests);
        } catch (refreshErr) {
          console.error("Error refreshing requests:", refreshErr);
        }
      } else {
        alert("Error: " + (data.error || "Failed to send request"));
      }
    } catch (err) {
      console.error("Error sending subscription request:", err);
      alert("Error sending request: " + String(err));
    }
    setRequesting(false);
  }

  return (
    <DashboardShell title="Subscription">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">Subscription</h2>
          <p className="text-slate-400 mt-1">
            Manage your premium plan and view request status.
          </p>
        </div>

        <div className="max-w-md space-y-6">
          {userData?.isSubscribed && timeLeft ? (
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/20 to-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-white">Premium Active</h4>
                  <p className="text-sm text-slate-400">Full access to all features</p>
                </div>
                <div className="px-3 py-1 bg-amber-400 text-[#0f172a] text-xs font-bold rounded-full">
                  ★ PREMIUM
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Time Remaining</p>
                <p className="text-2xl font-bold text-amber-400">{timeLeft}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Expires:{" "}
                  {userData?.subscriptionExpiry
                    ? new Date(userData.subscriptionExpiry).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          ) : !userData?.isSubscribed ? (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-white">Request Premium Access</h4>
                  <p className="text-sm text-slate-400">Select a plan and send request</p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                  Free Plan
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
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
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-xs text-blue-400 mb-2">GCash Payment</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Number</span>
                        <span className="text-white font-bold">09469086926</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name</span>
                        <span className="text-white">Earl Christian Rey</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount</span>
                        <span className="text-amber-400 font-bold">
                          ₱{PLANS.find((p) => p.id === selectedPlan)?.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      GCash Reference Number
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter reference number from GCash"
                      className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={requestSubscription}
                    disabled={requesting || !referenceNumber.trim()}
                    className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50"
                  >
                    {requesting ? "Sending..." : "Request Premium"}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {subRequests.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">Your Requests</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {subRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {req.plan.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-400">
                          Ref: {req.reference_number || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          req.status === "approved"
                            ? "bg-green-400/10 text-green-400"
                            : req.status === "rejected"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-amber-400/10 text-amber-400"
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
