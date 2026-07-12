import React, { useState, useRef, useEffect } from "react";
import dashboardImg from "@/assets/dashboard.png";
import { ArrowRight, X, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "./ui/button";

export default function InteractiveReveal({ onLaunchEditor }) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Sync mouse position relative to container
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Center the lens initially
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [isHovering]);

  const circleRadius = isHovering ? 220 : 120;

  return (
    <>
      {/* ── Base Card (Trigger) ── */}
      <div
        onClick={onLaunchEditor}
        onMouseEnter={() => setIsHovering(true)}
        className="relative w-full aspect-[16/10] max-w-[550px] rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:border-sky-500/50 group select-none"
      >
        {/* Mock Editor Skeleton */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between bg-slate-950">
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
            </div>

            {/* Right panel: preview page skeleton */}
            <div className="w-1/2 pl-4 flex flex-col items-center justify-center">
              <div className="w-full aspect-[1/1.4] max-w-[140px] bg-slate-900/50 border border-slate-900 rounded p-3 flex flex-col gap-2">
                <div className="h-2 w-3/4 bg-slate-800 rounded self-center" />
                <div className="h-1 w-full bg-slate-900 rounded mt-2" />
                <div className="h-1 w-5/6 bg-slate-900 rounded" />
                <div className="h-2 w-1/2 bg-teal-950/40 rounded mt-2" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
            <div className="h-3 w-24 bg-slate-900 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
        </div>

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-sky-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Hover to Explore Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Focus Modal Overlay ── */}
      {isHovering && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-6 animate-fadeIn"
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Top Bar inside Modal */}
          <div className="w-[85vw] max-w-[1200px] flex items-center justify-between mb-4 z-[90]">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <LayoutGrid className="h-4 w-4" />
              <span>Interactive Workspace Tour — Move mouse to reveal</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={onLaunchEditor}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 text-xs px-4 py-2"
              >
                Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsHovering(false)}
                className="border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-white text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" /> Close Preview
              </Button>
            </div>
          </div>

          {/* Modal Focus Area (Covers ~80% of the screen) */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onClick={onLaunchEditor}
            className="relative w-[85vw] max-w-[1200px] aspect-[16/10] rounded-2xl border border-sky-500/30 bg-slate-900/50 shadow-2xl overflow-hidden cursor-crosshair select-none z-[85]"
          >
            {/* Background Layer: Skeleton Blueprint (Modal scaled version) */}
            <div className="absolute inset-0 p-12 flex flex-col justify-between bg-slate-950/90">
              <div className="flex gap-8 h-full w-full">
                <div className="w-1/2 border-r border-slate-900/80 pr-8 flex flex-col gap-5">
                  <div className="h-6 w-1/4 bg-slate-900 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-900 rounded" />
                  <div className="h-4 w-5/6 bg-slate-900 rounded" />
                  <div className="h-4 w-2/3 bg-slate-900 rounded" />
                  <div className="h-4 w-4/5 bg-slate-900 rounded" />
                  <div className="h-6 w-1/3 bg-slate-900 rounded mt-6" />
                  <div className="h-4 w-3/4 bg-slate-900 rounded" />
                </div>
                <div className="w-1/2 pl-8 flex flex-col items-center justify-center">
                  <div className="w-full aspect-[1/1.4] max-w-[200px] bg-slate-900/40 border border-slate-900 rounded-lg p-5 flex flex-col gap-3">
                    <div className="h-3 w-3/4 bg-slate-800 rounded self-center" />
                    <div className="h-2 w-full bg-slate-900 rounded mt-4" />
                    <div className="h-2 w-5/6 bg-slate-900 rounded" />
                    <div className="h-3 w-1/2 bg-teal-950/40 rounded mt-4" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-900/80 pt-6 mt-4">
                <div className="h-4 w-32 bg-slate-900 rounded" />
                <div className="h-4 w-24 bg-slate-900 rounded" />
              </div>
            </div>

            {/* Foreground Reveal Layer (Soft Radial Mask) */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
              style={{
                maskImage: `radial-gradient(circle ${circleRadius}px at ${mousePos.x}px ${mousePos.y}px, black 85%, transparent 100%)`,
                WebkitMaskImage: `radial-gradient(circle ${circleRadius}px at ${mousePos.x}px ${mousePos.y}px, black 85%, transparent 100%)`,
              }}
            >
              <img
                src={dashboardImg}
                alt="Dashboard Workspace View"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>

            {/* Floating Lens Ring */}
            <div
              className="absolute border border-sky-400/60 rounded-full pointer-events-none transition-all duration-200 ease-out flex items-center justify-center"
              style={{
                width: `${circleRadius * 2}px`,
                height: `${circleRadius * 2}px`,
                left: `${mousePos.x - circleRadius}px`,
                top: `${mousePos.y - circleRadius}px`,
                boxShadow: "0 0 45px rgba(14, 165, 233, 0.4), inset 0 0 25px rgba(14, 165, 233, 0.15)",
              }}
            >
              <div className="h-2 w-2 rounded-full bg-sky-400 shadow-md" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
