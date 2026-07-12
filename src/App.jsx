import { useEffect, useMemo, useRef, useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { TEMPLATES } from "@/lib/templates";
import { parseMarkdown } from "@/lib/parser";
import { blocksToHtml } from "@/lib/renderHtml";
import { exportDocx } from "@/lib/exportDocx";
import PagedPreview from "@/components/PagedPreview";
import StylesDrawer from "@/components/StylesDrawer";
import PdfDialog from "@/components/PdfDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Upload, Download, FileType2, Paintbrush, Type, Sun, Moon, FileUp,
} from "lucide-react";

export default function App() {
  const markdown = useDocStore((s) => s.markdown);
  const setMarkdown = useDocStore((s) => s.setMarkdown);
  const fileName = useDocStore((s) => s.fileName);
  const setFileName = useDocStore((s) => s.setFileName);
  const templateKey = useDocStore((s) => s.templateKey);
  const setTemplate = useDocStore((s) => s.setTemplate);
  const styles = useDocStore((s) => s.styles);
  const dark = useDocStore((s) => s.dark);
  const setDark = useDocStore((s) => s.setDark);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const dragDepth = useRef(0);

  // follow system preference on first load
  useEffect(() => {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setDark(true);
  }, [setDark]);

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const html = useMemo(() => blocksToHtml(blocks, styles), [blocks, styles]);

  const loadFile = (file) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) return;
    setFileName(file.name.replace(/\.(md|markdown|txt)$/i, ""));
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result));
    reader.readAsText(file);
  };

  const onUpload = (e) => {
    loadFile(e.target.files?.[0]);
    e.target.value = "";
  };

  // window-level drag & drop for .md files
  const onDragEnter = (e) => { e.preventDefault(); dragDepth.current++; setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); } };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      className="relative flex h-screen flex-col bg-background text-foreground transition-colors"
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >
      {/* drop overlay */}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-primary/10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background px-10 py-8 shadow-xl">
            <FileUp className="h-8 w-8 text-primary" />
            <div className="text-sm font-medium">Drop your .md file to load it</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">MD → Docs</span>
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        <Select value={templateKey} onValueChange={setTemplate}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <Type className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <SelectItem key={k} value={k}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="h-8 w-40 rounded-md border border-input bg-secondary/50 px-2 text-xs outline-none focus:border-primary"
          aria-label="File name"
        />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setDrawerOpen(true)}>
            <Paintbrush className="h-3.5 w-3.5" /> Design
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload .md
          </Button>
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={onUpload} />
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setPdfOpen(true)}>
            <FileType2 className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => exportDocx(blocks, styles, fileName)}>
            <Download className="h-3.5 w-3.5" /> Word (.docx)
          </Button>
        </div>
      </header>

      {/* Workspace: editor + paged preview */}
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[34%] min-w-[280px] flex-col border-r bg-background">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Markdown</span>
            <span className="text-[11px] text-muted-foreground">or drag & drop a .md file anywhere</span>
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none rounded-none border-0 bg-background p-4 font-mono text-[13px] leading-relaxed focus-visible:ring-0"
            placeholder="# Paste your markdown here…"
          />
        </div>

        <PagedPreview html={html} />
      </div>

      <StylesDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <PdfDialog open={pdfOpen} onOpenChange={setPdfOpen} />
    </div>
  );
}
