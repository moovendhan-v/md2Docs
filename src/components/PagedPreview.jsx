import { useLayoutEffect, useRef } from "react";
import { useDocStore } from "@/store/useDocStore";
import { PAGE, CONTENT_WIDTH, CONTENT_HEIGHT } from "@/lib/page";
import { baseStyle } from "@/lib/renderHtml";

/* Splits the rendered document into real A4 pages by measuring block heights.
   Code blocks taller than a page are split line-by-line across pages instead
   of being clipped. The same page slices feed the PDF renderer. */
export default function PagedPreview({ html }) {
  const styles = useDocStore((s) => s.styles);
  const pages = useDocStore((s) => s.pages);
  const setPages = useDocStore((s) => s.setPages);
  const measureRef = useRef(null);

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

    blocks.forEach((b) => {
      const top = b.offsetTop;
      const height = b.offsetHeight;

      // oversized <pre>: split its lines across as many pages as needed
      if (b.tagName === "PRE" && height > CONTENT_HEIGHT) {
        const styleAttr = b.getAttribute("style") || "";
        const linesArr = b.innerHTML.split("\n");
        const padPx = 27; // pre padding top+bottom (10pt * 2 at 96dpi)
        const lineH = (height - padPx) / Math.max(1, linesArr.length);

        let remaining = CONTENT_HEIGHT - (top - pageTop);
        let idx = 0;
        let lastChunkHeight = 0;
        while (idx < linesArr.length) {
          let fit = Math.floor((remaining - padPx) / lineH);
          if (fit < 3) { // not enough room — start a fresh page
            closePage();
            remaining = CONTENT_HEIGHT;
            fit = Math.floor((remaining - padPx) / lineH);
          }
          fit = Math.max(1, fit);
          const chunk = linesArr.slice(idx, idx + fit).join("\n");
          current.push(`<pre style="${styleAttr}">${chunk}</pre>`);
          lastChunkHeight = padPx + Math.min(fit, linesArr.length - idx) * lineH;
          idx += fit;
          if (idx < linesArr.length) { closePage(); remaining = CONTENT_HEIGHT; }
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
      if (bottom - pageTop > CONTENT_HEIGHT && current.length > 0) {
        closePage();
        pageTop = top;
      }
      current.push(b.outerHTML);
    });
    closePage();
    setPages(result.length ? result : [""]);
  }, [html, styles, setPages]);

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

  return (
    <div ref={wrapperRef} className="flex-1 overflow-y-auto bg-canvas p-8 transition-colors">
      {/* hidden measurement container — exact content width of a page */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: "fixed", left: -20000, top: -20000, width: CONTENT_WIDTH,
          visibility: "hidden", pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", ...styleObj(baseStyle(styles)) }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="mx-auto flex w-fit flex-col items-center gap-6">
        {pages.map((pageHtml, i) => (
          <div key={i} className="relative">
            <div
              className="page-content-wrapper bg-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
              style={{
                width: PAGE.width, height: PAGE.height,
                padding: `${PAGE.marginY}px ${PAGE.marginX}px`,
                boxSizing: "border-box", overflow: "hidden",
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
