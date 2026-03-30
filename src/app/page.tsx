"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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

function SolarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" />
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
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function ChargingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <rect x="18" y="8" width="28" height="48" rx="4" stroke="#22c55e" strokeWidth="3" />
      <rect x="26" y="4" width="12" height="6" rx="2" fill="#22c55e" />
      <rect x="24" y="40" width="16" height="12" rx="2" fill="#22c55e" opacity="0.4" />
      <rect x="24" y="28" width="16" height="12" rx="2" fill="#22c55e" opacity="0.6" />
      <rect x="24" y="16" width="16" height="12" rx="2" fill="#22c55e" />
      <path d="M30 20 L36 28 L32 28 L34 36 L28 28 L32 28 Z" fill="#0f172a" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas!.height + 10;
          p.x = Math.random() * canvas!.width;
        }
        if (p.x < -10) p.x = canvas!.width + 10;
        if (p.x > canvas!.width + 10) p.x = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx!.fill();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-3">
          <img src="https://assets.kiloapps.io/user_061af2b2-c2a5-4dde-be2d-578f8d4a3f18/f9f43215-05fa-484b-a516-be2eb8521f47/ad30a66a-ccea-4204-bb5d-83d87e90b9f6.jpg" alt="PSPCS Logo" className="w-12 h-12 rounded-lg object-contain" />
          <div>
            <h1 className="text-xl font-bold text-amber-400">KLEOXM 111</h1>
            <p className="text-xs text-slate-400">Powered Solar Piso Charging Station</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playClick();
              router.push("/login");
            }}
            suppressHydrationWarning
            className="px-5 py-2 text-sm font-medium text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 transition-all"
          >
            Log In
          </button>
          <button
            onClick={() => {
              playClick();
              router.push("/signup");
            }}
            suppressHydrationWarning
            className="px-5 py-2 text-sm font-medium text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
        <div className="float mb-6">
          <img src="https://assets.kiloapps.io/user_061af2b2-c2a5-4dde-be2d-578f8d4a3f18/f9f43215-05fa-484b-a516-be2eb8521f47/ad30a66a-ccea-4204-bb5d-83d87e90b9f6.jpg" alt="PSPCS Logo" className="w-40 h-40 md:w-56 md:h-56 rounded-2xl object-contain" />
        </div>
        <h2 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
            Powered Solar Piso
          </span>
          <br />
          <span className="text-white">Charging Station</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8">
          The <span className="text-amber-400 font-semibold">PSPCS</span> by KLEOXM 111 — 
          a solar-powered phone charging station. Find stations near you, track your charging, and go green!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            onClick={() => {
              playClick();
              router.push("/signup");
            }}
            suppressHydrationWarning
            className="px-8 py-3 text-lg font-bold text-[#0f172a] bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105"
          >
            Get Started
          </button>
          <button
            onClick={() => {
              playClick();
              router.push("/login");
            }}
            suppressHydrationWarning
            className="px-8 py-3 text-lg font-medium text-amber-400 border border-amber-400/30 rounded-xl hover:bg-amber-400/10 transition-all"
          >
            I Have an Account
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-8">
          {[
            {
              icon: <SolarIcon className="w-12 h-12" />,
              title: "Solar Powered",
              desc: "100% renewable energy. Solar panel with rectifier bridge diode for efficient DC output.",
            },
            {
              icon: <ChargingIcon className="w-12 h-12" />,
              title: "All Device Types",
              desc: "3.6VDC rotary output charges all phone brands and types. Universal compatibility.",
            },
            {
              icon: (
                <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="24" stroke="#3b82f6" strokeWidth="3" />
                  <path d="M32 16 L32 32 L44 32" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="32" cy="32" r="3" fill="#3b82f6" />
                </svg>
              ),
              title: "Real-time Tracking",
              desc: "Track battery level, solar watts, and find the nearest active station on the map.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 text-center slide-in"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specs */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <h3 className="text-2xl font-bold text-center text-white mb-8">Technical Specifications</h3>
        <div className="max-w-3xl mx-auto glass-card rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Solar Panel", value: "With Rectifier Bridge-type Diode" },
              { label: "DC Output", value: "For Battery Charging" },
              { label: "Inverter", value: "Battery to 220VAC Output" },
              { label: "Converter", value: "Transformer to 12VAC" },
              { label: "Rectifier", value: "12VAC to DC Conversion" },
              { label: "Final Output", value: "3.6VDC Rotary — All Types" },
              { label: "Brand", value: "KLEOXM 111 PSPCS" },
            ].map((spec, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">{spec.label}</span>
                <span className="text-sm font-medium text-amber-400">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Go Solar?</h3>
          <p className="text-slate-300 mb-8">
            Join KLEOXM 111 and be part of the sustainable energy revolution. 
            Create your account now and start charging with clean energy.
          </p>
          <button
            onClick={() => {
              playClick();
              router.push("/signup");
            }}
            suppressHydrationWarning
            className="px-10 py-4 text-lg font-bold text-[#0f172a] bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105"
          >
            Create Account
          </button>
        </div>
      </section>

      {/* Innovators */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <h3 className="text-2xl font-bold text-center text-white mb-8">Innovators</h3>
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Arena, Felix Miguel",
              "Durian, Gio",
              "Jacela, Kizjamira",
              "Rey, Earl Christian",
              "Wesca, Luckie Lorenz",
              "Zabaldica, Patrick",
            ].map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[#0f172a] font-bold text-xs">
                  {name.charAt(0)}
                </div>
                <span className="text-sm text-white">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SolarIcon className="w-6 h-6" />
            <span className="text-sm text-slate-400">KLEOXM 111 — PSPCS</span>
          </div>
          <div className="text-sm text-slate-500">
            Contact: 09469086926 (Earl Christian Rey) | earlrey0322@gmail.com
          </div>
        </div>
      </footer>
    </main>
  );
}
