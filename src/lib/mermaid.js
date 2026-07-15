/* Lazy-loaded mermaid singleton.
   Renders <div class="mermaid-diagram"> elements into SVG once the DOM is ready. */
import mermaid from "mermaid";

let initialized = false;

export function initMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "inherit",
  });
  initialized = true;
}

let counter = 0;

export async function renderMermaidDiagrams(container) {
  if (!container) return;
  initMermaid();

  const els = container.querySelectorAll(".mermaid-diagram:not(.rendered)");
  for (const el of els) {
    const code = el.getAttribute("data-mermaid");
    if (!code) continue;
    try {
      const id = `mermaid-${counter++}`;
      const { svg } = await mermaid.render(id, code);
      el.innerHTML = svg;
      el.classList.add("rendered");
    } catch (err) {
      el.innerHTML = `<pre style="color:red;font-size:11px;">${err.message || "Mermaid render error"}</pre>`;
      el.classList.add("rendered");
    }
  }
}

/* Render mermaid text to an SVG string (used by docx/pdf export). */
export async function renderMermaidSvg(text) {
  initMermaid();
  const id = `mermaid-export-${counter++}`;
  const { svg } = await mermaid.render(id, text);
  return svg;
}
