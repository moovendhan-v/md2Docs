import React from "react";
import dashboardImg from "@/assets/dashboard.png";

export default function InteractiveReveal({ onLaunchEditor }) {
  return (
    <div
      onClick={onLaunchEditor}
      className="relative w-full aspect-[16/10] max-w-[550px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-[1.03] hover:border-sky-500/50 group select-none"
    >
      <img
        src={dashboardImg}
        alt="Dashboard Workspace View"
        className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
    </div>
  );
}