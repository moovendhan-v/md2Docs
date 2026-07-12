import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  FileText, Download, FileType2, Paintbrush, ArrowRight, Github, ExternalLink,
  Layers, Zap, Cpu, Sparkles, Terminal, Code2, ShieldAlert
} from "lucide-react";
import { Button } from "./ui/button";

export default function LandingPage({ onLaunchEditor }) {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState("web");

  // Three.js 3D Background effect
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create a group to hold the entire document assembly
    const documentGroup = new THREE.Group();
    documentGroup.rotation.y = -0.3; // Default angle to show 3D depth
    documentGroup.rotation.x = 0.2;

    // 1. The document base sheet (semi-transparent glassmorphic plate)
    const sheetGeom = new THREE.PlaneGeometry(8, 11);
    const sheetMat = new THREE.MeshBasicMaterial({
      color: 0x0a0f1d, // Deep dark slate background
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const sheet = new THREE.Mesh(sheetGeom, sheetMat);
    documentGroup.add(sheet);

    // 2. The document border outline (neon teal/blue)
    const outlineGeom = new THREE.EdgesGeometry(sheetGeom);
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9, // Tailwind sky-500
    });
    const outline = new THREE.LineSegments(outlineGeom, outlineMat);
    documentGroup.add(outline);

    // 3. Add horizontal "text line" strips onto the sheet (offset slightly forward to prevent z-fighting)
    // Title Line at top (Thick Teal strip)
    const titleGeom = new THREE.PlaneGeometry(5, 0.4);
    const titleMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.95 });
    const titleMesh = new THREE.Mesh(titleGeom, titleMat);
    titleMesh.position.set(-0.8, 4.0, 0.02);
    documentGroup.add(titleMesh);

    // Horizontal text lines configuration
    const lineParams = [
      { y: 3.0, w: 6.0, x: 0 },
      { y: 2.4, w: 5.5, x: -0.25 },
      { y: 1.8, w: 4.2, x: -0.9 },
      // Section Heading (Teal strip)
      { y: 0.6, w: 3.0, x: -1.5, color: 0x14b8a6, h: 0.3 },
      // Body lines
      { y: -0.1, w: 6.0, x: 0 },
      { y: -0.7, w: 5.8, x: -0.1 },
      { y: -1.3, w: 6.0, x: 0 },
      { y: -1.9, w: 3.5, x: -1.25 },
      // Section Heading 2
      { y: -2.9, w: 3.2, x: -1.4, color: 0x14b8a6, h: 0.3 },
      // List items (offset with bullets)
      { y: -3.6, w: 4.5, x: -0.5, list: true },
      { y: -4.2, w: 4.8, x: -0.35, list: true },
      { y: -4.8, w: 4.2, x: -0.65, list: true },
    ];

    const meshArray = [];
    lineParams.forEach((p, idx) => {
      const geom = new THREE.PlaneGeometry(p.w, p.h || 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: p.color || 0x0ea5e9,
        transparent: true,
        opacity: 0.65
      });
      const lineMesh = new THREE.Mesh(geom, mat);
      lineMesh.position.set(p.x + (p.list ? 0.35 : 0), p.y, 0.02);
      documentGroup.add(lineMesh);
      meshArray.push(lineMesh);

      if (p.list) {
        const bulletGeom = new THREE.BoxGeometry(0.12, 0.12, 0.02);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
        const bulletMesh = new THREE.Mesh(bulletGeom, bulletMat);
        bulletMesh.position.set(p.x - p.w / 2 + 0.1, p.y, 0.02);
        documentGroup.add(bulletMesh);
      }
    });

    scene.add(documentGroup);

    // Add subtle ambient particles orbiting the document
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 35;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Track mouse movement to rotate object
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (event.clientX - windowHalfX) / 150;
      mouseY = (event.clientY - windowHalfY) / 150;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth lag rotation (damping)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      documentGroup.rotation.y = -0.3 + targetX * 0.4;
      documentGroup.rotation.x = 0.2 + targetY * 0.4;

      // Float effect: slow up/down wave
      const time = Date.now() * 0.001;
      documentGroup.position.y = Math.sin(time * 0.8) * 0.3;

      // Pulse code/text line opacity slightly to make it feel alive
      meshArray.forEach((mesh, idx) => {
        mesh.material.opacity = 0.5 + Math.sin(time * 2 + idx) * 0.15;
      });

      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      sheetGeom.dispose();
      sheetMat.dispose();
      outlineGeom.dispose();
      outlineMat.dispose();
      titleGeom.dispose();
      titleMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  const [previewStyle, setPreviewStyle] = useState("boardroom");

  const PREVIEW_STYLES = {
    boardroom: {
      name: "Boardroom Style",
      desc: "Formal sans-serif with sky blue accents, ideal for professional business reports.",
      font: "font-sans",
      titleAlign: "text-left",
      headerRule: true,
      ruleColor: "bg-sky-500",
      headingColor: "text-sky-500 font-bold",
      textColor: "text-slate-300",
      badgeColor: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      bgColor: "bg-slate-900/60"
    },
    academic: {
      name: "Academic Style",
      desc: "Elegant serif with centered title headings, perfect for research papers and essays.",
      font: "font-serif",
      titleAlign: "text-center",
      headerRule: false,
      ruleColor: "bg-transparent",
      headingColor: "text-white font-serif italic",
      textColor: "text-slate-300",
      badgeColor: "bg-white/10 text-slate-200 border border-white/20",
      bgColor: "bg-[#111625]"
    },
    technical: {
      name: "Technical Blueprint",
      desc: "Monospace font layout with a clean green border, designed for developers and APIs.",
      font: "font-mono",
      titleAlign: "text-left",
      headerRule: true,
      ruleColor: "bg-teal-500",
      headingColor: "text-teal-400 font-mono",
      textColor: "text-slate-400",
      badgeColor: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
      bgColor: "bg-[#080d16]"
    },
    warmSunset: {
      name: "Warm Sunset",
      desc: "Friendly sans-serif layout with warm orange accents, excellent for casual articles.",
      font: "font-sans",
      titleAlign: "text-left",
      headerRule: true,
      ruleColor: "bg-amber-500",
      headingColor: "text-amber-400 font-semibold",
      textColor: "text-slate-300",
      badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      bgColor: "bg-[#1b1510]"
    }
  };

  const currentPreview = PREVIEW_STYLES[previewStyle];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* ── 3D Canvas Background ── */}
      <div 
        ref={containerRef} 
        className="absolute top-0 right-0 w-full md:w-1/2 h-[600px] md:h-screen pointer-events-none z-0 opacity-80"
        style={{ maskImage: "radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)", WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)" }}
      />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[150px] pointer-events-none z-0" />

      {/* ── Header / Navbar ── */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sky-500 text-slate-950 shadow-md">
            <FileText className="h-5 w-5 font-bold" />
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            MD → Docs
          </span>
          <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            v0.1.0
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
          <a href="#extension" className="hover:text-white transition-colors">VS Code Extension</a>
          <a href="https://github.com/moovendhan-v" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white text-sm"
            onClick={onLaunchEditor}
          >
            Launch Editor
          </Button>
          <Button 
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/20 text-sm"
            onClick={onLaunchEditor}
          >
            Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 flex flex-col items-start text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/30 text-sky-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing VS Code Extension Support</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-6">
            Transform Markdown into <br />
            <span className="bg-gradient-to-r from-sky-400 via-sky-200 to-teal-400 bg-clip-text text-transparent">
              Stunning Documents
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mb-8">
            Create beautifully stylized Word (.docx) and PDF files natively from your markdown. Fully offline compatible. Use it in the web editor or directly inside VS Code.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <Button 
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-6 text-base shadow-xl shadow-sky-500/20"
              onClick={onLaunchEditor}
            >
              Start Writing Online
            </Button>
            <a href="#extension" className="flex items-center justify-center">
              <Button 
                variant="outline" 
                className="border-slate-800 bg-slate-950 hover:bg-slate-900 text-white px-8 py-6 text-base"
              >
                <Terminal className="mr-2 h-4 w-4 text-sky-400" /> Install VS Code Extension
              </Button>
            </a>
          </div>

          {/* Quick stats / features badges */}
          <div className="flex flex-wrap gap-6 mt-12 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> 100% Client-Side</span>
            <span className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-sky-500" /> 5+ Curated Styles</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4 text-teal-500" /> Real .docx Generation</span>
          </div>

        </div>
      </section>

      {/* ── Feature Cards Grid ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Engineered for Perfect Output
          </h2>
          <p className="text-slate-400 text-base">
            No more converting Markdown to raw HTML and printing messy pages. MD → Docs generates structured documents with real bookmarked headers, custom page margins, and auto-fitting code blocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group relative rounded-xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/30">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Native Word Export</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generates native Microsoft Word files (`.docx`) complete with document outline bookmarks and live internal links, not just a repackaged webpage.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:bg-slate-900/30">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
              <Paintbrush className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Curated Typography Systems</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Includes pre-configured styling setups (Academic, Boardroom, Technical, Warm Sunset) so your documents look highly professional immediately.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/30">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
              <FileType2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Perfect PDF Layouts</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Provides dedicated print margins, forced page breaks, and scale controls to generate exact A4/Letter size PDF outputs cleanly.
            </p>
          </div>
        </div>
      </section>

      {/* ── Interactive Document Style Toggler ── */}
      <section id="templates" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-teal-500/10 text-teal-400 text-xs font-bold mb-4 uppercase tracking-wider">
              <Paintbrush className="h-3.5 w-3.5" /> Curated Templates
            </div>
            <h2 className="text-3xl font-extrabold mb-6">
              Switch designs <br />
              with a single click.
            </h2>
            <p className="text-slate-400 text-base mb-8 leading-relaxed">
              MD → Docs completely reformats your page outline, font sizing, headings, blockquotes, and lists in real-time. Pick the style that matches your audience.
            </p>

            {/* Template Option List */}
            <div className="space-y-3">
              {Object.entries(PREVIEW_STYLES).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setPreviewStyle(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    previewStyle === key
                      ? "border-sky-500 bg-sky-950/20 text-white shadow-md shadow-sky-500/5"
                      : "border-slate-900 bg-slate-950/20 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">{item.name}</span>
                    {previewStyle === key && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Document Page Container */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[460px] rounded-2xl border border-slate-900 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-sm relative">
              
              {/* Paper element */}
              <div className={`w-full transition-all duration-500 rounded-xl p-8 shadow-inner ${currentPreview.bgColor} ${currentPreview.font}`}>
                
                {/* Title */}
                <h3 className={`text-xl font-extrabold text-white mb-2 ${currentPreview.titleAlign}`}>
                  Project Specification
                </h3>
                
                {/* Rule */}
                {currentPreview.headerRule && (
                  <div className={`h-[2px] w-full mb-6 ${currentPreview.ruleColor}`} />
                )}
                {!currentPreview.headerRule && <div className="h-4" />}

                {/* Subtitle / Author details */}
                <div className={`flex flex-wrap gap-2 mb-6 ${currentPreview.titleAlign === "text-center" ? "justify-center" : "justify-start"}`}>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${currentPreview.badgeColor}`}>
                    Author: Moovendhan
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${currentPreview.badgeColor}`}>
                    Date: July 2026
                  </span>
                </div>

                {/* Heading 1 */}
                <h4 className={`text-sm tracking-wide uppercase mb-3 ${currentPreview.headingColor}`}>
                  1. Executive Summary
                </h4>
                
                {/* Body paragraph text */}
                <p className={`text-xs leading-relaxed mb-6 ${currentPreview.textColor}`}>
                  This document specifies the structural blueprints and design templates compiled to convert raw Markdown nodes into native Word and PDF files cleanly.
                </p>

                {/* Heading 2 */}
                <h4 className={`text-sm tracking-wide uppercase mb-3 ${currentPreview.headingColor}`}>
                  2. Key Deliverables
                </h4>

                {/* List items */}
                <div className={`space-y-2.5 text-xs ${currentPreview.textColor}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>100% client-side conversion logic</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">•</span>
                    <span>Synchronized offline VS Code extension VSIX</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── VS Code Extension Feature Section ── */}
      <section id="extension" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-sky-500/10 text-sky-400 text-xs font-bold mb-4 uppercase tracking-wider">
              <Code2 className="h-3.5 w-3.5" /> VS Code Extension
            </div>
            <h2 className="text-3xl font-extrabold mb-6">
              Write locally. <br />
              Export with one click.
            </h2>
            <p className="text-slate-400 text-base mb-6 leading-relaxed">
              Get the entire document design engine directly inside VS Code. The extension adds toolbar actions to your Markdown files so you can preview, export to Word, or print to PDF offline without leaving your editor.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <p className="text-slate-300 text-sm">Side-by-side Live Preview Panel</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <p className="text-slate-300 text-sm">Right-click explorer context menu support</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <p className="text-slate-300 text-sm">Shares the exact same rendering logic</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                className="border-slate-800 bg-slate-950 hover:bg-slate-900 text-white font-medium"
                onClick={() => {
                  vscodeInstallInstruction();
                }}
              >
                Installation Guide
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Visual CLI/Command Mockup */}
            <div className="w-full rounded-xl border border-slate-900 bg-slate-950/60 shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-1.5 border-b border-slate-900 bg-slate-950 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/30" />
                <span className="text-[11px] text-slate-500 font-mono ml-4">Terminal — Install offline package</span>
              </div>
              <div className="p-6 font-mono text-xs text-slate-400 text-left space-y-3">
                <p className="text-slate-500"># Install the custom compiled extension package directly</p>
                <div className="flex gap-2">
                  <span className="text-sky-400">$</span>
                  <span className="text-slate-200">code --install-extension ./vscode-extension/md-to-docs-0.1.0.vsix</span>
                </div>
                <p className="text-emerald-500 mt-2">✓ Extension 'md-to-docs' was successfully installed.</p>
                <p className="text-slate-500 mt-4"># Features are active instantly on any .md file</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20 text-sky-400">
              <FileText className="h-3 w-3" />
            </div>
            <span className="font-semibold text-slate-400">MD → Docs</span>
          </div>

          <div>
            <p>© {new Date().getFullYear()} md2docs.cybertechmind.com. Generated with 🖤 for engineers.</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/moovendhan-v" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 flex items-center gap-1 transition-colors">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function vscodeInstallInstruction() {
  alert(
    "To install this local extension:\n\n" +
    "1. Open VS Code.\n" +
    "2. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P).\n" +
    "3. Run: 'Extensions: Install from VSIX...'\n" +
    "4. Choose: 'vscode-extension/md-to-docs-0.1.0.vsix' from this project directory."
  );
}
