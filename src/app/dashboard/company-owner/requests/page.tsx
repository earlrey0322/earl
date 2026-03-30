"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

interface Redemption {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  redemption_type: string;
  redemption_label: string;
  amount: number;
  status: string;
  contact_name: string | null;
  contact_number: string | null;
  delivery_address: string | null;
  created_at: string;
}

interface SubscriptionRequest {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  user_role: string;
  plan: string;
  status: string;
  reference_number: string;
  created_at: string;
  subscription_expiry: string | null;
}

interface MonthlyPayment {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  user_role: string;
  amount: number;
  reference_number: string;
  status: string;
  paid_for_month: string;
  created_at: string;
}

const PLAN_PRICES: Record<string, number> = {
  "1_day": 20,
  "1_week": 60,
  "1_month": 100,
  "3_months": 170,
  "6_months": 220,
  "1_year": 300,
};

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

export default function RequestsPage() {
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "redemptions">("pending");

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/subscription-requests").then((r) => r.json()),
      apiFetch("/api/monthly-payments").then((r) => r.json()),
      apiFetch("/api/redemptions").then((r) => r.json()),
    ]).then(([srR, mpR, rdR]) => {
      if (srR.status === "fulfilled" && srR.value.requests) setSubRequests(srR.value.requests);
      if (mpR.status === "fulfilled" && mpR.value.payments) setMonthlyPayments(mpR.value.payments);
      if (rdR.status === "fulfilled" && rdR.value.redemptions) setRedemptions(rdR.value.redemptions);
    }).catch((err) => console.error("Requests fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscriptionRequest(requestId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "PATCH", body: JSON.stringify({ requestId, approve }) });
      const data = await res.json();
      if (res.ok) {
        setSubRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r));
        alert(`Request ${approve ? "approved" : "rejected"}!`);
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleMonthlyPayment(paymentId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/monthly-payments", { method: "PATCH", body: JSON.stringify({ paymentId, approve }) });
      const data = await res.json();
      if (res.ok) {
        setMonthlyPayments((prev) => prev.map((p) => p.id === paymentId ? { ...p, status: approve ? "approved" : "rejected" } : p));
        alert(`Monthly payment ${approve ? "approved" : "rejected"}!`);
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleRedemption(redemptionId: number, approve: boolean) {
    playClick();
    try {
      const res = await apiFetch("/api/redemptions", { method: "PATCH", body: JSON.stringify({ redemptionId, approve }) });
      if (res.ok) {
        setRedemptions((prev) => prev.map((r) => r.id === redemptionId ? { ...r, status: approve ? "approved" : "rejected" } : r));
        alert(`Redemption ${approve ? "approved" : "rejected"}!`);
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function deleteSubscriptionRequest(requestId: number) {
    playClick();
    if (!confirm("Delete this request?")) return;
    try {
      const res = await apiFetch("/api/subscription-requests", { method: "DELETE", body: JSON.stringify({ requestId }) });
      if (res.ok) {
        setSubRequests((prev) => prev.filter((r) => r.id !== requestId));
        alert("Deleted!");
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  async function deleteMonthlyPayment(paymentId: number) {
    playClick();
    if (!confirm("Delete this payment request?")) return;
    try {
      const res = await apiFetch("/api/monthly-payments", { method: "DELETE", body: JSON.stringify({ paymentId }) });
      if (res.ok) {
        setMonthlyPayments((prev) => prev.filter((p) => p.id !== paymentId));
        alert("Deleted!");
      }
    } catch (err) { alert("Error: " + String(err)); }
  }

  const pendingSubRequests = subRequests.filter((r) => r.status === "pending");
  const pendingMonthlyPayments = monthlyPayments.filter((p) => p.status === "pending");
  const approvedSubRequests = subRequests.filter((r) => r.status === "approved");
  const approvedMonthlyPayments = monthlyPayments.filter((p) => p.status === "approved");
  const pendingRedemptions = redemptions.filter((r) => r.status === "pending");

  const subscriptionRevenue = approvedSubRequests.reduce((s, r) => s + (PLAN_PRICES[r.plan] || 0), 0);
  const monthlyPaymentRevenue = approvedMonthlyPayments.reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) {
    return (
      <DashboardShell title="Requests">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading requests...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Requests">
      <div className="space-y-8">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === "pending" ? "bg-amber-400/20 text-amber-400" : "text-slate-400 hover:text-white"}`}
          >
            Pending ({pendingSubRequests.length + pendingMonthlyPayments.length + pendingRedemptions.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === "approved" ? "bg-green-400/20 text-green-400" : "text-slate-400 hover:text-white"}`}
          >
            Approved ({approvedSubRequests.length + approvedMonthlyPayments.length})
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === "redemptions" ? "bg-purple-400/20 text-purple-400" : "text-slate-400 hover:text-white"}`}
          >
            Redemptions ({pendingRedemptions.length})
          </button>
        </div>

        {/* Revenue Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Revenue Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-blue-400/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">₱{subscriptionRevenue}</div>
              <div className="text-xs text-slate-400">Subscriptions</div>
            </div>
            <div className="px-4 py-3 bg-purple-400/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">₱{monthlyPaymentRevenue}</div>
              <div className="text-xs text-slate-400">Monthly Payments</div>
            </div>
            <div className="px-4 py-3 bg-green-400/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">₱{subscriptionRevenue + monthlyPaymentRevenue}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
          </div>
        </div>

        {/* Pending Tab */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            {pendingSubRequests.length === 0 && pendingMonthlyPayments.length === 0 && pendingRedemptions.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No pending requests.</div>
            ) : (
              <>
                {/* Subscription Requests */}
                {pendingSubRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Subscription Requests</h3>
                    {pendingSubRequests.map((req) => (
                      <div key={`sub-${req.id}`} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{req.user_name} wants to have a {req.plan.replace(/_/g, " ")}</p>
                            <p className="text-xs text-slate-400">{req.user_email} ({req.user_role})</p>
                            <p className="text-xs text-slate-500">Ref: {req.reference_number || "N/A"}</p>
                            <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSubscriptionRequest(req.id, true)}
                              className="px-4 py-2 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                              Accept
                            </button>
                            <button onClick={() => handleSubscriptionRequest(req.id, false)}
                              className="px-4 py-2 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Monthly Payment Requests */}
                {pendingMonthlyPayments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Monthly Payment Requests</h3>
                    {pendingMonthlyPayments.map((payment) => (
                      <div key={`mp-${payment.id}`} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{payment.user_name} wants to pay monthly fee</p>
                            <p className="text-xs text-slate-400">{payment.user_email} ({payment.user_role})</p>
                            <p className="text-xs text-amber-400">₱{payment.amount} for {payment.paid_for_month}</p>
                            <p className="text-xs text-slate-500">Ref: {payment.reference_number || "N/A"}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleMonthlyPayment(payment.id, true)}
                              className="px-4 py-2 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                              Approve
                            </button>
                            <button onClick={() => handleMonthlyPayment(payment.id, false)}
                              className="px-4 py-2 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Approved Tab */}
        {activeTab === "approved" && (
          <div className="space-y-6">
            {approvedSubRequests.length === 0 && approvedMonthlyPayments.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No approved requests.</div>
            ) : (
              <>
                {/* Approved Subscriptions */}
                {approvedSubRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Approved Subscriptions</h3>
                    {approvedSubRequests.map((req) => (
                      <div key={`approved-sub-${req.id}`} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{req.user_name} - {req.plan.replace(/_/g, " ")}</p>
                            <p className="text-xs text-green-400">Approved</p>
                            {req.subscription_expiry && (
                              <p className="text-xs text-slate-500">Expires: {new Date(req.subscription_expiry).toLocaleString()}</p>
                            )}
                          </div>
                          <button onClick={() => deleteSubscriptionRequest(req.id)}
                            className="px-3 py-1 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-700">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approved Monthly Payments */}
                {approvedMonthlyPayments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Approved Monthly Payments</h3>
                    {approvedMonthlyPayments.map((payment) => (
                      <div key={`approved-mp-${payment.id}`} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{payment.user_name} - ₱{payment.amount}</p>
                            <p className="text-xs text-green-400">Approved for {payment.paid_for_month}</p>
                          </div>
                          <button onClick={() => deleteMonthlyPayment(payment.id)}
                            className="px-3 py-1 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-700">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Redemptions Tab */}
        {activeTab === "redemptions" && (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-4 bg-purple-500/5 border border-purple-500/30">
              <p className="text-sm text-purple-400 font-medium">Redemption Points Guide</p>
              <p className="text-xs text-slate-400 mt-1">1000 pts = Full Station | 500 pts = Parts | 100 pts = 3 Coin Slots | 50 pts = Cable</p>
            </div>

            {pendingRedemptions.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center text-slate-400">No pending redemptions.</div>
            ) : (
              <div className="space-y-3">
                {pendingRedemptions.map((r) => (
                  <div key={r.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{r.user_name}</p>
                        <p className="text-xs text-slate-400">{r.user_email}</p>
                        <p className="text-xs text-amber-400 mt-1">{r.redemption_label || r.redemption_type} - {r.amount} pts</p>
                        {(r.contact_name || r.delivery_address) && (
                          <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-white">{r.contact_name} - {r.contact_number}</p>
                            <p className="text-xs text-slate-400">{r.delivery_address}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRedemption(r.id, true)}
                          className="px-3 py-1 text-xs font-bold text-green-400 border border-green-400/30 rounded hover:bg-green-400/10">
                          Approve
                        </button>
                        <button onClick={() => handleRedemption(r.id, false)}
                          className="px-3 py-1 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
