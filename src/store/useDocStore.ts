import { create } from "zustand";
import { TEMPLATES, DEFAULT_MD } from "@/lib/templates";

const clone = (o: any) => JSON.parse(JSON.stringify(o));

export interface TocOptions {
  enabled: boolean;
  title: string;
  style: "dotted" | "lines" | "plain";
  maxDepth: number;
  insertAtTop: boolean;
}

export interface DocStore {
  markdown: string;
  fileName: string;
  templateKey: string;
  styles: any;
  elementOverrides: Record<string, string>;
  pages: string[];
  dark: boolean;
  hrPageBreak: boolean;
  canvasLayout: "vertical" | "horizontal";
  tocOptions: TocOptions;
  customTemplates: Record<string, any>;

  loadCustomTemplates: () => void;
  saveCustomTemplate: (template: any) => void;
  deleteCustomTemplate: (id: string) => void;
  setMarkdown: (markdown: string) => void;
  setFileName: (fileName: string) => void;
  setPages: (pages: string[]) => void;
  setHrPageBreak: (hrPageBreak: boolean) => void;
  setCanvasLayout: (canvasLayout: "vertical" | "horizontal") => void;
  setTemplate: (templateKey: string) => void;
  updateStyle: (group: string, key: string, value: any) => void;
  resetStyles: () => void;
  setDark: (dark: boolean) => void;
  setElementOverride: (eid: string, inlineStyle: string) => void;
  clearElementOverride: (eid: string) => void;
  updateTocOption: (key: keyof TocOptions | string, value: any) => void;
}

export const useDocStore = create<DocStore>((set, get) => ({
  markdown: DEFAULT_MD,
  fileName: "document",
  templateKey: "boardroom",
  styles: clone(TEMPLATES.boardroom.styles),
  elementOverrides: {},  // { [eid]: { inlineStyle: "color:#f00;font-size:18pt;" } }
  pages: [],             // paginated HTML, kept in sync by PagedPreview
  dark: false,
  hrPageBreak: false,
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
      const stored = typeof window !== "undefined" ? localStorage.getItem("md2docs_custom_templates_v1") : null;
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
      if (typeof window !== "undefined") {
        localStorage.setItem("md2docs_custom_templates_v1", JSON.stringify(updated));
      }
      return { customTemplates: updated };
    });
  },

  deleteCustomTemplate: (id) => {
    set((state) => {
      const updated = { ...state.customTemplates };
      delete updated[id];
      if (typeof window !== "undefined") {
        localStorage.setItem("md2docs_custom_templates_v1", JSON.stringify(updated));
      }
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
    if (source) {
      set({ styles: clone(source.styles), elementOverrides: {} });
    }
  },
  setDark: (dark) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);
    }
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


