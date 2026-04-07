"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

interface StoreItem { id: string; name: string; description: string; price: number; image?: string; specs?: string[]; }
interface StoreOrder { id: number; item_name: string; amount: number; full_name: string; contact_number: string; delivery_address: string; reference_number: string; status: string; created_at: string; }

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [form, setForm] = useState({ fullName: "", contactNumber: "", deliveryAddress: "", referenceNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/store").then(r => r.json()).then(d => {
      if (d.items) setItems(d.items);
      if (d.orders) setOrders(d.orders);
    }).catch(() => {});
  }, []);

  async function submitOrder() {
    if (!selectedItem || !form.fullName || !form.contactNumber || !form.deliveryAddress || !form.referenceNumber) {
      alert("Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/store", {
        method: "POST",
        body: JSON.stringify({ itemId: selectedItem.id, ...form }),
      });
      const d = await res.json();
      if (res.ok) {
        alert("Order submitted! We'll contact you soon.");
        setShowBuyModal(false);
        setSelectedItem(null);
        setForm({ fullName: "", contactNumber: "", deliveryAddress: "", referenceNumber: "" });
        const refresh = await apiFetch("/api/store");
        const refreshData = await refresh.json();
        if (refreshData.orders) setOrders(refreshData.orders);
      } else {
        alert("Error: " + (d.error || "Failed to submit order"));
      }
    } catch (err) { alert("Error: " + String(err)); }
    setSubmitting(false);
  }

  return (
    <DashboardShell title="PSPCS Store">
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-amber-400/10 to-orange-500/5">
          <h2 className="text-2xl font-bold text-white">PSPCS Store</h2>
          <p className="text-slate-400 mt-1">Buy charging stations and parts</p>
        </div>

        {/* GCash Info */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">GCash Payment</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Number:</span> <span className="text-white font-bold">09469086926</span></div>
            <div><span className="text-slate-400">Name:</span> <span className="text-white font-bold">Earl Christian Rey</span></div>
          </div>
        </div>

        {/* Store Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Available Items</h3>
          {items.length === 0 ? (
            <p className="text-slate-400">Loading items...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="glass-card rounded-2xl overflow-hidden">
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex items-center justify-center">
                    <img
                      src={item.image || "https://assets.kiloapps.io/user_061af2b2-c2a5-4dde-be2d-578f8d4a3f18/f9f43215-05fa-484b-a516-be2eb8521f47/14c8ce58-f984-482f-bbf8-0c4ce615ec7a.png"}
                      alt={item.name}
                      className="w-48 h-48 object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-green-400/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                      IN STOCK
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-white text-xl">{item.name}</h4>
                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                    
                    {item.specs && item.specs.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Specifications</h5>
                        <ul className="space-y-1.5">
                          {item.specs.map((spec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {spec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-3xl font-bold text-amber-400">₱{item.price.toLocaleString()}</span>
                      <button
                        onClick={() => { setSelectedItem(item); setShowBuyModal(true); }}
                        className="px-6 py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Your Orders</h3>
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{order.item_name}</p>
                        <p className="text-sm text-amber-400">₱{order.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Ref: {order.reference_number}</p>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        order.status === "approved" ? "bg-green-400/10 text-green-400" :
                        order.status === "rejected" ? "bg-red-400/10 text-red-400" :
                        "bg-amber-400/10 text-amber-400"
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Buy Modal */}
        {showBuyModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-2">Buy {selectedItem.name}</h3>
              <p className="text-2xl font-bold text-amber-400 mb-4">₱{selectedItem.price.toLocaleString()}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Contact Number</label>
                  <input type="text" value={form.contactNumber} onChange={(e) => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white" placeholder="09XX XXX XXXX" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Delivery Address</label>
                  <textarea value={form.deliveryAddress} onChange={(e) => setForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white" rows={3} placeholder="Full delivery address" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">GCash Reference Number</label>
                  <input type="text" value={form.referenceNumber} onChange={(e) => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white" placeholder="Reference number" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={submitOrder} disabled={submitting}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">
                  {submitting ? "Submitting..." : "Confirm Purchase"}
                </button>
                <button onClick={() => { setShowBuyModal(false); setSelectedItem(null); }}
                  className="px-6 py-3 text-slate-400 border border-slate-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
