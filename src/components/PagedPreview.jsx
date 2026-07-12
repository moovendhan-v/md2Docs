import { useLayoutEffect, useRef, useState } from "react";
import { useDocStore } from "@/store/useDocStore";
import { getPageGeometry } from "@/lib/page";
import { baseStyle } from "@/lib/renderHtml";
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
  const [zoom, setZoom] = useState(1.0);

  const geom = getPageGeometry(styles.page.margin || "normal");

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

    const contentHeight = geom.contentHeight;

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
        // the final chunk sits at the top of the current page — align the
        // offset bookkeeping so following blocks measure against it correctly
        pageTop = top + height - lastChunkHeight;
        return;
      }

      if (b.tagName === "HR" || b.classList.contains("page-break")) {
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
  }, [html, styles, setPages, geom.contentHeight]);

  const wrapperRef = useRef(null);

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

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }} className="bg-canvas transition-colors">
      {/* Zoom controls floating widget - positioned relative to viewport panel */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
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
                    boxSizing: "border-box", overflow: "hidden",
                    background: styles.page.bg || "#ffffff",
                  }}
                >
                  <div style={styleObj(baseStyle(styles))} dangerouslySetInnerHTML={{ __html: pageHtml }} />
                </div>
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
