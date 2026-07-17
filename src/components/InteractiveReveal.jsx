import React from "react";
import dashboardImg from "@/assets/dashboard.png";

export default function InteractiveReveal({ onLaunchEditor }) {
  return (
    <div
      onClick={onLaunchEditor}
      className="relative w-full aspect-[16/10] max-w-[550px] flex items-center justify-center cursor-pointer select-none group py-8"
    >
      {/* Card 1 (Bottom / Left Fan) */}
      <div className="absolute w-[88%] aspect-[16/10] rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] translate-y-4 -translate-x-8 rotate-[-6deg] opacity-40 scale-95 group-hover:translate-y-10 group-hover:-translate-x-20 group-hover:rotate-[-12deg] group-hover:opacity-50">
        <img
          src={dashboardImg}
          alt="Dashboard Preview Layer 3"
          className="w-full h-full object-cover select-none pointer-events-none opacity-50 blur-[0.5px]"
        />
      </div>

      {/* Card 2 (Middle / Right Fan) */}
      <div className="absolute w-[88%] aspect-[16/10] rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] -translate-y-3 translate-x-8 rotate-[4deg] opacity-60 scale-[0.98] group-hover:-translate-y-8 group-hover:translate-x-20 group-hover:rotate-[10deg] group-hover:opacity-75">
        <img
          src={dashboardImg}
          alt="Dashboard Preview Layer 2"
          className="w-full h-full object-cover select-none pointer-events-none opacity-70 blur-[0.3px]"
        />
      </div>

      {/* Card 3 (Top / Main Focus) */}
      <div className="absolute w-[88%] aspect-[16/10] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] z-10 group-hover:scale-[1.03] group-hover:border-sky-500/50 group-hover:shadow-sky-500/10">
        <img
          src={dashboardImg}
          alt="Dashboard Preview Main"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    </div>
  );
}