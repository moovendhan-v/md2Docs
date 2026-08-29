import { useMemo } from "react";
import { useDocStore } from "@/store/useDocStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Type, Heading2, FileText, Table2, Code2, Quote, Link2,
  Image as ImageIcon, List, MousePointer2, RotateCcw,
} from "lucide-react";
import { FONT_OPTIONS } from "@/components/CustomizePanel";

// ── type metadata ─────────────────────────────────────────────────────────────

const TYPE_META = {
  title:      { label: "Title (H1)",       icon: Type,          color: "#6366f1" },
  heading:    { label: "Heading",           icon: Heading2,      color: "#0284c7" },
  paragraph:  { label: "Paragraph / Body", icon: FileText,      color: "#64748b" },
  list:       { label: "List",             icon: List,          color: "#64748b" },
  table:      { label: "Table",            icon: Table2,        color: "#059669" },
  code:       { label: "Code Block",       icon: Code2,         color: "#7c3aed" },
  blockquote: { label: "Blockquote",       icon: Quote,         color: "#d97706" },
  link:       { label: "Link",             icon: Link2,         color: "#0ea5e9" },
  image:      { label: "Image / Badge",    icon: ImageIcon,     color: "#94a3b8" },
  toc:        { label: "Table of Contents", icon: List,          color: "#8b5cf6" },
  hr:         { label: "Divider",          icon: MousePointer2, color: "#94a3b8" },
  page:       { label: "Page / Document",  icon: FileText,      color: "#94a3b8" },
};


// ── CSS fragment helpers ──────────────────────────────────────────────────────
// We store per-element overrides as CSS strings, e.g. "color:#f00;font-size:16pt;"

function parseCss(css = "") {
  const result = {};
  css.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) result[k] = v;
  });
  return result;
}

function buildCss(map) {
  return Object.entries(map)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

// ── reusable mini-field atoms ─────────────────────────────────────────────────

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 rounded border border-input" style={{ background: value }} />
        <input
          type="color"
          value={value.startsWith("#") ? value : "#888888"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 0.5, unit = "pt", onChange }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="py-1.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums font-semibold text-foreground/80">{num}{unit}</span>
      </div>
      <Slider value={[num]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FontField({ label, value, onChange }) {
  return (
    <div className="py-1.5">
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value || FONT_OPTIONS[0].value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span style={{ fontFamily: f.value }}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Divider() { return <div className="my-2 border-t border-border/30" />; }

// ── per-type override panels ──────────────────────────────────────────────────
// Each panel reads from / writes to a CSS properties map (specific to this element)

function TitleOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        These settings apply <strong>only to this title block</strong>, overriding the global theme.
      </p>
      <FontField label="Font family"
        value={get("font-family", globalSt.title.fontFamily || globalSt.page.fontFamily)}
        onChange={(v) => setCss((c) => ({ ...c, "font-family": v }))} />
      <SliderField label="Font size"
        value={parseFloat(get("font-size", `${globalSt.title.fontSize}pt`))}
        min={14} max={48}
        onChange={(v) => setCss((c) => ({ ...c, "font-size": `${v}pt` }))} />
      <ColorField label="Color"
        value={get("color", globalSt.title.color)}
        onChange={(v) => setCss((c) => ({ ...c, color: v }))} />
      <SliderField label="Letter spacing"
        value={parseFloat(get("letter-spacing", "0px")) || 0}
        min={-2} max={10} unit="px"
        onChange={(v) => setCss((c) => ({ ...c, "letter-spacing": `${v}px` }))} />
      <Divider />
      <ToggleField label="Uppercase"
        checked={get("text-transform", "") === "uppercase"}
        onChange={(v) => setCss((c) => ({ ...c, "text-transform": v ? "uppercase" : "none" }))} />
    </>
  );
}

function HeadingOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        These settings apply <strong>only to this heading</strong>, not all headings.
      </p>
      <FontField label="Font family"
        value={get("font-family", globalSt.heading.fontFamily || globalSt.page.fontFamily)}
        onChange={(v) => setCss((c) => ({ ...c, "font-family": v }))} />
      <SliderField label="Font size"
        value={parseFloat(get("font-size", `${globalSt.heading.fontSize}pt`))}
        min={10} max={32}
        onChange={(v) => setCss((c) => ({ ...c, "font-size": `${v}pt` }))} />
      <ColorField label="Color"
        value={get("color", globalSt.heading.color)}
        onChange={(v) => setCss((c) => ({ ...c, color: v }))} />
      <SliderField label="Letter spacing"
        value={parseFloat(get("letter-spacing", "0px")) || 0}
        min={-2} max={8} unit="px"
        onChange={(v) => setCss((c) => ({ ...c, "letter-spacing": `${v}px` }))} />
      <Divider />
      <ToggleField label="Uppercase"
        checked={get("text-transform", "") === "uppercase"}
        onChange={(v) => setCss((c) => ({ ...c, "text-transform": v ? "uppercase" : "none" }))} />
    </>
  );
}

function ParagraphOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        Override styles for <strong>this paragraph</strong> only.
      </p>
      <FontField label="Font family"
        value={get("font-family", globalSt.page.fontFamily)}
        onChange={(v) => setCss((c) => ({ ...c, "font-family": v }))} />
      <SliderField label="Font size"
        value={parseFloat(get("font-size", `${globalSt.page.fontSize}pt`))}
        min={6} max={20}
        onChange={(v) => setCss((c) => ({ ...c, "font-size": `${v}pt` }))} />
      <ColorField label="Text color"
        value={get("color", globalSt.page.textColor)}
        onChange={(v) => setCss((c) => ({ ...c, color: v }))} />
      <SliderField label="Line height"
        value={parseFloat(get("line-height", `${globalSt.page.lineHeight}`))}
        min={1} max={3} step={0.05} unit="×"
        onChange={(v) => setCss((c) => ({ ...c, "line-height": `${v}` }))} />
    </>
  );
}

function CodeOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        Override styles for <strong>this code block</strong> only.
      </p>
      <ColorField label="Background"
        value={get("background", globalSt.code.bg)}
        onChange={(v) => setCss((c) => ({ ...c, background: v }))} />
      <ColorField label="Text color"
        value={get("color", globalSt.code.color)}
        onChange={(v) => setCss((c) => ({ ...c, color: v }))} />
      <SliderField label="Border radius"
        value={parseFloat(get("border-radius", `${globalSt.code.borderRadius || 4}px`))}
        min={0} max={16} step={1} unit="px"
        onChange={(v) => setCss((c) => ({ ...c, "border-radius": `${v}px` }))} />
    </>
  );
}

function BlockquoteOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  // parse border-left: 3px solid #color
  const bLeft = get("border-left", `${globalSt.blockquote.borderWidth || 3}px solid ${globalSt.blockquote.borderColor}`);
  const bWidth = parseFloat(bLeft) || 3;
  const bColor = bLeft.match(/#[0-9a-fA-F]{3,6}/)?.[0] || globalSt.blockquote.borderColor;

  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        Override styles for <strong>this blockquote</strong> only.
      </p>
      <ColorField label="Border color"
        value={bColor}
        onChange={(v) => setCss((c) => ({ ...c, "border-left": `${bWidth}px solid ${v}` }))} />
      <SliderField label="Border width"
        value={bWidth} min={1} max={10} step={1} unit="px"
        onChange={(v) => setCss((c) => ({ ...c, "border-left": `${v}px solid ${bColor}` }))} />
      <ColorField label="Text color"
        value={get("color", globalSt.blockquote.color)}
        onChange={(v) => setCss((c) => ({ ...c, color: v }))} />
      <ColorField label="Background"
        value={get("background", globalSt.blockquote.bg || "transparent")}
        onChange={(v) => setCss((c) => ({ ...c, background: v }))} />
      <Divider />
      <ToggleField label="Italic"
        checked={get("font-style", globalSt.blockquote.italic ? "italic" : "normal") === "italic"}
        onChange={(v) => setCss((c) => ({ ...c, "font-style": v ? "italic" : "normal" }))} />
    </>
  );
}

