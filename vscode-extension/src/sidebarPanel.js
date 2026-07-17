/* sidebarPanel.js
   WebviewViewProvider that renders a live Markdown preview in the VS Code
   sidebar with template switching, PDF preview, and Word/PDF export. */

import * as vscode from "vscode";
import * as path from "path";
import { parseMarkdown } from "@shared/parser";
import { blocksToHtml, baseStyle } from "@shared/renderHtml";
import { TEMPLATES } from "@shared/templates";
import { exportDocxToFile } from "./exportDocxNode.js";

export class SidebarProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
    this._templateKey = Object.keys(TEMPLATES)[0];
    this._activeUri = undefined;
    this._disposables = [];
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true,
    };

    webviewView.webview.html = this._buildHtml("", null, "");

    // Handle messages from the webview (template change, export buttons)
    webviewView.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.type) {
          case "templateChange":
            this._templateKey = msg.key;
            this._refresh();
            break;
          case "exportPdf":
            this._handleExportPdf();
            break;
          case "exportDocx":
            this._handleExportDocx();
            break;
          case "printPdf":
            // Webview asked to trigger VS Code PDF print
            break;
        }
      },
      undefined,
      this._disposables
    );

    webviewView.onDidDispose(() => {
      this.view = undefined;
    }, null, this._disposables);

    // Watch for active editor changes
    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this._isMarkdown(editor.document.uri)) {
          this._activeUri = editor.document.uri;
          this._refresh();
        }
      })
    );

    // Watch for text changes
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (this._activeUri && e.document.uri.toString() === this._activeUri.toString()) {
          this._refresh();
        }
      })
    );

    // Watch for saves
    this._disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (this._activeUri && doc.uri.toString() === this._activeUri.toString()) {
          this._refresh();
        }
      })
    );

    // Set initial active file if any
    const editor = vscode.window.activeTextEditor;
    if (editor && this._isMarkdown(editor.document.uri)) {
      this._activeUri = editor.document.uri;
      this._refresh();
    }

    this.context.subscriptions.push(...this._disposables);
  }

  _isMarkdown(uri) {
    return uri.fsPath.endsWith(".md") || uri.fsPath.endsWith(".markdown");
  }

  async _refresh() {
    if (!this.view || !this._activeUri) return;

    try {
      const bytes = await vscode.workspace.fs.readFile(this._activeUri);
      const md = new TextDecoder().decode(bytes);
      const blocks = parseMarkdown(md);
      const styles = TEMPLATES[this._templateKey].styles;
      const bodyHtml = blocksToHtml(blocks, styles);
      const fileName = path.basename(this._activeUri.fsPath, path.extname(this._activeUri.fsPath));

      this.view.webview.html = this._buildHtml(bodyHtml, styles, fileName);
    } catch (err) {
      console.error("MD → Docs sidebar refresh error:", err);
    }
  }

  async _handleExportPdf() {
    if (!this._activeUri) {
      vscode.window.showErrorMessage("MD → Docs: No Markdown file open.");
      return;
    }

    const template = TEMPLATES[this._templateKey];
    const fileName = path.basename(this._activeUri.fsPath, path.extname(this._activeUri.fsPath));
    const outPath = this._activeUri.fsPath.replace(/\.(md|markdown)$/i, ".pdf");

    // Open a webview with print-to-PDF styling
    const panel = vscode.window.createWebviewPanel(
      "md-to-docs.pdf",
      `PDF Preview: ${fileName}`,
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(this._activeUri);
      const md = new TextDecoder().decode(bytes);
      const blocks = parseMarkdown(md);
      const bodyHtml = blocksToHtml(blocks, template.styles);

      panel.webview.html = buildPdfWebviewHtml(bodyHtml, template.styles, fileName);

      vscode.window.showInformationMessage(
        "📄 PDF preview opened. Use Cmd+P → 'Save as PDF' to export.",
        { modal: false }
      );
    } catch (err) {
      vscode.window.showErrorMessage(`MD → Docs: PDF preview failed — ${err.message}`);
    }
  }

  async _handleExportDocx() {
    if (!this._activeUri) {
      vscode.window.showErrorMessage("MD → Docs: No Markdown file open.");
      return;
    }

    const template = TEMPLATES[this._templateKey];
    const outPath = this._activeUri.fsPath.replace(/\.(md|markdown)$/i, ".docx");
    let success = false;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
      async (progress) => {
        progress.report({ message: "Generating Word document…" });
        try {
          const bytes = await vscode.workspace.fs.readFile(this._activeUri);
          const md = new TextDecoder().decode(bytes);
          const blocks = parseMarkdown(md);

          await exportDocxToFile(blocks, template.styles, outPath);
          success = true;
        } catch (err) {
          vscode.window.showErrorMessage(`MD → Docs: Export failed — ${err.message}`);
        }
      }
    );

    if (success) {
      const openBtn = "Open File";
      const result = await vscode.window.showInformationMessage(
        `✅ Saved: ${path.basename(outPath)}`,
        openBtn
      );
      if (result === openBtn) {
        vscode.env.openExternal(vscode.Uri.file(outPath));
      }
    }
  }

  _buildHtml(bodyHtml, styles, fileName) {
    const templateEntries = Object.entries(TEMPLATES);
    const currentTemplate = TEMPLATES[this._templateKey];
    const bg = styles ? (styles.page.bg || "#ffffff") : "#ffffff";
    const fontFamily = styles ? styles.page.fontFamily : "Arial, sans-serif";
    const fontSize = styles ? styles.page.fontSize : 11;
    const textColor = styles ? styles.page.textColor : "#1f2937";
    const lineHeight = styles ? styles.page.lineHeight : 1.55;

    const templateOptions = templateEntries
      .map(([key, t]) => {
        const selected = key === this._templateKey ? " selected" : "";
        return `<option value="${key}"${selected}>${t.name}</option>`;
      })
      .join("");

    if (!bodyHtml) {
      return /* html */ `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><style>${commonStyles()}</style></head>
<body>
  <div class="empty-state">
    <div class="empty-icon">📄</div>
    <div class="empty-title">MD → Docs</div>
    <div class="empty-hint">Open a Markdown file to preview it here.</div>
  </div>
</body>
</html>`;
    }

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${commonStyles()}</style>
</head>
<body>
  <div class="header">
    <div class="file-label">📄 ${escHtml(fileName)}.md</div>
    <div class="template-row">
      <label class="tpl-label">Template:</label>
      <select id="templateSelect" class="template-select">
        ${templateOptions}
      </select>
    </div>
  </div>

  <div class="content" id="content">
    <div class="page" style="background:${bg};color:${textColor};font-family:${fontFamily};font-size:${fontSize}pt;line-height:${lineHeight};">
      ${bodyHtml}
    </div>
  </div>

  <div class="actions">
    <button id="btnPdf" class="action-btn pdf-btn">📥 Download PDF</button>
    <button id="btnDocx" class="action-btn docx-btn">📥 Download Word</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById('templateSelect').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'templateChange', key: e.target.value });
    });

    document.getElementById('btnPdf').addEventListener('click', () => {
      vscode.postMessage({ type: 'exportPdf' });
    });

    document.getElementById('btnDocx').addEventListener('click', () => {
      vscode.postMessage({ type: 'exportDocx' });
    });
  </script>
