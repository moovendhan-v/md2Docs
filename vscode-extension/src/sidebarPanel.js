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
      const blocks = parseMarkdown(md);
      const styles = TEMPLATES[this._templateKey].styles;
      const bodyHtml = blocksToHtml(blocks, styles);
      const fileName = path.basename(this._activeUri.fsPath, path.extname(this._activeUri.fsPath));

      this.view.webview.html = this._buildHtml(bodyHtml, styles, fileName);
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

  _buildHtml(bodyHtml, styles, fileName) {
    const templateEntries = Object.entries(TEMPLATES);
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

    const defaultStylesJson = JSON.stringify(styles);

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${commonStyles()}</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
  <div class="header">
    <div class="file-label">📄 ${escHtml(fileName)}.md</div>
    
    <details class="customize-details">
      <summary class="customize-summary">🛠️ Customize Layout & Styling</summary>
      <div class="customize-content">
        <div class="control-row">
          <label>Template:</label>
          <select id="templateSelect" class="control-input">
            ${templateOptions}
          </select>
        </div>
        <div class="control-row">
          <label>Font Family:</label>
          <select id="fontSelect" class="control-input">
            <option value="Arial, Helvetica, sans-serif">Arial</option>
            <option value="Georgia, 'Times New Roman', serif">Georgia</option>
            <option value="'Segoe UI', Verdana, sans-serif">Segoe UI</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
            <option value="'Courier New', Courier, monospace">Courier New</option>
            <option value="Garamond, 'EB Garamond', serif">Garamond</option>
          </select>
        </div>
        <div class="control-row">
          <label>Font Size (pt):</label>
          <input type="number" id="fontSizeInput" class="control-input" min="8" max="24" step="0.5" />
        </div>
        <div class="control-row">
          <label>Line Height:</label>
          <input type="number" id="lineHeightInput" class="control-input" min="1.0" max="2.5" step="0.1" />
        </div>
        <div class="control-row">
          <label>Margins:</label>
          <select id="marginSelect" class="control-input">
            <option value="normal">Normal (~2cm)</option>
            <option value="narrow">Narrow (~1cm)</option>
            <option value="wide">Wide (~3cm)</option>
          </select>
        </div>
        <div class="control-row">
          <label>Background:</label>
          <input type="color" id="bgInput" class="control-input" />
        </div>
        <div class="control-row">
          <label>Text Color:</label>
          <input type="color" id="colorInput" class="control-input" />
        </div>
        <div class="control-row">
          <label>Table Border Color:</label>
          <input type="color" id="tableBorderColorInput" class="control-input" />
        </div>
        <div class="control-row">
          <label>Table Border Width (px):</label>
          <input type="number" id="tableBorderWidthInput" class="control-input" min="1" max="10" />
        </div>
        <div class="control-row">
          <label>Preview Zoom:</label>
          <select id="zoomSelect" class="control-input">
            <option value="fit" selected>Fit Page</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1.0">100% (Real size)</option>
          </select>
        </div>
        <div class="control-checkbox-row">
          <label><input type="checkbox" id="chkHrPageBreak" /> --- as page break</label>
        </div>
        <div class="control-checkbox-row">
          <label><input type="checkbox" id="chkPageNumbers" /> Enable Page Numbers</label>
        </div>
        <div class="control-checkbox-row">
          <label><input type="checkbox" id="chkTableOfContents" /> Table of Contents</label>
        </div>
      </div>
    </details>
  </div>

  <div class="content" id="content">
    <div id="rawContent" style="display:none;">${bodyHtml}</div>
    <div id="previewContainer" class="preview-container"></div>
  </div>

  <div class="actions">
    <button id="btnPdf" class="action-btn pdf-btn">📥 Download PDF</button>
    <button id="btnDocx" class="action-btn docx-btn">📥 Download Word</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const defaultStyles = ${defaultStylesJson};
    let state = vscode.getState() || {
      styles: defaultStyles,
      options: {
        hrPageBreak: true,
        showPageNumbers: true,
        showTOC: false,
        zoom: 'fit'
      }
    };

    if (state.styles.page.fontFamily !== defaultStyles.page.fontFamily && !state.userCustomized) {
      state.styles = defaultStyles;
    }

    function initInputs() {
      document.getElementById('fontSelect').value = state.styles.page.fontFamily;
      document.getElementById('fontSizeInput').value = state.styles.page.fontSize;
      document.getElementById('lineHeightInput').value = state.styles.page.lineHeight;
      document.getElementById('marginSelect').value = state.styles.page.margin || 'normal';
      document.getElementById('bgInput').value = state.styles.page.bg || '#ffffff';
      document.getElementById('colorInput').value = state.styles.page.textColor || '#1f2937';
      document.getElementById('tableBorderColorInput').value = state.styles.table.borderColor || '#c7d2e0';
      document.getElementById('tableBorderWidthInput').value = parseInt(state.styles.table.borderWidth, 10) || 1;
      
      document.getElementById('chkHrPageBreak').checked = state.options.hrPageBreak;
      document.getElementById('chkPageNumbers').checked = state.options.showPageNumbers;
      document.getElementById('chkTableOfContents').checked = state.options.showTOC;
      document.getElementById('zoomSelect').value = state.options.zoom || 'fit';
    }

    function saveState() {
      vscode.setState(state);
    }

    function handleStyleChange(group, prop, value) {
      state.styles[group][prop] = value;
      state.userCustomized = true;
      saveState();
      renderPreview();
    }

    function handleOptionChange(prop, value) {
      state.options[prop] = value;
      saveState();
      renderPreview();
    }

    document.getElementById('templateSelect').addEventListener('change', (e) => {
      vscode.postMessage({ type: 'templateChange', key: e.target.value });
      state.userCustomized = false;
    });

    document.getElementById('fontSelect').addEventListener('change', (e) => handleStyleChange('page', 'fontFamily', e.target.value));
    document.getElementById('fontSizeInput').addEventListener('change', (e) => handleStyleChange('page', 'fontSize', parseFloat(e.target.value)));
    document.getElementById('lineHeightInput').addEventListener('change', (e) => handleStyleChange('page', 'lineHeight', parseFloat(e.target.value)));
    document.getElementById('marginSelect').addEventListener('change', (e) => handleStyleChange('page', 'margin', e.target.value));
    document.getElementById('bgInput').addEventListener('change', (e) => handleStyleChange('page', 'bg', e.target.value));
    document.getElementById('colorInput').addEventListener('change', (e) => handleStyleChange('page', 'textColor', e.target.value));
    document.getElementById('tableBorderColorInput').addEventListener('change', (e) => handleStyleChange('table', 'borderColor', e.target.value));
    document.getElementById('tableBorderWidthInput').addEventListener('change', (e) => handleStyleChange('table', 'borderWidth', e.target.value + 'px'));

    document.getElementById('chkHrPageBreak').addEventListener('change', (e) => handleOptionChange('hrPageBreak', e.target.checked));
    document.getElementById('chkPageNumbers').addEventListener('change', (e) => handleOptionChange('showPageNumbers', e.target.checked));
    document.getElementById('chkTableOfContents').addEventListener('change', (e) => handleOptionChange('showTOC', e.target.checked));
    document.getElementById('zoomSelect').addEventListener('change', (e) => handleOptionChange('zoom', e.target.value));

    document.getElementById('btnPdf').addEventListener('click', () => {
      vscode.postMessage({ type: 'exportPdf', styles: state.styles, options: state.options });
    });

    document.getElementById('btnDocx').addEventListener('click', () => {
      vscode.postMessage({ type: 'exportDocx', styles: state.styles, options: state.options });
    });

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

    function renderPreview() {
      const rawContent = document.getElementById('rawContent');
      const previewContainer = document.getElementById('previewContainer');
      if (!rawContent || !previewContainer) return;

      const geom = getPageGeometry(state.styles.page.margin || 'normal');

      const measureDiv = document.createElement('div');
      measureDiv.style.position = 'fixed';
      measureDiv.style.left = '-20000px';
      measureDiv.style.top = '-20000px';
      measureDiv.style.width = geom.contentWidth + 'px';
      measureDiv.style.visibility = 'hidden';
      
      measureDiv.style.fontFamily = state.styles.page.fontFamily;
      measureDiv.style.fontSize = state.styles.page.fontSize + 'pt';
      measureDiv.style.lineHeight = state.styles.page.lineHeight;
      measureDiv.style.color = state.styles.page.textColor;
      
      measureDiv.innerHTML = rawContent.innerHTML;
      document.body.appendChild(measureDiv);

      const borderVal = state.styles.table.borderWidth || '1px';
      const borderCol = state.styles.table.borderColor || '#c7d2e0';
      const tables = measureDiv.querySelectorAll('table, td, th');
      tables.forEach(t => {
        t.style.border = borderVal + ' solid ' + borderCol;
      });

      const hrs = measureDiv.querySelectorAll('hr');
      hrs.forEach(hr => {
        if (state.options.hrPageBreak) {
          hr.classList.add('page-break');
        } else {
          hr.classList.remove('page-break');
        }
      });

      const headings = Array.from(measureDiv.querySelectorAll('h1, h2, h3'));
      if (state.options.showTOC && headings.length > 0) {
        const tocContainer = document.createElement('div');
        tocContainer.style.border = '1px solid ' + borderCol;
        tocContainer.style.padding = '12px';
        tocContainer.style.marginBottom = '16px';
        tocContainer.style.borderRadius = '6px';
        tocContainer.style.background = state.styles.table.stripeColor || '#fafafa';
        
        const titleEl = document.createElement('strong');
        titleEl.style.display = 'block';
        titleEl.style.marginBottom = '6px';
        titleEl.innerText = 'Table of Contents';
        tocContainer.appendChild(titleEl);
        
        const listEl = document.createElement('ul');
        listEl.style.listStyle = 'none';
        listEl.style.paddingLeft = '0';
        listEl.style.margin = '0';
        
        headings.forEach(h => {
          const li = document.createElement('li');
          const level = parseInt(h.tagName.substring(1), 10);
          li.style.paddingLeft = ((level - 1) * 12) + 'px';
          li.style.margin = '3px 0';
          
          const a = document.createElement('a');
          a.href = '#' + h.id;
          a.style.color = state.styles.link.color || '#1d4ed8';
          a.style.textDecoration = 'none';
          a.innerText = h.innerText || h.textContent;
          li.appendChild(a);
          listEl.appendChild(li);
        });
        
        tocContainer.appendChild(listEl);
        measureDiv.insertBefore(tocContainer, measureDiv.firstChild);
      }

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
        pages.push(rawContent.innerHTML);
      }

      previewContainer.innerHTML = '';
      pages.forEach((pageHtml, i) => {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        pageWrapper.style.width = geom.width + 'px';
        pageWrapper.style.height = geom.height + 'px';
        pageWrapper.style.background = state.styles.page.bg || '#ffffff';
        pageWrapper.style.color = state.styles.page.textColor || '#1f2937';
        pageWrapper.style.fontFamily = state.styles.page.fontFamily;
        pageWrapper.style.fontSize = state.styles.page.fontSize + 'pt';
        pageWrapper.style.lineHeight = state.styles.page.lineHeight;
        pageWrapper.style.padding = geom.marginY + 'px ' + geom.marginX + 'px';
        pageWrapper.style.boxSizing = 'border-box';
        pageWrapper.style.overflow = 'hidden';
        
        pageWrapper.innerHTML = pageHtml;
        pageContainer.appendChild(pageWrapper);

        if (state.options.showPageNumbers) {
          const pageNum = document.createElement('div');
          pageNum.className = 'page-number-footer';
          pageNum.innerText = 'Page ' + (i + 1) + ' of ' + pages.length;
          pageContainer.appendChild(pageNum);
        }

        previewContainer.appendChild(pageContainer);
      });

      updatePageScale();
    }

    function updatePageScale() {
      const container = document.getElementById('previewContainer');
      if (!container) return;
      
      const zoomVal = state.options.zoom || 'fit';
      let scale;
      if (zoomVal === 'fit') {
        const containerWidth = container.clientWidth - 24;
        scale = Math.min(1, containerWidth / 794);
      } else {
        scale = parseFloat(zoomVal);
      }
      
      const wrappers = document.querySelectorAll('.page-wrapper');
      wrappers.forEach(w => {
        w.style.transform = 'scale(' + scale + ')';
        w.style.transformOrigin = 'top left';
      });
      
      const pageContainers = document.querySelectorAll('.page-container');
      pageContainers.forEach(c => {
        c.style.width = (794 * scale) + 'px';
        c.style.height = (1123 * scale) + 'px';
      });
    }

    initInputs();
    renderPreview();
    window.addEventListener('resize', updatePageScale);

    window.addEventListener('message', async (event) => {
      const msg = event.data;
      if (msg.type === 'generatePdfBytes') {
        try {
          const geom = getPageGeometry(msg.marginPreset);

          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'pt', 'a4');
          const pw = pdf.internal.pageSize.getWidth();
          const ph = pdf.internal.pageSize.getHeight();

          const pages = [];
          const wrappers = document.querySelectorAll('.page-wrapper');
          wrappers.forEach(w => {
            pages.push(w.innerHTML);
          });

          const renderContainer = document.createElement('div');
          renderContainer.style.position = 'fixed';
          renderContainer.style.left = '-20000px';
          renderContainer.style.top = '-20000px';
          document.body.appendChild(renderContainer);

          for (let i = 0; i < pages.length; i++) {
            const wrapEl = document.createElement('div');
            wrapEl.style.width = geom.width + 'px';
            wrapEl.style.height = geom.height + 'px';
            wrapEl.style.background = msg.bg || '#ffffff';
            wrapEl.style.color = state.styles.page.textColor || '#1f2937';
            wrapEl.style.padding = geom.marginY + 'px ' + geom.marginX + 'px';
            wrapEl.style.boxSizing = 'border-box';
            wrapEl.style.overflow = 'hidden';
            wrapEl.style.position = 'relative';
            
            wrapEl.innerHTML = '<div style="font-family:' + state.styles.page.fontFamily + ';font-size:' + state.styles.page.fontSize + 'pt;line-height:' + state.styles.page.lineHeight + ';color:' + state.styles.page.textColor + ';">' + pages[i] + '</div>';
            
            if (msg.showPageNumbers) {
              const pageNum = document.createElement('div');
              pageNum.style.position = 'absolute';
              pageNum.style.bottom = '20px';
              pageNum.style.left = '0';
              pageNum.style.width = '100%';
              pageNum.style.textAlign = 'center';
              pageNum.style.fontSize = '9pt';
              pageNum.style.color = '#888888';
              pageNum.innerText = 'Page ' + (i + 1) + ' of ' + pages.length;
              wrapEl.appendChild(pageNum);
            }

            renderContainer.appendChild(wrapEl);

            const canvas = await html2canvas(wrapEl, {
              scale: 2,
              backgroundColor: msg.bg || '#ffffff',
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
          vscode.postMessage({
            type: 'pdfBytesGenerated',
            data: base64Data,
            outputPath: msg.outputPath
          });
        } catch (err) {
          vscode.postMessage({ type: 'pdfError', message: err.message });
        }
      }
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
      margin-bottom: 6px;
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

    /* Customize styling panel */
    .customize-details {
      background: #202021;
      border: 1px solid #333;
      border-radius: 4px;
      margin-top: 6px;
    }
    .customize-summary {
      padding: 5px 8px;
      font-size: 11px;
      font-weight: 600;
      color: #aaa;
      cursor: pointer;
      outline: none;
    }
    .customize-content {
      padding: 8px;
      border-top: 1px solid #333;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .control-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .control-row label {
      font-size: 11px;
      color: #aaa;
    }
    .control-input {
      background: #333;
      color: #ccc;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 11px;
      outline: none;
      width: 120px;
    }
    .control-input[type="color"] {
      width: 40px;
      height: 20px;
      padding: 0;
      cursor: pointer;
    }
    .control-checkbox-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #ccc;
      margin-top: 2px;
    }

    .content {
      flex: 1;
      overflow: auto;
      padding: 12px;
      background: #181818;
    }

    .preview-container {
      display: block;
      width: 100%;
    }

    .page-container {
      position: relative;
      display: block;
      margin: 0 auto 20px auto;
    }

    .page-wrapper {
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      border-radius: 2px;
      transform-origin: top left;
      overflow-wrap: break-word;
    }

    .page-wrapper img {
      max-width: 100%;
      height: auto;
    }

    .page-wrapper table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0;
    }

    .page-wrapper pre {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .page-number-footer {
      font-size: 10px;
      color: #777;
      margin-top: 4px;
      text-align: center;
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

function escHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
