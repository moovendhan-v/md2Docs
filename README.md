# MD → Docs Converter (MVP v3)

Convert Markdown into templated, styled documents with a paginated A4 preview.
Export a **real .docx** (opens in MS Word / Google Docs / LibreOffice) or a
**rendered PDF** with an in-app viewer.

Built with **React + Vite + Zustand + Tailwind + shadcn/ui**.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **Paginated preview** — the document is split into real A4 pages
  (Page 1 / N), exactly matching what lands in the PDF
- **Real .docx export** — built with the `docx` package (Office Open XML),
  not the old HTML-in-.doc trick, so files open everywhere
- **Rendered PDF** — generated in the browser (jsPDF + html2canvas) from the
  same page slices as the preview, shown in an in-app viewer before download
- **Dark mode** — toggle in the header; follows your system preference on load.
  The document sheets stay white (they're paper), the app chrome goes dark
- **Design drawer** — visual template gallery (miniature documents drawn with
  each template's real colors) + per-element style controls
  (Document / Title / Headings / Tables / Code / Blockquotes / Links).
  Everything applies live
- **Drag & drop** — drop a `.md` file anywhere in the window, or use Upload

## v3 fixes (from real-document testing)

- **Anchor links work in Word** — headings get Bookmarks; `[text](#anchor)`
  exports as an InternalHyperlink, so a Table of Contents actually navigates
- **Ordered lists no longer restart at 1** — the literal start number is
  preserved (`3.` stays `3.`) even when a list is interrupted by code blocks
  or nested bullets; one level of nested lists is supported in preview,
  .docx, and PDF
- **Formatting nests correctly** — `**\`code\` inside bold**` renders as
  bold code, not literal backticks (inline runs carry bold/italic flags)
- **Code blocks auto-fit** — the font size shrinks so the longest line fits
  the printable width; ASCII trees and tables stay aligned instead of
  wrapping and orphaning words (applies to preview, .docx, and PDF)
- **Huge code blocks paginate** — a code block taller than a page is split
  line-by-line across pages in the preview/PDF instead of being clipped

## Architecture

```
src/
  App.jsx                    layout, dark mode, drag & drop
  store/useDocStore.js       Zustand store (markdown, template, styles, pages, dark)
  lib/parser.js              markdown → block tokens (ONE parser, three renderers)
  lib/renderHtml.js          tokens + styles → inline-styled HTML (preview + PDF)
  lib/exportDocx.js          tokens + styles → real .docx via `docx`
  lib/exportPdf.js           preview pages → PDF via jsPDF + html2canvas
  lib/page.js                shared A4 geometry (preview and PDF use the same numbers)
  lib/templates.js           template style sheets + demo markdown
  components/PagedPreview.jsx    measures blocks, splits into A4 pages
  components/StylesDrawer.jsx    shadcn Sheet: Templates | Styles tabs
  components/TemplateGallery.jsx visual template cards
  components/CustomizePanel.jsx  per-element style controls
  components/PdfDialog.jsx       in-app PDF renderer + viewer
  components/ui/                 shadcn/ui components
```

The key design decision: **one parser feeds three renderers** (HTML preview,
.docx, PDF), and the preview + PDF share the same page geometry (`lib/page.js`)
and page slices — so preview, PDF, and DOCX always agree on styling.

## Server-side PDF (Next.js upgrade path)

The client-side PDF rasterizes pages to images (crisp at 2x scale, but text is
not selectable). For production-grade vector PDFs, add a Next.js API route:

```js
// app/api/pdf/route.js
import puppeteer from "puppeteer";

export async function POST(req) {
  const { html } = await req.json(); // send blocksToHtml(blocks, styles)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(
    `<html><head><style>@page{size:A4;margin:2cm 2.2cm;}</style></head><body>${html}</body></html>`
  );
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return new Response(pdf, { headers: { "Content-Type": "application/pdf" } });
}
```

Because rendering already flows through `blocksToHtml()`, the server route
consumes the exact same HTML — no duplicate styling logic.
