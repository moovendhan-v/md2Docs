/* extension.js — main entry point for the MD → Docs VS Code extension.

   Commands registered:
     md-to-docs.preview     — Live preview webview (updates on every keystroke)
     md-to-docs.exportDocx  — Save .docx beside the source .md file
     md-to-docs.exportPdf   — Print the preview webview to PDF

   Sidebar:
     md-to-docs.sidebar     — WebviewViewProvider with live preview + export

   Editor title icons appear automatically on every .md file
   (configured in package.json contributes.menus.editor/title). */

import * as vscode from "vscode";
import * as path from "path";
import { parseMarkdown } from "@shared/parser";
import { TEMPLATES } from "@shared/templates";
import { openPreview } from "./previewPanel.js";
import { exportDocxToFile } from "./exportDocxNode.js";
import { SidebarProvider } from "./sidebarPanel.js";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns the URI of the currently active .md file, or shows an error. */
function getActiveMdUri() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("MD → Docs: No active editor.");
    return null;
  }
  const uri = editor.document.uri;
  if (!uri.fsPath.endsWith(".md") && !uri.fsPath.endsWith(".markdown")) {
    vscode.window.showErrorMessage("MD → Docs: Active file is not a Markdown file.");
    return null;
  }
  return uri;
}

/** Pick a template interactively (Quick Pick). */
async function pickTemplate() {
  const items = Object.entries(TEMPLATES).map(([key, t]) => ({
    label: t.name,
    description: key,
    key,
    styles: t.styles,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Choose a document template…",
    matchOnDescription: true,
  });

  return picked || null;
}

// ── activate ─────────────────────────────────────────────────────────────────

export function activate(context) {
  console.log("MD → Docs extension activated");

  // ── Sidebar WebviewView ─────────────────────────────────────────────────────
  const sidebarProvider = new SidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("md-to-docs.sidebar", sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // ── Preview ────────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("md-to-docs.preview", async (uriArg) => {
      const uri = uriArg || getActiveMdUri();
      if (!uri) return;
      openPreview(uri, context);
    })
  );

  // ── Export .docx ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("md-to-docs.exportDocx", async (uriArg) => {
      const uri = uriArg || getActiveMdUri();
      if (!uri) return;

      // Let user pick a template
      const template = await pickTemplate();
      if (!template) return; // cancelled

      const srcPath = uri.fsPath;
      const defaultUri = vscode.Uri.file(srcPath.replace(/\.(md|markdown)$/i, ".docx"));
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { 'Word Document': ['docx'] }
      });
      if (!saveUri) return;
      const outPath = saveUri.fsPath;
      let success = false;

      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
        async (progress) => {
          progress.report({ message: "Generating Word document…" });
          try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const md = new TextDecoder().decode(bytes);
            const blocks = parseMarkdown(md);

            await exportDocxToFile(blocks, template.styles, outPath);
            success = true;
          } catch (err) {
            vscode.window.showErrorMessage(`MD → Docs: Export failed — ${err.message}`);
            console.error(err);
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
    })
  );

  // ── Export PDF ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("md-to-docs.exportPdf", async (uriArg) => {
      const uri = uriArg || getActiveMdUri();
      if (!uri) return;

      const template = await pickTemplate();
      if (!template) return;

      const defaultUri = vscode.Uri.file(uri.fsPath.replace(/\.(md|markdown)$/i, ".pdf"));
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { 'PDF Document': ['pdf'] }
      });
      if (!saveUri) return;

      const fileName = path.basename(uri.fsPath, path.extname(uri.fsPath));
      const panel = vscode.window.createWebviewPanel(
        "md-to-docs.pdf",
        `Generating PDF: ${fileName}`,
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: true }
      );

      let success = false;

      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
        async (progress) => {
          progress.report({ message: "Generating PDF document…" });

          try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const md = new TextDecoder().decode(bytes);
            const blocks = parseMarkdown(md);

            const { blocksToHtml } = await import("@shared/renderHtml");
            const bodyHtml = blocksToHtml(blocks, template.styles);
            const styles = template.styles;
            const bg = styles.page.bg || "#ffffff";
            const marginPreset = styles.page.margin || "normal";

            panel.webview.html = buildPdfHtml(bodyHtml, styles, fileName, bg, marginPreset);

            // Wait for message from webview
            await new Promise((resolve) => {
              const disposable = panel.webview.onDidReceiveMessage(async (msg) => {
                if (msg.type === "pdfBytesGenerated") {
                  try {
                    const buffer = Buffer.from(msg.data, "base64");
                    await vscode.workspace.fs.writeFile(saveUri, buffer);
                    success = true;
                  } catch (err) {
                    vscode.window.showErrorMessage(`MD → Docs: Failed to write PDF file — ${err.message}`);
                  }
                  disposable.dispose();
                  panel.dispose();
                  resolve();
                } else if (msg.type === "pdfError") {
                  vscode.window.showErrorMessage(`MD → Docs: PDF export failed — ${msg.message}`);
                  disposable.dispose();
                  panel.dispose();
                  resolve();
                }
              });
            });
          } catch (err) {
            vscode.window.showErrorMessage(`MD → Docs: PDF export failed — ${err.message}`);
            panel.dispose();
          }
        }
      );

      if (success) {
        const openBtn = "Open File";
        const result = await vscode.window.showInformationMessage(
          `✅ Saved: ${path.basename(saveUri.fsPath)}`,
          openBtn
        );
        if (result === openBtn) {
          vscode.env.openExternal(saveUri);
        }
      }
    })
  );
}