</body>
</html>`;
  }
}

// ── Shared CSS ──────────────────────────────────────────────────────────────
function commonStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #1e1e1e;
      color: #ccc;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .header {
      padding: 10px 12px;
      border-bottom: 1px solid #333;
      background: #252526;
    }

    .file-label {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .template-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tpl-label {
      font-size: 11px;
      color: #999;
      white-space: nowrap;
    }

    .template-select {
      flex: 1;
      background: #333;
      color: #ccc;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
    }

    .template-select:focus {
      border-color: #007acc;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .page {
      border-radius: 4px;
      padding: 36px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      overflow-wrap: break-word;
      min-height: 200px;
    }

    .page img {
      max-width: 100%;
      height: auto;
    }

    .page table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0;
    }

    .page pre {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .actions {
      padding: 10px 12px;
      border-top: 1px solid #333;
      background: #252526;
      display: flex;
      gap: 8px;
    }

    .action-btn {
      flex: 1;
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .pdf-btn {
      background: #c7442a;
      color: #fff;
    }

    .pdf-btn:hover {
      background: #d4553c;
    }

    .docx-btn {
      background: #2b579a;
      color: #fff;
    }

    .docx-btn:hover {
      background: #3a6ab5;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 8px;
    }

    .empty-icon {
      font-size: 40px;
      opacity: 0.4;
    }

    .empty-title {
      font-size: 14px;
      font-weight: 600;
      color: #888;
    }

    .empty-hint {
      font-size: 11px;
      color: #666;
      text-align: center;
      max-width: 200px;
      line-height: 1.4;
    }
  `;
}

// ── PDF webview HTML ────────────────────────────────────────────────────────
function buildPdfWebviewHtml(bodyHtml, styles, fileName) {
  const bg = styles.page.bg || "#ffffff";

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(fileName)}</title>
  <style>
    @page { size: A4; margin: 2cm 2.2cm; }

    * { box-sizing: border-box; }

    body {
      font-family: ${styles.page.fontFamily};
      font-size: ${styles.page.fontSize}pt;
      color: ${styles.page.textColor};
      line-height: ${styles.page.lineHeight};
      background: ${bg};
      padding: 0;
      margin: 0;
    }

    .page-wrap {
      max-width: 794px;
      margin: 0 auto;
      padding: 72px 80px;
      background: ${bg};
    }

    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }

    @media print {
      body { background: white; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#1e1e1e;color:#ccc;padding:12px 24px;font-family:system-ui;font-size:13px;display:flex;justify-content:space-between;align-items:center;">
    <span>📄 ${escHtml(fileName)}.md — PDF Export Preview</span>
    <button onclick="window.print()" style="background:#4ec9b0;color:#000;border:none;padding:6px 16px;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <div class="page-wrap">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function escHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
