/* A4 geometry at 96dpi. Shared by the paged preview and the PDF renderer,
   so what you see in preview is exactly what lands on each PDF page. */
export const PAGE = {
  width: 794,     // 210mm
  height: 1123,   // 297mm
  marginX: 83,    // ~2.2cm
  marginY: 75,    // ~2cm
};
export const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;   // 628
export const CONTENT_HEIGHT = PAGE.height - PAGE.marginY * 2; // 973
