/* Renders each preview page to canvas and assembles a real PDF in the browser.
   Returns a blob URL so the PDF can be shown in an in-app viewer before download.
   (For server-side vector PDFs, see README — Next.js + puppeteer route.) */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PAGE } from "./page";
import { baseStyle } from "./renderHtml";

export async function renderPdf(pages, styles) {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-20000px;top:0;`;
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = document.createElement("div");
      pageEl.style.cssText = `width:${PAGE.width}px;height:${PAGE.height}px;background:#ffffff;padding:${PAGE.marginY}px ${PAGE.marginX}px;box-sizing:border-box;overflow:hidden;`;
      pageEl.innerHTML = `<div style="${baseStyle(styles)}">${pages[i]}</div>`;
      host.appendChild(pageEl);

      const canvas = await html2canvas(pageEl, { scale: 2, backgroundColor: "#ffffff", logging: false });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, pw, ph);
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
