/* Markdown → block tokens with inline runs.
   One parser feeds three renderers: HTML preview, .docx export, PDF export.

   Inline runs are flat with formatting flags, so nesting like
   **`git pull` fails** (code inside bold) parses correctly:
   { t:"code", text:"git pull", bold:true }, { t:"text", text:" fails", bold:true } */

const INLINE_RE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

export function parseInline(text, flags = {}) {
  const runs = [];
  const re = new RegExp(INLINE_RE.source, "g");
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ t: "text", text: text.slice(last, m.index), ...flags });
    if (m[1]) runs.push(...parseInline(m[2], { ...flags, bold: true }));
    else if (m[3]) runs.push(...parseInline(m[4], { ...flags, italic: true }));
    else if (m[5]) runs.push({ t: "code", text: m[6], ...flags });
    else if (m[7]) runs.push({ t: "link", text: m[8], href: m[9], ...flags });
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

    // fenced code block
    if (line.trim().startsWith("```")) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: "code", text: buf.join("\n") });
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
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // lists — one nesting level, and the literal start number is preserved
    // so "3. …" after an interruption keeps numbering instead of restarting at 1
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
          // nested list under the previous item
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
      !lines[i].includes("|")
    ) { buf.push(lines[i]); i++; }
    blocks.push({ type: "paragraph", inline: parseInline(buf.join("\n")) });
  }

  return blocks;
}

/* Auto-fit font size for code blocks: shrink so the longest line fits the
   printable width instead of wrapping and orphaning words. Shared by the
   HTML renderer (preview/PDF) and the .docx export. ~471pt printable width,
   monospace advance ≈ 0.55em → size ≤ 785 / longestLine. */
export function codeFontSize(text, defaultPt) {
  const maxLen = Math.max(1, ...text.split("\n").map((l) => l.length));
  const fit = 785 / maxLen;
  return Math.max(6, Math.min(defaultPt, Math.floor(fit * 2) / 2));
}
