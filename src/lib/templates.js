/* Templates — each is a complete style sheet for the document. */
export const TEMPLATES = {
  boardroom: {
    name: "Boardroom",
    styles: {
      page: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, textColor: "#1f2937", lineHeight: 1.55 },
      title: { fontSize: 26, color: "#0f3460", align: "left", uppercase: false, rule: true, ruleColor: "#0f3460" },
      heading: { fontSize: 16, color: "#0f3460", uppercase: false },
      table: { headerBg: "#0f3460", headerColor: "#ffffff", borderColor: "#c7d2e0", striped: true, stripeColor: "#f1f5fb" },
      code: { bg: "#f3f4f6", color: "#111827" },
      blockquote: { borderColor: "#0f3460", italic: true, color: "#475569" },
      link: { color: "#1d4ed8" },
    },
  },
  editorial: {
    name: "Editorial",
    styles: {
      page: { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, textColor: "#292524", lineHeight: 1.7 },
      title: { fontSize: 32, color: "#292524", align: "center", uppercase: false, rule: false, ruleColor: "#292524" },
      heading: { fontSize: 18, color: "#7c2d12", uppercase: false },
      table: { headerBg: "#fff7ed", headerColor: "#7c2d12", borderColor: "#e7d8c9", striped: false, stripeColor: "#faf7f2" },
      code: { bg: "#f5f5f4", color: "#44403c" },
      blockquote: { borderColor: "#7c2d12", italic: true, color: "#57534e" },
      link: { color: "#9a3412" },
    },
  },
  technical: {
    name: "Technical",
    styles: {
      page: { fontFamily: "'Segoe UI', Verdana, sans-serif", fontSize: 10.5, textColor: "#18181b", lineHeight: 1.6 },
      title: { fontSize: 22, color: "#18181b", align: "left", uppercase: true, rule: true, ruleColor: "#18181b" },
      heading: { fontSize: 14, color: "#18181b", uppercase: true },
      table: { headerBg: "#18181b", headerColor: "#fafafa", borderColor: "#d4d4d8", striped: true, stripeColor: "#f4f4f5" },
      code: { bg: "#18181b", color: "#e4e4e7" },
      blockquote: { borderColor: "#a1a1aa", italic: false, color: "#52525b" },
      link: { color: "#0d9488" },
    },
  },
  modern: {
    name: "Modern Minimalist",
    styles: {
      page: { fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 11, textColor: "#0f172a", lineHeight: 1.6 },
      title: { fontSize: 28, color: "#0f172a", align: "left", uppercase: false, rule: true, ruleColor: "#e2e8f0" },
      heading: { fontSize: 16, color: "#475569", uppercase: false },
      table: { headerBg: "#f8fafc", headerColor: "#0f172a", borderColor: "#e2e8f0", striped: true, stripeColor: "#f1f5f9" },
      code: { bg: "#f8fafc", color: "#0f172a" },
      blockquote: { borderColor: "#cbd5e1", italic: true, color: "#64748b" },
      link: { color: "#0284c7" },
    },
  },
  corporate: {
    name: "Corporate Indigo",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#1e293b", lineHeight: 1.5 },
      title: { fontSize: 26, color: "#312e81", align: "left", uppercase: false, rule: true, ruleColor: "#312e81" },
      heading: { fontSize: 15, color: "#3730a3", uppercase: false },
      table: { headerBg: "#3730a3", headerColor: "#ffffff", borderColor: "#e2e8f0", striped: true, stripeColor: "#f5f3ff" },
      code: { bg: "#f1f5f9", color: "#1e1b4b" },
      blockquote: { borderColor: "#4f46e5", italic: false, color: "#475569" },
      link: { color: "#4f46e5" },
    },
  },
  forest: {
    name: "Forest Organic",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#2d3748", lineHeight: 1.65 },
      title: { fontSize: 28, color: "#064e3b", align: "center", uppercase: false, rule: true, ruleColor: "#a7f3d0" },
      heading: { fontSize: 16, color: "#065f46", uppercase: false },
      table: { headerBg: "#d1fae5", headerColor: "#064e3b", borderColor: "#a7f3d0", striped: true, stripeColor: "#f0fdf4" },
      code: { bg: "#f3f4f6", color: "#064e3b" },
      blockquote: { borderColor: "#059669", italic: true, color: "#4a5568" },
      link: { color: "#059669" },
    },
  },
  academic: {
    name: "Academic Thesis",
    styles: {
      page: { fontFamily: "'Times New Roman', Times, serif", fontSize: 12, textColor: "#000000", lineHeight: 2.0 },
      title: { fontSize: 24, color: "#000000", align: "center", uppercase: true, rule: false, ruleColor: "#000000" },
      heading: { fontSize: 14, color: "#000000", uppercase: false },
      table: { headerBg: "#ffffff", headerColor: "#000000", borderColor: "#000000", striped: false, stripeColor: "#ffffff" },
      code: { bg: "#f8f9fa", color: "#000000" },
      blockquote: { borderColor: "#000000", italic: true, color: "#000000" },
      link: { color: "#000000" },
    },
  },
  crimson: {
    name: "Warm Crimson",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#262626", lineHeight: 1.6 },
      title: { fontSize: 28, color: "#991b1b", align: "left", uppercase: false, rule: true, ruleColor: "#991b1b" },
      heading: { fontSize: 16, color: "#991b1b", uppercase: false },
      table: { headerBg: "#fff5f5", headerColor: "#991b1b", borderColor: "#fee2e2", striped: true, stripeColor: "#fff8f8" },
      code: { bg: "#f5f5f5", color: "#991b1b" },
      blockquote: { borderColor: "#991b1b", italic: true, color: "#737373" },
      link: { color: "#c2410c" },
    },
  },
  ocean: {
    name: "Ocean Breeze",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#334155", lineHeight: 1.55 },
      title: { fontSize: 26, color: "#0369a1", align: "left", uppercase: false, rule: true, ruleColor: "#bae6fd" },
      heading: { fontSize: 15, color: "#0284c7", uppercase: false },
      table: { headerBg: "#e0f2fe", headerColor: "#0369a1", borderColor: "#bae6fd", striped: true, stripeColor: "#f0f9ff" },
      code: { bg: "#f1f5f9", color: "#0369a1" },
      blockquote: { borderColor: "#38bdf8", italic: true, color: "#475569" },
      link: { color: "#0284c7" },
    },
  },
  luxury: {
    name: "Royal Gold",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 12, textColor: "#3c3014", lineHeight: 1.7 },
      title: { fontSize: 30, color: "#854d0e", align: "center", uppercase: true, rule: true, ruleColor: "#854d0e" },
      heading: { fontSize: 16, color: "#a16207", uppercase: false },
      table: { headerBg: "#fef08a", headerColor: "#854d0e", borderColor: "#fef08a", striped: false, stripeColor: "#fefcbf" },
      code: { bg: "#fefdf0", color: "#854d0e" },
      blockquote: { borderColor: "#854d0e", italic: true, color: "#713f12" },
      link: { color: "#a16207" },
    },
  },
  cyberpunk: {
    name: "Cyber Tech",
    styles: {
      page: { fontFamily: "monospace", fontSize: 10, textColor: "#e2e8f0", lineHeight: 1.5 },
      title: { fontSize: 24, color: "#db2777", align: "left", uppercase: true, rule: true, ruleColor: "#db2777" },
      heading: { fontSize: 14, color: "#7c3aed", uppercase: true },
      table: { headerBg: "#7c3aed", headerColor: "#ffffff", borderColor: "#4b5563", striped: true, stripeColor: "#1f1a3a" },
      code: { bg: "#0f172a", color: "#10b981" },
      blockquote: { borderColor: "#db2777", italic: false, color: "#94a3b8" },
      link: { color: "#db2777" },
    },
  },

  /* ---------------------------------------------------------------------
   * New additions below
   * ------------------------------------------------------------------- */

  noir: {
    name: "Noir",
    styles: {
      page: { fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, textColor: "#111111", lineHeight: 1.5 },
      title: { fontSize: 30, color: "#000000", align: "left", uppercase: true, rule: true, ruleColor: "#000000" },
      heading: { fontSize: 15, color: "#000000", uppercase: true },
      table: { headerBg: "#000000", headerColor: "#ffffff", borderColor: "#000000", striped: false, stripeColor: "#f5f5f5" },
      code: { bg: "#111111", color: "#f5f5f5" },
      blockquote: { borderColor: "#000000", italic: false, color: "#333333" },
      link: { color: "#000000" },
    },
  },
  slate: {
    name: "Slate Graphite",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#27272a", lineHeight: 1.6 },
      title: { fontSize: 26, color: "#3f3f46", align: "left", uppercase: false, rule: true, ruleColor: "#71717a" },
      heading: { fontSize: 15, color: "#52525b", uppercase: false },
      table: { headerBg: "#3f3f46", headerColor: "#fafafa", borderColor: "#d4d4d8", striped: true, stripeColor: "#f4f4f5" },
      code: { bg: "#e4e4e7", color: "#27272a" },
      blockquote: { borderColor: "#71717a", italic: true, color: "#52525b" },
      link: { color: "#3f3f46" },
    },
  },
  lavender: {
    name: "Lavender Soft",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#3b3159", lineHeight: 1.6 },
      title: { fontSize: 27, color: "#6d28d9", align: "left", uppercase: false, rule: true, ruleColor: "#ddd6fe" },
      heading: { fontSize: 15, color: "#7c3aed", uppercase: false },
      table: { headerBg: "#f5f3ff", headerColor: "#6d28d9", borderColor: "#ddd6fe", striped: true, stripeColor: "#faf9ff" },
      code: { bg: "#f5f3ff", color: "#5b21b6" },
      blockquote: { borderColor: "#a78bfa", italic: true, color: "#6d28d9" },
      link: { color: "#7c3aed" },
    },
  },
  terracotta: {
    name: "Terracotta",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#44403c", lineHeight: 1.65 },
      title: { fontSize: 28, color: "#9a3412", align: "left", uppercase: false, rule: true, ruleColor: "#fdba74" },
      heading: { fontSize: 16, color: "#c2410c", uppercase: false },
      table: { headerBg: "#fff7ed", headerColor: "#9a3412", borderColor: "#fed7aa", striped: true, stripeColor: "#fffaf5" },
      code: { bg: "#fef2e8", color: "#9a3412" },
      blockquote: { borderColor: "#f97316", italic: true, color: "#78350f" },
      link: { color: "#c2410c" },
    },
  },
  arctic: {
    name: "Arctic Clean",
    styles: {
      page: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 10.5, textColor: "#1e293b", lineHeight: 1.55 },
      title: { fontSize: 24, color: "#0f172a", align: "left", uppercase: false, rule: true, ruleColor: "#cbd5e1" },
      heading: { fontSize: 14, color: "#334155", uppercase: false },
      table: { headerBg: "#f1f5f9", headerColor: "#0f172a", borderColor: "#e2e8f0", striped: false, stripeColor: "#f8fafc" },
      code: { bg: "#f8fafc", color: "#334155" },
      blockquote: { borderColor: "#94a3b8", italic: false, color: "#475569" },
      link: { color: "#0891b2" },
    },
  },
  blueprint: {
    name: "Blueprint",
    styles: {
      page: { fontFamily: "'Courier New', monospace", fontSize: 10.5, textColor: "#dbeafe", lineHeight: 1.55 },
      title: { fontSize: 24, color: "#ffffff", align: "left", uppercase: true, rule: true, ruleColor: "#93c5fd" },
      heading: { fontSize: 14, color: "#bfdbfe", uppercase: true },
      table: { headerBg: "#1e3a8a", headerColor: "#ffffff", borderColor: "#3b82f6", striped: true, stripeColor: "#1e40af" },
      code: { bg: "#1e3a8a", color: "#dbeafe" },
      blockquote: { borderColor: "#60a5fa", italic: false, color: "#bfdbfe" },
      link: { color: "#93c5fd" },
    },
  },
  newspaper: {
    name: "Vintage Newspaper",
    styles: {
      page: { fontFamily: "'Times New Roman', Times, serif", fontSize: 11, textColor: "#292524", lineHeight: 1.5 },
      title: { fontSize: 34, color: "#1c1917", align: "center", uppercase: true, rule: true, ruleColor: "#1c1917" },
      heading: { fontSize: 15, color: "#1c1917", uppercase: true },
      table: { headerBg: "#e7e5e4", headerColor: "#1c1917", borderColor: "#a8a29e", striped: false, stripeColor: "#f5f5f4" },
      code: { bg: "#f5f5f4", color: "#292524" },
      blockquote: { borderColor: "#1c1917", italic: true, color: "#44403c" },
      link: { color: "#1c1917" },
    },
  },
  bauhaus: {
    name: "Bauhaus Bold",
    styles: {
      page: { fontFamily: "Futura, 'Century Gothic', sans-serif", fontSize: 11, textColor: "#1a1a1a", lineHeight: 1.5 },
      title: { fontSize: 30, color: "#d7263d", align: "left", uppercase: true, rule: true, ruleColor: "#1a1a1a" },
      heading: { fontSize: 16, color: "#1258a8", uppercase: true },
      table: { headerBg: "#1a1a1a", headerColor: "#f4d35e", borderColor: "#1a1a1a", striped: true, stripeColor: "#f4f4f4" },
      code: { bg: "#f4d35e", color: "#1a1a1a" },
      blockquote: { borderColor: "#d7263d", italic: false, color: "#1a1a1a" },
      link: { color: "#1258a8" },
    },
  },
  rosegold: {
    name: "Rose Gold",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#4a3b3b", lineHeight: 1.65 },
      title: { fontSize: 28, color: "#9f5760", align: "center", uppercase: false, rule: true, ruleColor: "#eabfc0" },
      heading: { fontSize: 16, color: "#b76e79", uppercase: false },
      table: { headerBg: "#fdf0f0", headerColor: "#9f5760", borderColor: "#eabfc0", striped: true, stripeColor: "#fff8f8" },
      code: { bg: "#fdf0f0", color: "#9f5760" },
      blockquote: { borderColor: "#b76e79", italic: true, color: "#6b4c4c" },
      link: { color: "#b76e79" },
    },
  },
  mono: {
    name: "Pure Monochrome",
    styles: {
      page: { fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, textColor: "#000000", lineHeight: 1.6 },
      title: { fontSize: 26, color: "#000000", align: "left", uppercase: false, rule: true, ruleColor: "#000000" },
      heading: { fontSize: 15, color: "#000000", uppercase: false },
      table: { headerBg: "#ffffff", headerColor: "#000000", borderColor: "#000000", striped: false, stripeColor: "#ffffff" },
      code: { bg: "#ffffff", color: "#000000" },
      blockquote: { borderColor: "#000000", italic: true, color: "#000000" },
      link: { color: "#000000" },
    },
  },
  emerald: {
    name: "Emerald Corporate",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#1c1917", lineHeight: 1.55 },
      title: { fontSize: 26, color: "#065f46", align: "left", uppercase: false, rule: true, ruleColor: "#065f46" },
      heading: { fontSize: 15, color: "#047857", uppercase: false },
      table: { headerBg: "#065f46", headerColor: "#ffffff", borderColor: "#a7f3d0", striped: true, stripeColor: "#ecfdf5" },
      code: { bg: "#ecfdf5", color: "#065f46" },
      blockquote: { borderColor: "#10b981", italic: false, color: "#374151" },
      link: { color: "#059669" },
    },
  },
  desert: {
    name: "Desert Sand",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#57534e", lineHeight: 1.65 },
      title: { fontSize: 27, color: "#92400e", align: "left", uppercase: false, rule: true, ruleColor: "#fde68a" },
      heading: { fontSize: 15, color: "#b45309", uppercase: false },
      table: { headerBg: "#fefce8", headerColor: "#92400e", borderColor: "#fde68a", striped: true, stripeColor: "#fffdf5" },
      code: { bg: "#fefce8", color: "#92400e" },
      blockquote: { borderColor: "#d97706", italic: true, color: "#78716c" },
      link: { color: "#b45309" },
    },
  },
  midnight: {
    name: "Midnight Navy",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#e2e8f0", lineHeight: 1.6 },
      title: { fontSize: 27, color: "#f1f5f9", align: "left", uppercase: false, rule: true, ruleColor: "#334155" },
      heading: { fontSize: 15, color: "#93c5fd", uppercase: false },
      table: { headerBg: "#1e293b", headerColor: "#f1f5f9", borderColor: "#334155", striped: true, stripeColor: "#0f172a" },
      code: { bg: "#0f172a", color: "#93c5fd" },
      blockquote: { borderColor: "#3b82f6", italic: true, color: "#94a3b8" },
      link: { color: "#60a5fa" },
    },
  },
  copper: {
    name: "Copper Metallic",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#3f2e1f", lineHeight: 1.6 },
      title: { fontSize: 27, color: "#b45309", align: "left", uppercase: false, rule: true, ruleColor: "#b45309" },
      heading: { fontSize: 15, color: "#c2703d", uppercase: false },
      table: { headerBg: "#b45309", headerColor: "#fff7ed", borderColor: "#fdba74", striped: true, stripeColor: "#fff7ed" },
      code: { bg: "#fff7ed", color: "#7c2d12" },
      blockquote: { borderColor: "#c2703d", italic: true, color: "#5c4326" },
      link: { color: "#b45309" },
    },
  },
  zen: {
    name: "Zen Minimal",
    styles: {
      page: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, textColor: "#4b5563", lineHeight: 1.75 },
      title: { fontSize: 24, color: "#374151", align: "left", uppercase: false, rule: false, ruleColor: "#e5e7eb" },
      heading: { fontSize: 14, color: "#4b5563", uppercase: false },
      table: { headerBg: "#f9fafb", headerColor: "#374151", borderColor: "#e5e7eb", striped: false, stripeColor: "#f9fafb" },
      code: { bg: "#f9fafb", color: "#4b5563" },
      blockquote: { borderColor: "#d1d5db", italic: true, color: "#6b7280" },
      link: { color: "#6b7280" },
    },
  },
  retro: {
    name: "Retro Typewriter",
    styles: {
      page: { fontFamily: "'Courier New', Courier, monospace", fontSize: 11, textColor: "#2b2b2b", lineHeight: 1.6 },
      title: { fontSize: 24, color: "#2b2b2b", align: "left", uppercase: true, rule: true, ruleColor: "#2b2b2b" },
      heading: { fontSize: 14, color: "#2b2b2b", uppercase: true },
      table: { headerBg: "#e8e4d8", headerColor: "#2b2b2b", borderColor: "#a89f8a", striped: true, stripeColor: "#f4f1e8" },
      code: { bg: "#e8e4d8", color: "#2b2b2b" },
      blockquote: { borderColor: "#8a7f66", italic: false, color: "#514b3f" },
      link: { color: "#7a4b2c" },
    },
  },
  pastel: {
    name: "Pastel Dream",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#4b3f4e", lineHeight: 1.65 },
      title: { fontSize: 27, color: "#c084fc", align: "center", uppercase: false, rule: true, ruleColor: "#fbcfe8" },
      heading: { fontSize: 15, color: "#f472b6", uppercase: false },
      table: { headerBg: "#fdf4ff", headerColor: "#a855f7", borderColor: "#f5d0fe", striped: true, stripeColor: "#fdf4ff" },
      code: { bg: "#fdf2f8", color: "#a21caf" },
      blockquote: { borderColor: "#f0abfc", italic: true, color: "#86198f" },
      link: { color: "#c026d3" },
    },
  },
  coral: {
    name: "Coral Reef",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#164e63", lineHeight: 1.6 },
      title: { fontSize: 27, color: "#e11d48", align: "left", uppercase: false, rule: true, ruleColor: "#5eead4" },
      heading: { fontSize: 15, color: "#0d9488", uppercase: false },
      table: { headerBg: "#ecfeff", headerColor: "#0e7490", borderColor: "#a5f3fc", striped: true, stripeColor: "#f0fdfa" },
      code: { bg: "#fff1f2", color: "#be123c" },
      blockquote: { borderColor: "#fb7185", italic: true, color: "#0e7490" },
      link: { color: "#e11d48" },
    },
  },
  ivory: {
    name: "Ivory Elegance",
    styles: {
      page: { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 11.5, textColor: "#44403c", lineHeight: 1.7 },
      title: { fontSize: 30, color: "#1c1917", align: "center", uppercase: false, rule: false, ruleColor: "#d6d3d1" },
      heading: { fontSize: 16, color: "#57534e", uppercase: false },
      table: { headerBg: "#fafaf9", headerColor: "#292524", borderColor: "#e7e5e4", striped: false, stripeColor: "#fafaf9" },
      code: { bg: "#f5f5f4", color: "#44403c" },
      blockquote: { borderColor: "#d6d3d1", italic: true, color: "#78716c" },
      link: { color: "#92400e" },
    },
  },
  steel: {
    name: "Industrial Steel",
    styles: {
      page: { fontFamily: "'Segoe UI', Verdana, sans-serif", fontSize: 10.5, textColor: "#1f2937", lineHeight: 1.5 },
      title: { fontSize: 24, color: "#374151", align: "left", uppercase: true, rule: true, ruleColor: "#9ca3af" },
      heading: { fontSize: 14, color: "#4b5563", uppercase: true },
      table: { headerBg: "#4b5563", headerColor: "#f9fafb", borderColor: "#9ca3af", striped: true, stripeColor: "#f3f4f6" },
      code: { bg: "#e5e7eb", color: "#1f2937" },
      blockquote: { borderColor: "#6b7280", italic: false, color: "#374151" },
      link: { color: "#334155" },
    },
  },
  wine: {
    name: "Deep Wine",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#3f1520", lineHeight: 1.65 },
      title: { fontSize: 28, color: "#6b1229", align: "center", uppercase: false, rule: true, ruleColor: "#6b1229" },
      heading: { fontSize: 16, color: "#8c1c3f", uppercase: false },
      table: { headerBg: "#6b1229", headerColor: "#fdf2f4", borderColor: "#e7b3bd", striped: true, stripeColor: "#fdf2f4" },
      code: { bg: "#fdf2f4", color: "#6b1229" },
      blockquote: { borderColor: "#8c1c3f", italic: true, color: "#7a2e3d" },
      link: { color: "#8c1c3f" },
    },
  },
  sunset: {
    name: "Sunset Warm",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#451a03", lineHeight: 1.6 },
      title: { fontSize: 28, color: "#c2410c", align: "left", uppercase: false, rule: true, ruleColor: "#fdba74" },
      heading: { fontSize: 15, color: "#ea580c", uppercase: false },
      table: { headerBg: "#fff7ed", headerColor: "#c2410c", borderColor: "#fed7aa", striped: true, stripeColor: "#fffaf0" },
      code: { bg: "#fff1e6", color: "#9a3412" },
      blockquote: { borderColor: "#fb923c", italic: true, color: "#7c2d12" },
      link: { color: "#dc2626" },
    },
  },
};

