"use client";

import { useState } from "react";

interface HistoryItem {
  id: number; phoneBrand: string; startBattery: number; targetBattery: number;
  costPesos: number; durationMinutes: number; stationName: string; userEmail: string; createdAt: string;
}

function playClick() {
  try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sine"; g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15); } catch {}
}

const PHONE_BRANDS = ["Apple iPhone","Samsung Galaxy","Xiaomi","Huawei","OPPO","Vivo","Realme","OnePlus","Nokia","Google Pixel","Infinix","Tecno","Other"];

const PHONE_RATES: Record<string, number> = {
  "Apple iPhone": 20, "Samsung Galaxy": 25, "Xiaomi": 33, "Huawei": 40,
  "OPPO": 30, "Vivo": 33, "Realme": 30, "OnePlus": 30, "Nokia": 18,
  "Google Pixel": 23, "Infinix": 18, "Tecno": 18, "Other": 20,
};

function compute(phoneBrand: string, current: number, target: number) {
  if (!phoneBrand || current >= target) return null;
  const rate = PHONE_RATES[phoneBrand] || 20;
  const wh = 16.65;
  const energy = ((target - current) / 100) * wh;
  const minutes = Math.max(Math.ceil((energy / rate) * 60), 3);
  const cost = Math.max(Math.ceil(minutes / 3), 1);
  return { watts: rate, minutes, cost, energy: Math.round(energy * 100) / 100 };
}

export function ChargingCalculator({
  stationId, stationName, companyName, onSessionStart, history, showAllHistory = false,
}: {
  stationId?: number;
  stationName?: string;
  companyName?: string;
  onSessionStart?: (data: { stationId: number; phoneBrand: string; startBattery: number; targetBattery: number; costPesos: number; durationMinutes: number }) => void;
  history?: HistoryItem[];
  showAllHistory?: boolean;
}) {
  const isKleoxm = companyName === "KLEOXM 111";
  const [phoneBrand, setPhoneBrand] = useState("");
  const [currentBattery, setCurrentBattery] = useState(55);
  const [targetBattery, setTargetBattery] = useState(100);

  const result = compute(phoneBrand, currentBattery, targetBattery);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white">PSPCS-based Calculator</h3>
            <p className="text-xs text-slate-400">
              {isKleoxm ? "Accurate estimate for KLEOXM 111 stations" : "Approximate estimate (most accurate for KLEOXM 111)"}
            </p>
          </div>
        </div>

        {stationId && companyName && !isKleoxm && (
          <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
            <p className="text-xs text-amber-400">⚠️ This estimate is optimized for KLEOXM 111 stations. Results may vary for other stations.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone Brand</label>
          <select value={phoneBrand} onChange={(e) => setPhoneBrand(e.target.value)}
            className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400">
            <option value="">Select phone brand</option>
            {PHONE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Current Battery: <span className="text-amber-400 font-bold">{currentBattery}%</span></label>
          <input type="range" min={1} max={99} value={currentBattery} onChange={(e) => setCurrentBattery(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, ${currentBattery > 50 ? "#22c55e" : currentBattery > 20 ? "#f59e0b" : "#ef4444"} ${currentBattery}%, #334155 ${currentBattery}%)` }} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Battery: <span className="text-green-400 font-bold">{targetBattery}%</span></label>
          <input type="range" min={currentBattery + 1} max={100} value={targetBattery} onChange={(e) => setTargetBattery(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700" />
        </div>

        {result && (
          <div className="bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-amber-400">Result</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center"><div className="text-2xl font-bold text-white">₱{result.cost}</div><div className="text-[10px] text-slate-400">Cost</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-white">{result.minutes}</div><div className="text-[10px] text-slate-400">Minutes</div></div>
              <div className="text-center"><div className="text-lg font-bold text-white">{result.watts}W</div><div className="text-[10px] text-slate-400">Rate</div></div>
              <div className="text-center"><div className="text-lg font-bold text-white">{result.energy}Wh</div><div className="text-[10px] text-slate-400">Energy</div></div>
            </div>
            {stationId && onSessionStart && (
              <button onClick={() => { playClick(); onSessionStart({ stationId, phoneBrand, startBattery: currentBattery, targetBattery, costPesos: result.cost, durationMinutes: result.minutes }); }}
                className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg hover:shadow-lg">
                Start Charging — ₱{result.cost} ({result.minutes} min)
              </button>
            )}
          </div>
        )}
      </div>

      {history && history.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">{showAllHistory ? "All Charging History" : "Your Charging History"}</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.slice(0, 20).map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{h.phoneBrand}</p>
                  {showAllHistory && <p className="text-xs text-blue-400">{h.userEmail}</p>}
                  <p className="text-xs text-slate-400">{h.stationName}</p>
                  <p className="text-xs text-slate-500">{h.startBattery}% → {h.targetBattery}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">₱{h.costPesos}</p>
                  <p className="text-xs text-slate-500">{h.durationMinutes} min</p>
                  <p className="text-[10px] text-slate-600">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
