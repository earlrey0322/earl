"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

function playError() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 200;
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

const PHONE_BRANDS = [
  "Apple iPhone", "Samsung Galaxy", "Xiaomi", "Huawei", "OPPO", "Vivo",
  "Realme", "OnePlus", "Nokia", "Google Pixel", "Infinix", "Tecno", "Other",
];

type Role = "customer" | "branch_owner" | "company_owner";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    role: "" as Role | "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    contactNumber: "",
    address: "",
    phoneBrand: "",
    worklifeAnswer: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function getWorklifeHint() {
    if (form.role === "company_owner") return 'Must answer "SUSTAINABILITY"';
    if (form.role === "branch_owner") return 'Must answer "ENVIRONMENT"';
    return "Any answer accepted";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    playClick();
    setError("");

    if (form.password !== form.confirmPassword) {
      playError();
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      playError();
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          phoneBrand: form.phoneBrand,
          contactNumber: form.contactNumber,
          address: form.address,
          worklifeAnswer: form.worklifeAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        playError();
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      playSuccess();

      // Notify about email notification
      alert(
        `Account created successfully! A notification has been sent to earlrey0322@gmail.com.\n\nWelcome to PSPCS by KLEOXM 111!`
      );

      switch (data.user.role) {
        case "company_owner":
          router.push("/dashboard/company-owner");
          break;
        case "branch_owner":
          router.push("/dashboard/branch-owner");
          break;
        default:
          router.push("/dashboard/customer");
      }
    } catch {
      playError();
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg className="w-14 h-14 mx-auto mb-3" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="14" fill="#f59e0b" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="32"
                y1="4"
                x2="32"
                y2="12"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${deg} 32 32)`}
              />
            ))}
          </svg>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Join PSPCS by KLEOXM 111 — Step {step} of 3
          </p>
          {/* Progress */}
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-16 rounded-full transition-colors ${
                  s <= step ? "bg-amber-400" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-4 slide-in">
              <h2 className="text-lg font-bold text-white">Select Your Role</h2>
              {([
                {
                  value: "customer" as Role,
                  title: "Customer",
                  desc: "I want to charge my phone at PSPCS stations",
                  icon: "🔋",
                },
                {
                  value: "branch_owner" as Role,
                  title: "Station/Branch Owner",
                  desc: "I own a PSPCS charging station",
                  icon: "⚡",
                },
                {
                  value: "company_owner" as Role,
                  title: "Company Owner",
                  desc: "I am part of KLEOXM 111 management",
                  icon: "🏢",
                },
              ]).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    playClick();
                    updateForm("role", r.value);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    form.role === r.value
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <h3 className="font-bold text-white">{r.title}</h3>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                disabled={!form.role}
                onClick={() => {
                  playClick();
                  setStep(2);
                }}
                className="w-full py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4 slide-in">
              <h2 className="text-lg font-bold text-white">Personal Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateForm("fullName", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => updateForm("contactNumber", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="09XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="City, Province"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setStep(1);
                  }}
                  className="flex-1 py-3 font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!form.fullName || !form.email}
                  onClick={() => {
                    playClick();
                    setStep(3);
                  }}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verification & Password */}
          {step === 3 && (
            <div className="space-y-4 slide-in">
              <h2 className="text-lg font-bold text-white">Verification & Password</h2>

              {/* Worklife Question */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  What is your worklife focus?
                </label>
                <p className="text-xs text-amber-400 mb-2">{getWorklifeHint()}</p>
                <input
                  type="text"
                  value={form.worklifeAnswer}
                  onChange={(e) => updateForm("worklifeAnswer", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors uppercase"
                  placeholder={
                    form.role === "company_owner"
                      ? "SUSTAINABILITY"
                      : form.role === "branch_owner"
                      ? "ENVIRONMENT"
                      : "Your answer"
                  }
                />
              </div>

              {/* Phone Brand for customers */}
              {form.role === "customer" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Brand</label>
                  <select
                    value={form.phoneBrand}
                    onChange={(e) => updateForm("phoneBrand", e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="">Select your phone brand</option>
                    {PHONE_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateForm("confirmPassword", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Email notification notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 text-blue-400 text-xs">
                📧 A notification will be sent to earlrey0322@gmail.com upon account creation.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setStep(2);
                  }}
                  className="flex-1 py-3 font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.password || !form.confirmPassword}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-green-500/25 transition-all"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                playClick();
                router.push("/login");
              }}
              className="text-amber-400 hover:underline"
            >
              Log In
            </button>
          </p>
        </form>

        <button
          onClick={() => {
            playClick();
            router.push("/");
          }}
          className="mt-6 w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
