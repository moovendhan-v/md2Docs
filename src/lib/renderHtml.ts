//@ts-nocheck
/* Tokens + styles → inline-styled HTML (used by preview + PDF renderer).
   Each block gets a data-eid="<index>" attribute so the ElementInspector can
   write per-element inline-style overrides that only affect that one block. */
import katex from "katex";
import { codeFontSize } from "./parser";

export const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const baseStyle = (st) =>
  `font-family:${st.page.fontFamily};font-size:${st.page.fontSize}pt;color:${st.page.textColor};line-height:${st.page.lineHeight};`;

function wrapFlags(html, r) {
  if (r.italic) html = `<em>${html}</em>`;
  if (r.bold) html = `<strong>${html}</strong>`;
  return html;
}

function inlineHtml(runs, st) {
  if (!runs || (runs.length === 1 && runs[0].text === "")) return "&nbsp;";
  return runs
    .map((r) => {
      const text = esc(r.text || "").replace(/\n/g, "<br/>");
      switch (r.t) {
        case "code":
          return wrapFlags(
            `<code style="background:${st.code.bg};color:${st.code.color};padding:1px 5px;border-radius:3px;font-family:Consolas,'Courier New',monospace;font-size:0.9em;">${text}</code>`, r);
        case "math": {
          try {
            return katex.renderToString(r.math || r.text || "", { throwOnError: false, displayMode: false });
          } catch {
            return wrapFlags(`<code>${esc(r.math || r.text || "")}</code>`, r);
          }
        }
        case "footnote-ref":
          return `<sup><a href="#fn-${esc(r.footnoteId)}" id="fnref-${esc(r.footnoteId)}" style="color:${st.link.color};text-decoration:none;font-weight:bold;font-size:0.78em;padding:0 1px;">[${esc(r.footnoteId)}]</a></sup>`;
        case "link": {
          const underline = st.link.underline !== false ? "text-decoration:underline;" : "text-decoration:none;";
          return wrapFlags(`<a href="${esc(r.href)}" style="color:${st.link.color};${underline}">${text}</a>`, r);
        }
        case "image":
          return wrapFlags(`<img src="${esc(r.src)}" alt="${esc(r.text || "")}" style="display:block;margin:12pt auto;max-width:100%;max-height:220px;border-radius:8px;object-fit:contain;" />`, r);
        case "linked-image":
          return wrapFlags(`<a href="${esc(r.href)}" style="display:inline-block;"><img src="${esc(r.src)}" alt="${esc(r.text || "")}" style="height:28px;margin:2px;vertical-align:middle;" /></a>`, r);
        default:
          return wrapFlags(text, r);
      }
    })
    .join("");
}

function headingStyle(block, st) {
  const fontFam = st.heading.fontFamily && st.heading.fontFamily !== "default"
    ? `font-family:${st.heading.fontFamily};` : "";
  const letterSpacing = st.heading.letterSpacing ? `letter-spacing:${st.heading.letterSpacing}px;` : "";
  if (block.isTitle) {
    const titleFontFam = st.title.fontFamily && st.title.fontFamily !== "default"
      ? `font-family:${st.title.fontFamily};` : fontFam;
    const titleLetterSpacing = st.title.letterSpacing ? `letter-spacing:${st.title.letterSpacing}px;` : "";
    const ruleWidth = st.title.ruleWidth || 2;
    return (
      titleFontFam +
      `font-size:${st.title.fontSize}pt;color:${st.title.color};text-align:${st.title.align};` +
      (st.title.uppercase ? "text-transform:uppercase;" : "") +
      titleLetterSpacing +
      (st.title.rule ? `border-bottom:${ruleWidth}px solid ${st.title.ruleColor};padding-bottom:8pt;` : "") +
      "margin:0 0 14pt 0;font-weight:bold;"
    );
  }
  const size = block.level <= 2 ? st.heading.fontSize : Math.max(st.heading.fontSize - 2, st.page.fontSize + 1);
  const headingRuleWidth = st.heading.ruleWidth || 1;
  return (
    fontFam +
    `font-size:${size}pt;color:${st.heading.color};` +
    (st.heading.uppercase ? "text-transform:uppercase;" : "") +
    letterSpacing +
    (st.heading.rule ? `border-bottom:${headingRuleWidth}px solid ${st.heading.ruleColor || st.heading.color};padding-bottom:4pt;` : "") +
    "margin:16pt 0 6pt 0;font-weight:bold;"
  );
}

