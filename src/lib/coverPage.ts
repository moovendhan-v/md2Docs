//@ts-nocheck
/**
 * Cover Page Generator for MD → Docs.
 * Supports Executive, Modern Tech, and Academic layout presets.
 */

export interface CoverPageConfig {
  enabled: boolean;
  template: "executive" | "modern" | "academic";
  title?: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  date?: string;
  version?: string;
  abstract?: string;
}

export function renderCoverPageHtml(
  config: CoverPageConfig,
  styles: any,
  meta: { title?: string; author?: string; organization?: string; date?: string },
  geom: { width: number; height: number; marginTop: number; marginBottom: number; marginLeft: number; marginRight: number }
): string {
  if (!config || !config.enabled) return "";

  const title = config.title || meta.title || "Document Title";
  const subtitle = config.subtitle || "Enterprise Technical Report & Architecture Blueprint";
  const author = config.author || meta.author || "Author Name";
  const organization = config.organization || meta.organization || "Organization";
  const date = config.date || meta.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const version = config.version || "v1.0.0";
  const abstract = config.abstract || "This document outlines the architectural specifications, operational frameworks, and implementation guidelines adhering to enterprise-grade standards.";

  const fontFamily = styles.page?.fontFamily || "system-ui, -apple-system, sans-serif";
  const primaryColor = styles.title?.color || "#0284c7";
  const textColor = styles.page?.textColor || "#1e293b";

  if (config.template === "modern") {
    return `
      <div class="cover-page cover-modern" style="display:flex;flex-direction:column;justify-content:space-between;height:100%;font-family:${fontFamily};color:${textColor};padding:24pt 12pt;box-sizing:border-box;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${primaryColor};padding-bottom:12pt;">
          <div style="font-size:13pt;font-weight:700;letter-spacing:0.05em;color:${primaryColor};">${organization}</div>
          <div style="font-size:9pt;font-weight:600;background:${primaryColor}15;color:${primaryColor};padding:3pt 8pt;border-radius:12pt;">${version}</div>
        </div>

        <div style="margin:40pt 0;">
          <div style="font-size:10pt;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:${primaryColor};margin-bottom:8pt;">Technical Document</div>
          <h1 style="font-size:32pt;line-height:1.15;font-weight:800;color:${textColor};margin:0 0 14pt 0;">${title}</h1>
          <p style="font-size:14pt;line-height:1.4;color:#64748b;margin:0 0 24pt 0;">${subtitle}</p>
          
          <div style="background:#f8fafc;border-left:4px solid ${primaryColor};padding:14pt 16pt;border-radius:0 8pt 8pt 0;margin-top:20pt;">
            <div style="font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#475569;margin-bottom:6pt;">Abstract</div>
            <p style="font-size:10.5pt;line-height:1.55;color:#334155;margin:0;">${abstract}</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;border-top:1px solid #e2e8f0;padding-top:16pt;font-size:9.5pt;">
          <div>
            <div style="color:#64748b;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2pt;">Prepared By</div>
            <div style="font-weight:600;color:${textColor};">${author}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:#64748b;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2pt;">Release Date</div>
            <div style="font-weight:600;color:${textColor};">${date}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (config.template === "academic") {
    return `
      <div class="cover-page cover-academic" style="display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;height:100%;font-family:${fontFamily};color:${textColor};padding:40pt 20pt;box-sizing:border-box;">
        <div>
          <div style="font-size:12pt;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;margin-bottom:4pt;">${organization}</div>
          <div style="font-size:9.5pt;color:#94a3b8;">Publication Series: ${version}</div>
        </div>

        <div style="max-width:90%;">
          <h1 style="font-size:28pt;line-height:1.2;font-weight:700;color:${textColor};margin:0 0 12pt 0;">${title}</h1>
          <p style="font-size:13pt;font-style:italic;color:#64748b;margin:0 0 28pt 0;">${subtitle}</p>
          
          <div style="font-size:12pt;font-weight:600;margin-bottom:4pt;">${author}</div>
          <div style="font-size:10pt;color:#64748b;margin-bottom:24pt;">${organization}</div>

          <div style="background:#ffffff;border:1px solid #e2e8f0;padding:16pt 20pt;border-radius:6pt;text-align:justify;margin:0 auto;max-width:440px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size:10pt;font-weight:bold;text-align:center;margin-bottom:6pt;text-transform:uppercase;letter-spacing:0.05em;">Abstract</div>
            <p style="font-size:9.5pt;line-height:1.55;color:#475569;margin:0;">${abstract}</p>
          </div>
        </div>

        <div style="font-size:10pt;color:#64748b;border-top:1px solid #e2e8f0;width:100%;padding-top:12pt;">
          ${date}
        </div>
      </div>
    `;
  }

  // Executive default
  return `
    <div class="cover-page cover-executive" style="display:flex;flex-direction:column;justify-content:space-between;height:100%;font-family:${fontFamily};color:${textColor};padding:24pt 16pt;box-sizing:border-box;">
      <div style="border-left:6px solid ${primaryColor};padding-left:14pt;margin-top:10pt;">
        <div style="font-size:11pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${primaryColor};margin-bottom:4pt;">${organization}</div>
        <div style="font-size:8.5pt;color:#94a3b8;letter-spacing:0.05em;">CONFIDENTIAL & PROPRIETARY</div>
      </div>

      <div style="margin:40pt 0;">
        <h1 style="font-size:34pt;line-height:1.12;font-weight:900;color:${primaryColor};margin:0 0 14pt 0;letter-spacing:-0.02em;">${title}</h1>
        <p style="font-size:14pt;line-height:1.45;color:#475569;font-weight:400;margin:0 0 28pt 0;">${subtitle}</p>

        <div style="background:#f1f5f9;border-radius:8pt;padding:16pt 18pt;">
          <div style="font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${primaryColor};margin-bottom:6pt;">Executive Summary</div>
          <p style="font-size:10pt;line-height:1.6;color:#334155;margin:0;">${abstract}</p>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #cbd5e1;padding-top:14pt;font-size:9.5pt;">
        <div>
          <div style="color:#64748b;font-size:8.5pt;text-transform:uppercase;margin-bottom:2pt;">Prepared For</div>
          <div style="font-weight:700;color:${textColor};">${organization}</div>
          <div style="color:#64748b;">Author: ${author}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:#64748b;font-size:8.5pt;text-transform:uppercase;margin-bottom:2pt;">Document Version</div>
          <div style="font-weight:700;color:${primaryColor};">${version}</div>
          <div style="color:#64748b;">${date}</div>
        </div>
      </div>
    </div>
  `;
}
