import { useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw, ChevronDown, ChevronRight, FileText, Type, Heading2,
  Table2, Code2, Quote, Link2, Layout, Hash,
} from "lucide-react";

export const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Segoe UI", value: "'Segoe UI', Verdana, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Calibri", value: "Calibri, Candara, sans-serif" },
  { label: "Garamond", value: "Garamond, 'EB Garamond', serif" },
  { label: "Century Gothic", value: "'Century Gothic', sans-serif" },
  { label: "Baskerville", value: "Baskerville, Georgia, serif" },
  { label: "Palatino", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Helvetica Neue", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Futura / Century Gothic", value: "Futura, 'Century Gothic', sans-serif" },
];

const BORDER_STYLES = ["none", "solid", "dashed", "dotted", "double"];

// ── reusable field components ─────────────────────────────────────────────────

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div
          className="h-5 w-5 rounded border border-input"
          style={{ background: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 0.5, unit = "pt", onChange }) {
  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums font-medium text-foreground/80">{value}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ToggleField({ label, checked, onChange, description }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        {description && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="py-1">
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label || o.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FontField({ label, value, onChange, includeDefault = false }) {
  return (
    <div className="py-1">
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {includeDefault && (
            <SelectItem value="default">Default (Inherit)</SelectItem>
          )}
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

// ── collapsible section ───────────────────────────────────────────────────────

function Section({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-primary/80" />}
          <span className="text-xs font-semibold text-foreground/90">{title}</span>
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-0.5 bg-background/50">
          {children}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-border/30" />;
}

// ── main component ────────────────────────────────────────────────────────────

export default function CustomizePanel() {
  const styles = useDocStore((s) => s.styles);
  const updateStyle = useDocStore((s) => s.updateStyle);
  const resetStyles = useDocStore((s) => s.resetStyles);
  const hrPageBreak = useDocStore((s) => s.hrPageBreak);
  const setHrPageBreak = useDocStore((s) => s.setHrPageBreak);
  const st = styles;

  const u = (group, key, val) => updateStyle(group, key, val);

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center justify-between gap-2 pb-2 shrink-0">
        <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-widest">Customize</p>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground" onClick={resetStyles}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5">

        {/* ── DOCUMENT ── */}
        <Section icon={FileText} title="Document" defaultOpen>
          <FontField label="Body font" value={st.page.fontFamily} onChange={(v) => u("page", "fontFamily", v)} />
          <SliderField label="Body size" value={st.page.fontSize} min={8} max={16} onChange={(v) => u("page", "fontSize", v)} />
          <SliderField label="Line height" value={st.page.lineHeight} min={1} max={2.5} step={0.05} unit="×" onChange={(v) => u("page", "lineHeight", v)} />
          <ColorField label="Text color" value={st.page.textColor} onChange={(v) => u("page", "textColor", v)} />
          <ColorField label="Page background" value={st.page.bg || "#ffffff"} onChange={(v) => u("page", "bg", v)} />

          <Divider />

          <SelectField
            label="Page margins"
            value={st.page.margin || "normal"}
            options={[
              { label: "Normal (~2cm)", value: "normal" },
              { label: "Narrow (~1cm)", value: "narrow" },
              { label: "Wide (~3cm)", value: "wide" },
            ]}
            onChange={(v) => u("page", "margin", v)}
          />

          <Divider />

          <ToggleField label="--- as page break" checked={hrPageBreak} onChange={setHrPageBreak} />
        </Section>

        {/* ── PAGE BORDER ── */}
        <Section icon={Layout} title="Page Border">
          <SelectField
            label="Border style"
            value={st.page.borderStyle || "none"}
            options={BORDER_STYLES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
            onChange={(v) => u("page", "borderStyle", v)}
          />
          {(st.page.borderStyle && st.page.borderStyle !== "none") && (
            <>
              <ColorField label="Border color" value={st.page.borderColor || "#cccccc"} onChange={(v) => u("page", "borderColor", v)} />
              <SliderField label="Border width" value={st.page.borderWidth || 1} min={1} max={10} step={1} unit="px" onChange={(v) => u("page", "borderWidth", v)} />
              <SliderField label="Border inset" value={st.page.borderInset || 8} min={2} max={40} step={1} unit="px" onChange={(v) => u("page", "borderInset", v)} />
            </>
          )}
        </Section>

        {/* ── PAGE NUMBERS ── */}
        <Section icon={Hash} title="Page Numbers">
          <ToggleField
            label="Show page numbers"
            checked={st.page.showPageNumbers !== false}
            onChange={(v) => u("page", "showPageNumbers", v)}
          />
          {st.page.showPageNumbers !== false && (
            <>
              <SelectField
                label="Position"
                value={st.page.pageNumberAlign || "center"}
                options={[
                  { label: "Left", value: "left" },
                  { label: "Center", value: "center" },
                  { label: "Right", value: "right" },
                ]}
                onChange={(v) => u("page", "pageNumberAlign", v)}
              />
              <SelectField
                label="Format"
                value={st.page.pageNumberFormat || "Page X of Y"}
                options={[
                  { label: "Page X of Y", value: "Page X of Y" },
                  { label: "X / Y", value: "X / Y" },
                  { label: "X", value: "X" },
                  { label: "— X —", value: "— X —" },
                ]}
                onChange={(v) => u("page", "pageNumberFormat", v)}
              />
              <ColorField label="Number color" value={st.page.pageNumberColor || "#888888"} onChange={(v) => u("page", "pageNumberColor", v)} />
              <SliderField label="Number size" value={st.page.pageNumberSize || 8} min={6} max={14} step={0.5} onChange={(v) => u("page", "pageNumberSize", v)} />
            </>
          )}
        </Section>

        {/* ── TITLE ── */}
        <Section icon={Type} title="Title (H1)">
          <FontField label="Font override" value={st.title.fontFamily || "default"} onChange={(v) => u("title", "fontFamily", v)} includeDefault />
          <SliderField label="Size" value={st.title.fontSize} min={16} max={44} onChange={(v) => u("title", "fontSize", v)} />
          <ColorField label="Color" value={st.title.color} onChange={(v) => u("title", "color", v)} />
          <SelectField
            label="Alignment"
            value={st.title.align}
            options={[{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }]}
            onChange={(v) => u("title", "align", v)}
          />
          <SliderField label="Letter spacing" value={st.title.letterSpacing || 0} min={-1} max={8} step={0.5} unit="px" onChange={(v) => u("title", "letterSpacing", v)} />
          <Divider />
          <ToggleField label="Uppercase" checked={st.title.uppercase} onChange={(v) => u("title", "uppercase", v)} />
          <ToggleField label="Underline rule" checked={st.title.rule} onChange={(v) => u("title", "rule", v)} />
          {st.title.rule && (
            <>
              <ColorField label="Rule color" value={st.title.ruleColor} onChange={(v) => u("title", "ruleColor", v)} />
              <SliderField label="Rule thickness" value={st.title.ruleWidth || 2} min={1} max={8} step={1} unit="px" onChange={(v) => u("title", "ruleWidth", v)} />
            </>
          )}
        </Section>

        {/* ── HEADINGS ── */}
        <Section icon={Heading2} title="Headings (H2–H6)">
          <FontField label="Font override" value={st.heading.fontFamily || "default"} onChange={(v) => u("heading", "fontFamily", v)} includeDefault />
          <SliderField label="Size (H2)" value={st.heading.fontSize} min={11} max={26} onChange={(v) => u("heading", "fontSize", v)} />
          <ColorField label="Color" value={st.heading.color} onChange={(v) => u("heading", "color", v)} />
          <SliderField label="Letter spacing" value={st.heading.letterSpacing || 0} min={-1} max={6} step={0.5} unit="px" onChange={(v) => u("heading", "letterSpacing", v)} />
          <Divider />
          <ToggleField label="Uppercase" checked={st.heading.uppercase} onChange={(v) => u("heading", "uppercase", v)} />
          <ToggleField label="Bottom border" checked={!!st.heading.rule} onChange={(v) => u("heading", "rule", v)} />
          {st.heading.rule && (
            <ColorField label="Border color" value={st.heading.ruleColor || st.heading.color} onChange={(v) => u("heading", "ruleColor", v)} />
          )}
        </Section>

        {/* ── TABLES ── */}
        <Section icon={Table2} title="Tables">
          <ColorField label="Header background" value={st.table.headerBg} onChange={(v) => u("table", "headerBg", v)} />
          <ColorField label="Header text" value={st.table.headerColor} onChange={(v) => u("table", "headerColor", v)} />
          <ColorField label="Border color" value={st.table.borderColor} onChange={(v) => u("table", "borderColor", v)} />
          <Divider />
          <ToggleField label="Striped rows" checked={st.table.striped} onChange={(v) => u("table", "striped", v)} />
          {st.table.striped && (
            <ColorField label="Stripe color" value={st.table.stripeColor} onChange={(v) => u("table", "stripeColor", v)} />
          )}
          <Divider />
          <SelectField
            label="Header alignment"
            value={st.table.headerAlign || "left"}
            options={[{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }]}
            onChange={(v) => u("table", "headerAlign", v)}
          />
        </Section>

        {/* ── CODE ── */}
        <Section icon={Code2} title="Code Blocks">
          <ColorField label="Background" value={st.code.bg} onChange={(v) => u("code", "bg", v)} />
          <ColorField label="Text color" value={st.code.color} onChange={(v) => u("code", "color", v)} />
          <SliderField label="Border radius" value={st.code.borderRadius || 4} min={0} max={16} step={1} unit="px" onChange={(v) => u("code", "borderRadius", v)} />
          <ToggleField label="Show border" checked={!!st.code.border} onChange={(v) => u("code", "border", v)} />
          {st.code.border && (
            <ColorField label="Border color" value={st.code.borderColor || "#e5e7eb"} onChange={(v) => u("code", "borderColor", v)} />
          )}
        </Section>

        {/* ── BLOCKQUOTE ── */}
        <Section icon={Quote} title="Blockquotes">
          <ColorField label="Left border" value={st.blockquote.borderColor} onChange={(v) => u("blockquote", "borderColor", v)} />
          <SliderField label="Border width" value={st.blockquote.borderWidth || 3} min={1} max={10} step={1} unit="px" onChange={(v) => u("blockquote", "borderWidth", v)} />
          <ColorField label="Background" value={st.blockquote.bg || "transparent"} onChange={(v) => u("blockquote", "bg", v)} />
          <ColorField label="Text color" value={st.blockquote.color} onChange={(v) => u("blockquote", "color", v)} />
          <Divider />
          <ToggleField label="Italic text" checked={st.blockquote.italic} onChange={(v) => u("blockquote", "italic", v)} />
        </Section>

        {/* ── LINKS ── */}
        <Section icon={Link2} title="Links">
          <ColorField label="Color" value={st.link.color} onChange={(v) => u("link", "color", v)} />
          <ToggleField label="Underline" checked={st.link.underline !== false} onChange={(v) => u("link", "underline", v)} />
        </Section>

      </div>
    </div>
  );
}
