import { useLayoutEffect, useEffect, useRef, useState, useCallback } from "react";
import { useDocStore } from "@/store/useDocStore";
import { getPageGeometry } from "@/lib/page";
import { baseStyle } from "@/lib/renderHtml";
import { renderMermaidDiagrams } from "@/lib/mermaid";
import { Button } from "@/components/ui/button";
import { Plus, Minus, LayoutList, LayoutGrid } from "lucide-react";
import ElementInspector from "@/components/ElementInspector";

/* ── element-type detection from clicked DOM node ───────────────────────────── */

const TABLE_TAGS = new Set(["table", "thead", "tbody", "tr", "td", "th"]);

/** Walk up from `el` and return the first `data-eid` value found on a block ancestor. */
function findBlockEid(el) {
  let node = el;
  while (node && node.tagName) {
    const eid = node.getAttribute?.("data-eid");
    if (eid != null) return eid;
    if (node.classList?.contains("preview-interactive")) break;
    node = node.parentElement;
  }
  return null;
}

function detectElementInfo(target) {
  let el = target;
  while (el && el.tagName) {
    const tag = el.tagName.toLowerCase();

    // Table: walk up to the <table> to get its eid
    if (TABLE_TAGS.has(tag)) {
      let t = el;
      while (t && t.tagName?.toLowerCase() !== "table") t = t.parentElement;
      return { type: "table", eid: t?.getAttribute?.("data-eid") ?? null };
    }

    if (tag === "h1") return { type: "title",      eid: findBlockEid(el) };
    if (["h2","h3","h4","h5","h6"].includes(tag))
                     return { type: "heading",     eid: findBlockEid(el) };
    if (tag === "pre")        return { type: "code",       eid: findBlockEid(el) };
    if (tag === "blockquote") return { type: "blockquote", eid: findBlockEid(el) };
    if (tag === "ul" || tag === "ol")
                              return { type: "list",       eid: findBlockEid(el) };
    if (tag === "li")         return { type: "list",       eid: findBlockEid(el.closest("ul,ol") ?? el) };
    if (tag === "p")          return { type: "paragraph",  eid: findBlockEid(el) };
    if (tag === "hr")         return { type: "hr",         eid: findBlockEid(el) };
    // Inline elements — report their type but eid comes from the containing block
    if (tag === "a")   return { type: "link",  eid: findBlockEid(el) };
    if (tag === "img") return { type: "image", eid: findBlockEid(el) };

    // Stop at wrapper div
    if (tag === "div" && el.classList?.contains("preview-interactive")) break;
    el = el.parentElement;
  }
  return { type: "page", eid: null };
}


/* ── main component ──────────────────────────────────────────────────────────── */

