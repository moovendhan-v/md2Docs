/* Renders each preview page to canvas and assembles a real PDF.
   Root cause fix: renderHtml escapes & → &amp; in img src attrs (correct HTML),
   but fetch() needs the real & character. We decode HTML entities before fetching,
   then replace the encoded src in the HTML string with a base64 data URL so
   html2canvas never needs to make a network request at all. */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getPageGeometry } from "./page";
import { baseStyle } from "./renderHtml";

// ── image helpers ──────────────────────────────────────────────────────────────

/** Decode HTML-entity-encoded URLs (e.g. &amp; → &) so they can be fetched. */
function decodeHtmlUrl(encoded) {
  return encoded
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'");
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch one external image URL → base64 data URL.
 * Tries two approaches:
 *  1. fetch() with CORS (works for skillicons.dev, shields.io, most CDNs)
 *  2. HTMLImageElement + Canvas (fallback when server has CORS headers but
 *     fetch mode fails for other reasons)
 * Returns null if both approaches fail.
 */
async function fetchAsDataUrl(url) {
  // ── approach 1: direct fetch ───────────────────────────────────────────────
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob.size === 0) throw new Error("empty blob");
    const dataUrl = await blobToDataUrl(blob);
    if (dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:application/octet-stream")) {
      return dataUrl;
    }
    throw new Error("unexpected mime");
  } catch { /* fall through to proxy */ }

  // ── approach 2: weserv CORS proxy (bypasses CORS restrictions) ──────────────
  try {
    const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob.size === 0) throw new Error("empty blob");
    const dataUrl = await blobToDataUrl(blob);
    if (dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:application/octet-stream")) {
      return dataUrl;
    }
    throw new Error("unexpected mime");
  } catch { /* fall through to image element */ }

  // ── approach 3: load via HTMLImageElement → canvas ─────────────────────────
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const cleanup = (v) => { img.onload = null; img.onerror = null; resolve(v); };
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width  = img.naturalWidth  || 1;
          c.height = img.naturalHeight || 1;
          c.getContext("2d").drawImage(img, 0, 0);
          cleanup(c.toDataURL("image/png"));
        } catch { cleanup(null); }
      };
      img.onerror = () => cleanup(null);
      // Append cache-buster so browser doesn't serve a cached tainted resource
      img.src = url.includes("?") ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;
    });
  } catch { return null; }
}

/**
 * Scan HTML string for external img src attributes, fetch them all in parallel,
 * return a map of { decodedUrl → dataUrl }.
 */
async function buildImageCache(htmlPages) {
  const urlSet = new Set();
  const srcRe  = /src="(https?:\/\/[^"]+)"/gi;
  for (const html of htmlPages) {
    let m;
    const re = new RegExp(srcRe.source, "gi");
    while ((m = re.exec(html)) !== null) {
      urlSet.add(decodeHtmlUrl(m[1])); // decode &amp; etc. before fetching
    }
  }

  const cache = {};
  await Promise.all(
    [...urlSet].map(async (url) => {
      const du = await fetchAsDataUrl(url);
      if (du) cache[url] = du;
    })
  );
  return cache;
}

/**
 * Replace every external img src in an HTML string with the pre-fetched
 * base64 data URL from the cache.
 */
function inlineImages(html, cache) {
  return html.replace(/src="(https?:\/\/[^"]+)"/gi, (match, encodedUrl) => {
    const realUrl = decodeHtmlUrl(encodedUrl);
    return cache[realUrl] ? `src="${cache[realUrl]}"` : match;
  });
}

// ── main renderer ──────────────────────────────────────────────────────────────

