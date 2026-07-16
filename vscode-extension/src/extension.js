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

      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
        async (progress) => {
          progress.report({ message: "Generating Word document…" });
          try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const md = new TextDecoder().decode(bytes);
            const blocks = parseMarkdown(md);

            const srcPath = uri.fsPath;
            const outPath = srcPath.replace(/\.(md|markdown)$/i, ".docx");

            await exportDocxToFile(blocks, template.styles, outPath);

            const openBtn = "Open File";
            const result = await vscode.window.showInformationMessage(
              `✅ Saved: ${path.basename(outPath)}`,
              openBtn
            );
            if (result === openBtn) {
              vscode.env.openExternal(vscode.Uri.file(outPath));
            }
          } catch (err) {
            vscode.window.showErrorMessage(`MD → Docs: Export failed — ${err.message}`);
            console.error(err);
          }
        }
      );
    })
  );

  // ── Export PDF ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("md-to-docs.exportPdf", async (uriArg) => {
      const uri = uriArg || getActiveMdUri();
      if (!uri) return;

      const template = await pickTemplate();
      if (!template) return;

      const fileName = path.basename(uri.fsPath, path.extname(uri.fsPath));
      const panel = vscode.window.createWebviewPanel(
        "md-to-docs.pdf",
        `PDF Preview: ${fileName}`,
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const md = new TextDecoder().decode(bytes);
        const blocks = parseMarkdown(md);

        const { blocksToHtml } = await import("@shared/renderHtml");
        const bodyHtml = blocksToHtml(blocks, template.styles);
        const styles = template.styles;

        panel.webview.html = buildPdfHtml(bodyHtml, styles, fileName);

        vscode.window.showInformationMessage(
          "📄 Use Ctrl+P (or Cmd+P) → 'Save as PDF' to export.",
          { modal: false }
        );
      } catch (err) {
        vscode.window.showErrorMessage(`MD → Docs: PDF preview failed — ${err.message}`);
        console.error(err);
      }
    })
  );
}

export function deactivate() {}

// ── PDF webview HTML ──────────────────────────────────────────────────────────
function buildPdfHtml(bodyHtml, styles, fileName) {
  const bg = styles.page.bg || "#ffffff";

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(fileName)}</title>
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
    <span>📄 ${esc(fileName)}.md — PDF Export Preview</span>
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

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
