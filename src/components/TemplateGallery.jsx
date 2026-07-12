import { TEMPLATES } from "@/lib/templates";
import { useDocStore } from "@/store/useDocStore";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/* Visual template cards — a miniature document drawn with each template's
   real colors, so you see what you're picking before you pick it. */
function MiniDoc({ styles: st }) {
  return (
    <div className="pointer-events-none h-36 w-full overflow-hidden rounded-md border border-black/10 bg-white p-3">
      <div
        style={{
          color: st.title.color,
          textAlign: st.title.align,
          fontFamily: st.page.fontFamily,
          fontWeight: 700,
          fontSize: 13,
          textTransform: st.title.uppercase ? "uppercase" : "none",
          borderBottom: st.title.rule ? `1.5px solid ${st.title.ruleColor}` : "none",
          paddingBottom: 3,
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        Document title
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-sm" style={{ background: "#d6d3d1" }} />
        <div className="h-1.5 w-10/12 rounded-sm" style={{ background: "#e0dedb" }} />
      </div>
      <div
        style={{ color: st.heading.color, fontFamily: st.page.fontFamily, fontWeight: 700, fontSize: 9, textTransform: st.heading.uppercase ? "uppercase" : "none" }}
        className="mt-2"
      >
        Section heading
      </div>
      <table className="mt-1.5 w-full border-collapse" style={{ fontSize: 7 }}>
        <thead>
          <tr>
            {["Metric", "Q1", "Q2"].map((h) => (
              <th key={h} style={{ background: st.table.headerBg, color: st.table.headerColor, border: `1px solid ${st.table.borderColor}`, padding: "2px 4px", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1].map((r) => (
            <tr key={r}>
              {[0, 1, 2].map((c) => (
                <td key={c} style={{ border: `1px solid ${st.table.borderColor}`, background: st.table.striped && r === 1 ? st.table.stripeColor : "#fff", padding: "2px 4px" }}>
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

export default function TemplateGallery() {
  const templateKey = useDocStore((s) => s.templateKey);
  const setTemplate = useDocStore((s) => s.setTemplate);

  return (
    <div className="grid gap-3">
      {Object.entries(TEMPLATES).map(([key, t]) => {
        const active = key === templateKey;
        return (
          <button
            key={key}
            onClick={() => setTemplate(key)}
            className={cn(
              "group relative rounded-lg border p-2 text-left transition-all hover:border-primary/60 hover:shadow-sm",
              active ? "border-primary ring-2 ring-primary/30" : "border-border"
            )}
          >
            <MiniDoc styles={t.styles} />
            <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
              <span className="text-sm font-medium">{t.name}</span>
              {active && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" /> Active
                </span>
              )}
            </div>
          </button>
        );
      })}
      <p className="px-1 text-xs text-muted-foreground">
        Picking a template loads its styles as your starting point — then fine-tune any single element in the Styles tab.
      </p>
    </div>
  );
}
