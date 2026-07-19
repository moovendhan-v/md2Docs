/* Templates — each is a complete style sheet for the document. */
export const TEMPLATES = {
  boardroom: {
    name: "Boardroom",
    styles: {
      page: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, textColor: "#1f2937", lineHeight: 1.55, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#cccccc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#0f3460", align: "left", uppercase: false, rule: true, ruleColor: "#0f3460", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#0f3460", uppercase: false, rule: false, ruleColor: "#0f3460", letterSpacing: 0 },
      table: { headerBg: "#0f3460", headerColor: "#ffffff", borderColor: "#c7d2e0", striped: true, stripeColor: "#f1f5fb", headerAlign: "left" },
      code: { bg: "#f3f4f6", color: "#111827", borderRadius: 4, border: false, borderColor: "#e5e7eb" },
      blockquote: { borderColor: "#0f3460", italic: true, color: "#475569", borderWidth: 3, bg: "transparent" },
      link: { color: "#1d4ed8", underline: true },
    },
  },
  editorial: {
    name: "Editorial",
    styles: {
      page: { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, textColor: "#292524", lineHeight: 1.7, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#7c2d12", pageNumberSize: 8, borderStyle: "none", borderColor: "#cccccc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 32, color: "#292524", align: "center", uppercase: false, rule: false, ruleColor: "#292524", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 18, color: "#7c2d12", uppercase: false, rule: false, ruleColor: "#7c2d12", letterSpacing: 0 },
      table: { headerBg: "#fff7ed", headerColor: "#7c2d12", borderColor: "#e7d8c9", striped: false, stripeColor: "#faf7f2", headerAlign: "left" },
      code: { bg: "#f5f5f4", color: "#44403c", borderRadius: 4, border: false, borderColor: "#e7e5e4" },
      blockquote: { borderColor: "#7c2d12", italic: true, color: "#57534e", borderWidth: 3, bg: "transparent" },
      link: { color: "#9a3412", underline: true },
    },
  },
  technical: {
    name: "Technical",
    styles: {
      page: { fontFamily: "'Segoe UI', Verdana, sans-serif", fontSize: 10.5, textColor: "#18181b", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "right", pageNumberFormat: "Page X of Y", pageNumberColor: "#71717a", pageNumberSize: 8, borderStyle: "none", borderColor: "#cccccc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 22, color: "#18181b", align: "left", uppercase: true, rule: true, ruleColor: "#18181b", ruleWidth: 2, letterSpacing: 1 },
      heading: { fontSize: 14, color: "#18181b", uppercase: true, rule: true, ruleColor: "#d4d4d8", letterSpacing: 0.5 },
      table: { headerBg: "#18181b", headerColor: "#fafafa", borderColor: "#d4d4d8", striped: true, stripeColor: "#f4f4f5", headerAlign: "left" },
      code: { bg: "#18181b", color: "#e4e4e7", borderRadius: 4, border: false, borderColor: "#3f3f46" },
      blockquote: { borderColor: "#a1a1aa", italic: false, color: "#52525b", borderWidth: 4, bg: "transparent" },
      link: { color: "#0d9488", underline: true },
    },
  },
  modern: {
    name: "Modern Minimalist",
    styles: {
      page: { fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 11, textColor: "#0f172a", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#94a3b8", pageNumberSize: 8, borderStyle: "none", borderColor: "#e2e8f0", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#0f172a", align: "left", uppercase: false, rule: true, ruleColor: "#e2e8f0", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#475569", uppercase: false, rule: false, ruleColor: "#e2e8f0", letterSpacing: 0 },
      table: { headerBg: "#f8fafc", headerColor: "#0f172a", borderColor: "#e2e8f0", striped: true, stripeColor: "#f1f5f9", headerAlign: "left" },
      code: { bg: "#f8fafc", color: "#0f172a", borderRadius: 4, border: true, borderColor: "#e2e8f0" },
      blockquote: { borderColor: "#cbd5e1", italic: true, color: "#64748b", borderWidth: 3, bg: "transparent" },
      link: { color: "#0284c7", underline: true },
    },
  },
  corporate: {
    name: "Corporate Indigo",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#1e293b", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#cccccc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#312e81", align: "left", uppercase: false, rule: true, ruleColor: "#312e81", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#3730a3", uppercase: false, rule: false, ruleColor: "#3730a3", letterSpacing: 0 },
      table: { headerBg: "#3730a3", headerColor: "#ffffff", borderColor: "#e2e8f0", striped: true, stripeColor: "#f5f3ff", headerAlign: "left" },
      code: { bg: "#f1f5f9", color: "#1e1b4b", borderRadius: 4, border: false, borderColor: "#e2e8f0" },
      blockquote: { borderColor: "#4f46e5", italic: false, color: "#475569", borderWidth: 3, bg: "transparent" },
      link: { color: "#4f46e5", underline: true },
    },
  },
  forest: {
    name: "Forest Organic",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#2d3748", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#a7f3d0", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#064e3b", align: "center", uppercase: false, rule: true, ruleColor: "#a7f3d0", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#065f46", uppercase: false, rule: false, ruleColor: "#a7f3d0", letterSpacing: 0 },
      table: { headerBg: "#d1fae5", headerColor: "#064e3b", borderColor: "#a7f3d0", striped: true, stripeColor: "#f0fdf4", headerAlign: "left" },
      code: { bg: "#f3f4f6", color: "#064e3b", borderRadius: 4, border: false, borderColor: "#a7f3d0" },
      blockquote: { borderColor: "#059669", italic: true, color: "#4a5568", borderWidth: 3, bg: "transparent" },
      link: { color: "#059669", underline: true },
    },
  },
  academic: {
    name: "Academic Thesis",
    styles: {
      page: { fontFamily: "'Times New Roman', Times, serif", fontSize: 12, textColor: "#000000", lineHeight: 2.0, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#555555", pageNumberSize: 9, borderStyle: "none", borderColor: "#cccccc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 24, color: "#000000", align: "center", uppercase: true, rule: false, ruleColor: "#000000", ruleWidth: 1, letterSpacing: 1 },
      heading: { fontSize: 14, color: "#000000", uppercase: false, rule: false, ruleColor: "#000000", letterSpacing: 0 },
      table: { headerBg: "#ffffff", headerColor: "#000000", borderColor: "#000000", striped: false, stripeColor: "#ffffff", headerAlign: "left" },
      code: { bg: "#f8f9fa", color: "#000000", borderRadius: 2, border: true, borderColor: "#cccccc" },
      blockquote: { borderColor: "#000000", italic: true, color: "#000000", borderWidth: 2, bg: "transparent" },
      link: { color: "#000000", underline: true },
    },
  },
  crimson: {
    name: "Warm Crimson",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#262626", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#fee2e2", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#991b1b", align: "left", uppercase: false, rule: true, ruleColor: "#991b1b", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#991b1b", uppercase: false, rule: false, ruleColor: "#fca5a5", letterSpacing: 0 },
      table: { headerBg: "#fff5f5", headerColor: "#991b1b", borderColor: "#fee2e2", striped: true, stripeColor: "#fff8f8", headerAlign: "left" },
      code: { bg: "#f5f5f5", color: "#991b1b", borderRadius: 4, border: false, borderColor: "#fee2e2" },
      blockquote: { borderColor: "#991b1b", italic: true, color: "#737373", borderWidth: 3, bg: "transparent" },
      link: { color: "#c2410c", underline: true },
    },
  },
  ocean: {
    name: "Ocean Breeze",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#334155", lineHeight: 1.55, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#0369a1", pageNumberSize: 8, borderStyle: "none", borderColor: "#bae6fd", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#0369a1", align: "left", uppercase: false, rule: true, ruleColor: "#bae6fd", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#0284c7", uppercase: false, rule: false, ruleColor: "#bae6fd", letterSpacing: 0 },
      table: { headerBg: "#e0f2fe", headerColor: "#0369a1", borderColor: "#bae6fd", striped: true, stripeColor: "#f0f9ff", headerAlign: "left" },
      code: { bg: "#f1f5f9", color: "#0369a1", borderRadius: 4, border: false, borderColor: "#bae6fd" },
      blockquote: { borderColor: "#38bdf8", italic: true, color: "#475569", borderWidth: 3, bg: "transparent" },
      link: { color: "#0284c7", underline: true },
    },
  },
  luxury: {
    name: "Royal Gold",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 12, textColor: "#3c3014", lineHeight: 1.7, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#a16207", pageNumberSize: 8, borderStyle: "solid", borderColor: "#854d0e", borderWidth: 1, borderInset: 12 },
      title: { fontSize: 30, color: "#854d0e", align: "center", uppercase: true, rule: true, ruleColor: "#854d0e", ruleWidth: 2, letterSpacing: 1 },
      heading: { fontSize: 16, color: "#a16207", uppercase: false, rule: false, ruleColor: "#fef08a", letterSpacing: 0 },
      table: { headerBg: "#fef08a", headerColor: "#854d0e", borderColor: "#fef08a", striped: false, stripeColor: "#fefcbf", headerAlign: "center" },
      code: { bg: "#fefdf0", color: "#854d0e", borderRadius: 4, border: true, borderColor: "#fef08a" },
      blockquote: { borderColor: "#854d0e", italic: true, color: "#713f12", borderWidth: 3, bg: "transparent" },
      link: { color: "#a16207", underline: false },
    },
  },
  cyberpunk: {
    name: "Cyber Tech",
    styles: {
      page: { fontFamily: "monospace", fontSize: 10, textColor: "#e2e8f0", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "right", pageNumberFormat: "X / Y", pageNumberColor: "#db2777", pageNumberSize: 8, borderStyle: "solid", borderColor: "#db2777", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 24, color: "#db2777", align: "left", uppercase: true, rule: true, ruleColor: "#db2777", ruleWidth: 1, letterSpacing: 2 },
      heading: { fontSize: 14, color: "#7c3aed", uppercase: true, rule: true, ruleColor: "#4b5563", letterSpacing: 1 },
      table: { headerBg: "#7c3aed", headerColor: "#ffffff", borderColor: "#4b5563", striped: true, stripeColor: "#1f1a3a", headerAlign: "left" },
      code: { bg: "#0f172a", color: "#10b981", borderRadius: 0, border: true, borderColor: "#10b981" },
      blockquote: { borderColor: "#db2777", italic: false, color: "#94a3b8", borderWidth: 2, bg: "transparent" },
      link: { color: "#db2777", underline: false },
    },
  },

  /* -------------------------------------------------------------------
   * New additions below
   * ----------------------------------------------------------------- */

  noir: {
    name: "Noir",
    styles: {
      page: { fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, textColor: "#111111", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "X", pageNumberColor: "#555555", pageNumberSize: 8, borderStyle: "none", borderColor: "#000000", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 30, color: "#000000", align: "left", uppercase: true, rule: true, ruleColor: "#000000", ruleWidth: 2, letterSpacing: 2 },
      heading: { fontSize: 15, color: "#000000", uppercase: true, rule: false, ruleColor: "#000000", letterSpacing: 1 },
      table: { headerBg: "#000000", headerColor: "#ffffff", borderColor: "#000000", striped: false, stripeColor: "#f5f5f5", headerAlign: "left" },
      code: { bg: "#111111", color: "#f5f5f5", borderRadius: 0, border: false, borderColor: "#333333" },
      blockquote: { borderColor: "#000000", italic: false, color: "#333333", borderWidth: 4, bg: "transparent" },
      link: { color: "#000000", underline: true },
    },
  },
  slate: {
    name: "Slate Graphite",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#27272a", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#71717a", pageNumberSize: 8, borderStyle: "none", borderColor: "#d4d4d8", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#3f3f46", align: "left", uppercase: false, rule: true, ruleColor: "#71717a", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#52525b", uppercase: false, rule: false, ruleColor: "#d4d4d8", letterSpacing: 0 },
      table: { headerBg: "#3f3f46", headerColor: "#fafafa", borderColor: "#d4d4d8", striped: true, stripeColor: "#f4f4f5", headerAlign: "left" },
      code: { bg: "#e4e4e7", color: "#27272a", borderRadius: 4, border: false, borderColor: "#d4d4d8" },
      blockquote: { borderColor: "#71717a", italic: true, color: "#52525b", borderWidth: 3, bg: "transparent" },
      link: { color: "#3f3f46", underline: true },
    },
  },
  lavender: {
    name: "Lavender Soft",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#3b3159", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#7c3aed", pageNumberSize: 8, borderStyle: "none", borderColor: "#ddd6fe", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#6d28d9", align: "left", uppercase: false, rule: true, ruleColor: "#ddd6fe", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#7c3aed", uppercase: false, rule: false, ruleColor: "#ddd6fe", letterSpacing: 0 },
      table: { headerBg: "#f5f3ff", headerColor: "#6d28d9", borderColor: "#ddd6fe", striped: true, stripeColor: "#faf9ff", headerAlign: "left" },
      code: { bg: "#f5f3ff", color: "#5b21b6", borderRadius: 4, border: true, borderColor: "#ddd6fe" },
      blockquote: { borderColor: "#a78bfa", italic: true, color: "#6d28d9", borderWidth: 3, bg: "#faf9ff" },
      link: { color: "#7c3aed", underline: true },
    },
  },
  terracotta: {
    name: "Terracotta",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#44403c", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#fed7aa", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#9a3412", align: "left", uppercase: false, rule: true, ruleColor: "#fdba74", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#c2410c", uppercase: false, rule: false, ruleColor: "#fdba74", letterSpacing: 0 },
      table: { headerBg: "#fff7ed", headerColor: "#9a3412", borderColor: "#fed7aa", striped: true, stripeColor: "#fffaf5", headerAlign: "left" },
      code: { bg: "#fef2e8", color: "#9a3412", borderRadius: 4, border: false, borderColor: "#fed7aa" },
      blockquote: { borderColor: "#f97316", italic: true, color: "#78350f", borderWidth: 3, bg: "transparent" },
      link: { color: "#c2410c", underline: true },
    },
  },
  arctic: {
    name: "Arctic Clean",
    styles: {
      page: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 10.5, textColor: "#1e293b", lineHeight: 1.55, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#94a3b8", pageNumberSize: 8, borderStyle: "none", borderColor: "#e2e8f0", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 24, color: "#0f172a", align: "left", uppercase: false, rule: true, ruleColor: "#cbd5e1", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 14, color: "#334155", uppercase: false, rule: false, ruleColor: "#e2e8f0", letterSpacing: 0 },
      table: { headerBg: "#f1f5f9", headerColor: "#0f172a", borderColor: "#e2e8f0", striped: false, stripeColor: "#f8fafc", headerAlign: "left" },
      code: { bg: "#f8fafc", color: "#334155", borderRadius: 4, border: true, borderColor: "#e2e8f0" },
      blockquote: { borderColor: "#94a3b8", italic: false, color: "#475569", borderWidth: 2, bg: "transparent" },
      link: { color: "#0891b2", underline: true },
    },
  },
  blueprint: {
    name: "Blueprint",
    styles: {
      page: { fontFamily: "'Courier New', monospace", fontSize: 10.5, textColor: "#dbeafe", lineHeight: 1.55, showPageNumbers: true, pageNumberAlign: "left", pageNumberFormat: "X / Y", pageNumberColor: "#93c5fd", pageNumberSize: 8, borderStyle: "solid", borderColor: "#3b82f6", borderWidth: 1, borderInset: 10 },
      title: { fontSize: 24, color: "#ffffff", align: "left", uppercase: true, rule: true, ruleColor: "#93c5fd", ruleWidth: 1, letterSpacing: 2 },
      heading: { fontSize: 14, color: "#bfdbfe", uppercase: true, rule: true, ruleColor: "#1e3a8a", letterSpacing: 1 },
      table: { headerBg: "#1e3a8a", headerColor: "#ffffff", borderColor: "#3b82f6", striped: true, stripeColor: "#1e40af", headerAlign: "left" },
      code: { bg: "#1e3a8a", color: "#dbeafe", borderRadius: 0, border: true, borderColor: "#3b82f6" },
      blockquote: { borderColor: "#60a5fa", italic: false, color: "#bfdbfe", borderWidth: 2, bg: "transparent" },
      link: { color: "#93c5fd", underline: false },
    },
  },
  newspaper: {
    name: "Vintage Newspaper",
    styles: {
      page: { fontFamily: "'Times New Roman', Times, serif", fontSize: 11, textColor: "#292524", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#44403c", pageNumberSize: 8, borderStyle: "double", borderColor: "#1c1917", borderWidth: 3, borderInset: 10 },
      title: { fontSize: 34, color: "#1c1917", align: "center", uppercase: true, rule: true, ruleColor: "#1c1917", ruleWidth: 2, letterSpacing: 2 },
      heading: { fontSize: 15, color: "#1c1917", uppercase: true, rule: true, ruleColor: "#a8a29e", letterSpacing: 1 },
      table: { headerBg: "#e7e5e4", headerColor: "#1c1917", borderColor: "#a8a29e", striped: false, stripeColor: "#f5f5f4", headerAlign: "center" },
      code: { bg: "#f5f5f4", color: "#292524", borderRadius: 0, border: false, borderColor: "#a8a29e" },
      blockquote: { borderColor: "#1c1917", italic: true, color: "#44403c", borderWidth: 3, bg: "transparent" },
      link: { color: "#1c1917", underline: true },
    },
  },
  bauhaus: {
    name: "Bauhaus Bold",
    styles: {
      page: { fontFamily: "Futura, 'Century Gothic', sans-serif", fontSize: 11, textColor: "#1a1a1a", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "right", pageNumberFormat: "X", pageNumberColor: "#d7263d", pageNumberSize: 9, borderStyle: "solid", borderColor: "#1a1a1a", borderWidth: 2, borderInset: 6 },
      title: { fontSize: 30, color: "#d7263d", align: "left", uppercase: true, rule: true, ruleColor: "#1a1a1a", ruleWidth: 3, letterSpacing: 3 },
      heading: { fontSize: 16, color: "#1258a8", uppercase: true, rule: false, ruleColor: "#1a1a1a", letterSpacing: 1 },
      table: { headerBg: "#1a1a1a", headerColor: "#f4d35e", borderColor: "#1a1a1a", striped: true, stripeColor: "#f4f4f4", headerAlign: "left" },
      code: { bg: "#f4d35e", color: "#1a1a1a", borderRadius: 0, border: true, borderColor: "#1a1a1a" },
      blockquote: { borderColor: "#d7263d", italic: false, color: "#1a1a1a", borderWidth: 4, bg: "transparent" },
      link: { color: "#1258a8", underline: false },
    },
  },
  rosegold: {
    name: "Rose Gold",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#4a3b3b", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#b76e79", pageNumberSize: 8, borderStyle: "none", borderColor: "#eabfc0", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#9f5760", align: "center", uppercase: false, rule: true, ruleColor: "#eabfc0", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#b76e79", uppercase: false, rule: false, ruleColor: "#eabfc0", letterSpacing: 0 },
      table: { headerBg: "#fdf0f0", headerColor: "#9f5760", borderColor: "#eabfc0", striped: true, stripeColor: "#fff8f8", headerAlign: "left" },
      code: { bg: "#fdf0f0", color: "#9f5760", borderRadius: 6, border: true, borderColor: "#eabfc0" },
      blockquote: { borderColor: "#b76e79", italic: true, color: "#6b4c4c", borderWidth: 2, bg: "#fff8f8" },
      link: { color: "#b76e79", underline: false },
    },
  },
  mono: {
    name: "Pure Monochrome",
    styles: {
      page: { fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, textColor: "#000000", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "X", pageNumberColor: "#666666", pageNumberSize: 8, borderStyle: "none", borderColor: "#000000", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#000000", align: "left", uppercase: false, rule: true, ruleColor: "#000000", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#000000", uppercase: false, rule: false, ruleColor: "#000000", letterSpacing: 0 },
      table: { headerBg: "#ffffff", headerColor: "#000000", borderColor: "#000000", striped: false, stripeColor: "#ffffff", headerAlign: "left" },
      code: { bg: "#ffffff", color: "#000000", borderRadius: 0, border: true, borderColor: "#000000" },
      blockquote: { borderColor: "#000000", italic: true, color: "#000000", borderWidth: 2, bg: "transparent" },
      link: { color: "#000000", underline: true },
    },
  },
  emerald: {
    name: "Emerald Corporate",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#1c1917", lineHeight: 1.55, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#047857", pageNumberSize: 8, borderStyle: "none", borderColor: "#a7f3d0", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 26, color: "#065f46", align: "left", uppercase: false, rule: true, ruleColor: "#065f46", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#047857", uppercase: false, rule: false, ruleColor: "#a7f3d0", letterSpacing: 0 },
      table: { headerBg: "#065f46", headerColor: "#ffffff", borderColor: "#a7f3d0", striped: true, stripeColor: "#ecfdf5", headerAlign: "left" },
      code: { bg: "#ecfdf5", color: "#065f46", borderRadius: 4, border: true, borderColor: "#a7f3d0" },
      blockquote: { borderColor: "#10b981", italic: false, color: "#374151", borderWidth: 3, bg: "transparent" },
      link: { color: "#059669", underline: true },
    },
  },
  desert: {
    name: "Desert Sand",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#57534e", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#888888", pageNumberSize: 8, borderStyle: "none", borderColor: "#fde68a", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#92400e", align: "left", uppercase: false, rule: true, ruleColor: "#fde68a", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#b45309", uppercase: false, rule: false, ruleColor: "#fde68a", letterSpacing: 0 },
      table: { headerBg: "#fefce8", headerColor: "#92400e", borderColor: "#fde68a", striped: true, stripeColor: "#fffdf5", headerAlign: "left" },
      code: { bg: "#fefce8", color: "#92400e", borderRadius: 4, border: false, borderColor: "#fde68a" },
      blockquote: { borderColor: "#d97706", italic: true, color: "#78716c", borderWidth: 3, bg: "transparent" },
      link: { color: "#b45309", underline: true },
    },
  },
  midnight: {
    name: "Midnight Navy",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#e2e8f0", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "X / Y", pageNumberColor: "#60a5fa", pageNumberSize: 8, borderStyle: "none", borderColor: "#334155", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#f1f5f9", align: "left", uppercase: false, rule: true, ruleColor: "#334155", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#93c5fd", uppercase: false, rule: true, ruleColor: "#1e293b", letterSpacing: 0 },
      table: { headerBg: "#1e293b", headerColor: "#f1f5f9", borderColor: "#334155", striped: true, stripeColor: "#0f172a", headerAlign: "left" },
      code: { bg: "#0f172a", color: "#93c5fd", borderRadius: 4, border: true, borderColor: "#334155" },
      blockquote: { borderColor: "#3b82f6", italic: true, color: "#94a3b8", borderWidth: 3, bg: "#0f172a" },
      link: { color: "#60a5fa", underline: false },
    },
  },
  copper: {
    name: "Copper Metallic",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#3f2e1f", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#c2703d", pageNumberSize: 8, borderStyle: "none", borderColor: "#fdba74", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#b45309", align: "left", uppercase: false, rule: true, ruleColor: "#b45309", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#c2703d", uppercase: false, rule: false, ruleColor: "#fdba74", letterSpacing: 0 },
      table: { headerBg: "#b45309", headerColor: "#fff7ed", borderColor: "#fdba74", striped: true, stripeColor: "#fff7ed", headerAlign: "left" },
      code: { bg: "#fff7ed", color: "#7c2d12", borderRadius: 4, border: true, borderColor: "#fdba74" },
      blockquote: { borderColor: "#c2703d", italic: true, color: "#5c4326", borderWidth: 3, bg: "transparent" },
      link: { color: "#b45309", underline: true },
    },
  },
  zen: {
    name: "Zen Minimal",
    styles: {
      page: { fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, textColor: "#4b5563", lineHeight: 1.75, showPageNumbers: false, pageNumberAlign: "center", pageNumberFormat: "X", pageNumberColor: "#9ca3af", pageNumberSize: 8, borderStyle: "none", borderColor: "#e5e7eb", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 24, color: "#374151", align: "left", uppercase: false, rule: false, ruleColor: "#e5e7eb", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 14, color: "#4b5563", uppercase: false, rule: false, ruleColor: "#e5e7eb", letterSpacing: 0 },
      table: { headerBg: "#f9fafb", headerColor: "#374151", borderColor: "#e5e7eb", striped: false, stripeColor: "#f9fafb", headerAlign: "left" },
      code: { bg: "#f9fafb", color: "#4b5563", borderRadius: 2, border: false, borderColor: "#e5e7eb" },
      blockquote: { borderColor: "#d1d5db", italic: true, color: "#6b7280", borderWidth: 2, bg: "transparent" },
      link: { color: "#6b7280", underline: false },
    },
  },
  retro: {
    name: "Retro Typewriter",
    styles: {
      page: { fontFamily: "'Courier New', Courier, monospace", fontSize: 11, textColor: "#2b2b2b", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#8a7f66", pageNumberSize: 8, borderStyle: "none", borderColor: "#a89f8a", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 24, color: "#2b2b2b", align: "left", uppercase: true, rule: true, ruleColor: "#2b2b2b", ruleWidth: 2, letterSpacing: 2 },
      heading: { fontSize: 14, color: "#2b2b2b", uppercase: true, rule: false, ruleColor: "#a89f8a", letterSpacing: 1 },
      table: { headerBg: "#e8e4d8", headerColor: "#2b2b2b", borderColor: "#a89f8a", striped: true, stripeColor: "#f4f1e8", headerAlign: "left" },
      code: { bg: "#e8e4d8", color: "#2b2b2b", borderRadius: 0, border: true, borderColor: "#a89f8a" },
      blockquote: { borderColor: "#8a7f66", italic: false, color: "#514b3f", borderWidth: 3, bg: "transparent" },
      link: { color: "#7a4b2c", underline: true },
    },
  },
  pastel: {
    name: "Pastel Dream",
    styles: {
      page: { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 11, textColor: "#4b3f4e", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#c084fc", pageNumberSize: 8, borderStyle: "none", borderColor: "#f5d0fe", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#c084fc", align: "center", uppercase: false, rule: true, ruleColor: "#fbcfe8", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#f472b6", uppercase: false, rule: false, ruleColor: "#f5d0fe", letterSpacing: 0 },
      table: { headerBg: "#fdf4ff", headerColor: "#a855f7", borderColor: "#f5d0fe", striped: true, stripeColor: "#fdf4ff", headerAlign: "left" },
      code: { bg: "#fdf2f8", color: "#a21caf", borderRadius: 8, border: true, borderColor: "#f5d0fe" },
      blockquote: { borderColor: "#f0abfc", italic: true, color: "#86198f", borderWidth: 2, bg: "#fdf4ff" },
      link: { color: "#c026d3", underline: true },
    },
  },
  coral: {
    name: "Coral Reef",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#164e63", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#0d9488", pageNumberSize: 8, borderStyle: "none", borderColor: "#a5f3fc", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 27, color: "#e11d48", align: "left", uppercase: false, rule: true, ruleColor: "#5eead4", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#0d9488", uppercase: false, rule: false, ruleColor: "#a5f3fc", letterSpacing: 0 },
      table: { headerBg: "#ecfeff", headerColor: "#0e7490", borderColor: "#a5f3fc", striped: true, stripeColor: "#f0fdfa", headerAlign: "left" },
      code: { bg: "#fff1f2", color: "#be123c", borderRadius: 4, border: false, borderColor: "#fca5a5" },
      blockquote: { borderColor: "#fb7185", italic: true, color: "#0e7490", borderWidth: 3, bg: "transparent" },
      link: { color: "#e11d48", underline: true },
    },
  },
  ivory: {
    name: "Ivory Elegance",
    styles: {
      page: { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 11.5, textColor: "#44403c", lineHeight: 1.7, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#a8a29e", pageNumberSize: 8, borderStyle: "none", borderColor: "#d6d3d1", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 30, color: "#1c1917", align: "center", uppercase: false, rule: false, ruleColor: "#d6d3d1", ruleWidth: 1, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#57534e", uppercase: false, rule: false, ruleColor: "#e7e5e4", letterSpacing: 0 },
      table: { headerBg: "#fafaf9", headerColor: "#292524", borderColor: "#e7e5e4", striped: false, stripeColor: "#fafaf9", headerAlign: "left" },
      code: { bg: "#f5f5f4", color: "#44403c", borderRadius: 4, border: false, borderColor: "#e7e5e4" },
      blockquote: { borderColor: "#d6d3d1", italic: true, color: "#78716c", borderWidth: 2, bg: "transparent" },
      link: { color: "#92400e", underline: false },
    },
  },
  steel: {
    name: "Industrial Steel",
    styles: {
      page: { fontFamily: "'Segoe UI', Verdana, sans-serif", fontSize: 10.5, textColor: "#1f2937", lineHeight: 1.5, showPageNumbers: true, pageNumberAlign: "right", pageNumberFormat: "Page X of Y", pageNumberColor: "#6b7280", pageNumberSize: 8, borderStyle: "solid", borderColor: "#9ca3af", borderWidth: 1, borderInset: 6 },
      title: { fontSize: 24, color: "#374151", align: "left", uppercase: true, rule: true, ruleColor: "#9ca3af", ruleWidth: 2, letterSpacing: 1 },
      heading: { fontSize: 14, color: "#4b5563", uppercase: true, rule: true, ruleColor: "#e5e7eb", letterSpacing: 0.5 },
      table: { headerBg: "#4b5563", headerColor: "#f9fafb", borderColor: "#9ca3af", striped: true, stripeColor: "#f3f4f6", headerAlign: "left" },
      code: { bg: "#e5e7eb", color: "#1f2937", borderRadius: 2, border: true, borderColor: "#9ca3af" },
      blockquote: { borderColor: "#6b7280", italic: false, color: "#374151", borderWidth: 4, bg: "transparent" },
      link: { color: "#334155", underline: true },
    },
  },
  wine: {
    name: "Deep Wine",
    styles: {
      page: { fontFamily: "Georgia, serif", fontSize: 11.5, textColor: "#3f1520", lineHeight: 1.65, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "— X —", pageNumberColor: "#8c1c3f", pageNumberSize: 8, borderStyle: "none", borderColor: "#e7b3bd", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#6b1229", align: "center", uppercase: false, rule: true, ruleColor: "#6b1229", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 16, color: "#8c1c3f", uppercase: false, rule: false, ruleColor: "#e7b3bd", letterSpacing: 0 },
      table: { headerBg: "#6b1229", headerColor: "#fdf2f4", borderColor: "#e7b3bd", striped: true, stripeColor: "#fdf2f4", headerAlign: "left" },
      code: { bg: "#fdf2f4", color: "#6b1229", borderRadius: 4, border: false, borderColor: "#e7b3bd" },
      blockquote: { borderColor: "#8c1c3f", italic: true, color: "#7a2e3d", borderWidth: 3, bg: "transparent" },
      link: { color: "#8c1c3f", underline: true },
    },
  },
  sunset: {
    name: "Sunset Warm",
    styles: {
      page: { fontFamily: "system-ui, sans-serif", fontSize: 11, textColor: "#451a03", lineHeight: 1.6, showPageNumbers: true, pageNumberAlign: "center", pageNumberFormat: "Page X of Y", pageNumberColor: "#ea580c", pageNumberSize: 8, borderStyle: "none", borderColor: "#fed7aa", borderWidth: 1, borderInset: 8 },
      title: { fontSize: 28, color: "#c2410c", align: "left", uppercase: false, rule: true, ruleColor: "#fdba74", ruleWidth: 2, letterSpacing: 0 },
      heading: { fontSize: 15, color: "#ea580c", uppercase: false, rule: false, ruleColor: "#fed7aa", letterSpacing: 0 },
      table: { headerBg: "#fff7ed", headerColor: "#c2410c", borderColor: "#fed7aa", striped: true, stripeColor: "#fffaf0", headerAlign: "left" },
      code: { bg: "#fff1e6", color: "#9a3412", borderRadius: 4, border: false, borderColor: "#fed7aa" },
      blockquote: { borderColor: "#fb923c", italic: true, color: "#7c2d12", borderWidth: 3, bg: "transparent" },
      link: { color: "#dc2626", underline: true },
    },
  },
};


export const DEFAULT_MD = `# Moovendhan V | Backend & DevOps Cloud Engineer

![Profile Photo](https://github.com/user-attachments/assets/cd49f32c-6d44-418e-b7de-f26b5b78b55c)


<div align="center">

![Profile Photo](https://skillicons.dev/icons?i=html,css,js,ts,react,nextjs,tailwind,bootstrap,nodejs,nestjs,express,py,fastapi,php,mysql,postgres,mongodb,redis,sqlite,graphql,prisma,firebase,aws,docker,kubernetes,terraform,jenkins,githubactions,git,github,linux,ubuntu,nginx,vscode,postman,bash&perline=12)

</div>



Highly motivated **Backend & DevOps Engineer** with 2+ years of experience building scalable APIs, microservices, and cloud-native AWS infrastructure in production environments. Proficient in designing resilient, secure, and cost-optimized cloud architectures.

## Professional Summary

- **Backend & API Systems**: Python/Node.js APIs, microservices, and event-driven architectures using AWS SQS/SNS and Redis caching.
- **Full-Cycle DevOps**: Docker containerization, CI/CD automation (GitHub Actions, CodePipeline), IaC (CloudFormation), and ECS Fargate deployments.
- **Cloud Architecture**: AWS Certified Solutions Architect – Associate (SAA-C03); strong foundation in designing resilient, cost-optimized, and secure cloud environments.

## Certification

**AWS Certified Solutions Architect – Associate (SAA-C03)**
*Amazon Web Services, 2025*
Validated expertise in designing resilient, secure, high-performing, and cost-optimized AWS architectures.

## Technical Skills

- **Programming Languages**: Python, JavaScript/TypeScript (ES6+), Bash Scripting
- **Backend & APIs**: FastAPI, Flask, Express.js, NestJS, RESTful APIs, GraphQL, Microservices, Event-Driven Architecture
- **Databases & Caching**: PostgreSQL, MySQL, MongoDB, Redis, Query Optimization, Database Design
- **AWS Services**: Lambda, ECS Fargate, EC2, RDS, S3, CloudFront, API Gateway, SQS, SNS, Cognito, CloudWatch, CloudFormation, Secrets Manager, VPC, ALB, ECR
- **DevOps & CI/CD**: Docker, Docker Compose, GitHub Actions, AWS CodePipeline, CodeBuild, CodeDeploy, Blue-Green Deployments
- **Security & IaC**: CloudFormation, IAM Roles & Policies, OWASP Standards, OAuth/OIDC, Secrets Management, VPC Isolation
- **Developer Tools**: Git, Jira, Pytest, Postman, Docker Hub, Technical Documentation

## Contact & Links

- **GitHub**: [github.com/moovendhan-v](https://github.com/moovendhan-v/md2Docs)
- **Website**: [cybertechmind.com](https://cybertechmind.com)

*Generated dynamically using MD → Docs.*
*md2docs.cybertechmind.com*
`;