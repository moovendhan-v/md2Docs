/* Markdown → block tokens with inline runs.
   One parser feeds three renderers: HTML preview, .docx export, PDF export. */

import { MarkdownBlock, MarkdownRun } from "../types";

// Matches:
// 1. Math block / inline: $...$
// 2. Footnote reference: [^id]
// 3. Bold: **...**
// 4. Italic: *...*
// 5. Code: `...`
// 6. Linked image: [![alt](src)](href)
// 7. Image: ![alt](src)
// 8. Link: [text](href)
const INLINE_RE = /(\$([^\$\n]+)\$)|(\[\^([a-zA-Z0-9_-]+)\])|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\))|(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))/g;

export function parseInline(text: string, flags: any = {}): MarkdownRun[] {
  const runs: MarkdownRun[] = [];
  const re = new RegExp(INLINE_RE.source, "g");
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ t: "text", text: text.slice(last, m.index), ...flags });
    if (m[1]) {
      // $math$
      runs.push({ t: "math", math: m[2], text: m[2], ...flags });
    } else if (m[3]) {
      // [^id] footnote ref
      runs.push({ t: "footnote-ref", footnoteId: m[4], text: `[${m[4]}]`, ...flags });
    } else if (m[5]) {
      runs.push(...parseInline(m[6], { ...flags, bold: true }));
    } else if (m[7]) {
      runs.push(...parseInline(m[8], { ...flags, italic: true }));
    } else if (m[9]) {
      runs.push({ t: "code", text: m[10], ...flags });
    } else if (m[11]) {
      // [![alt](imgSrc)](href)  — badge / linked image
      runs.push({ t: "linked-image", text: m[12], src: m[13], href: m[14], ...flags });
    } else if (m[15]) {
      // ![alt](src)
      runs.push({ t: "image", text: m[16], src: m[17], ...flags });
    } else if (m[18]) {
      // [text](href)
      runs.push({ t: "link", text: m[19], href: m[20], ...flags });
    }
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ t: "text", text: text.slice(last), ...flags });
  return runs;
}

