import { create } from "zustand";
import { TEMPLATES, DEFAULT_MD } from "@/lib/templates";

const clone = (o) => JSON.parse(JSON.stringify(o));

export const useDocStore = create((set, get) => ({
  markdown: DEFAULT_MD,
  fileName: "document",
  templateKey: "boardroom",
  styles: clone(TEMPLATES.boardroom.styles),
  pages: [],        // paginated HTML, kept in sync by PagedPreview
  dark: false,
  hrPageBreak: true,

  setMarkdown: (markdown) => set({ markdown }),
  setFileName: (fileName) => set({ fileName }),
  setPages: (pages) => set({ pages }),
  setHrPageBreak: (hrPageBreak) => set({ hrPageBreak }),
  setTemplate: (templateKey) =>
    set({ templateKey, styles: clone(TEMPLATES[templateKey].styles) }),
  updateStyle: (group, key, value) =>
    set({ styles: { ...get().styles, [group]: { ...get().styles[group], [key]: value } } }),
  resetStyles: () => set({ styles: clone(TEMPLATES[get().templateKey].styles) }),
  setDark: (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    set({ dark });
  },
}));