export default function PagedPreview({ html }) {
  const styles = useDocStore((s) => s.styles);
  const pages = useDocStore((s) => s.pages);
  const setPages = useDocStore((s) => s.setPages);
  const canvasLayout = useDocStore((s) => s.canvasLayout);
  const setCanvasLayout = useDocStore((s) => s.setCanvasLayout);
  const measureRef = useRef(null);
  const [zoom, setZoom] = useState(0.5);
  const [mermaidTick, setMermaidTick] = useState(0);

  // inspector state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectedType, setInspectedType] = useState("page");
  const [inspectedEid, setInspectedEid] = useState(null);

  const geom = getPageGeometry(styles.page.margin || "normal");

  // Page number settings
  const showPageNumbers = styles.page.showPageNumbers !== false;
  const pageNumAlign   = styles.page.pageNumberAlign  || "center";
  const pageNumFormat  = styles.page.pageNumberFormat || "Page X of Y";
  const pageNumColor   = styles.page.pageNumberColor  || "#888888";
  const pageNumSize    = styles.page.pageNumberSize   || 8;

  // Page border
  const borderStyle = styles.page.borderStyle || "none";
  const borderColor = styles.page.borderColor || "#cccccc";
  const borderWidth = styles.page.borderWidth || 1;
  const borderInset = styles.page.borderInset || 8;

  const isHorizontal = canvasLayout === "horizontal";

  /* Mermaid in hidden measurement container */
  useEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const container = root.firstElementChild;
    if (!container) return;
    renderMermaidDiagrams(container).then(() => setMermaidTick((t) => t + 1));
  }, [html]);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const container = root.firstElementChild;
    if (!container) { setPages([]); return; }

    const blocks = Array.from(container.children);
    const result = [];
    let current = [];
    let pageTop = 0;

    const closePage = () => {
      if (current.length) { result.push(current.join("")); current = []; }
    };

    const footerReserve = showPageNumbers ? 24 : 0;
    const contentHeight = geom.contentHeight - footerReserve;

    blocks.forEach((b) => {
      const top = b.offsetTop;
      const height = b.offsetHeight;

      if (b.tagName === "PRE" && height > contentHeight) {
        const styleAttr = b.getAttribute("style") || "";
        const linesArr = b.innerHTML.split("\n");
        const padPx = 27;
        const lineH = (height - padPx) / Math.max(1, linesArr.length);
        let remaining = contentHeight - (top - pageTop);
        let idx = 0;
        let lastChunkHeight = 0;
        while (idx < linesArr.length) {
          let fit = Math.floor((remaining - padPx) / lineH);
          if (fit < 3) { closePage(); remaining = contentHeight; fit = Math.floor((remaining - padPx) / lineH); }
          fit = Math.max(1, fit);
          const chunk = linesArr.slice(idx, idx + fit).join("\n");
          current.push(`<pre style="${styleAttr}">${chunk}</pre>`);
          lastChunkHeight = padPx + Math.min(fit, linesArr.length - idx) * lineH;
          idx += fit;
          if (idx < linesArr.length) { closePage(); remaining = contentHeight; }
        }
        pageTop = top + height - lastChunkHeight;
        return;
      }

      if (b.classList.contains("page-break")) { closePage(); pageTop = top + height; return; }

      const bottom = top + height;
      if (bottom - pageTop > contentHeight && current.length > 0) { closePage(); pageTop = top; }
      current.push(b.outerHTML);
    });
    closePage();
    setPages(result.length ? result : [""]);
  }, [html, styles, setPages, geom.contentHeight, mermaidTick, showPageNumbers]);

  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.querySelectorAll(".page-content-wrapper").forEach((w) => renderMermaidDiagrams(w));
  }, [pages]);

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.querySelectorAll(".page-content-wrapper").forEach((el) => {
        el.scrollTop = 0; el.scrollLeft = 0;
      });
    }
  }, [pages]);

  /* ── click-to-inspect ─────────────────────────────────────────────────────── */
  const handleContentClick = useCallback((e) => {
    if (e.target.closest("button")) return;
    const { type, eid } = detectElementInfo(e.target);
    setInspectedType(type);
    setInspectedEid(eid);
    setInspectorOpen(true);
  }, []);

  /* ── container dimension maths ────────────────────────────────────────────── */
  const containerHeight = isHorizontal
    ? geom.height * zoom + 80
    : geom.height * pages.length * zoom + (pages.length - 1) * 24 * zoom + 80;

  const containerWidth = isHorizontal
    ? (geom.width * pages.length + (pages.length - 1) * 24) * zoom
    : geom.width * zoom;

  /* ── helpers ──────────────────────────────────────────────────────────────── */
  const getPageLabel = (i) => {
    const x = i + 1; const y = pages.length;
    switch (pageNumFormat) {
      case "X / Y": return `${x} / ${y}`;
      case "X":     return `${x}`;
      case "— X —": return `— ${x} —`;
      default:      return `Page ${x} of ${y}`;
    }
  };

  const pageNumAlignStyle = { left: "flex-start", center: "center", right: "flex-end" }[pageNumAlign] || "center";



  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }} className="bg-canvas transition-colors">

      {/* ElementInspector sheet */}
      <ElementInspector
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        elementType={inspectedType}
        eid={inspectedEid}
      />

      {/* Floating controls bar */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur-sm">
        {/* Layout toggle */}
        <Button
          variant={isHorizontal ? "secondary" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => setCanvasLayout(isHorizontal ? "vertical" : "horizontal")}
          title={isHorizontal ? "Switch to vertical layout" : "Switch to horizontal layout"}
        >
          {isHorizontal
            ? <LayoutList className="h-3.5 w-3.5" />
            : <LayoutGrid  className="h-3.5 w-3.5" />}
        </Button>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Zoom */}
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} aria-label="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[40px] text-center text-xs font-semibold tabular-nums text-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} aria-label="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Hidden measurement container */}
      <div ref={measureRef} aria-hidden
        style={{ position: "fixed", left: -20000, top: -20000, width: geom.contentWidth, visibility: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "relative", ...styleObj(baseStyle(styles)) }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Scrollable canvas */}
      <div ref={wrapperRef}
        style={{ flex: 1, overflow: "auto", minHeight: 0, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "flex-start" }}
        className="p-8">

        {/* Outer div holds the scaled height/width so scrollbar is correct */}
        <div style={{
          height: `${containerHeight}px`,
          width: `${containerWidth}px`,
          flexShrink: 0,
        }}>
          {/* Inner div is the scaled pages container */}
          <div
            style={{
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              alignItems: isHorizontal ? "flex-start" : "center",
              gap: "24px",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: isHorizontal
                ? `${geom.width * pages.length + (pages.length - 1) * 24}px`
                : `${geom.width}px`,
              height: isHorizontal
                ? `${geom.height}px`
                : `${geom.height * pages.length + (pages.length - 1) * 24}px`,
            }}
          >
            {pages.map((pageHtml, i) => (
              <div key={i} style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  className="page-content-wrapper shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
                  style={{
                    width: geom.width, height: geom.height,
                    padding: `${geom.marginY}px ${geom.marginX}px`,
                    paddingBottom: showPageNumbers ? `${Math.max(geom.marginY, 32)}px` : `${geom.marginY}px`,
                    boxSizing: "border-box", overflow: "hidden",
                    background: styles.page.bg || "#ffffff",
                    position: "relative",
                  }}
                >
                  {/* Restricted page border box */}
                  {borderStyle !== "none" && (
                    <div
                      style={{
                        position: "absolute",
                        top: `${borderInset}px`,
                        left: `${borderInset}px`,
                        right: `${borderInset}px`,
                        bottom: showPageNumbers
                          ? `${Math.max(geom.marginY - 8, borderInset + 16)}px`
                          : `${borderInset}px`,
                        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                        pointerEvents: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                  {/* Content — interactive for click-to-inspect */}
                  <div
                    className="preview-interactive"
                    style={styleObj(baseStyle(styles))}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                    onClick={handleContentClick}
                  />

                  {/* Page number footer */}
                  {showPageNumbers && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: `${geom.marginY}px`,
                      display: "flex", alignItems: "center", justifyContent: pageNumAlignStyle,
                      paddingLeft: `${geom.marginX}px`, paddingRight: `${geom.marginX}px`,
                      pointerEvents: "none",
                    }}>
                      <span style={{
                        color: pageNumColor, fontSize: `${pageNumSize}pt`,
                        fontFamily: styles.page.fontFamily, lineHeight: 1, letterSpacing: "0.04em",
                      }}>
                        {getPageLabel(i)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Page counter label below sheet */}
                <div className="mt-1.5 text-center text-[11px] tracking-widest text-muted-foreground">
                  PAGE {i + 1} / {pages.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* "font-size:11pt;color:#111;" → React style object */
function styleObj(css) {
  const o = {};
  css.split(";").forEach((d) => {
    const idx = d.indexOf(":");
    if (idx === -1) return;
    const k = d.slice(0, idx).trim();
    const v = d.slice(idx + 1).trim();
    if (!k) return;
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  });
  return o;
}
