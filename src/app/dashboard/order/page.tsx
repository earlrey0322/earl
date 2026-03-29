"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api-fetch";

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

interface Product { id: string; name: string; price: number; desc: string; }
interface Order {
  id: number; buyerName: string; buyerPhone: string; buyerAddress: string;
  product: string; quantity: number; totalPrice: number; status: string; notes: string; createdAt: string;
}
interface UserData { id: number; role: string; fullName: string; isSubscribed: boolean; email: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/10 text-yellow-400",
  confirmed: "bg-blue-400/10 text-blue-400",
  shipped: "bg-purple-400/10 text-purple-400",
  delivered: "bg-green-400/10 text-green-400",
  cancelled: "bg-red-400/10 text-red-400",
};

export default function OrderPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/auth/me").then((r) => r.json()),
      apiFetch("/api/orders").then((r) => r.json()),
    ]).then(([meRes, ordersRes]) => {
      if (meRes.status === "fulfilled" && meRes.value.user) {
        const u = meRes.value.user;
        setUserData(u);
        setBuyerName(u.fullName || "");
      }
      if (ordersRes.status === "fulfilled") {
        if (ordersRes.value.orders) setOrders(ordersRes.value.orders);
        if (ordersRes.value.products) setProducts(ordersRes.value.products);
      }
    }).catch(() => {});
  }, []);

  const selectedProd = products.find((p) => p.id === selectedProduct);
  const totalPrice = selectedProd ? selectedProd.price * quantity : 0;

  async function handleOrder() {
    playClick();
    setError(""); setMessage("");
    if (!buyerName || !buyerPhone || !buyerAddress || !selectedProduct) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({ buyerName, buyerPhone, buyerAddress, product: selectedProd?.name, quantity, totalPrice, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => [data.order, ...prev]);
        setMessage("Order placed! Pay via GCash: 09469086926 (Earl Christian Rey) to confirm.");
        setSelectedProduct("");
        setQuantity(1);
        setNotes("");
      } else {
        setError(data.error || "Order failed");
      }
    } catch { setError("Network error"); }
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    playClick();
    await apiFetch("/api/orders", { method: "PATCH", body: JSON.stringify({ id, status }) });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  const isOwner = userData?.role === "company_owner";

  return (
    <DashboardShell title="Order PSPCS">
      <div className="space-y-8">
        {/* Order Form */}
        {!isOwner && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Order PSPCS Station</h2>
            <p className="text-sm text-slate-400 mb-6">Order your own Powered Solar Piso Charging Station. Pay via GCash to confirm.</p>

            {message && <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">{message}</div>}
            {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Phone Number</label>
                <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="09XXXXXXXXX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">Delivery Address</label>
                <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="Full address for delivery" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Product</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400">
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — ₱{p.price}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Quantity</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="Special instructions" />
              </div>
            </div>

            {selectedProd && (
              <div className="mt-4 p-4 bg-amber-400/10 border border-amber-400/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{selectedProd.name}</p>
                    <p className="text-xs text-slate-400">{selectedProd.desc}</p>
                    <p className="text-xs text-slate-400 mt-1">Qty: {quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">₱{totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleOrder} disabled={loading || !selectedProduct || !buyerName || !buyerPhone || !buyerAddress}
              className="w-full mt-4 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50 hover:shadow-lg">
              {loading ? "Placing Order..." : "Place Order"}
            </button>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400">
              After placing order, pay via GCash: <strong>09469086926</strong> (Earl Christian Rey) to confirm your order.
            </div>
          </div>
        )}

        {/* Product Catalog */}
        {!isOwner && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Available Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
                  <p className="text-lg font-bold text-amber-400 mt-2">₱{p.price.toLocaleString()}</p>
                  <button onClick={() => { playClick(); setSelectedProduct(p.id); }}
                    className="w-full mt-2 py-2 text-xs font-medium text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">{isOwner ? "All Orders" : "Your Orders"}</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{order.product}</p>
                      {isOwner && <p className="text-xs text-blue-400">{order.buyerName} — {order.buyerPhone}</p>}
                      <p className="text-xs text-slate-400 mt-1">{order.buyerAddress}</p>
                      <p className="text-xs text-slate-500">Qty: {order.quantity} | {new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.notes && <p className="text-xs text-slate-500 mt-1">Notes: {order.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">₱{order.totalPrice.toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-slate-700 text-slate-400"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      {["confirmed", "shipped", "delivered", "cancelled"].map((s) => (
                        <button key={s} onClick={() => updateStatus(order.id, s)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-full ${order.status === s ? STATUS_COLORS[s] : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GCash Info */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Payment Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">GCash Number</span>
              <span className="text-white font-bold">09469086926</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Account Name</span>
              <span className="text-white font-bold">Earl Christian Rey</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Email</span>
              <span className="text-white font-bold">earlrey0322@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
