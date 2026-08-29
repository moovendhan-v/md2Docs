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

export function getPageGeometry(marginPreset: any = "normal") {
  let marginTop = 75; // ~2cm
  let marginBottom = 75;
  let marginLeft = 83; // ~2.2cm
  let marginRight = 83;
  
  if (marginPreset === "narrow") {
    marginTop = 38; marginBottom = 38; marginLeft = 45; marginRight = 45;
  } else if (marginPreset === "wide") {
    marginTop = 94; marginBottom = 94; marginLeft = 113; marginRight = 113;
  } else if (typeof marginPreset === 'object' && marginPreset !== null) {
    marginTop = marginPreset.top ?? 75;
    marginBottom = marginPreset.bottom ?? 75;
    marginLeft = marginPreset.left ?? 83;
    marginRight = marginPreset.right ?? 83;
  }
  
  const width = 794;
  const height = 1123;
  return {
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginX: marginLeft, // Legacy fallback for now
    marginY: marginTop,  // Legacy fallback for now
    contentWidth: width - marginLeft - marginRight,
    contentHeight: height - marginTop - marginBottom,
  };
}
