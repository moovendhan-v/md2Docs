import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { getPageGeometry } from "@/lib/page";
import { baseStyle } from "@/lib/renderHtml";
import { renderMermaidDiagrams } from "@/lib/mermaid";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

/* Splits the rendered document into real A4 pages by measuring block heights.
   Code blocks taller than a page are split line-by-line across pages instead
   of being clipped. The same page slices feed the PDF renderer. */
export default function PagedPreview({ html }) {
  const styles = useDocStore((s) => s.styles);
  const pages = useDocStore((s) => s.pages);
  const setPages = useDocStore((s) => s.setPages);
  const measureRef = useRef(null);
  const isVsCode = !!(window.acquireVsCodeApi || window.navigator.userAgent.includes("VSCode") || window.top !== window.self);
  const [zoom, setZoom] = useState(0.5);
  const [mermaidTick, setMermaidTick] = useState(0);

  const geom = getPageGeometry(styles.page.margin || "normal");

  // Page number settings from styles
  const showPageNumbers = styles.page.showPageNumbers !== false;
  const pageNumAlign = styles.page.pageNumberAlign || "center";
  const pageNumFormat = styles.page.pageNumberFormat || "Page X of Y";
  const pageNumColor = styles.page.pageNumberColor || "#888888";
  const pageNumSize = styles.page.pageNumberSize || 8;

  // Page border settings
  const borderStyle = styles.page.borderStyle || "none";
  const borderColor = styles.page.borderColor || "#cccccc";
  const borderWidth = styles.page.borderWidth || 1;
  const borderInset = styles.page.borderInset || 8;

  /* Render mermaid diagrams in the hidden measurement container, then
     signal re-measurement by bumping mermaidTick. */
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

    // reserve space at bottom for page number
    const footerReserve = showPageNumbers ? 24 : 0;
    const contentHeight = geom.contentHeight - footerReserve;

    blocks.forEach((b) => {
      const top = b.offsetTop;
      const height = b.offsetHeight;

      // oversized <pre>: split its lines across as many pages as needed
      if (b.tagName === "PRE" && height > contentHeight) {
        const styleAttr = b.getAttribute("style") || "";
        const linesArr = b.innerHTML.split("\n");
        const padPx = 27; // pre padding top+bottom (10pt * 2 at 96dpi)
        const lineH = (height - padPx) / Math.max(1, linesArr.length);

        let remaining = contentHeight - (top - pageTop);
        let idx = 0;
        let lastChunkHeight = 0;
        while (idx < linesArr.length) {
          let fit = Math.floor((remaining - padPx) / lineH);
          if (fit < 3) { // not enough room — start a fresh page
            closePage();
            remaining = contentHeight;
            fit = Math.floor((remaining - padPx) / lineH);
          }
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

      if (b.classList.contains("page-break")) {
        closePage();
        pageTop = top + height;
        return;
      }

      const bottom = top + height;
      if (bottom - pageTop > contentHeight && current.length > 0) {
        closePage();
        pageTop = top;
      }
      current.push(b.outerHTML);
    });
    closePage();
    setPages(result.length ? result : [""]);
  }, [html, styles, setPages, geom.contentHeight, mermaidTick, showPageNumbers]);

  const wrapperRef = useRef(null);

  /* Render mermaid diagrams inside the visible page wrappers after pages change. */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrappers = wrapperRef.current.querySelectorAll(".page-content-wrapper");
    wrappers.forEach((w) => renderMermaidDiagrams(w));
  }, [pages]);

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      const pageDivs = wrapperRef.current.querySelectorAll(".page-content-wrapper");
      pageDivs.forEach((el) => {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      });
    }
  }, [pages]);

  const containerHeight = geom.height * pages.length * zoom + (pages.length - 1) * 24 * zoom + 80;

  // Build page number label
  const getPageLabel = (i) => {
    const x = i + 1;
    const y = pages.length;
    switch (pageNumFormat) {
      case "X / Y": return `${x} / ${y}`;
      case "X": return `${x}`;
      case "— X —": return `— ${x} —`;
      default: return `Page ${x} of ${y}`;
    }
  };

  const pageNumAlignStyle = { left: "flex-start", center: "center", right: "flex-end" }[pageNumAlign] || "center";

  // Border style for page wrapper
  const pageBorderCss = borderStyle !== "none"
    ? {
        outline: `${borderWidth}px ${borderStyle} ${borderColor}`,
        outlineOffset: `-${borderInset}px`,
      }
    : {};

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }} className="bg-canvas transition-colors">
      {/* Zoom controls floating widget */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          aria-label="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[40px] text-center text-xs font-semibold tabular-nums text-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
          aria-label="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* hidden measurement container — exact content width of a page */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "fixed", left: -20000, top: -20000, width: geom.contentWidth,
          visibility: "hidden", pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", ...styleObj(baseStyle(styles)) }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Scrollable pages list container */}
      <div ref={wrapperRef} style={{ flex: 1, overflow: "auto", minHeight: 0, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "flex-start" }} className="p-8">
        <div
          style={{
            height: `${containerHeight}px`,
            flexShrink: 0,
          }}
        >
          <div
            className="flex flex-col items-center gap-6"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              width: `${geom.width}px`,
              height: `${geom.height * pages.length + (pages.length - 1) * 24}px`,
            }}
          >
            {pages.map((pageHtml, i) => (
              <div key={i} className="relative">
                <div
                  className="page-content-wrapper shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
                  style={{
                    width: geom.width, height: geom.height,
                    padding: `${geom.marginY}px ${geom.marginX}px`,
                    paddingBottom: showPageNumbers ? `${Math.max(geom.marginY, 32)}px` : `${geom.marginY}px`,
                    boxSizing: "border-box", overflow: "hidden",
                    background: styles.page.bg || "#ffffff",
                    position: "relative",
                    ...pageBorderCss,
                  }}
                >
                  {/* Document content */}
                  <div style={styleObj(baseStyle(styles))} dangerouslySetInnerHTML={{ __html: pageHtml }} />

                  {/* Page number footer — rendered inside the page at the bottom */}
                  {showPageNumbers && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${geom.marginY}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: pageNumAlignStyle,
                        paddingLeft: `${geom.marginX}px`,
                        paddingRight: `${geom.marginX}px`,
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          color: pageNumColor,
                          fontSize: `${pageNumSize}pt`,
                          fontFamily: styles.page.fontFamily,
                          lineHeight: 1,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {getPageLabel(i)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Page indicator below the sheet */}
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