export const DEFAULT_MD = `# Moovendhan | Software Engineer & Cloud Architect

![Profile Photo](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250&h=250)

Highly motivated **Software Engineer** specializing in full-stack web development and cloud-native infrastructure automation. Expert at translating product ideas into production-ready architectures, with extensive experience in React/Next.js frontends, Node.js services, and AWS/Cloudflare deployments.

---

## 🛠️ Technical Stack & Skills

- **Front-End Development**: React, Next.js, Vite, TailwindCSS, State Management (Zustand, Redux)
- **Back-End & API Design**: Node.js, Express, REST APIs, Reverse Proxies (Nginx)
- **DevOps & Infrastructure**: Infrastructure as Code (Terraform), AWS (ECS, ALB, Route53, IAM), Cloudflare Pages
- **Developer Workflows**: CI/CD (GitHub Actions), Docker, Git, Command-line automation

---

## 🚀 Key Projects

### 📝 MD → Docs (Markdown Document Generator)
*A high-fidelity markdown-to-document converter with custom styling systems.*
- Implemented real-time Canva-style visual template selection and multi-column previews.
- Engineered dynamic margins (A4 standard) and soft-break pagination rules for PDF/Word exports.
- **Technologies**: React, Zustand, Radix UI, docx.js, TailwindCSS.

### 🌐 Secure Nominatim Proxy Setup
*Enterprise reverse-proxy reverse geolocation services.*
- Architected Nginx reverse-proxies isolating core Nominatim geolocation engines.
- Configured secure CORS handling and performance optimized cache profiles.
- **Technologies**: Docker Compose, Nginx, Linux.

---

## 📈 Key Metrics & Accomplishments

| Highlight | Description | Impact |
|---|---|---|
| Cloud Migrations | Orchestrated ECS-based modular AWS architectures | 100% infrastructure reproducibility |
| Build Optimization | Rebuilt asset bundles and optimized Vite assets | Reduced load times by 38% |
| CI/CD Pipelines | Deployed environment-separated Git deployment branches | Automated dev → prod releases |

---

> "Strive not to be a success, but rather to be of value." — Albert Einstein

### Contact & Links
- **GitHub**: [github.com/moovendhan-v](https://github.com/moovendhan-v)
- **Website**: [moovendhan.dev](https://github.com/moovendhan-v)

*Generated dynamically using MD → Docs.*
`;