export async function renderPdf(pages, styles) {
  const geom = getPageGeometry(styles.page.margin || "normal");

  // Pre-fetch every external image used across ALL pages in one parallel pass
  const imageCache = await buildImageCache(pages);

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-40000px;top:0;pointer-events:none;";
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pw  = pdf.internal.pageSize.getWidth();
    const ph  = pdf.internal.pageSize.getHeight();

    const showPageNumbers = styles.page.showPageNumbers !== false;
    const pageNumAlign    = styles.page.pageNumberAlign  || "center";
    const pageNumFormat   = styles.page.pageNumberFormat || "Page X of Y";
    const pageNumColor    = styles.page.pageNumberColor  || "#888888";
    const pageNumSize     = styles.page.pageNumberSize   || 8;

    const getLabel = (i) => {
      const x = i + 1; const y = pages.length;
      switch (pageNumFormat) {
        case "X / Y": return `${x} / ${y}`;
        case "X":     return `${x}`;
        case "— X —": return `— ${x} —`;
        default:      return `Page ${x} of ${y}`;
      }
    };

    const borderStyle = styles.page.borderStyle || "none";
    const borderColor = styles.page.borderColor || "#cccccc";
    const borderWidth = styles.page.borderWidth || 1;
    const borderInset = styles.page.borderInset || 8;

    for (let i = 0; i < pages.length; i++) {
      const paddingBottom = showPageNumbers
        ? `${Math.max(geom.marginY, 32)}px`
        : `${geom.marginY}px`;

      const pageEl = document.createElement("div");
      pageEl.style.cssText =
        `width:${geom.width}px;height:${geom.height}px;` +
        `background:${styles.page.bg || "#ffffff"};` +
        `padding:${geom.marginY}px ${geom.marginX}px;` +
        `padding-bottom:${paddingBottom};` +
        `box-sizing:border-box;overflow:hidden;position:relative;`;

      // Restricted page border box overlay
      if (borderStyle !== "none") {
        const borderOverlay = document.createElement("div");
        const bottomOffset = showPageNumbers
          ? `${Math.max(geom.marginY - 8, borderInset + 16)}px`
          : `${borderInset}px`;
        borderOverlay.style.cssText =
          `position:absolute;` +
          `top:${borderInset}px;left:${borderInset}px;right:${borderInset}px;bottom:${bottomOffset};` +
          `border:${borderWidth}px ${borderStyle} ${borderColor};` +
          `pointer-events:none;box-sizing:border-box;`;
        pageEl.appendChild(borderOverlay);
      }

      // Inline images BEFORE setting innerHTML so no network requests are made
      const processedHtml = inlineImages(pages[i], imageCache);

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = baseStyle(styles);
      contentDiv.innerHTML = processedHtml;
      pageEl.appendChild(contentDiv);

      // Page number footer
      if (showPageNumbers) {
        const footer = document.createElement("div");
        const alignMap = { left: "flex-start", center: "center", right: "flex-end" };
        footer.style.cssText =
          `position:absolute;bottom:0;left:0;right:0;height:${geom.marginY}px;` +
          `display:flex;align-items:center;` +
          `justify-content:${alignMap[pageNumAlign] || "center"};` +
          `padding-left:${geom.marginX}px;padding-right:${geom.marginX}px;`;
        const span = document.createElement("span");
        span.style.cssText =
          `color:${pageNumColor};font-size:${pageNumSize}pt;` +
          `font-family:${styles.page.fontFamily};line-height:1;letter-spacing:0.04em;`;
        span.textContent = getLabel(i);
        footer.appendChild(span);
        pageEl.appendChild(footer);
      }

      host.appendChild(pageEl);

      // Wait a tick for data-URL images to decode in the newly appended element
      await new Promise((r) => setTimeout(r, 80));

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        backgroundColor: styles.page.bg || "#ffffff",
        logging: false,
        useCORS: true,      // belt-and-suspenders: also try CORS for any missed imgs
        allowTaint: true,   // don't throw on tainted canvas
        imageTimeout: 0,    // data URLs load instantly — no timeout needed
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pw, ph);
      host.removeChild(pageEl);
    }

    const blob = pdf.output("blob");
    return URL.createObjectURL(blob);
  } finally {
    host.remove();
  }
}

export function downloadBlobUrl(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
