/* previewPanel.js
   Manages the VS Code WebviewPanel that renders the markdown preview
   using the exact same renderHtml + templates logic as the frontend. */

import * as vscode from "vscode";
import { parseMarkdown } from "@shared/parser";
import { blocksToHtml, baseStyle } from "@shared/renderHtml";
import { TEMPLATES } from "@shared/templates";

// Keep one panel per document URI so we don't open duplicates
const panels = new Map();

export function openPreview(uri, context) {
  const key = uri.toString();

  // If a panel already exists for this file, reveal it
  if (panels.has(key)) {
    panels.get(key).reveal();
    return;
  }

  const fileName = uri.path.split("/").pop().replace(/\.md$/i, "");
  const panel = vscode.window.createWebviewPanel(
    "md-to-docs.preview",
    `Preview: ${fileName}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panels.set(key, panel);
  panel.onDidDispose(() => panels.delete(key));

  // Get the default template styles (Boardroom)
  const templateKey = Object.keys(TEMPLATES)[0];
  const styles = TEMPLATES[templateKey].styles;

  const render = (md) => {
    const blocks = parseMarkdown(md);
    const bodyHtml = blocksToHtml(blocks, styles);
    panel.webview.html = buildWebviewHtml(bodyHtml, styles, fileName);
  };

  // Initial render from disk
  vscode.workspace.fs.readFile(uri).then((bytes) => {
    render(new TextDecoder().decode(bytes));
  });

  // Re-render whenever the document is saved
  const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.uri.toString() === key) {
      render(doc.getText());
    }
  });

  // Also re-render on every keystroke (live preview)
  const changeListener = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document.uri.toString() === key) {
      render(e.document.getText());
    }
  });

  panel.onDidDispose(() => {
    saveListener.dispose();
    changeListener.dispose();
  });

  context.subscriptions.push(saveListener, changeListener);
}

function buildWebviewHtml(bodyHtml, styles, fileName) {
  const bg = styles.page.bg || "#ffffff";
  const fontFamily = styles.page.fontFamily;
  const fontSize = styles.page.fontSize;
  const textColor = styles.page.textColor;
  const lineHeight = styles.page.lineHeight;

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview: ${escHtml(fileName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #1e1e1e;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
    }

    .toolbar {
      width: 794px;
      max-width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .toolbar-label {
      color: #888;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .template-select {
      background: #2d2d2d;
      color: #ccc;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      outline: none;
    }

    .page {
      width: 794px;
      max-width: 100%;
      background: ${bg};
      color: ${textColor};
      font-family: ${fontFamily};
      font-size: ${fontSize}pt;
      line-height: ${lineHeight};
      padding: 72px 80px;
      border-radius: 4px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      margin-bottom: 32px;
      overflow-wrap: break-word;
    }

    /* Make images responsive inside the page */
    .page img {
      max-width: 100%;
      height: auto;
    }

    /* Badge images keep their natural height */
    .page img[style*="height:28px"],
    .page img[style*="height: 28px"] {
      height: 24px !important;
      width: auto !important;
    }

    /* Tables */
    .page table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
    }

    /* Code blocks */
    .page pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-label">📄 ${escHtml(fileName)}.md — Live Preview</span>
    <span class="toolbar-label" style="color:#4ec9b0;">MD → Docs</span>
  </div>
  <div class="page" id="page">
    ${bodyHtml}
  </div>
  <script>
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', fontFamily: 'inherit' });
    (async function() {
      const els = document.querySelectorAll('.mermaid-diagram');
      let id = 0;
      for (const el of els) {
        const code = el.getAttribute('data-mermaid');
        if (!code) continue;
        try {
          const { svg } = await mermaid.render('mermaid-' + (id++), code);
          el.innerHTML = svg;
        } catch (e) {
          el.innerHTML = '<pre style="color:red;font-size:11px;">' + (e.message || 'Mermaid error') + '</pre>';
        }
      }
    })();
  </script>
</body>
</html>`;
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