export function deactivate() {}

// ── PDF webview HTML ──────────────────────────────────────────────────────────
function buildPdfHtml(bodyHtml, styles, fileName, bg, marginPreset) {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
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
  </style>
</head>
<body>
  <div class="page-wrap" id="pdfPage">
    ${bodyHtml}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('load', async () => {
      try {
        const pageEl = document.getElementById('pdfPage');
        if (!pageEl) {
          vscode.postMessage({ type: 'pdfError', message: 'No content found' });
          return;
        }

        function getPageGeometry(marginPreset) {
          let marginX = 83;
          let marginY = 75;
          if (marginPreset === "narrow") {
            marginX = 45;
            marginY = 38;
          } else if (marginPreset === "wide") {
            marginX = 113;
            marginY = 94;
          }
          return {
            width: 794,
            height: 1123,
            marginX,
            marginY,
            contentWidth: 794 - marginX * 2,
            contentHeight: 1123 - marginY * 2
          };
        }

        const geom = getPageGeometry('${marginPreset}');

        // 1. Measure and Paginate
        const measureDiv = document.createElement('div');
        measureDiv.style.position = 'fixed';
        measureDiv.style.left = '-20000px';
        measureDiv.style.top = '-20000px';
        measureDiv.style.width = geom.contentWidth + 'px';
        measureDiv.style.visibility = 'hidden';
        
        measureDiv.style.fontFamily = pageEl.style.fontFamily;
        measureDiv.style.fontSize = pageEl.style.fontSize;
        measureDiv.style.lineHeight = pageEl.style.lineHeight;
        measureDiv.style.color = pageEl.style.color;
        
        measureDiv.innerHTML = pageEl.innerHTML;
        document.body.appendChild(measureDiv);

        const blocks = Array.from(measureDiv.children);
        const pages = [];
        let current = [];
        let pageTop = 0;

        const closePage = () => {
          if (current.length) {
            pages.push(current.join(''));
            current = [];
          }
        };

        blocks.forEach((b) => {
          const top = b.offsetTop;
          const height = b.offsetHeight;
          
          if (b.classList.contains('page-break')) {
            closePage();
            pageTop = top + height;
            return;
          }
          
          const bottom = top + height;
          if (bottom - pageTop > geom.contentHeight && current.length > 0) {
            closePage();
            pageTop = top;
          }
          current.push(b.outerHTML);
        });
        closePage();
        document.body.removeChild(measureDiv);

        if (pages.length === 0) {
          pages.push(pageEl.innerHTML);
        }

        // 2. Render pages to canvas and build PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();

        const renderContainer = document.createElement('div');
        renderContainer.style.position = 'fixed';
        renderContainer.style.left = '-20000px';
        renderContainer.style.top = '-20000px';
        document.body.appendChild(renderContainer);

        for (let i = 0; i < pages.length; i++) {
          const wrapEl = document.createElement('div');
          wrapEl.style.width = geom.width + 'px';
          wrapEl.style.height = geom.height + 'px';
          wrapEl.style.background = '${bg}';
          wrapEl.style.padding = geom.marginY + 'px ' + geom.marginX + 'px';
          wrapEl.style.boxSizing = 'border-box';
          wrapEl.style.overflow = 'hidden';
          
          wrapEl.innerHTML = '<div style="font-family:' + pageEl.style.fontFamily + ';font-size:' + pageEl.style.fontSize + ';line-height:' + pageEl.style.lineHeight + ';color:' + pageEl.style.color + ';">' + pages[i] + '</div>';
          renderContainer.appendChild(wrapEl);

          const canvas = await html2canvas(wrapEl, {
            scale: 2,
            backgroundColor: '${bg}',
            useCORS: true,
            logging: false
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
          renderContainer.removeChild(wrapEl);
        }

        document.body.removeChild(renderContainer);

        const pdfOutput = pdf.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];
        vscode.postMessage({ type: 'pdfBytesGenerated', data: base64Data });
      } catch (err) {
        vscode.postMessage({ type: 'pdfError', message: err.message });
      }
    });
  </script>
</body>
</html>`;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
