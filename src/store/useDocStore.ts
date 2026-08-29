import { create } from "zustand";
import { TEMPLATES, DEFAULT_MD } from "@/lib/templates";

const clone = (o) => JSON.parse(JSON.stringify(o));

export const useDocStore = create((set, get) => ({
  markdown: DEFAULT_MD,
  fileName: "document",
  templateKey: "boardroom",
  styles: clone(TEMPLATES.boardroom.styles),
  elementOverrides: {},  // { [eid]: { inlineStyle: "color:#f00;font-size:18pt;" } }
  pages: [],             // paginated HTML, kept in sync by PagedPreview
  dark: false,
  hrPageBreak: true,
  canvasLayout: "vertical",  // "vertical" | "horizontal"

  // Table of Contents options
  tocOptions: {
    enabled: false,       // show TOC (also triggered by [TOC] marker)
    title: "Table of Contents",
    style: "dotted",      // "dotted" | "lines" | "plain"
    maxDepth: 3,          // 1 | 2 | 3
    insertAtTop: false,   // auto-prepend TOC before first heading
  },

  customTemplates: {}, // { [id]: TemplateConfig }

  loadCustomTemplates: () => {
    try {
      const stored = localStorage.getItem("md2docs_custom_templates_v1");
      if (stored) {
        set({ customTemplates: JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to load custom templates", e);
    }
  },

  saveCustomTemplate: (template) => {
    set((state) => {
      const updated = { ...state.customTemplates, [template.id]: template };
      localStorage.setItem("md2docs_custom_templates_v1", JSON.stringify(updated));
      return { customTemplates: updated };
    });
  },

  deleteCustomTemplate: (id) => {
    set((state) => {
      const updated = { ...state.customTemplates };
      delete updated[id];
      localStorage.setItem("md2docs_custom_templates_v1", JSON.stringify(updated));
      return { customTemplates: updated };
    });
  },

  setMarkdown: (markdown) => set({ markdown }),
  setFileName: (fileName) => set({ fileName }),
  setPages: (pages) => set({ pages }),
  setHrPageBreak: (hrPageBreak) => set({ hrPageBreak }),
  setCanvasLayout: (canvasLayout) => set({ canvasLayout }),
  setTemplate: (templateKey) => {
    const state = get();
    const source = state.customTemplates[templateKey] || TEMPLATES[templateKey];
    if (source) {
      set({ templateKey, styles: clone(source.styles), elementOverrides: {} });
    }
  },
  updateStyle: (group, key, value) =>
    set({ styles: { ...get().styles, [group]: { ...get().styles[group], [key]: value } } }),
  resetStyles: () => {
    const state = get();
    const source = state.customTemplates[state.templateKey] || TEMPLATES[state.templateKey];
    set({ styles: clone(source.styles), elementOverrides: {} });
  },
  setDark: (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    set({ dark });
  },

  /* Per-element inline style override (CSS string fragment) */
  setElementOverride: (eid, inlineStyle) =>
    set((state) => ({
      elementOverrides: { ...state.elementOverrides, [eid]: inlineStyle },
    })),
  clearElementOverride: (eid) =>
    set((state) => {
      const next = { ...state.elementOverrides };
      delete next[eid];
      return { elementOverrides: next };
    }),

  updateTocOption: (key, value) =>
    set((state) => ({
      tocOptions: { ...state.tocOptions, [key]: value },
    })),
}));

// Initialize custom templates from localStorage on load
if (typeof window !== "undefined") {
  useDocStore.getState().loadCustomTemplates();
}

