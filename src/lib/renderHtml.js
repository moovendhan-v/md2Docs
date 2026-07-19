/* Tokens + styles → inline-styled HTML (used by preview + PDF renderer).
   Each block gets a data-eid="<index>" attribute so the ElementInspector can
   write per-element inline-style overrides that only affect that one block. */
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
  if (runs.length === 1 && runs[0].text === "") return "&nbsp;";
  return runs
    .map((r) => {
      const text = esc(r.text || "").replace(/\n/g, "<br/>");
      switch (r.t) {
        case "code":
          return wrapFlags(
            `<code style="background:${st.code.bg};color:${st.code.color};padding:1px 5px;border-radius:3px;font-family:Consolas,'Courier New',monospace;font-size:0.9em;">${text}</code>`, r);
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

function listHtml(list, st) {
  const tag = list.ordered ? "ol" : "ul";
  const start = list.ordered && list.start > 1 ? ` start="${list.start}"` : "";
  const items = list.items
    .map((it) => {
      const inline = it.inline || it;
      const child = it.children
        ? listHtml({ ordered: it.children.ordered, start: it.children.start, items: it.children.items }, st)
        : "";
      return `<li style="margin:3pt 0;">${inlineHtml(inline, st)}${child}</li>`;
    })
    .join("");
  return `<${tag}${start} style="margin:8pt 0;padding-left:22pt;">${items}</${tag}>`;
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

export function blockToHtml(block, st, opts = {}, overrides = {}) {
  const eid = block._eid ?? "";
  const eidAttr = eid !== "" ? ` data-eid="${eid}"` : "";
  const ov = overrides[eid] || "";  // extra inline CSS for this specific element

  switch (block.type) {
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
      return `<div class="mermaid-diagram"${eidAttr} data-mermaid="${esc(block.text)}" style="text-align:center;margin:12pt 0;"></div>`;
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
        : "padding:2pt 0 2pt 12pt;";
      const base = `border-left:${bqBorderWidth}px solid ${st.blockquote.borderColor};margin:10pt 0;${bqBg}color:${st.blockquote.color};${st.blockquote.italic ? "font-style:italic;" : ""}`;
      const style = mergeStyle(base, ov);
      return `<blockquote${eidAttr} style="${style}">${block.lines.map((l) => inlineHtml(l, st)).join("<br/>")}</blockquote>`;
    }
    case "table": {
      const cellPad = "padding:5pt 8pt;";
      const headerAlign = st.table.headerAlign || "left";
      const th = block.headers
        .map((c) => `<th style="${cellPad}background:${st.table.headerBg};color:${st.table.headerColor};border:1px solid ${st.table.borderColor};text-align:${headerAlign};font-weight:bold;">${inlineHtml(c, st)}</th>`)
        .join("");
      const trs = block.rows
        .map((r, ri) => {
          const bg = st.table.striped && ri % 2 === 1 ? `background:${st.table.stripeColor};` : "";
          return `<tr>${r.map((c) => `<td style="${cellPad}border:1px solid ${st.table.borderColor};${bg}">${inlineHtml(c, st)}</td>`).join("")}</tr>`;
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
      const start = block.ordered && block.start > 1 ? ` start="${block.start}"` : "";
      const base = `margin:8pt 0;padding-left:22pt;`;
      const style = mergeStyle(base, ov);
      const items = block.items
        .map((it) => {
          const inline = it.inline || it;
          const child = it.children
            ? listHtml({ ordered: it.children.ordered, start: it.children.start, items: it.children.items }, st)
            : "";
          return `<li style="margin:3pt 0;">${inlineHtml(inline, st)}${child}</li>`;
        })
        .join("");
      return `<${tag}${start}${eidAttr} style="${style}">${items}</${tag}>`;
    }
    default: {
      const base = `margin:0 0 8pt 0;`;
      const style = mergeStyle(base, ov);
      return `<p${eidAttr} style="${style}">${inlineHtml(block.inline, st)}</p>`;
    }
  }
}

export function blocksToHtml(blocks, st, opts = {}, overrides = {}) {
  return blocks
    .map((b, i) => blockToHtml({ ...b, _eid: i }, st, opts, overrides))
    .join("\n");
}