const ALERT_STYLES = {
  note: {
    color: "#0284c7",
    bg: "rgba(2,132,199,0.06)",
    borderColor: "#0284c7",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5pt;display:inline-block;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  },
  tip: {
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    borderColor: "#059669",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5pt;display:inline-block;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>`,
  },
  important: {
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.06)",
    borderColor: "#7c3aed",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5pt;display:inline-block;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  },
  warning: {
    color: "#d97706",
    bg: "rgba(217,119,6,0.06)",
    borderColor: "#d97706",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5pt;display:inline-block;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  },
  caution: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.06)",
    borderColor: "#dc2626",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5pt;display:inline-block;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  },
};

function listHtml(list, st, depth = 0) {
  const tag = list.ordered ? "ol" : "ul";
  const start = list.ordered && list.start > 1 ? Number(list.start) : 1;
  const bulletSymbols = ["•", "◦", "▪"];
  const bullet = bulletSymbols[depth % bulletSymbols.length];

  const items = list.items
    .map((it, idx) => {
      const inline = it.inline || it;
      let marker = list.ordered ? `${start + idx}.` : bullet;
      if (it.checked !== undefined) {
        marker = it.checked
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:11pt;height:11pt;border:1.5px solid ${st.heading.color || st.title.color};border-radius:3px;background:${st.heading.color || st.title.color};color:#fff;font-size:8pt;line-height:1;font-weight:bold;">✓</span>`
          : `<span style="display:inline-flex;align-items:center;justify-content:center;width:11pt;height:11pt;border:1.5px solid ${st.table.borderColor || '#888'};border-radius:3px;background:transparent;"></span>`;
      }
      const child = it.children
        ? listHtml({ ordered: it.children.ordered, start: it.children.start, items: it.children.items }, st, depth + 1)
        : "";
      return `<li style="display:flex;align-items:flex-start;margin:3pt 0;">` +
        `<span style="display:inline-flex;align-items:center;width:18pt;flex-shrink:0;user-select:none;line-height:inherit;">${marker}</span>` +
        `<div style="flex:1;min-width:0;">${inlineHtml(inline, st)}${child}</div>` +
        `</li>`;
    })
    .join("");
  return `<${tag} style="margin:2pt 0;padding-left:0;list-style:none;">${items}</${tag}>`;
}

/* Merge override CSS string into a base style string.
   If the override string already contains a given property, it wins. */
function mergeStyle(base, override) {
  if (!override) return base;
  // Strip duplicate props from base that exist in override
  const overrideProps = new Set(
    override.split(";").map((p) => p.split(":")[0].trim()).filter(Boolean)
  );
  const filtered = base
    .split(";")
    .filter((p) => {
      const key = p.split(":")[0].trim();
      return key && !overrideProps.has(key);
    })
    .join(";");
  return filtered + ";" + override;
}

/* ── Word-style Table of Contents renderer ───────────────────────────────── */

/**
 * Build a complete Word-style TOC HTML string.
 * @param {Array}  headings      - filtered array of heading blocks (type=="heading")
 * @param {Object} st            - styles object
 * @param {Object} tocOptions    - { title, style, maxDepth }
 * @param {Object} pageMap       - { [headingId]: pageNumber } — may be empty on first pass
 * @param {String} eidAttr       - data-eid attribute for the element inspector
 */
