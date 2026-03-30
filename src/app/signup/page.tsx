"use client";

import { useState } from "react";

const PHONE_BRANDS = ["Apple iPhone", "Samsung Galaxy", "Xiaomi", "Huawei", "OPPO", "Vivo", "Realme", "OnePlus", "Nokia", "Google Pixel", "Other"];

type Role = "customer" | "branch_owner" | "other_branch" | "company_owner";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const [form, setForm] = useState({
    role: "" as Role | "", email: "", password: "", confirmPassword: "",
    fullName: "", contactNumber: "", address: "", phoneBrand: "", worklifeAnswer: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isValidEmail = form.email.includes("@") && form.email.includes(".");

  async function sendVerificationCode() {
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }
    setSendingCode(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setSentCode(data.code);
      } else {
        setError(data.error || "Failed to send verification code");
      }
    } catch (err) {
      setError("Failed to send verification code");
    }
    setSendingCode(false);
  }

  function verifyCode() {
    if (verificationCode === sentCode && sentCode !== "") {
      setIsEmailVerified(true);
      setError("");
    } else {
      setError("Invalid verification code. Please check your email and try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isEmailVerified) {
      setError("Please verify your email first");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, fullName: form.fullName.trim(),
          role: form.role, phoneBrand: form.phoneBrand, contactNumber: form.contactNumber,
          address: form.address, worklifeAnswer: form.worklifeAnswer,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server returned invalid response");
        setLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      let url = "/dashboard/customer";
      if (data.user?.role === "company_owner") url = "/dashboard/company-owner";
      else if (data.user?.role === "branch_owner" || data.user?.role === "other_branch") url = "/dashboard/branch-owner";

      window.location.href = url;
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-xl font-bold text-[#0f172a]">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join PSPCS by KLEOXM 111 — Step {step} of 3</p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-16 rounded-full ${s <= step ? "bg-amber-400" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5" suppressHydrationWarning>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Select Your Role</h2>
              {([
                { value: "customer" as Role, title: "Customer", desc: "I want to charge my phone", icon: "🔋" },
                { value: "branch_owner" as Role, title: "Station Owner", desc: "I own a PSPCS station (₱75/month)", icon: "⚡" },
                { value: "other_branch" as Role, title: "Other Branch", desc: "I operate another branch (₱100/month)", icon: "🏪" },
                { value: "company_owner" as Role, title: "Company Owner", desc: "KLEOXM 111 management", icon: "🏢" },
              ]).map((r) => (
                <button key={r.value} type="button" onClick={() => update("role", r.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${form.role === r.value ? "border-amber-400 bg-amber-400/10" : "border-slate-600 hover:border-slate-500"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div><h3 className="font-bold text-white">{r.title}</h3><p className="text-xs text-slate-400">{r.desc}</p></div>
                  </div>
                </button>
              ))}
              <button type="button" disabled={!form.role} onClick={() => setStep(2)}
                className="w-full py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Personal Information</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="Juan Dela Cruz" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => { update("email", e.target.value); setIsEmailVerified(false); setCodeSent(false); setSentCode(""); setVerificationCode(""); }} required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="your@gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number</label>
                <input type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="09XXXXXXXXX" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 font-medium text-slate-300 border border-slate-600 rounded-lg">Back</button>
                <button type="button" disabled={!form.fullName || !form.email} onClick={() => setStep(3)}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Email Verification & Password</h2>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <label className="block text-sm font-medium text-slate-300 mb-2">Verify Your Email</label>
                <p className="text-xs text-slate-400 mb-3">
                  {isValidEmail 
                    ? `We'll send a verification code to ${form.email}`
                    : "Enter a valid email in Step 2 first"}
                </p>
                
                {!codeSent && !isEmailVerified && (
                  <button type="button" onClick={sendVerificationCode} disabled={!isValidEmail || sendingCode}
                    className="w-full py-3 text-sm font-bold text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 disabled:opacity-50">
                    {sendingCode ? "Sending..." : "Click to Verify Email"}
                  </button>
                )}

                {codeSent && !isEmailVerified && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-sm text-green-400 font-medium">✓ Code sent to your email!</p>
                      <p className="text-xs text-slate-400 mt-1">Check your inbox: {form.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">Enter 6-digit code</label>
                      <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                        placeholder="000000" maxLength={6} />
                    </div>
                    <button type="button" onClick={verifyCode} disabled={verificationCode.length !== 6}
                      className="w-full py-2 text-sm font-bold text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 disabled:opacity-50">
                      Verify Code
                    </button>
                    <button type="button" onClick={sendVerificationCode}
                      className="w-full py-2 text-xs text-slate-400 hover:text-slate-300">
                      Didn&apos;t receive code? Resend
                    </button>
                  </div>
                )}

                {isEmailVerified && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-400 font-bold">✓ Email Verified!</p>
                    <p className="text-xs text-slate-400">{form.email}</p>
                  </div>
                )}
              </div>

              {form.role === "customer" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Brand</label>
                  <select value={form.phoneBrand} onChange={(e) => update("phoneBrand", e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400">
                    <option value="">Select your phone brand</option>
                    {PHONE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Worklife Answer</label>
                <input type="text" value={form.worklifeAnswer} onChange={(e) => update("worklifeAnswer", e.target.value)} required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 uppercase focus:outline-none focus:border-amber-400"
                  placeholder="Enter worklife answer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" placeholder="Confirm password" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 font-medium text-slate-300 border border-slate-600 rounded-lg">Back</button>
                <button type="submit" disabled={loading || !form.password || !form.confirmPassword || !isEmailVerified || !form.worklifeAnswer}
                  className="flex-1 py-3 font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg disabled:opacity-50">
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-400">
            Already have an account? <a href="/login" className="text-amber-400 hover:underline">Log In</a>
          </p>
        </form>
      </div>
    </main>
  );
}
