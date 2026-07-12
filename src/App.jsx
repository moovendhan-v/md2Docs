import { useEffect, useMemo, useRef, useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { TEMPLATES } from "@/lib/templates";
import { parseMarkdown } from "@/lib/parser";
import { blocksToHtml } from "@/lib/renderHtml";
import { exportDocx } from "@/lib/exportDocx";
import PagedPreview from "@/components/PagedPreview";
import PdfDialog from "@/components/PdfDialog";
import TemplatesDialog from "@/components/TemplatesDialog";
import TemplateGallery from "@/components/TemplateGallery";
import CustomizePanel from "@/components/CustomizePanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Upload, Download, FileType2, Paintbrush, Type, Sun, Moon, FileUp,
  Bold, Italic, Code, Link2, Table2, Quote, Split, Info, Undo, Redo, LayoutGrid,
  X, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
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

  const [pdfOpen, setPdfOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const dragDepth = useRef(0);

  // Custom Undo/Redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef([markdown]);
  const historyIndexRef = useRef(0);
  const isUndoRedoAction = useRef(false);
  const typingTimer = useRef(null);

  // follow system preference on first load
  useEffect(() => {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setDark(true);
  }, [setDark]);

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const html = useMemo(() => blocksToHtml(blocks, styles), [blocks, styles]);

  const stats = useMemo(() => {
    const cleanMd = markdown.trim();
    const words = cleanMd === "" ? 0 : cleanMd.split(/\s+/).length;
    const chars = markdown.length;
    const minRead = Math.max(1, Math.ceil(words / 200));
    return { words, chars, minRead };
  }, [markdown]);

  // Push to undo/redo history
  const pushHistory = (newVal) => {
    const index = historyIndexRef.current;
    const stack = historyRef.current.slice(0, index + 1);
    if (stack[stack.length - 1] !== newVal) {
      stack.push(newVal);
      if (stack.length > 50) stack.shift();
      historyRef.current = stack;
      historyIndexRef.current = stack.length - 1;
      setCanUndo(true);
      setCanRedo(false);
    }
  };

  const handleUndo = () => {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      isUndoRedoAction.current = true;
      const nextIdx = idx - 1;
      historyIndexRef.current = nextIdx;
      setMarkdown(historyRef.current[nextIdx]);
      setCanUndo(nextIdx > 0);
      setCanRedo(true);
      setTimeout(() => { document.getElementById("md-textarea")?.focus(); }, 30);
    }
  };

  const handleRedo = () => {
    const idx = historyIndexRef.current;
    const stack = historyRef.current;
    if (idx < stack.length - 1) {
      isUndoRedoAction.current = true;
      const nextIdx = idx + 1;
      historyIndexRef.current = nextIdx;
      setMarkdown(stack[nextIdx]);
      setCanUndo(true);
      setCanRedo(nextIdx < stack.length - 1);
      setTimeout(() => { document.getElementById("md-textarea")?.focus(); }, 30);
    }
  };

  const handleKeyDown = (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) handleRedo(); else handleUndo();
    } else if (isMod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      handleRedo();
    }
  };

  useEffect(() => {
    if (isUndoRedoAction.current) { isUndoRedoAction.current = false; return; }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { pushHistory(markdown); }, 600);
  }, [markdown]);

  const loadFile = (file) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) return;
    setFileName(file.name.replace(/\.(md|markdown|txt)$/i, ""));
    const reader = new FileReader();
    reader.onload = () => {
      const textVal = String(reader.result);
      setMarkdown(textVal);
      pushHistory(textVal);
    };
    reader.readAsText(file);
  };

  const onUpload = (e) => { loadFile(e.target.files?.[0]); e.target.value = ""; };

  const onDragEnter = (e) => { e.preventDefault(); dragDepth.current++; setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); } };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => { e.preventDefault(); dragDepth.current = 0; setDragging(false); loadFile(e.dataTransfer.files?.[0]); };

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById("md-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);
    let replacement = "";
    if (syntax === "bold") replacement = `**${selected || "bold text"}**`;
    else if (syntax === "italic") replacement = `*${selected || "italic text"}*`;
    else if (syntax === "code") replacement = `\`${selected || "code"}\``;
    else if (syntax === "codeblock") replacement = `\n\`\`\`javascript\n${selected || "// code here"}\n\`\`\`\n`;
    else if (syntax === "link") replacement = `[${selected || "link text"}](https://example.com)`;
    else if (syntax === "table") replacement = `\n| Metric | Value |\n|---|---|\n| Item 1 | 100 |\n| Item 2 | 200 |\n`;
    else if (syntax === "quote") replacement = `\n> ${selected || "quote"}\n`;
    else if (syntax === "hr") replacement = `\n---\n`;
    const newText = before + replacement + after;
    setMarkdown(newText);
    pushHistory(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const handleTemplateSelectChange = (val) => {
    if (val === "_gallery") setTemplatesOpen(true);
    else setTemplate(val);
  };

  return (
    <div
      className="relative flex h-screen flex-col bg-background text-foreground transition-colors overflow-hidden"
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >
      {/* Drop overlay */}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-primary/10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background px-10 py-8 shadow-xl">
            <FileUp className="h-8 w-8 text-primary" />
            <div className="text-sm font-medium">Drop your .md file to load it</div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b bg-background/80 px-4 py-2.5 backdrop-blur-md shrink-0">
        {/* Logo */}
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:bg-secondary/60 p-1.5 rounded-lg transition-colors select-none group"
          onClick={() => setTemplatesOpen(true)}
          title="Browse visual templates library"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">MD → Docs</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
            Templates
          </span>
        </div>

        <div className="mx-1.5 h-5 w-px bg-border" />

        {/* Template & Filename */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary/40 p-1 ring-1 ring-border">
          <Select value={templateKey} onValueChange={handleTemplateSelectChange}>
            <SelectTrigger className="h-7 w-36 border-0 bg-transparent text-xs hover:bg-secondary/60 focus:ring-0 focus:ring-offset-0">
              <Type className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_gallery" className="font-semibold text-primary focus:text-primary">
                <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Visual Gallery...</span>
              </SelectItem>
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <SelectItem key={k} value={k}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-border" />

          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="h-7 w-36 border-0 bg-transparent px-2 text-xs outline-none focus:ring-0 placeholder:text-muted-foreground"
            placeholder="document"
            aria-label="File name"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Left panel toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-secondary"
            onClick={() => setLeftOpen((v) => !v)}
            title={leftOpen ? "Hide editor" : "Show editor"}
            aria-label="Toggle editor panel"
          >
            {leftOpen
              ? <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          {/* Right panel toggle */}
          <Button
            variant={rightOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs border-dashed hover:border-primary/50"
            onClick={() => setRightOpen((v) => !v)}
            aria-label="Toggle design panel"
          >
            <Paintbrush className="h-3.5 w-3.5 text-primary" /> Design
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={onUpload} />

          <div className="h-5 w-px bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs hover:text-red-500 hover:border-red-200" onClick={() => setPdfOpen(true)}>
            <FileType2 className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-primary shadow-sm hover:shadow transition-all" onClick={() => exportDocx(blocks, styles, fileName)}>
            <Download className="h-3.5 w-3.5" /> Word (.docx)
          </Button>
        </div>
      </header>

      {/* ── 3-column workspace ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT SIDEBAR — Editor */}
        <div
          className="flex flex-col border-r bg-background overflow-hidden transition-all duration-300 shrink-0"
          style={{ width: leftOpen ? "340px" : "0px" }}
        >
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/10 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Markdown Source</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded hover:bg-secondary" onClick={() => setLeftOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Editor Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/20 px-2 py-1 select-none shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80 disabled:opacity-30" onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80 disabled:opacity-30" onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              <Redo className="h-3.5 w-3.5" />
            </Button>
            <div className="h-4 w-px bg-border mx-1.5" />
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("code")} title="Inline code"><Code className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("codeblock")} title="Code block"><span className="text-[10px] font-extrabold font-mono">{"{}"}</span></Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("link")} title="Link"><Link2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("table")} title="Table"><Table2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80" onClick={() => insertMarkdown("quote")} title="Blockquote"><Quote className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-secondary/80 text-primary" onClick={() => insertMarkdown("hr")} title="Page break"><Split className="h-3.5 w-3.5" /></Button>
          </div>

          {/* Textarea */}
          <Textarea
            id="md-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="flex-1 resize-none rounded-none border-0 bg-background p-4 font-mono text-[13px] leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="# Paste your markdown here…"
          />

          {/* Stats footer */}
          <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground/80 font-medium select-none shrink-0">
            <span className="flex items-center gap-1"><Info className="h-3 w-3 text-muted-foreground" />{stats.minRead} min read</span>
            <div className="flex gap-3"><span>{stats.words} words</span><span>{stats.chars} chars</span></div>
          </div>
        </div>

        {/* MIDDLE — Document Preview (always fills remaining space) */}
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
          <PagedPreview html={html} />
        </div>

        {/* RIGHT SIDEBAR — Design Panel */}
        <div
          className="flex flex-col border-l bg-background overflow-hidden transition-all duration-300 shrink-0"
          style={{ width: rightOpen ? "300px" : "0px" }}
        >
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/10 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Design Options</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded hover:bg-secondary" onClick={() => setRightOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Tabs defaultValue="templates" className="flex min-h-0 flex-1 flex-col px-4 pt-3 overflow-hidden">
            <TabsList className="w-full h-8 shrink-0">
              <TabsTrigger value="templates" className="flex-1 text-xs py-1">Templates</TabsTrigger>
              <TabsTrigger value="styles" className="flex-1 text-xs py-1">Styles</TabsTrigger>
            </TabsList>
            <TabsContent value="templates" className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
              <TemplateGallery />
            </TabsContent>
            <TabsContent value="styles" className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
              <CustomizePanel />
            </TabsContent>
          </Tabs>
        </div>

      </div>

      <PdfDialog open={pdfOpen} onOpenChange={setPdfOpen} />
      <TemplatesDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />
    </div>
  );
}
