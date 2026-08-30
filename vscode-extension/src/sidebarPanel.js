/* sidebarPanel.js
   WebviewViewProvider that renders the React frontend webview
   inside the VS Code sidebar with live syncing, templates, and export. */

import * as vscode from "vscode";
import * as path from "path";
import { parseMarkdown } from "@shared/parser";
import { TEMPLATES } from "@shared/templates";
import { exportDocxToFile } from "./exportDocxNode.js";

export class SidebarProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
    this._templateKey = Object.keys(TEMPLATES)[0] || "boardroom";
    this._activeUri = undefined;
    this._disposables = [];
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;

    const distPath = path.join(this.context.extensionPath, "dist", "client");

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(distPath),
        vscode.Uri.file(path.join(this.context.extensionPath, "dist")),
      ],
      retainContextWhenHidden: true,
    };

    // Set webview HTML
    this._setWebviewHtml(distPath);

    // Handle messages from the React webview
    webviewView.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.type) {
          case "ready":
          case "webviewReady":
            this._sendMarkdownToWebview();
            break;
          case "templateChange":
            this._templateKey = msg.key;
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
          this._sendMarkdownToWebview();
        }
      })
    );

    // Watch for text changes
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (this._activeUri && e.document.uri.toString() === this._activeUri.toString()) {
          this._sendMarkdownToWebview();
        }
      })
    );

    // Watch for saves
    this._disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (this._activeUri && doc.uri.toString() === this._activeUri.toString()) {
          this._sendMarkdownToWebview();
        }
      })
    );

    // Set initial active file if any
    const editor = vscode.window.activeTextEditor;
    if (editor && this._isMarkdown(editor.document.uri)) {
      this._activeUri = editor.document.uri;
    }

    this.context.subscriptions.push(...this._disposables);
  }

  _isMarkdown(uri) {
    if (!uri || !uri.fsPath) return false;
    return uri.fsPath.endsWith(".md") || uri.fsPath.endsWith(".markdown");
  }

  _setWebviewHtml(distPath) {
    if (!this.view) return;

    const appJsUri = this.view.webview.asWebviewUri(vscode.Uri.file(path.join(distPath, "app.js")));
    const appCssUri = this.view.webview.asWebviewUri(vscode.Uri.file(path.join(distPath, "app.css")));
    const cspSource = this.view.webview.cspSource;

    this.view.webview.html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data: blob:; style-src ${cspSource} 'unsafe-inline' https:; script-src ${cspSource} 'unsafe-inline' 'unsafe-eval' https:; font-src ${cspSource} https: data:; connect-src ${cspSource} https: data: blob:;" />
  <link rel="stylesheet" href="${appCssUri}" />
  <title>MD to Docs</title>
</head>
<body class="antialiased bg-background text-foreground">
  <div id="root"></div>
  <script src="${appJsUri}"></script>
</body>
</html>`;

    // Send markdown after React mounts
    setTimeout(() => {
      this._sendMarkdownToWebview();
    }, 200);
    setTimeout(() => {
      this._sendMarkdownToWebview();
    }, 800);
  }

  async _sendMarkdownToWebview() {
    if (!this.view) return;

    if (!this._activeUri) {
      const editor = vscode.window.activeTextEditor;
      if (editor && this._isMarkdown(editor.document.uri)) {
        this._activeUri = editor.document.uri;
      }
    }

    if (!this._activeUri) return;

    try {
      let md = "";
      const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === this._activeUri.toString());
      if (doc) {
        md = doc.getText();
      } else {
        const bytes = await vscode.workspace.fs.readFile(this._activeUri);
        md = new TextDecoder().decode(bytes);
      }

      const fileName = path.basename(this._activeUri.fsPath, path.extname(this._activeUri.fsPath));

      this.view.webview.postMessage({
        type: "updateMarkdown",
        markdown: md,
        fileName: fileName,
      });
    } catch (err) {
      console.error("MD → Docs error sending markdown:", err);
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
      filters: { "PDF Document": ["pdf"] },
    });
    if (!saveUri) return;

    const styles = customStyles || TEMPLATES[this._templateKey]?.styles || {};
    const bg = styles.page?.bg || "#ffffff";
    const marginPreset = styles.page?.margin || "normal";
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
            showTOC: options.showTOC === true,
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
      filters: { "Word Document": ["docx"] },
    });
    if (!saveUri) return;

    const styles = customStyles || TEMPLATES[this._templateKey]?.styles || {};
    const options = customOptions || {};
    const outPath = saveUri.fsPath;
    let success = false;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "MD → Docs", cancellable: false },
      async (progress) => {
        progress.report({ message: "Generating Word document…" });
        try {
          const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === this._activeUri.toString());
          const md = doc ? doc.getText() : new TextDecoder().decode(await vscode.workspace.fs.readFile(this._activeUri));
          const blocks = parseMarkdown(md);

          await exportDocxToFile(blocks, styles, outPath, {
            hrPageBreak: options.hrPageBreak !== false,
            showPageNumbers: options.showPageNumbers !== false,
            showTOC: options.showTOC === true,
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