function TableOverride({ css, setCss, globalSt }) {
  const get = (p, fallback) => css[p] || fallback;
  return (
    <>
      <p className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed">
        Override the <strong>table wrapper</strong> style only (headers/cells keep global styles).
      </p>
      <ColorField label="Background"
        value={get("background", "transparent")}
        onChange={(v) => setCss((c) => ({ ...c, background: v }))} />
      <SliderField label="Border radius"
        value={parseFloat(get("border-radius", "0px")) || 0}
        min={0} max={12} step={1} unit="px"
        onChange={(v) => setCss((c) => ({ ...c, "border-radius": `${v}px` }))} />
      <SliderField label="Top margin"
        value={parseFloat(get("margin-top", "10pt")) || 10}
        min={0} max={40} unit="pt"
        onChange={(v) => setCss((c) => ({ ...c, "margin-top": `${v}pt` }))} />
    </>
  );
}

function ImageInfo() {
  return (
    <p className="text-xs text-muted-foreground/80 py-2 leading-relaxed">
      Image and badge styles are defined in the markdown source. Edit the
      <code className="mx-1 rounded bg-muted px-1 text-[10px]">![alt](url)</code>
      syntax to change the source URL.
    </p>
  );
}

function TocInfo() {
  return (
    <p className="text-xs text-muted-foreground/80 py-2 leading-relaxed">
      The Table of Contents appearance is controlled globally. Please use the
      <strong> Table of Contents </strong> section in the <strong>Design Options (Styles)</strong> panel to customize its look, depth, and leader style.
    </p>
  );
}

// ── main inspector component ──────────────────────────────────────────────────

export default function ElementInspector({ open, onOpenChange, elementType, eid }) {
  const styles = useDocStore((s) => s.styles);
  const elementOverrides = useDocStore((s) => s.elementOverrides);
  const setElementOverride = useDocStore((s) => s.setElementOverride);
  const clearElementOverride = useDocStore((s) => s.clearElementOverride);

  const meta = TYPE_META[elementType] || TYPE_META.page;
  const Icon = meta.icon;
  const hasEid = eid !== null && eid !== undefined;

  // Current override CSS string → parse into a map we can manipulate
  const currentOverrideCss = hasEid ? (elementOverrides[eid] || "") : "";
  const cssMap = useMemo(() => parseCss(currentOverrideCss), [currentOverrideCss]);

  // Write back to store whenever the cssMap changes
  const setCssField = (updater) => {
    if (!hasEid) return;
    const next = updater(cssMap);
    const cssStr = buildCss(next);
    if (cssStr) {
      setElementOverride(eid, cssStr);
    } else {
      clearElementOverride(eid);
    }
  };

  const handleClearOverride = () => {
    if (hasEid) clearElementOverride(eid);
  };

  const hasOverride = hasEid && !!elementOverrides[eid];

  const renderControls = () => {
    if (!hasEid) {
      return (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Click any element in the preview to start customizing it.
        </p>
      );
    }
    switch (elementType) {
      case "title":      return <TitleOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
      case "heading":    return <HeadingOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
      case "code":       return <CodeOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
      case "blockquote": return <BlockquoteOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
      case "table":      return <TableOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
      case "image":      return <ImageInfo />;
      case "toc":        return <TocInfo />;
      case "paragraph":
      case "list":
      default:           return <ParagraphOverride css={cssMap} setCss={setCssField} globalSt={styles} />;
    }

  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-[300px] sm:max-w-[300px]"
      >
        {/* Coloured header */}
        <SheetHeader
          className="px-4 pt-5 pb-4 border-b"
          style={{ borderBottom: `3px solid ${meta.color}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: meta.color + "22" }}
              >
                <Icon className="h-4 w-4" style={{ color: meta.color }} />
              </div>
              <div>
                <SheetTitle className="text-sm leading-none">{meta.label}</SheetTitle>
                <SheetDescription className="mt-0.5 text-[11px]">
                  {hasEid ? `Element #${eid}` : "No element selected"}
                </SheetDescription>
              </div>
            </div>

            {/* Reset this element's override */}
            {hasOverride && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={handleClearOverride}
                title="Remove all overrides for this element"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {hasOverride && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-primary/8 px-2 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] text-primary font-medium">
                This element has custom styles
              </span>
            </div>
          )}
        </SheetHeader>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {renderControls()}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-4 py-2.5 text-[10px] text-muted-foreground/60 leading-relaxed">
          Changes affect <strong>only this element</strong>. Use the Design panel to change all {meta.label} elements at once.
        </div>
      </SheetContent>
    </Sheet>
  );
}
