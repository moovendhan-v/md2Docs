/* Tokens + styles → inline-styled HTML (used by preview + PDF renderer). */
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
  if (runs.length === 1 && runs[0].text === "") {
    return "&nbsp;";
  }
  return runs
    .map((r) => {
      const text = esc(r.text).replace(/\n/g, "<br/>");
      switch (r.t) {
        case "code":
          return wrapFlags(
            `<code style="background:${st.code.bg};color:${st.code.color};padding:1px 5px;border-radius:3px;font-family:Consolas,'Courier New',monospace;font-size:0.9em;">${text}</code>`, r);
        case "link":
          return wrapFlags(`<a href="${esc(r.href)}" style="color:${st.link.color};">${text}</a>`, r);
        default:
          return wrapFlags(text, r);
      }
    })
    .join("");
}

function headingStyle(block, st) {
  const fontFam = st.heading.fontFamily && st.heading.fontFamily !== "default"
    ? `font-family:${st.heading.fontFamily};`
    : "";
  if (block.isTitle) {
    const titleFontFam = st.title.fontFamily && st.title.fontFamily !== "default"
      ? `font-family:${st.title.fontFamily};`
      : fontFam;
    return (
      titleFontFam +
      `font-size:${st.title.fontSize}pt;color:${st.title.color};text-align:${st.title.align};` +
      (st.title.uppercase ? "text-transform:uppercase;letter-spacing:1px;" : "") +
      (st.title.rule ? `border-bottom:2px solid ${st.title.ruleColor};padding-bottom:8pt;` : "") +
      "margin:0 0 14pt 0;font-weight:bold;"
    );
  }
  const size = block.level <= 2 ? st.heading.fontSize : Math.max(st.heading.fontSize - 2, st.page.fontSize + 1);
  return (
    fontFam +
    `font-size:${size}pt;color:${st.heading.color};` +
    (st.heading.uppercase ? "text-transform:uppercase;letter-spacing:0.5px;" : "") +
    "margin:16pt 0 6pt 0;font-weight:bold;"
  );
}

function listHtml(list, st) {
  const tag = list.ordered ? "ol" : "ul";
  const start = list.ordered && list.start > 1 ? ` start="${list.start}"` : "";
  const items = list.items
    .map((it) => {
      // nested items arrive either as {inline, children} or plain run arrays
      const inline = it.inline || it;
      const child = it.children
        ? listHtml({ ordered: it.children.ordered, start: it.children.start, items: it.children.items }, st)
        : "";
      return `<li style="margin:3pt 0;">${inlineHtml(inline, st)}${child}</li>`;
    })
    .join("");
  return `<${tag}${start} style="margin:8pt 0;padding-left:22pt;">${items}</${tag}>`;
}

export function blockToHtml(block, st) {
  switch (block.type) {
    case "heading":
      return `<h${block.level} id="${block.id}" style="${headingStyle(block, st)}">${inlineHtml(block.inline, st)}</h${block.level}>`;
    case "hr":
      return `<hr class="page-break" style="border:none;border-top:1px dashed ${st.table.borderColor};margin:14pt 0;" />`;
    case "code": {
      const size = codeFontSize(block.text, st.page.fontSize - 1);
      return `<pre style="background:${st.code.bg};color:${st.code.color};padding:10pt;border-radius:4px;font-family:Consolas,'Courier New',monospace;font-size:${size}pt;line-height:1.45;white-space:pre;overflow:hidden;margin:8pt 0;">${esc(block.text)}</pre>`;
    }
    case "blockquote":
      return `<blockquote style="border-left:3px solid ${st.blockquote.borderColor};margin:10pt 0;padding:2pt 0 2pt 12pt;color:${st.blockquote.color};${st.blockquote.italic ? "font-style:italic;" : ""}">${block.lines.map((l) => inlineHtml(l, st)).join("<br/>")}</blockquote>`;
    case "table": {
      const cellPad = "padding:5pt 8pt;";
      const th = block.headers
        .map((c) => `<th style="${cellPad}background:${st.table.headerBg};color:${st.table.headerColor};border:1px solid ${st.table.borderColor};text-align:left;font-weight:bold;">${inlineHtml(c, st)}</th>`)
        .join("");
      const trs = block.rows
        .map((r, ri) => {
          const bg = st.table.striped && ri % 2 === 1 ? `background:${st.table.stripeColor};` : "";
          return `<tr>${r.map((c) => `<td style="${cellPad}border:1px solid ${st.table.borderColor};${bg}">${inlineHtml(c, st)}</td>`).join("")}</tr>`;
        })
        .join("");
      return `<table style="border-collapse:collapse;width:100%;margin:10pt 0;${baseStyle(st)}"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
    }
    case "list":
      return listHtml(block, st);
    default:
      return `<p style="margin:0 0 8pt 0;">${inlineHtml(block.inline, st)}</p>`;
  }
}

export function blocksToHtml(blocks, st) {
  return blocks.map((b) => blockToHtml(b, st)).join("\n");
}
