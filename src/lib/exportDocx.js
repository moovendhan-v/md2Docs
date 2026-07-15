/* Tokens + styles → real .docx via the `docx` package.
   Opens natively in MS Word, Google Docs, LibreOffice.

   - Headings get Bookmarks; [link](#anchor) becomes an InternalHyperlink,
     so tables of contents actually navigate inside Word.
   - Ordered lists keep their source start number (no restart-at-1 bugs).
   - Code blocks auto-fit their font size so long lines don't wrap badly. */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ExternalHyperlink, InternalHyperlink,
  Bookmark, LevelFormat, Footer, PageNumber, PageBreak,
} from "docx";
import { codeFontSize } from "./parser";

const hex = (c) => (c || "#000000").replace("#", "").toUpperCase();
const half = (pt) => Math.round(pt * 2); // docx font sizes are half-points
const CM = 567; // twips per cm

function runs(inline, st, opts = {}) {
  const out = [];
  for (const r of inline) {
    const common = {
      font: opts.font,
      size: opts.size,
      color: opts.color,
      allCaps: opts.allCaps,
      bold: opts.bold || r.bold,
      italics: opts.italics || r.italic,
    };
    const textParts = r.text.split("\n");
    switch (r.t) {
      case "code":
        textParts.forEach((part, idx) => {
          if (idx > 0) out.push(new TextRun({ ...common, text: "", break: 1 }));
          out.push(new TextRun({ ...common, text: part, font: "Consolas", shading: { fill: hex(st.code.bg) }, color: hex(st.code.color) }));
        });
        break;
      case "link": {
        textParts.forEach((part, idx) => {
          if (idx > 0) out.push(new TextRun({ ...common, text: "", break: 1 }));
          const child = new TextRun({ ...common, text: part, color: hex(st.link.color), underline: {} });
          if (r.href.startsWith("#")) {
            out.push(new InternalHyperlink({ anchor: r.href.slice(1), children: [child] }));
          } else {
            out.push(new ExternalHyperlink({ link: r.href, children: [child] }));
          }
        });
        break;
      }
      case "image":
        out.push(new TextRun({ ...common, text: `[Image: ${r.text || "Photo"}]`, color: "888888", italics: true }));
        break;
      default:
        textParts.forEach((part, idx) => {
          if (idx > 0) out.push(new TextRun({ ...common, text: "", break: 1 }));
          if (part !== "" || textParts.length === 1) {
            out.push(new TextRun({ ...common, text: part }));
          }
        });
    }
  }
  return out;
}

const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT };

export async function exportDocx(blocks, st, fileName, opts = {}) {
  const bodyFont = st.page.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
  const bodySize = half(st.page.fontSize);
  const bodyColor = hex(st.page.textColor);
  const spacing = { line: Math.round(st.page.lineHeight * 240), after: 120 };
  const border = { style: BorderStyle.SINGLE, size: 4, color: hex(st.table.borderColor) };
  const bodyOpts = { font: bodyFont, size: bodySize, color: bodyColor };

  const numbering = { config: [] };
  let olCount = 0;
  const children = [];

  const addOrderedRef = (start) => {
    const ref = `ol-${olCount++}`;
    numbering.config.push({
      reference: ref,
      levels: [
        {
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START,
          start,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1, format: LevelFormat.DECIMAL, text: "%2.", alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
        },
      ],
    });
    return ref;
  };

  const headingFont = st.heading.fontFamily && st.heading.fontFamily !== "default"
    ? st.heading.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
    : bodyFont;
  const titleFont = st.title.fontFamily && st.title.fontFamily !== "default"
    ? st.title.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
    : headingFont;

  for (const b of blocks) {
    switch (b.type) {
      case "heading": {
        // bookmark the heading so #anchor links can jump to it
        const mk = (opts) => [new Bookmark({ id: b.id, children: runs(b.inline, st, opts) })];
        if (b.isTitle) {
          children.push(new Paragraph({
            alignment: ALIGN[st.title.align] || AlignmentType.LEFT,
            spacing: { after: 280 },
            border: st.title.rule
              ? { bottom: { style: BorderStyle.SINGLE, size: 16, color: hex(st.title.ruleColor), space: 6 } }
              : undefined,
            children: mk({ font: titleFont, size: half(st.title.fontSize), color: hex(st.title.color), bold: true, allCaps: st.title.uppercase }),
          }));
        } else {
          const size = b.level <= 2 ? st.heading.fontSize : Math.max(st.heading.fontSize - 2, st.page.fontSize + 1);
          children.push(new Paragraph({
            spacing: { before: 320, after: 120 },
            children: mk({ font: headingFont, size: half(size), color: hex(st.heading.color), bold: true, allCaps: st.heading.uppercase }),
          }));
        }
        break;
      }
      case "paragraph":
        children.push(new Paragraph({ spacing, children: runs(b.inline, st, bodyOpts) }));
        break;
      case "list": {
        const ref = b.ordered ? addOrderedRef(b.start || 1) : null;
        for (const item of b.items) {
          children.push(new Paragraph({
            ...(b.ordered ? { numbering: { reference: ref, level: 0 } } : { bullet: { level: 0 } }),
            spacing: { line: spacing.line, after: 60 },
            children: runs(item.inline, st, bodyOpts),
          }));
          if (item.children) {
            const childRef = item.children.ordered ? addOrderedRef(item.children.start || 1) : null;
            for (const sub of item.children.items) {
              children.push(new Paragraph({
                ...(item.children.ordered
                  ? { numbering: { reference: childRef, level: 0 } }
                  : { bullet: { level: 1 } }),
                indent: item.children.ordered ? { left: 1440, hanging: 360 } : undefined,
                spacing: { line: spacing.line, after: 60 },
                children: runs(sub, st, bodyOpts),
              }));
            }
          }
        }
        break;
      }
      case "table": {
        const numCols = b.headers.length || 1;
        const colWidthPercent = 100 / numCols;

        const cell = (inline, isHeader, striped) =>
          new TableCell({
            width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
            shading: isHeader
              ? { fill: hex(st.table.headerBg) }
              : striped ? { fill: hex(st.table.stripeColor) } : undefined,
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [new Paragraph({
              children: runs(inline, st, {
                font: bodyFont, size: bodySize,
                color: isHeader ? hex(st.table.headerColor) : bodyColor,
                bold: isHeader,
              }),
            })],
          });
        const headerRow = new TableRow({ tableHeader: true, children: b.headers.map((h) => cell(h, true, false)) });
        const bodyRows = b.rows.map((r, ri) =>
          new TableRow({ children: r.map((c) => cell(c, false, st.table.striped && ri % 2 === 1)) })
        );
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: border, bottom: border, left: border, right: border,
            insideHorizontal: border, insideVertical: border,
          },
          rows: [headerRow, ...bodyRows],
        }));
        children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
        break;
      }
      case "blockquote":
        b.lines.forEach((l) =>
          children.push(new Paragraph({
            indent: { left: 360 },
            spacing,
            border: { left: { style: BorderStyle.SINGLE, size: 24, color: hex(st.blockquote.borderColor), space: 8 } },
            children: runs(l, st, { font: bodyFont, size: bodySize, color: hex(st.blockquote.color), italics: st.blockquote.italic }),
          }))
        );
        break;
      case "code": {
        const size = half(codeFontSize(b.text, st.page.fontSize - 1));
        b.text.split("\n").forEach((line) =>
          children.push(new Paragraph({
            shading: { fill: hex(st.code.bg) },
            spacing: { line: 240, after: 0 },
            children: [new TextRun({ text: line || " ", font: "Consolas", size, color: hex(st.code.color) })],
          }))
        );
        children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      }
      case "hr":
        if (opts.hrPageBreak !== false) {
          children.push(new Paragraph({
            pageBreakBefore: true,
            children: [],
          }));
        } else {
          children.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(st.table.borderColor), space: 1 } },
            spacing: { before: 120, after: 120 },
            children: [],
          }));
        }
        break;
      default:
        break;
    }
  }

  let topMargin = 2 * CM;
  let bottomMargin = 2 * CM;
  let leftMargin = 2.2 * CM;
  let rightMargin = 2.2 * CM;

  if (st.page.margin === "narrow") {
    topMargin = 1 * CM;
    bottomMargin = 1 * CM;
    leftMargin = 1.2 * CM;
    rightMargin = 1.2 * CM;
  } else if (st.page.margin === "wide") {
    topMargin = 2.5 * CM;
    bottomMargin = 2.5 * CM;
    leftMargin = 3 * CM;
    rightMargin = 3 * CM;
  }

  const doc = new Document({
    numbering: numbering.config.length ? numbering : undefined,
    styles: { default: { document: { run: { font: bodyFont, size: bodySize, color: bodyColor } } } },
    sections: [{
      properties: {
        page: { margin: { top: topMargin, bottom: bottomMargin, left: leftMargin, right: rightMargin } },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Page ",
                  font: bodyFont,
                  size: half(9),
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: bodyFont,
                  size: half(9),
                  color: "888888",
                }),
                new TextRun({
                  text: " of ",
                  font: bodyFont,
                  size: half(9),
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: bodyFont,
                  size: half(9),
                  color: "888888",
                }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
