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

export function getPageGeometry(marginPreset = "normal") {
  let marginX = 83; // ~2.2cm (Normal)
  let marginY = 75; // ~2cm
  
  if (marginPreset === "narrow") {
    marginX = 45; // ~1.2cm
    marginY = 38; // ~1cm
  } else if (marginPreset === "wide") {
    marginX = 113; // ~3cm
    marginY = 94;  // ~2.5cm
  }
  
  const width = 794;
  const height = 1123;
  return {
    width,
    height,
    marginX,
    marginY,
    contentWidth: width - marginX * 2,
    contentHeight: height - marginY * 2,
  };
}
