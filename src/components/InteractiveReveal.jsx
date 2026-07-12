import React, { useState, useRef, useEffect } from "react";
import dashboardImg from "@/assets/dashboard.png";
import { ArrowRight, X, Sparkles, LayoutGrid, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";

export default function InteractiveReveal({ onLaunchEditor }) {
  // ── Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Base Card State ──
  const cardRef = useRef(null);
  const [cardMouse, setCardMouse] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  // ── Modal Spotlight State ──
  const modalRef = useRef(null);
  const [modalMouse, setModalMouse] = useState({ x: 0, y: 0 });
  const [isHoveringModal, setIsHoveringModal] = useState(false);

  // Handle mouse move on the base card
  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCardMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Center the base card spotlight when not hovering
  useEffect(() => {
    if (cardRef.current && !isHoveringCard) {
      const rect = cardRef.current.getBoundingClientRect();
      setCardMouse({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [isHoveringCard]);

  // Handle mouse move on the modal card
  const handleModalMouseMove = (e) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    setModalMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Center the modal spotlight when it opens or mouse leaves
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setModalMouse({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [isModalOpen, isHoveringModal]);

  const cardRadius = isHoveringCard ? 130 : 80;
  const modalRadius = isHoveringModal ? 220 : 130;

  return (
    <>
      {/* ── Custom Keyframe Animations ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes customScaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-custom-fade {
          animation: customFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-custom-scale {
          animation: customScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />

      {/* ── Base Card (Trigger) ── */}
      <div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseEnter={() => setIsHoveringCard(true)}
        onMouseLeave={() => setIsHoveringCard(false)}
        onClick={() => setIsModalOpen(true)}
        className="relative w-full aspect-[16/10] max-w-[550px] rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-[1.03] hover:border-sky-500/50 group select-none"
      >
        {/* Background Layer: The Skeleton Blueprint */}
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

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
            <div className="h-3 w-24 bg-slate-900 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
        </div>

        {/* Foreground Reveal Layer (Spotlight Mask on Hover) */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
          style={{
            maskImage: `radial-gradient(circle ${cardRadius}px at ${cardMouse.x}px ${cardMouse.y}px, black 80%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(circle ${cardRadius}px at ${cardMouse.x}px ${cardMouse.y}px, black 80%, transparent 100%)`,
          }}
        >
          <img
            src={dashboardImg}
            alt="Dashboard Workspace View"
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </div>

        {/* Spotlight Ring */}
        <div
          className="absolute border border-sky-400/50 rounded-full pointer-events-none transition-all duration-300 ease-out flex items-center justify-center"
          style={{
            width: `${cardRadius * 2}px`,
            height: `${cardRadius * 2}px`,
            left: `${cardMouse.x - cardRadius}px`,
            top: `${cardMouse.y - cardRadius}px`,
            boxShadow: isHoveringCard 
              ? "0 0 25px rgba(14, 165, 233, 0.35), inset 0 0 15px rgba(14, 165, 233, 0.15)"
              : "0 0 15px rgba(14, 165, 233, 0.15)",
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        </div>

        {/* Floating Instruction overlay */}
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/5 transition-colors duration-300 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/95 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/50">
            <Maximize2 className="h-4 w-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Click to Expand Preview
            </span>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Focus Modal (Interactive Sandbox) ── */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-6 animate-custom-fade"
        >
          {/* Modal Content Wrapper (stops click propagation to close modal) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-[85vw] max-w-[1220px] flex flex-col items-center animate-custom-scale"
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between mb-4 z-[90]">
              <div className="flex items-center gap-2.5 text-sky-400 font-semibold text-sm">
                <LayoutGrid className="h-4 w-4" />
                <span className="text-slate-300">Live Dashboard Tour — Hover to inspect workspace</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    onLaunchEditor();
                  }}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 text-xs px-4 py-2"
                >
                  Open Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-white text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" /> Close Preview
                </Button>
              </div>
            </div>

            {/* Modal Interactive Card (Covers ~80% width, height adjusted to aspect ratio) */}
            <div
              ref={modalRef}
              onMouseMove={handleModalMouseMove}
              onMouseEnter={() => setIsHoveringModal(true)}
              onMouseLeave={() => setIsHoveringModal(false)}
              onClick={() => {
                setIsModalOpen(false);
                onLaunchEditor();
              }}
              className="relative w-full aspect-[16/10] rounded-2xl border border-sky-500/25 bg-slate-900/40 shadow-2xl overflow-hidden cursor-crosshair select-none z-[85] transition-all duration-300 hover:border-sky-500/40"
            >
              {/* Background Layer: Detailed Skeleton Grid */}
              <div className="absolute inset-0 p-12 flex flex-col justify-between bg-slate-950/90">
                <div className="flex gap-8 h-full w-full">
                  {/* Mock Editor */}
                  <div className="w-1/2 border-r border-slate-900/80 pr-8 flex flex-col gap-5">
                    <div className="h-6 w-1/4 bg-slate-900 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-900 rounded" />
                    <div className="h-4 w-5/6 bg-slate-900 rounded" />
                    <div className="h-4 w-2/3 bg-slate-900 rounded" />
                    <div className="h-4 w-4/5 bg-slate-900 rounded" />
                    <div className="h-6 w-1/3 bg-slate-900 rounded mt-6" />
                    <div className="h-4 w-3/4 bg-slate-900 rounded" />
                  </div>
                  {/* Mock Preview Page */}
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

              {/* Foreground Reveal Layer (Spotlight Masked Image) */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
                style={{
                  maskImage: `radial-gradient(circle ${modalRadius}px at ${modalMouse.x}px ${modalMouse.y}px, black 85%, transparent 100%)`,
                  WebkitMaskImage: `radial-gradient(circle ${modalRadius}px at ${modalMouse.x}px ${modalMouse.y}px, black 85%, transparent 100%)`,
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
                  width: `${modalRadius * 2}px`,
                  height: `${modalRadius * 2}px`,
                  left: `${modalMouse.x - modalRadius}px`,
                  top: `${modalMouse.y - modalRadius}px`,
                  boxShadow: "0 0 50px rgba(14, 165, 233, 0.45), inset 0 0 25px rgba(14, 165, 233, 0.2)",
                }}
              >
                <div className="h-2 w-2 rounded-full bg-sky-400 shadow-md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
