import { useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export const FONT_OPTIONS = [
  { label: "Arial (sans-serif)", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Segoe UI (sans-serif)", value: "'Segoe UI', Verdana, sans-serif" },
  { label: "Times New Roman (serif)", value: "'Times New Roman', Times, serif" },
  { label: "Courier New (monospace)", value: "'Courier New', Courier, monospace" },
  { label: "Calibri (sans-serif)", value: "Calibri, Candara, sans-serif" },
  { label: "Garamond (serif)", value: "Garamond, 'EB Garamond', serif" },
  { label: "Century Gothic (sans-serif)", value: "'Century Gothic', sans-serif" },
  { label: "Baskerville (serif)", value: "Baskerville, Georgia, serif" },
  { label: "Palatino (serif)", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Trebuchet MS (sans-serif)", value: "'Trebuchet MS', sans-serif" },
];

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-12 cursor-pointer rounded border border-input bg-background p-0.5"
      />
    </div>
  );
}

function SizeField({ label, value, min, max, onChange }) {
  return (
    <div className="py-1.5">
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{value}pt</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={0.5} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function CustomizePanel() {
  const styles = useDocStore((s) => s.styles);
  const updateStyle = useDocStore((s) => s.updateStyle);
  const resetStyles = useDocStore((s) => s.resetStyles);
  const [group, setGroup] = useState("page");
  const st = styles;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pb-1">
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="page">Document</SelectItem>
            <SelectItem value="title">Title (first heading)</SelectItem>
            <SelectItem value="heading">Headings</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="blockquote">Blockquotes</SelectItem>
            <SelectItem value="link">Links</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={resetStyles}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {group === "page" && (
          <>
            <div className="py-1.5">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Font family</Label>
              <Select value={st.page.fontFamily} onValueChange={(v) => updateStyle("page", "fontFamily", v)}>
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
            <SizeField label="Body size" value={st.page.fontSize} min={8} max={16} onChange={(v) => updateStyle("page", "fontSize", v)} />
            <SizeField label="Line height (×10)" value={st.page.lineHeight * 10} min={10} max={25} onChange={(v) => updateStyle("page", "lineHeight", v / 10)} />
            <ColorField label="Text color" value={st.page.textColor} onChange={(v) => updateStyle("page", "textColor", v)} />
          </>
        )}

        {group === "title" && (
          <>
            <SizeField label="Size" value={st.title.fontSize} min={16} max={44} onChange={(v) => updateStyle("title", "fontSize", v)} />
            <ColorField label="Color" value={st.title.color} onChange={(v) => updateStyle("title", "color", v)} />
            <div className="py-1.5">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Alignment</Label>
              <Select value={st.title.align} onValueChange={(v) => updateStyle("title", "align", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ToggleField label="Uppercase" checked={st.title.uppercase} onChange={(v) => updateStyle("title", "uppercase", v)} />
            <ToggleField label="Underline rule" checked={st.title.rule} onChange={(v) => updateStyle("title", "rule", v)} />
            {st.title.rule && (
              <ColorField label="Rule color" value={st.title.ruleColor} onChange={(v) => updateStyle("title", "ruleColor", v)} />
            )}
          </>
        )}

        {group === "heading" && (
          <>
            <SizeField label="Size (H2)" value={st.heading.fontSize} min={11} max={26} onChange={(v) => updateStyle("heading", "fontSize", v)} />
            <ColorField label="Color" value={st.heading.color} onChange={(v) => updateStyle("heading", "color", v)} />
            <ToggleField label="Uppercase" checked={st.heading.uppercase} onChange={(v) => updateStyle("heading", "uppercase", v)} />
          </>
        )}

        {group === "table" && (
          <>
            <ColorField label="Header background" value={st.table.headerBg} onChange={(v) => updateStyle("table", "headerBg", v)} />
            <ColorField label="Header text" value={st.table.headerColor} onChange={(v) => updateStyle("table", "headerColor", v)} />
            <ColorField label="Border" value={st.table.borderColor} onChange={(v) => updateStyle("table", "borderColor", v)} />
            <ToggleField label="Striped rows" checked={st.table.striped} onChange={(v) => updateStyle("table", "striped", v)} />
            {st.table.striped && (
              <ColorField label="Stripe color" value={st.table.stripeColor} onChange={(v) => updateStyle("table", "stripeColor", v)} />
            )}
          </>
        )}

        {group === "code" && (
          <>
            <ColorField label="Background" value={st.code.bg} onChange={(v) => updateStyle("code", "bg", v)} />
            <ColorField label="Text" value={st.code.color} onChange={(v) => updateStyle("code", "color", v)} />
          </>
        )}

        {group === "blockquote" && (
          <>
            <ColorField label="Border" value={st.blockquote.borderColor} onChange={(v) => updateStyle("blockquote", "borderColor", v)} />
            <ColorField label="Text" value={st.blockquote.color} onChange={(v) => updateStyle("blockquote", "color", v)} />
            <ToggleField label="Italic" checked={st.blockquote.italic} onChange={(v) => updateStyle("blockquote", "italic", v)} />
          </>
        )}

        {group === "link" && (
          <ColorField label="Color" value={st.link.color} onChange={(v) => updateStyle("link", "color", v)} />
        )}
      </div>
    </div>
  );
}
