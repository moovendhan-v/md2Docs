//@ts-nocheck
/* Renders each preview page to canvas and assembles a real PDF.
   Root cause fix: renderHtml escapes & → &amp; in img src attrs (correct HTML),
   but fetch() needs the real & character. We decode HTML entities before fetching,
   then replace the encoded src in the HTML string with a base64 data URL so
   html2canvas never needs to make a network request at all. */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getPageGeometry } from "./page";
import { baseStyle } from "./renderHtml";
import { renderMermaidDiagrams } from "./mermaid";

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

    // Pre-pass: map element IDs (headings/anchors) to their 1-based page number
    const idToPage = {};
    const parser = new DOMParser();
    pages.forEach((html, i) => {
      const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
      doc.querySelectorAll("[id]").forEach((el) => {
        idToPage[el.id] = i + 1;
      });
    });

    const showPageNumbers = styles.page.showPageNumbers !== false;
    const pageNumAlign    = styles.page.pageNumberAlign  || "center";
    const pageNumFormat   = styles.page.pageNumberFormat || "Page X of Y";
    const pageNumColor    = styles.page.pageNumberColor  || "#888888";
    const pageNumSize     = styles.page.pageNumberSize   || 8;

    const docMeta = styles.documentMeta || {};
    const interpolate = (str = "", pageIdx = 0) => {
      return str
        .replace(/{{page}}/gi, String(pageIdx + 1))
        .replace(/{{totalPages}}/gi, String(pages.length))
        .replace(/{{title}}|{{docTitle}}/gi, docMeta.title || styles.title?.text || "Document")
        .replace(/{{author}}/gi, docMeta.author || "")
        .replace(/{{organization}}|{{org}}/gi, docMeta.organization || "")
        .replace(/{{date}}/gi, docMeta.date || new Date().toLocaleDateString())
        .replace(/{{version}}/gi, docMeta.version || "");
    };

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

    // Header & Footer configs
    const headerCfg = styles.header || {};
    const footerCfg = styles.footer || {};
    const watermarkCfg = styles.watermark || {};

    for (let i = 0; i < pages.length; i++) {
      const pageEl = document.createElement("div");
      pageEl.style.cssText =
        `width:${geom.width}px;height:${geom.height}px;` +
        `background:${styles.page.bg || "#ffffff"};` +
        `padding:${geom.marginTop}px ${geom.marginRight}px ${geom.marginBottom}px ${geom.marginLeft}px;` +
        `box-sizing:border-box;overflow:hidden;position:relative;`;

      // Restricted page border box overlay
      if (borderStyle !== "none") {
        const borderOverlay = document.createElement("div");
        const bottomOffset = showPageNumbers
          ? `${Math.max(geom.marginBottom - 8, borderInset + 16)}px`
          : `${borderInset}px`;
        borderOverlay.style.cssText =
          `position:absolute;` +
          `top:${borderInset}px;left:${borderInset}px;right:${borderInset}px;bottom:${bottomOffset};` +
          `border:${borderWidth}px ${borderStyle} ${borderColor};` +
          `pointer-events:none;box-sizing:border-box;`;
        pageEl.appendChild(borderOverlay);
      }

      // Security / Draft Watermark Overlay
      if (watermarkCfg.enabled && watermarkCfg.text) {
        const wmEl = document.createElement("div");
        const angle = watermarkCfg.angle ?? -35;
        const opacity = watermarkCfg.opacity ?? 0.08;
        const wmColor = watermarkCfg.color || "#000000";
        const wmSize = watermarkCfg.fontSize || 52;
        wmEl.style.cssText =
          `position:absolute;top:50%;left:50%;` +
          `transform:translate(-50%,-50%) rotate(${angle}deg);` +
          `font-size:${wmSize}pt;font-weight:bold;color:${wmColor};opacity:${opacity};` +
          `font-family:${styles.page.fontFamily};text-transform:uppercase;` +
          `letter-spacing:0.1em;pointer-events:none;user-select:none;white-space:nowrap;z-index:1;`;
        wmEl.textContent = watermarkCfg.text;
        pageEl.appendChild(wmEl);
      }

      // Running Header
      if (headerCfg.enabled) {
        const headerEl = document.createElement("div");
        const headerRule = headerCfg.showRule !== false ? `border-bottom:1px solid ${borderColor};padding-bottom:4pt;` : "";
        headerEl.style.cssText =
          `position:absolute;top:0;left:0;right:0;height:${geom.marginTop}px;` +
          `display:flex;align-items:center;justify-content:space-between;` +
          `padding-left:${geom.marginLeft}px;padding-right:${geom.marginRight}px;` +
          `font-size:8pt;color:#888888;font-family:${styles.page.fontFamily};` +
          `${headerRule}`;

        const leftSpan = document.createElement("div");
        leftSpan.style.cssText = "display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50%;";
        if (headerCfg.logoUrl) {
          const logoImg = document.createElement("img");
          logoImg.src = headerCfg.logoUrl;
          logoImg.style.cssText = "height:16px;object-fit:contain;";
          leftSpan.appendChild(logoImg);
        }
        const leftTextSpan = document.createElement("span");
        leftTextSpan.textContent = interpolate(headerCfg.leftText || "{{title}}", i);
        leftSpan.appendChild(leftTextSpan);

        const rightSpan = document.createElement("div");
        rightSpan.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:45%;text-align:right;";
        rightSpan.textContent = interpolate(headerCfg.rightText || "{{organization}}", i);

        headerEl.appendChild(leftSpan);
        headerEl.appendChild(rightSpan);
        pageEl.appendChild(headerEl);
      }

      // Inline images BEFORE setting innerHTML so no network requests are made
      const processedHtml = inlineImages(pages[i], imageCache);

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = baseStyle(styles) + "position:relative;z-index:2;";
      contentDiv.innerHTML = processedHtml;
      await renderMermaidDiagrams(contentDiv);
      pageEl.appendChild(contentDiv);

      // Running Footer
      if (footerCfg.enabled || showPageNumbers) {
        const footer = document.createElement("div");
        const footerRule = footerCfg.showRule ? `border-top:1px solid ${borderColor};padding-top:4pt;` : "";
        footer.style.cssText =
          `position:absolute;bottom:0;left:0;right:0;height:${geom.marginBottom}px;` +
          `display:flex;align-items:center;justify-content:space-between;` +
          `padding-left:${geom.marginLeft}px;padding-right:${geom.marginRight}px;` +
          `font-size:${pageNumSize}pt;color:${pageNumColor};font-family:${styles.page.fontFamily};` +
          `${footerRule}`;

        const leftFooter = document.createElement("div");
        leftFooter.style.cssText = "font-size:7.5pt;color:#888888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:45%;";
        leftFooter.textContent = footerCfg.enabled ? interpolate(footerCfg.leftText || "Confidential", i) : "";

        const rightFooter = document.createElement("div");
        rightFooter.style.cssText = "font-size:${pageNumSize}pt;letter-spacing:0.04em;margin-left:auto;";
        rightFooter.textContent = showPageNumbers ? getLabel(i) : (footerCfg.enabled ? interpolate(footerCfg.rightText || "", i) : "");

        footer.appendChild(leftFooter);
        footer.appendChild(rightFooter);
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

      // Map interactive links from the DOM onto the PDF image
      const pageRect = pageEl.getBoundingClientRect();
      const scaleX = pw / pageRect.width;
      const scaleY = ph / pageRect.height;
      const links = pageEl.querySelectorAll("a[href]");

      for (const link of links) {
        const hrefAttr = link.getAttribute("href");
        if (!hrefAttr) continue;
        
        const rect = link.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const x = (rect.left - pageRect.left) * scaleX;
        const y = (rect.top - pageRect.top) * scaleY;
        const w = rect.width * scaleX;
        const h = rect.height * scaleY;

        if (hrefAttr.startsWith("#")) {
          // Internal link (e.g. TOC jump)
          const targetId = hrefAttr.substring(1);
          const targetPage = idToPage[targetId];
          if (targetPage) {
            pdf.link(x, y, w, h, { pageNumber: targetPage });
          }
        } else {
          // External link
          pdf.link(x, y, w, h, { url: link.href });
        }
      }

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
