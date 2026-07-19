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

  setMarkdown: (markdown) => set({ markdown }),
  setFileName: (fileName) => set({ fileName }),
  setPages: (pages) => set({ pages }),
  setHrPageBreak: (hrPageBreak) => set({ hrPageBreak }),
  setCanvasLayout: (canvasLayout) => set({ canvasLayout }),
  setTemplate: (templateKey) =>
    set({ templateKey, styles: clone(TEMPLATES[templateKey].styles), elementOverrides: {} }),
  updateStyle: (group, key, value) =>
    set({ styles: { ...get().styles, [group]: { ...get().styles[group], [key]: value } } }),
  resetStyles: () => set({ styles: clone(TEMPLATES[get().templateKey].styles), elementOverrides: {} }),
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
}));
