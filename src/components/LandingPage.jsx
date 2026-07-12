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
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create a beautiful morphing grid sphere / document geometry
    const geometry = new THREE.IcosahedronGeometry(7, 2);
    // Wireframe material with neon teal glow
    const material = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9, // Tailwind sky-500
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add a secondary inner glowing core
    const coreGeom = new THREE.IcosahedronGeometry(3, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6, // Tailwind teal-500
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(coreMesh);

    // Add subtle ambient particles
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
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
      mouseX = (event.clientX - windowHalfX) / 100;
      mouseY = (event.clientY - windowHalfY) / 100;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth lag rotation (damping)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mesh.rotation.y += 0.003;
      mesh.rotation.x += 0.002;
      mesh.rotation.y += targetX * 0.05;
      mesh.rotation.x += targetY * 0.05;

      coreMesh.rotation.y -= 0.005;
      coreMesh.rotation.x -= 0.003;

      // Make it pulse slightly
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time) * 0.05;
      mesh.scale.set(scale, scale, scale);

      particles.rotation.y += 0.0005;

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
      geometry.dispose();
      material.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

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
          <a href="#extension" className="hover:text-white transition-colors">VS Code Extension</a>
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
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