/* GitHub-style slugs so [link](#some-heading) anchors resolve. */
function slugify(text: string, used: Set<string>) {
  let slug = text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (used.has(slug)) {
    let n = 1;
    while (used.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  used.add(slug);
  return slug;
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TASK_RE = /^\[([ xX])\]\s+(.*)$/;
const FOOTNOTE_DEF_RE = /^\[\^([a-zA-Z0-9_-]+)\]:\s+(.*)$/;

// HTML block-level tags that should be passed through verbatim
const BLOCK_HTML_RE = /^<(div|img|table|thead|tbody|tr|td|th|section|article|header|footer|figure|figcaption|details|summary|br|hr|p|ul|ol|li|blockquote|pre|h[1-6]|sub|sup)[\s>\/]/i;

export function parseMarkdown(md: string): MarkdownBlock[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  const slugs = new Set<string>();
  const footnoteDefs: Array<{ id: string; text: string; runs: MarkdownRun[] }> = [];
  let i = 0;
  let firstH1 = true;
  let lastWasEmpty = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      if (lastWasEmpty) {
        blocks.push({ type: "paragraph", inline: [{ t: "text", text: "" }] });
      }
      lastWasEmpty = true;
      i++;
      continue;
    }
    lastWasEmpty = false;

    // Footnote definition: [^id]: Text
    const fnMatch = line.match(FOOTNOTE_DEF_RE);
    if (fnMatch) {
      const fnId = fnMatch[1];
      const fnLines = [fnMatch[2]];
      i++;
      while (i < lines.length && (lines[i].startsWith("    ") || lines[i].startsWith("\t"))) {
        fnLines.push(lines[i].trim());
        i++;
      }
      footnoteDefs.push({
        id: fnId,
        text: fnLines.join(" "),
        runs: parseInline(fnLines.join(" ")),
      });
      continue;
    }

    // Table of Contents marker: [TOC] or [[toc]]
    if (/^\[\[?[Tt][Oo][Cc]\]?\]$/.test(line.trim())) {
      blocks.push({ type: "toc" });
      i++;
      continue;
    }

    // Math block: $$ ... $$
    if (line.trim().startsWith("$$")) {
      const mathLines: string[] = [];
      const inlineMath = line.trim().slice(2);
      if (inlineMath.endsWith("$$") && inlineMath.length > 2) {
        blocks.push({ type: "math", math: inlineMath.slice(0, -2).trim() });
        i++;
        continue;
      }
      if (inlineMath.length > 0) mathLines.push(inlineMath);
      i++;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().endsWith("$$")) {
        const lastPart = lines[i].trim().slice(0, -2);
        if (lastPart.length > 0) mathLines.push(lastPart);
        i++;
      }
      blocks.push({ type: "math", math: mathLines.join("\n").trim() });
      continue;
    }

    // ── raw HTML block ──────────────────────────────────────────────────────
    const trimmed = line.trim();
    if (trimmed.startsWith("<") && (BLOCK_HTML_RE.test(trimmed) || trimmed.startsWith("</"))) {
      const htmlLines = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !lines[i].trim().startsWith("```")
      ) {
        htmlLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "html", raw: htmlLines.join("\n") });
      continue;
    }

    // fenced code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().replace(/^```/, "").trim().toLowerCase();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      if (lang === "mermaid") {
        blocks.push({ type: "mermaid", text: buf.join("\n") });
      } else {
        blocks.push({ type: "code", text: buf.join("\n"), lang });
      }
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const isTitle = level === 1 && firstH1;
      if (isTitle) firstH1 = false;
      blocks.push({
        type: "heading", level, isTitle,
        id: slugify(h[2], slugs),
        inline: parseInline(h[2]),
      });
      i++;
      continue;
    }

    // horizontal rule
    if (line === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // blockquote OR GFM Alert / Callout
    if (line.trim().startsWith(">")) {
      const quoteLinesRaw: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLinesRaw.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }

      // Check for GFM Alert syntax: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
      const firstLine = quoteLinesRaw[0]?.trim() || "";
      const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+(.*))?$/i);

      if (alertMatch) {
        const alertType = alertMatch[1].toLowerCase() as "note" | "tip" | "important" | "warning" | "caution";
        const customTitle = alertMatch[2]?.trim() || "";
        const remainingLines = quoteLinesRaw.slice(1);
        const parsedLines = remainingLines.map((l) => parseInline(l));
        blocks.push({
          type: "callout",
          alertType,
          alertTitle: customTitle || (alertType.charAt(0).toUpperCase() + alertType.slice(1)),
          lines: parsedLines.length ? parsedLines : [[]],
        });
        continue;
      }

      const quoteLines = quoteLinesRaw.map((l) => parseInline(l));
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const parseRow = (l: string) => l.split("|").slice(1, -1).map(c => parseInline(c.trim()));
      const headers = parseRow(line);

      // Parse alignments from separator row (e.g. :---:)
      const alignRow = lines[i + 1].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const alignments = alignRow.map((col) => {
        const left = col.startsWith(":");
        const right = col.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        return "left";
      });

      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows, alignments });
      continue;
    }

    // lists & task lists
    const lm = line.match(LIST_RE);
    if (lm) {
      const ordered = /\d/.test(lm[2]);
      const start = ordered ? parseInt(lm[2], 10) || 1 : 1;
      const items = [];
      while (i < lines.length) {
        const m2 = lines[i].match(LIST_RE);
        if (!m2) break;
        const indent = m2[1].length;
        let content = m2[3];
        const isOrdered = /\d/.test(m2[2]);

        // Check if task checkbox
        let checked: boolean | undefined = undefined;
        const tm = content.match(TASK_RE);
        if (tm) {
          checked = tm[1].toLowerCase() === "x";
          content = tm[2];
        }

        if (indent >= 2 && items.length > 0) {
          const parent = items[items.length - 1];
          if (!parent.children) {
            parent.children = { ordered: isOrdered, start: isOrdered ? parseInt(m2[2], 10) || 1 : 1, items: [] };
          }
          parent.children.items.push({ inline: parseInline(content), checked });
        } else {
          items.push({ inline: parseInline(content), checked, children: null });
        }
        i++;
      }
      blocks.push({ type: "list", ordered, start, items });
      continue;
    }

    // paragraph
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|>|```|\$\$)/.test(lines[i]) &&
      !LIST_RE.test(lines[i]) &&
      !lines[i].includes("|") &&
      !lines[i].trim().startsWith("<") &&
      !FOOTNOTE_DEF_RE.test(lines[i])
    ) { buf.push(lines[i]); i++; }
    blocks.push({ type: "paragraph", inline: parseInline(buf.join("\n")) });
  }

  // Append footnotes section at the end if any were defined
  if (footnoteDefs.length > 0) {
    blocks.push({
      type: "footnotes",
      notes: footnoteDefs,
    });
  }

  return blocks;
}

export function codeFontSize(_text: string, defaultPt: number = 9): number {
  return defaultPt;
}

