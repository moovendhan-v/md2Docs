import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import { useDocStore } from "@/store/useDocStore";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2 } from "lucide-react";
import TemplateBuilderDialog from "./TemplateBuilderDialog";

/* Visual template cards — a miniature document drawn with each template's
   real colors, so you see what you're picking before you pick it. */
function MiniDoc({ styles: st }) {
  return (
    <div 
      className="pointer-events-none h-36 w-full overflow-hidden rounded-md border border-black/10 bg-white p-3 relative"
      style={{
        backgroundImage: st.page?.backgroundUrl ? `url(${st.page.backgroundUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {st.page?.borderStyle && st.page.borderStyle !== "none" && (
         <div style={{
           position: "absolute", top: 4, left: 4, right: 4, bottom: 4,
           border: `${Math.max(1, (st.page.borderWidth || 1) / 2)}px ${st.page.borderStyle} ${st.page.borderColor || "#000"}`,
           pointerEvents: "none"
         }}/>
      )}
      {st.watermark?.text && (
         <div style={{
           position: "absolute", top: "50%", left: "50%",
           transform: "translate(-50%, -50%) rotate(-45deg)",
           color: st.watermark.color || "#ccc", opacity: st.watermark.opacity || 0.2,
           fontSize: "16pt", fontWeight: "bold", whiteSpace: "nowrap",
           pointerEvents: "none", zIndex: 0
         }}>
           {st.watermark.text}
         </div>
      )}
      {(st.header?.text || st.header?.logoUrl) && (
         <div style={{
           position: "absolute", top: 0, left: 0, right: 0, padding: "4px 8px",
           display: "flex", alignItems: "center",
           justifyContent: st.header.layout === "center" ? "center" : "space-between",
           flexDirection: st.header.layout === "logo-right" ? "row-reverse" : "row",
           borderBottom: st.header.borderBottom ? `1px solid ${st.page?.borderColor || "#000"}` : "none",
           zIndex: 11
         }}>
           {st.header.logoUrl && <img src={st.header.logoUrl} alt="logo" style={{ maxHeight: "10px", maxWidth: "30px", objectFit: "contain" }} />}
           {st.header.text && <span style={{ fontSize: "4pt", fontWeight: "bold", color: st.page?.borderColor || "#000" }}>{st.header.text}</span>}
         </div>
      )}
      {(st.footer?.text || st.footer?.bannerColor) && (
         <div style={{
           position: "absolute", bottom: 0, left: 0, right: 0, height: "12px",
           backgroundColor: st.footer.bannerColor || "transparent",
           display: "flex", alignItems: "center",
           justifyContent: st.footer.layout === "split" ? "space-between" : "center",
           padding: "0 8px", zIndex: 11
         }}>
           {st.footer.text && <span style={{ fontSize: "4pt", color: st.footer.textColor || "#fff" }}>{st.footer.text}</span>}
         </div>
      )}
      <div
        style={{
          color: st.title?.color || "#000",
          textAlign: st.title?.align || "left",
          fontFamily: st.page?.fontFamily,
          fontWeight: 700,
          fontSize: 13,
          textTransform: st.title?.uppercase ? "uppercase" : "none",
          borderBottom: st.title?.rule ? `1.5px solid ${st.title.ruleColor}` : "none",
          paddingBottom: 3,
          marginBottom: 6,
          lineHeight: 1.2,
          position: "relative", zIndex: 1
        }}
      >
        Document title
      </div>
      <div className="space-y-1.5 relative z-1">
        <div className="h-1.5 w-full rounded-sm" style={{ background: "#d6d3d1" }} />
        <div className="h-1.5 w-10/12 rounded-sm" style={{ background: "#e0dedb" }} />
      </div>
      <div
        style={{ color: st.heading?.color || "#000", fontFamily: st.page?.fontFamily, fontWeight: 700, fontSize: 9, textTransform: st.heading?.uppercase ? "uppercase" : "none", position: "relative", zIndex: 1 }}
        className="mt-2"
      >
        Section heading
      </div>
      <table className="mt-1.5 w-full border-collapse relative z-1" style={{ fontSize: 7 }}>
        <thead>
          <tr>
            {["Metric", "Q1", "Q2"].map((h) => (
              <th key={h} style={{ background: st.table?.headerBg || "#fff", color: st.table?.headerColor || "#000", border: `1px solid ${st.table?.borderColor || "#ccc"}`, padding: "2px 4px", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1].map((r) => (
            <tr key={r}>
              {[0, 1, 2].map((c) => (
                <td key={c} style={{ border: `1px solid ${st.table?.borderColor || "#ccc"}`, background: st.table?.striped && r === 1 ? (st.table.stripeColor || "#f5f5f5") : "#fff", padding: "2px 4px" }}>
                  <div className="h-1 w-6 rounded-sm" style={{ background: "#d6d3d1" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TemplateGallery({ columns = 1, onSelect }) {
  const templateKey = useDocStore((s) => s.templateKey);
  const setTemplate = useDocStore((s) => s.setTemplate);
  const customTemplates = useDocStore((s) => s.customTemplates);
  const deleteCustomTemplate = useDocStore((s) => s.deleteCustomTemplate);
  const [builderOpen, setBuilderOpen] = useState(false);

  const handleSelect = (key) => {
    setTemplate(key);
    if (onSelect) onSelect(key);
  };

  const allTemplates = {
    ...TEMPLATES,
    ...customTemplates,
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setBuilderOpen(true)}
        className="w-full py-2 px-4 border border-dashed rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-primary border-primary/50"
      >
        <Plus className="w-4 h-4" /> Create Custom Template
      </button>

      <div className={cn("grid gap-3", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-1")}>
        {Object.entries(allTemplates).map(([key, t]) => {
          const active = key === templateKey;
          const isCustom = !!t.isCustom;
          return (
            <div key={key} className="relative group">
              <button
                onClick={() => handleSelect(key)}
                className={cn(
                  "w-full relative rounded-lg border p-2 text-left transition-all hover:border-primary/60 hover:shadow-sm",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
              >
                <MiniDoc styles={t.styles} />
                <div className="mt-2 flex items-center justify-between px-1 pb-0.5 relative z-20">
                  <span className="text-sm font-medium flex items-center gap-1">
                    {t.name}
                  </span>
                  {active && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="h-3.5 w-3.5" /> Active
                    </span>
                  )}
                </div>
              </button>
              {isCustom && !active && (
                <button
                  className="absolute top-2 right-2 p-1.5 bg-background border rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-sm"
                  onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(key); }}
                  title="Delete Custom Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        Picking a template loads its styles as your starting point — then fine-tune any single element in the Styles tab.
      </p>

      <TemplateBuilderDialog 
        open={builderOpen} 
        onOpenChange={setBuilderOpen} 
        onSave={(id) => handleSelect(id)}
      />
    </div>
  );
}
