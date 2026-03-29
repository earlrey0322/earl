"use client";

import { useEffect, useState, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      startTransition(() => {
        setStatus("error");
        setMessage(errorDescription || error);
      });
      return;
    }

    if (code) {
      fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          const data = await res.json();
          startTransition(() => {
            if (res.ok) {
              setStatus("success");
              setMessage("Email confirmed successfully!");
            } else {
              setStatus("error");
              setMessage(data.error || "Failed to confirm email");
            }
          });
          if (res.ok) {
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }
        })
        .catch((err) => {
          startTransition(() => {
            setStatus("error");
            setMessage("Failed to confirm email: " + String(err));
          });
        });
    } else {
      startTransition(() => {
        setStatus("error");
        setMessage("No confirmation code received");
      });
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-400/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Confirming Email...</h2>
          <p className="text-slate-400 text-sm">Please wait while we verify your email address.</p>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Email Confirmed!</h2>
          <p className="text-green-400 text-sm mb-4">{message}</p>
          <p className="text-slate-400 text-xs">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Confirmation Failed</h2>
        <p className="text-red-400 text-sm mb-4">{message}</p>
        <a href="/login" className="inline-block w-full py-3 font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">
          Go to Login
        </a>
      </div>
    </main>
  );
}
