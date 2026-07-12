import React, { useState, useRef, useEffect } from "react";
import dashboardImg from "@/assets/dashboard.png";

export default function InteractiveReveal() {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Default coordinate when not hovering (centered)
  useEffect(() => {
    if (containerRef.current && !isHovering) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [isHovering]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const circleRadius = isHovering ? 130 : 80;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full aspect-[16/10] max-w-[550px] rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden cursor-crosshair group select-none"
    >
      {/* ── Background Layer: The Skeleton Blueprint ── */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between bg-slate-950">
        
        {/* Mock Editor Skeleton */}
        <div className="flex gap-4 h-full w-full">
          {/* Left panel: code lines */}
          <div className="w-1/2 border-r border-slate-900/60 pr-4 flex flex-col gap-3">
            <div className="h-4 w-1/3 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-slate-900 rounded" />
            <div className="h-3 w-5/6 bg-slate-900 rounded" />
            <div className="h-3 w-2/3 bg-slate-900 rounded" />
            <div className="h-3 w-4/5 bg-slate-900 rounded" />
            <div className="h-4 w-1/2 bg-slate-800 rounded mt-4" />
            <div className="h-3 w-3/4 bg-slate-900 rounded" />
            <div className="h-3 w-2/3 bg-slate-900 rounded" />
          </div>

          {/* Right panel: preview page skeleton */}
          <div className="w-1/2 pl-4 flex flex-col items-center justify-center">
            <div className="w-full aspect-[1/1.4] max-w-[140px] bg-slate-900/50 border border-slate-900 rounded p-3 flex flex-col gap-2">
              <div className="h-2 w-3/4 bg-slate-800 rounded self-center" />
              <div className="h-1 w-full bg-slate-900 rounded mt-2" />
              <div className="h-1 w-5/6 bg-slate-900 rounded" />
              <div className="h-1 w-2/3 bg-slate-900 rounded" />
              <div className="h-2 w-1/2 bg-teal-950/40 rounded mt-2" />
              <div className="h-1 w-5/6 bg-slate-900 rounded" />
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
          <div className="h-3 w-24 bg-slate-900 rounded" />
          <div className="h-3 w-16 bg-slate-800 rounded" />
        </div>
      </div>

      {/* ── Foreground Reveal Layer (Dynamic Mask Clip-path) ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          clipPath: `circle(${circleRadius}px at ${mousePos.x}px ${mousePos.y}px)`,
          WebkitClipPath: `circle(${circleRadius}px at ${mousePos.x}px ${mousePos.y}px)`,
        }}
      >
        <img
          src={dashboardImg}
          alt="Dashboard Workspace View"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>

      {/* ── Floating Lens Cursor Ring ── */}
      <div
        className="absolute border-2 border-sky-400 rounded-full pointer-events-none transition-all duration-300 ease-out flex items-center justify-center"
        style={{
          width: `${circleRadius * 2}px`,
          height: `${circleRadius * 2}px`,
          left: `${mousePos.x - circleRadius}px`,
          top: `${mousePos.y - circleRadius}px`,
          boxShadow: isHovering 
            ? "0 0 25px rgba(14, 165, 233, 0.4), inset 0 0 15px rgba(14, 165, 233, 0.2)"
            : "0 0 15px rgba(14, 165, 233, 0.2)",
        }}
      >
        {/* Tiny crosshair center point */}
        <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
      </div>

      {/* Floating Instruction Overlay */}
      {!isHovering && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none">
          <span className="text-[11px] bg-slate-900/90 text-slate-400 border border-slate-800 px-3 py-1.5 rounded-full font-medium tracking-wide uppercase shadow-lg select-none">
            🔍 Hover to Reveal Live Dashboard
          </span>
        </div>
      )}
    </div>
  );
}
