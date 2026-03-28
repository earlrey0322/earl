"use client";

import { useState, useMemo } from "react";

interface ChargingResult {
  estimatedWatts: number;
  durationMinutes: number;
  costPesos: number;
  energyNeeded: number;
}

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

const PHONE_BRANDS = [
  "Apple iPhone", "Samsung Galaxy", "Xiaomi", "Huawei", "OPPO", "Vivo",
  "Realme", "OnePlus", "Nokia", "Google Pixel", "Infinix", "Tecno", "Other",
];

const PHONE_RATES: Record<string, number> = {
  "Apple iPhone": 20, "Samsung Galaxy": 25, "Xiaomi": 33, "Huawei": 40,
  "OPPO": 30, "Vivo": 33, "Realme": 30, "OnePlus": 30, "Nokia": 18,
  "Google Pixel": 23, "Infinix": 18, "Tecno": 18, "Other": 20,
};

function computeResult(phoneBrand: string, currentBattery: number, targetBattery: number): ChargingResult | null {
  if (!phoneBrand || currentBattery >= targetBattery) return null;

  const rate = PHONE_RATES[phoneBrand] || 20;
  const avgBatteryWh = 16.65;
  const toCharge = targetBattery - currentBattery;
  const energyNeeded = (toCharge / 100) * avgBatteryWh;
  const durationHours = energyNeeded / rate;
  const durationMinutes = Math.max(Math.ceil(durationHours * 60), 5);
  const costPesos = Math.max(Math.ceil(durationMinutes / 5), 1);

  return {
    estimatedWatts: rate,
    durationMinutes,
    costPesos,
    energyNeeded: Math.round(energyNeeded * 100) / 100,
  };
}

export function ChargingCalculator({
  stationId,
  onSessionStart,
}: {
  stationId?: number;
  onSessionStart?: (session: {
    stationId: number;
    phoneBrand: string;
    startBattery: number;
    targetBattery: number;
    costPesos: number;
    durationMinutes: number;
  }) => void;
}) {
  const [phoneBrand, setPhoneBrand] = useState("");
  const [currentBattery, setCurrentBattery] = useState(55);
  const [targetBattery, setTargetBattery] = useState(100);

  const result = useMemo(
    () => computeResult(phoneBrand, currentBattery, targetBattery),
    [phoneBrand, currentBattery, targetBattery]
  );

  function handleStartSession() {
    if (!result || !stationId) return;
    playClick();
    onSessionStart?.({
      stationId,
      phoneBrand,
      startBattery: currentBattery,
      targetBattery,
      costPesos: result.costPesos,
      durationMinutes: result.durationMinutes,
    });
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white">Charging Calculator</h3>
          <p className="text-xs text-slate-400">Calculate cost to charge your phone</p>
        </div>
      </div>

      {/* Phone Brand */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Phone Brand</label>
        <select
          value={phoneBrand}
          onChange={(e) => {
            playClick();
            setPhoneBrand(e.target.value);
          }}
          className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 transition-colors"
        >
          <option value="">Select your phone brand</option>
          {PHONE_BRANDS.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      {/* Current Battery */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Current Battery: <span className="text-amber-400 font-bold">{currentBattery}%</span>
        </label>
        <input
          type="range"
          min={1}
          max={99}
          value={currentBattery}
          onChange={(e) => setCurrentBattery(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${
              currentBattery > 50 ? "#22c55e" : currentBattery > 20 ? "#f59e0b" : "#ef4444"
            } ${currentBattery}%, #334155 ${currentBattery}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>1%</span>
          <span>50%</span>
          <span>99%</span>
        </div>
      </div>

      {/* Target Battery */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Target Battery: <span className="text-green-400 font-bold">{targetBattery}%</span>
        </label>
        <input
          type="range"
          min={currentBattery + 1}
          max={100}
          value={targetBattery}
          onChange={(e) => setTargetBattery(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
          style={{
            background: `linear-gradient(to right, #22c55e ${((targetBattery - currentBattery) / (100 - currentBattery)) * 100}%, #334155 ${((targetBattery - currentBattery) / (100 - currentBattery)) * 100}%)`,
          }}
        />
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-5 space-y-3 slide-in">
          <h4 className="text-sm font-bold text-amber-400">Charging Estimate</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">₱{result.costPesos}</div>
              <div className="text-[10px] text-slate-400">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{result.durationMinutes}</div>
              <div className="text-[10px] text-slate-400">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{result.estimatedWatts}W</div>
              <div className="text-[10px] text-slate-400">Charging Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{result.energyNeeded}Wh</div>
              <div className="text-[10px] text-slate-400">Energy Needed</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            Rate: 1 peso = 5 minutes | PSPCS 3.6VDC output
          </p>

          {stationId && (
            <button
              onClick={handleStartSession}
              className="w-full py-3 text-sm font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all"
            >
              Start Charging Session — ₱{result.costPesos}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