export function buildTocHtml(headings, st, tocOptions = {}, pageMap = {}, eidAttr = "") {
  const title     = tocOptions.title    ?? "Table of Contents";
  const style     = tocOptions.style    ?? "dotted";  // "dotted" | "lines" | "plain"
  const maxDepth  = tocOptions.maxDepth ?? 3;

  const fontFam   = st.page.fontFamily;
  const bodySize  = st.page.fontSize;
  const textColor = st.page.textColor;
  const accentColor = st.heading.color || st.title.color;

  // TOC container background — slightly tinted
  const tocEntries = headings.filter((h) => !h.isTitle && h.level <= maxDepth);

  if (tocEntries.length === 0) return "";

  // Title bar
  const titleHtml = `<div style="
    font-family:${fontFam};
    font-size:${bodySize + 4}pt;
    font-weight:bold;
    color:${accentColor};
    margin:0 0 10pt 0;
    padding-bottom:6pt;
    border-bottom:2px solid ${accentColor};
    letter-spacing:0.02em;
  ">${esc(title)}</div>`;

  // Build each entry row
  const entryRows = tocEntries.map((h) => {
    const depth   = h.level - 2;   // H2 = depth 0, H3 = depth 1, H4 = depth 2
    const indent  = Math.max(0, depth) * 16;  // 16pt per level
    const isBold  = h.level === 2;
    const fontSize = Math.max(bodySize - 0.5, 9);

    // Extract plain text from inline tokens
    const text = (h.inline || []).map((r) => r.text || "").join("");
    const page = pageMap[h.id] ? String(pageMap[h.id]) : "";

    // Leader styles per TOC style option
    let leaderStyle = "";
    if (style === "dotted") {
      leaderStyle = `flex:1;
        height:0;
        border-bottom:1px dotted ${textColor};
        opacity:0.45;
        margin:0 5pt;
        position:relative;
        top:-3px;
        min-width:20pt;`;
    } else if (style === "lines") {
      leaderStyle = `flex:1;
        height:0;
        border-bottom:1px solid ${textColor};
        opacity:0.18;
        margin:0 5pt;
        position:relative;
        top:-3px;
        min-width:20pt;`;
    } else {
      // plain — just a spacer
      leaderStyle = `flex:1; min-width:8pt;`;
    }

    return `<a href="#${h.id}" style="
      display:flex;
      align-items:baseline;
      margin:${isBold ? "5pt" : "2.5pt"} 0;
      padding-left:${indent}pt;
      font-family:${fontFam};
      font-size:${fontSize}pt;
      color:${textColor};
      text-decoration:none;
    ">
      <span style="
        flex-shrink:0;
        font-weight:${isBold ? "bold" : "normal"};
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width:75%;
      ">${esc(text)}</span>
      <span style="${leaderStyle}"></span>
      <span style="
        flex-shrink:0;
        font-weight:${isBold ? "bold" : "normal"};
        min-width:16pt;
        text-align:right;
        color:${textColor};
        opacity:${page ? "1" : "0.35"};
      ">${page || "—"}</span>
    </a>`;
  }).join("\n");

  return `<div data-toc="true"${eidAttr} style="
    font-family:${fontFam};
    margin:0 0 18pt 0;
    padding:14pt 16pt;
    background:rgba(128,128,128,0.04);
    border-left:3px solid ${accentColor};
    border-radius:0 4px 4px 0;
    page-break-inside:avoid;
  ">${titleHtml}${entryRows}</div>`;
}


