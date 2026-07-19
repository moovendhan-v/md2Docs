/* sidebarPanel.js
   WebviewViewProvider that renders a live Markdown preview in the VS Code
   sidebar with template switching, PDF preview, and Word/PDF export. */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
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
    this._htmlLoaded = false;
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;

    const distPath = path.join(this.context.extensionPath, 'dist', 'client');

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(distPath)
      ],
      retainContextWhenHidden: true,
    };

    webviewView.webview.html = `<!DOCTYPE html><html><body><div style="padding: 20px; font-family: sans-serif; color: #888;">Opening preview...</div></body></html>`;

    // Handle messages from the webview (template change, export buttons)
    webviewView.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.type) {
          case "templateChange":
            this._templateKey = msg.key;
            this._refresh();
            break;
          case "exportPdf":
            this._handleExportPdf(msg.styles, msg.options);
            break;
          case "exportDocx":
            this._handleExportDocx(msg.styles, msg.options);
            break;
          case "pdfBytesGenerated":
            this._savePdfBytes(msg.data, msg.outputPath);
            break;
          case "pdfError":
            vscode.window.showErrorMessage(`MD → Docs: PDF export failed — ${msg.message}`);
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
      const fileName = path.basename(this._activeUri.fsPath, path.extname(this._activeUri.fsPath));

      if (!this._htmlLoaded) {
        const distPath = path.join(this.context.extensionPath, 'dist', 'client');
        const indexPath = path.join(distPath, 'index.html');
        let htmlContent = await fs.promises.readFile(indexPath, 'utf8');

        // Rewrite assets links
        htmlContent = htmlContent.replace(/(src|href)="\/assets\/([^"]+)"/g, (match, attr, assetName) => {
          const fileUri = vscode.Uri.file(path.join(distPath, 'assets', assetName));
          const webviewUri = this.view.webview.asWebviewUri(fileUri);
          return `${attr}="${webviewUri}"`;
        });

        this.view.webview.html = htmlContent;
        this._htmlLoaded = true;

        setTimeout(() => {
          this.view.webview.postMessage({
            type: "updateMarkdown",
            markdown: md,
            fileName: fileName
          });
        }, 1200);
      } else {
        this.view.webview.postMessage({
          type: "updateMarkdown",
          markdown: md,
          fileName: fileName
        });
      }
    } catch (err) {
      console.error("MD → Docs sidebar refresh error:", err);
    }
  }

  async _handleExportPdf(customStyles, customOptions) {
    if (!this._activeUri) {
      vscode.window.showErrorMessage("MD → Docs: No Markdown file open.");
      return;
    }

    const defaultUri = vscode.Uri.file(this._activeUri.fsPath.replace(/\.(md|markdown)$/i, ".pdf"));
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'PDF Document': ['pdf'] }
    });
    if (!saveUri) return;

    const styles = customStyles || TEMPLATES[this._templateKey].styles;
    const bg = styles.page.bg || "#ffffff";
    const marginPreset = styles.page.margin || "normal";
    const options = customOptions || {};

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
      async (progress) => {
        progress.report({ message: "Generating PDF document…" });
        if (this.view) {
          this.view.webview.postMessage({
            type: "generatePdfBytes",
            outputPath: saveUri.fsPath,
            bg: bg,
            marginPreset: marginPreset,
            showPageNumbers: options.showPageNumbers !== false,
            showTOC: options.showTOC === true
          });

          await new Promise((resolve) => {
            const disposable = this.view.webview.onDidReceiveMessage((msg) => {
              if (msg.type === "pdfBytesGenerated" || msg.type === "pdfError") {
                disposable.dispose();
                resolve();
              }
            });
          });
        }
      }
    );
  }

  async _savePdfBytes(base64Data, outputPath) {
    try {
      const buffer = Buffer.from(base64Data, "base64");
      await vscode.workspace.fs.writeFile(vscode.Uri.file(outputPath), buffer);

      const openBtn = "Open File";
      const result = await vscode.window.showInformationMessage(
        `✅ Saved: ${path.basename(outputPath)}`,
        openBtn
      );
      if (result === openBtn) {
        vscode.env.openExternal(vscode.Uri.file(outputPath));
      }
    } catch (err) {
      vscode.window.showErrorMessage(`MD → Docs: Failed to write PDF file — ${err.message}`);
    }
  }

  async _handleExportDocx(customStyles, customOptions) {
    if (!this._activeUri) {
      vscode.window.showErrorMessage("MD → Docs: No Markdown file open.");
      return;
    }

    const defaultUri = vscode.Uri.file(this._activeUri.fsPath.replace(/\.(md|markdown)$/i, ".docx"));
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'Word Document': ['docx'] }
    });
    if (!saveUri) return;

    const styles = customStyles || TEMPLATES[this._templateKey].styles;
    const options = customOptions || {};
    const outPath = saveUri.fsPath;
    let success = false;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
      async (progress) => {
        progress.report({ message: "Generating Word document…" });
        try {
          const bytes = await vscode.workspace.fs.readFile(this._activeUri);
          const md = new TextDecoder().decode(bytes);
          const blocks = parseMarkdown(md);

          await exportDocxToFile(blocks, styles, outPath, {
            hrPageBreak: options.hrPageBreak !== false,
            showPageNumbers: options.showPageNumbers !== false,
            showTOC: options.showTOC === true
          });
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
}
