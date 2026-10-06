import React, { useEffect, useRef } from 'react';
import {
  Banknote,
  Coins,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Landmark,
  ReceiptText,
  BadgeDollarSign,
  CircleDollarSign,
} from 'lucide-react';

interface ParticleDef {
  id: string;
  initX: number; // Percentage of screen width (0-100)
  initY: number; // Percentage of screen height (0-100)
  vx: number;    // Pixels per second horizontal velocity
  vy: number;    // Pixels per second vertical velocity
  vRot: number;  // Degrees per second rotation speed
  initRot: number;
  render: () => React.ReactNode;
}

const PARTICLES: ParticleDef[] = [
  // 1. Bangladeshi Taka (৳) Token - Moving Up-Right
  {
    id: 'taka-1',
    initX: 12,
    initY: 20,
    vx: 18,
    vy: -28,
    vRot: 5,
    initRot: -8,
    render: () => (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-500/30 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold font-mono text-base sm:text-xl backdrop-blur-[2px]">
        ৳
      </div>
    ),
  },
  // 2. Banknote - Moving Up-Left
  {
    id: 'banknote-1',
    initX: 84,
    initY: 15,
    vx: -22,
    vy: -24,
    vRot: -6,
    initRot: 12,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-500/30 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 backdrop-blur-[2px]">
        <Banknote className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 3. Gold Coins - Moving Down-Right
  {
    id: 'coins-1',
    initX: 8,
    initY: 48,
    vx: 24,
    vy: 18,
    vRot: 6,
    initRot: -5,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/30 shadow-sm flex items-center justify-center text-amber-500 dark:text-amber-400 backdrop-blur-[2px]">
        <Coins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 4. Wallet - Moving Up-Left
  {
    id: 'wallet-1',
    initX: 90,
    initY: 42,
    vx: -18,
    vy: -26,
    vRot: 7,
    initRot: 10,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-accent/35 shadow-sm flex items-center justify-center text-accent backdrop-blur-[2px]">
        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 5. Credit Card - Moving Down-Left
  {
    id: 'card-1',
    initX: 78,
    initY: 78,
    vx: -20,
    vy: 22,
    vRot: -5,
    initRot: -12,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-sky-500/30 shadow-sm flex items-center justify-center text-sky-600 dark:text-sky-400 backdrop-blur-[2px]">
        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 6. Piggy Bank (Savings) - Moving Upward-Drift
  {
    id: 'piggy-1',
    initX: 25,
    initY: 75,
    vx: 12,
    vy: -32,
    vRot: 4,
    initRot: 6,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-rose-500/30 shadow-sm flex items-center justify-center text-rose-500 dark:text-rose-400 backdrop-blur-[2px]">
        <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 7. Trending Up / Growth - Moving Up-Right
  {
    id: 'trending-1',
    initX: 86,
    initY: 62,
    vx: 20,
    vy: -22,
    vRot: -6,
    initRot: 8,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-teal-500/30 shadow-sm flex items-center justify-center text-teal-600 dark:text-teal-400 backdrop-blur-[2px]">
        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 8. Dollar ($) Token - Moving Down-Right
  {
    id: 'dollar-1',
    initX: 18,
    initY: 88,
    vx: 22,
    vy: 20,
    vRot: 5,
    initRot: -6,
    render: () => (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-sky-500/30 shadow-sm flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold font-mono text-sm sm:text-lg backdrop-blur-[2px]">
        $
      </div>
    ),
  },
  // 9. Landmark / Bank - Moving Up-Left
  {
    id: 'landmark-1',
    initX: 68,
    initY: 10,
    vx: -16,
    vy: -26,
    vRot: 4,
    initRot: 5,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-indigo-500/30 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 backdrop-blur-[2px]">
        <Landmark className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 10. Euro (€) Token - Moving Gently Downward
  {
    id: 'euro-1',
    initX: 32,
    initY: 35,
    vx: -10,
    vy: 24,
    vRot: -5,
    initRot: 8,
    render: () => (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-violet-500/30 shadow-sm flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold font-mono text-sm sm:text-lg backdrop-blur-[2px]">
        €
      </div>
    ),
  },
  // 11. Receipt / Statement - Moving Up-Right
  {
    id: 'receipt-1',
    initX: 72,
    initY: 48,
    vx: 18,
    vy: -24,
    vRot: 6,
    initRot: -10,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/30 shadow-sm flex items-center justify-center text-amber-600 dark:text-amber-400 backdrop-blur-[2px]">
        <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 12. Security Badge Dollar - Moving Down-Left
  {
    id: 'badge-1',
    initX: 62,
    initY: 86,
    vx: -20,
    vy: 18,
    vRot: -4,
    initRot: 4,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-sky-500/30 shadow-sm flex items-center justify-center text-sky-600 dark:text-sky-400 backdrop-blur-[2px]">
        <BadgeDollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 13. Second Taka (৳) Token - Moving Gentle Upward
  {
    id: 'taka-2',
    initX: 52,
    initY: 90,
    vx: 8,
    vy: -30,
    vRot: 6,
    initRot: 5,
    render: () => (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-500/30 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm sm:text-lg backdrop-blur-[2px]">
        ৳
      </div>
    ),
  },
  // 14. Second Banknote - Moving Down-Right
  {
    id: 'banknote-2',
    initX: 14,
    initY: 65,
    vx: 20,
    vy: 20,
    vRot: -6,
    initRot: -8,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-500/30 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 backdrop-blur-[2px]">
        <Banknote className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
  // 15. British Pound (£) Token - Moving Up-Left
  {
    id: 'pound-1',
    initX: 42,
    initY: 8,
    vx: -14,
    vy: -22,
    vRot: 5,
    initRot: 4,
    render: () => (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-sky-500/30 shadow-sm flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold font-mono text-sm sm:text-lg backdrop-blur-[2px]">
        £
      </div>
    ),
  },
  // 16. Circle Dollar Coin - Moving Down-Left
  {
    id: 'circle-dollar-1',
    initX: 82,
    initY: 30,
    vx: -18,
    vy: 24,
    vRot: 7,
    initRot: -6,
    render: () => (
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/30 shadow-sm flex items-center justify-center text-amber-500 dark:text-amber-400 backdrop-blur-[2px]">
        <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.6]" />
      </div>
    ),
  },
];

export const AuthAnimatedBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Track particle state
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = 80; // Off-screen threshold for seamless wrapping

    const state = PARTICLES.map((p) => ({
      x: (p.initX / 100) * width,
      y: (p.initY / 100) * height,
      vx: p.vx,
      vy: p.vy,
      rot: p.initRot,
      vRot: p.vRot,
    }));

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap delta to avoid jumps on tab switch
      lastTime = now;

      const currentW = window.innerWidth;
      const currentH = window.innerHeight;

      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        const el = elementsRef.current[i];
        if (!el) continue;

        // Constant speed movement
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vRot * dt;

        // Seamless wrapping outside viewport boundaries
        if (s.vx > 0 && s.x > currentW + margin) {
          s.x = -margin;
        } else if (s.vx < 0 && s.x < -margin) {
          s.x = currentW + margin;
        }

        if (s.vy > 0 && s.y > currentH + margin) {
          s.y = -margin;
        } else if (s.vy < 0 && s.y < -margin) {
          s.y = currentH + margin;
        }

        // Hardware-accelerated GPU transformation
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {PARTICLES.map((particle, idx) => (
        <div
          key={particle.id}
          ref={(el) => { elementsRef.current[idx] = el; }}
          className="absolute top-0 left-0 will-change-transform opacity-40 dark:opacity-35"
          style={{
            transform: `translate3d(${particle.initX}vw, ${particle.initY}vh, 0) rotate(${particle.initRot}deg)`,
          }}
        >
          {particle.render()}
        </div>
      ))}
    </div>
  );
};