export function blockToHtml(block, st, opts = {}, overrides = {}) {
  const eid = block._eid ?? "";
  const eidAttr = eid !== "" ? ` data-eid="${eid}"` : "";
  const ov = overrides[eid] || "";  // extra inline CSS for this specific element

  switch (block.type) {
    case "toc": {
      // TOC rendered via buildTocHtml, called from blocksToHtml with heading context
      // This placeholder is replaced by the full TOC in blocksToHtml
      return `<div data-toc-placeholder="true"${eidAttr}></div>`;
    }
    case "heading": {
      const base = headingStyle(block, st);
      const style = mergeStyle(base, ov);
      return `<h${block.level} id="${block.id}"${eidAttr} style="${style}">${inlineHtml(block.inline, st)}</h${block.level}>`;
    }
    case "hr":
      return opts.hrPageBreak
        ? `<hr class="page-break"${eidAttr} style="border:none;border-top:1px dashed ${st.table.borderColor};margin:14pt 0;" />`
        : `<hr${eidAttr} style="border:none;border-top:1px dashed ${st.table.borderColor};margin:14pt 0;" />`;
    case "mermaid":
      return `<div class="mermaid-diagram"${eidAttr} data-mermaid="${esc(block.text)}" style="text-align:center;margin:14pt 0;min-height:180px;display:flex;justify-content:center;align-items:center;page-break-inside:avoid;break-inside:avoid;"></div>`;
    case "code": {
      const size = codeFontSize(block.text, st.page.fontSize - 1);
      const radius = st.code.borderRadius !== undefined ? `${st.code.borderRadius}px` : "4px";
      const codeBorder = st.code.border ? `border:1px solid ${st.code.borderColor || "#e5e7eb"};` : "";
      const base = `background:${st.code.bg};color:${st.code.color};padding:10pt;border-radius:${radius};${codeBorder}font-family:Consolas,'Courier New',monospace;font-size:${size}pt;line-height:1.45;white-space:pre;overflow:hidden;margin:8pt 0;`;
      const style = mergeStyle(base, ov);
      return `<pre${eidAttr} style="${style}">${esc(block.text)}</pre>`;
    }
    case "blockquote": {
      const bqBorderWidth = st.blockquote.borderWidth || 3;
      const bqBg = st.blockquote.bg && st.blockquote.bg !== "transparent"
        ? `background:${st.blockquote.bg};padding:4pt 12pt;`
        : "background:transparent;padding:2pt 0 2pt 12pt;";
      const base = `border-left:${bqBorderWidth}px solid ${st.blockquote.borderColor};margin:10pt 0;${bqBg}color:${st.blockquote.color};${st.blockquote.italic ? "font-style:italic;" : ""}`;
      const style = mergeStyle(base, ov);
      return `<blockquote${eidAttr} style="${style}">${block.lines.map((l) => inlineHtml(l, st)).join("<br/>")}</blockquote>`;
    }
    case "table": {
      const cellPad = "padding:5pt 8pt;";
      const headerAlign = st.table.headerAlign || "left";
      const th = block.headers
        .map((c, ci) => {
          const align = block.alignments?.[ci] || headerAlign;
          return `<th style="${cellPad}background:${st.table.headerBg};color:${st.table.headerColor};border:1px solid ${st.table.borderColor};text-align:${align};font-weight:bold;">${inlineHtml(c, st)}</th>`;
        })
        .join("");
      const trs = block.rows
        .map((r, ri) => {
          const bg = st.table.striped && ri % 2 === 1 ? `background:${st.table.stripeColor};` : "";
          return `<tr>${r.map((c, ci) => {
            const align = block.alignments?.[ci] || "left";
            return `<td style="${cellPad}border:1px solid ${st.table.borderColor};text-align:${align};${bg}">${inlineHtml(c, st)}</td>`;
          }).join("")}</tr>`;
        })
        .join("");
      const base = `border-collapse:collapse;width:100%;margin:10pt 0;${baseStyle(st)}`;
      const style = mergeStyle(base, ov);
      return `<table${eidAttr} style="${style}"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
    }
    case "html":
      return `<div${eidAttr} style="margin:8pt 0;">${block.raw}</div>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const start = block.ordered && block.start > 1 ? Number(block.start) : 1;
      const base = `margin:8pt 0;padding-left:0;list-style:none;`;
      const style = mergeStyle(base, ov);
      const bulletSymbols = ["•", "◦", "▪"];
      const bullet = bulletSymbols[0];
      const items = block.items
        .map((it, idx) => {
          const inline = it.inline || it;
          const marker = block.ordered ? `${start + idx}.` : bullet;
          const child = it.children
            ? listHtml({ ordered: it.children.ordered, start: it.children.start, items: it.children.items }, st, 1)
            : "";
          return `<li style="display:flex;align-items:flex-start;margin:3pt 0;">` +
            `<span style="display:inline-block;width:18pt;flex-shrink:0;user-select:none;line-height:inherit;">${marker}</span>` +
            `<div style="flex:1;min-width:0;">${inlineHtml(inline, st)}${child}</div>` +
            `</li>`;
        })
        .join("");
      return `<${tag}${eidAttr} style="${style}">${items}</${tag}>`;
    }
    case "callout": {
      const cfg = ALERT_STYLES[block.alertType] || ALERT_STYLES.note;
      const title = block.alertTitle || "Note";
      const content = block.lines.map((l) => inlineHtml(l, st)).join("<br/>");
      const base = `margin:10pt 0;padding:8pt 12pt;background:${cfg.bg};border-left:3.5px solid ${cfg.borderColor};border-radius:0 6px 6px 0;page-break-inside:avoid;`;
      const style = mergeStyle(base, ov);
      return `<div${eidAttr} class="gfm-callout gfm-callout-${block.alertType}" style="${style}">` +
        `<div style="display:flex;align-items:center;font-weight:bold;color:${cfg.color};font-size:${Math.max(st.page.fontSize - 0.5, 9)}pt;margin-bottom:4pt;letter-spacing:0.02em;">` +
        `${cfg.icon}<span>${esc(title)}</span>` +
        `</div>` +
        `<div style="color:${st.page.textColor};font-size:${st.page.fontSize}pt;line-height:${st.page.lineHeight};">${content}</div>` +
        `</div>`;
    }
    case "math": {
      let mathHtml = "";
      try {
        mathHtml = katex.renderToString(block.math || "", { throwOnError: false, displayMode: true });
      } catch {
        mathHtml = `<pre style="font-family:monospace;">${esc(block.math || "")}</pre>`;
      }
      const base = `margin:10pt 0;padding:10pt 14pt;text-align:center;overflow-x:auto;background:rgba(128,128,128,0.03);border:1px solid ${st.table.borderColor};border-radius:6px;page-break-inside:avoid;`;
      const style = mergeStyle(base, ov);
      return `<div${eidAttr} class="math-block" style="${style}">${mathHtml}</div>`;
    }
    case "footnotes": {
      const notesHtml = (block.notes || [])
        .map((n) => {
          return `<li id="fn-${esc(n.id)}" style="margin:4pt 0;font-size:${Math.max(st.page.fontSize - 1.5, 8)}pt;color:${st.page.textColor};opacity:0.85;">` +
            `${inlineHtml(n.runs, st)} <a href="#fnref-${esc(n.id)}" style="color:${st.link.color};text-decoration:none;margin-left:4pt;font-weight:bold;" title="Jump back">↩</a>` +
            `</li>`;
        })
        .join("");
      const base = `margin-top:20pt;padding-top:10pt;border-top:1px solid ${st.table.borderColor};page-break-inside:avoid;`;
      const style = mergeStyle(base, ov);
      return `<div${eidAttr} class="footnotes-section" style="${style}">` +
        `<div style="font-size:9pt;font-weight:bold;color:${st.page.textColor};opacity:0.7;margin-bottom:6pt;text-transform:uppercase;letter-spacing:0.04em;">Footnotes</div>` +
        `<ol style="padding-left:16pt;margin:0;">${notesHtml}</ol>` +
        `</div>`;
    }
    default: {
      const base = `margin:0 0 8pt 0;`;
      const style = mergeStyle(base, ov);
      return `<p${eidAttr} style="${style}">${inlineHtml(block.inline, st)}</p>`;
    }
  }
}

export function blocksToHtml(blocks, st, opts = {}, overrides = {}) {
  // Collect all heading blocks for TOC generation
  const headings = blocks.filter((b) => b.type === "heading");
  const pageMap  = opts.pageMap  || {};
  const tocOpts  = opts.tocOptions || {};

  // Decide whether to auto-prepend TOC at the top
  const hasTocMarker   = blocks.some((b) => b.type === "toc");
  const insertAtTop    = !hasTocMarker && tocOpts.enabled && tocOpts.insertAtTop;

  let blocksToRender = blocks;
  if (insertAtTop) {
    blocksToRender = [{ type: "toc" }, ...blocks];
  }

  const parts = blocksToRender.map((b, i) => {
    if (b.type === "toc") {
      // Only render if TOC is enabled (either by marker or by panel toggle)
      if (!tocOpts.enabled && !hasTocMarker) return "";
      return buildTocHtml(headings, st, tocOpts, pageMap, ` data-eid="${i}"`);
    }
    return blockToHtml({ ...b, _eid: i }, st, opts, overrides);
  });

  return parts.join("\n");
}
