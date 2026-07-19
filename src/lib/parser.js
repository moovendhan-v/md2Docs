/* Markdown → block tokens with inline runs.
   One parser feeds three renderers: HTML preview, .docx export, PDF export.

   Inline runs are flat with formatting flags, so nesting like
   **`git pull` fails** (code inside bold) parses correctly:
   { t:"code", text:"git pull", bold:true }, { t:"text", text:" fails", bold:true }

   Raw HTML blocks (lines starting with < that contain block-level tags) are
   passed through verbatim so GitHub-flavored HTML like <div align="center">,
   <img ...>, <table> etc. render correctly in the preview. */

// Matches: ![alt](src){style} or ![alt](src) — image with optional {style attrs}
// Also matches: [![alt](src)](href) — linked image (badge pattern)
const INLINE_RE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\))|(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))/g;

export function parseInline(text, flags = {}) {
  const runs = [];
  const re = new RegExp(INLINE_RE.source, "g");
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ t: "text", text: text.slice(last, m.index), ...flags });
    if (m[1])       runs.push(...parseInline(m[2], { ...flags, bold: true }));
    else if (m[3])  runs.push(...parseInline(m[4], { ...flags, italic: true }));
    else if (m[5])  runs.push({ t: "code", text: m[6], ...flags });
    // [![alt](imgSrc)](href)  — badge / linked image
    else if (m[7])  runs.push({ t: "linked-image", text: m[8], src: m[9], href: m[10], ...flags });
    // ![alt](src)
    else if (m[11]) runs.push({ t: "image", text: m[12], src: m[13], ...flags });
    // [text](href)
    else if (m[14]) runs.push({ t: "link", text: m[15], href: m[16], ...flags });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ t: "text", text: text.slice(last), ...flags });
  return runs;
}

/* GitHub-style slugs so [link](#some-heading) anchors resolve. */
function slugify(text, used) {
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

// HTML block-level tags that should be passed through verbatim
const BLOCK_HTML_RE = /^<(div|img|table|thead|tbody|tr|td|th|section|article|header|footer|figure|figcaption|details|summary|br|hr|p|ul|ol|li|blockquote|pre|h[1-6]|sub|sup)[\s>\/]/i;

export function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const slugs = new Set();
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

    // ── raw HTML block ──────────────────────────────────────────────────────
    // Collect consecutive lines that are part of an HTML block.
    // We detect: opening <tag or </tag at the start of the trimmed line.
    const trimmed = line.trim();
    if (trimmed.startsWith("<") && (BLOCK_HTML_RE.test(trimmed) || trimmed.startsWith("</"))) {
      const htmlLines = [];
      // Collect until we hit a blank line OR a non-HTML line (like a heading)
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
        blocks.push({ type: "code", text: buf.join("\n") });
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
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(parseInline(lines[i].replace(/^\s*>\s?/, "")));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const parseRow = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => parseInline(c.trim()));
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

    // lists
    const lm = line.match(LIST_RE);
    if (lm) {
      const ordered = /\d/.test(lm[2]);
      const start = ordered ? parseInt(lm[2], 10) || 1 : 1;
      const items = [];
      while (i < lines.length) {
        const m2 = lines[i].match(LIST_RE);
        if (!m2) break;
        const indent = m2[1].length;
        const isOrdered = /\d/.test(m2[2]);
        if (indent >= 2 && items.length > 0) {
          const parent = items[items.length - 1];
          if (!parent.children) {
            parent.children = { ordered: isOrdered, start: isOrdered ? parseInt(m2[2], 10) || 1 : 1, items: [] };
          }
          parent.children.items.push(parseInline(m2[3]));
        } else {
          items.push({ inline: parseInline(m2[3]), children: null });
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
      !/^(#{1,6}\s|>|```)/.test(lines[i]) &&
      !LIST_RE.test(lines[i]) &&
      !lines[i].includes("|") &&
      !lines[i].trim().startsWith("<")
    ) { buf.push(lines[i]); i++; }
    blocks.push({ type: "paragraph", inline: parseInline(buf.join("\n")) });
  }

  return blocks;
}

/* Constant code font size — no auto-shrink. Always uses the provided default
   so all code blocks render at a consistent size regardless of line length. */
export function codeFontSize(_text, defaultPt) {
  return defaultPt;
}
