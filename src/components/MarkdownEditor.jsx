import React, { useRef, useEffect } from "react";

/**
 * Custom fast regex-based Markdown syntax highlighting function.
 * Escapes HTML characters first, then wraps Markdown tokens in styled spans.
 */
function highlightMarkdown(text) {
  if (!text) return " ";
  
  // Escape raw HTML entities
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers: # Title, ## Heading, etc. (must match start of line or start of input)
  html = html.replace(/^(#{1,6}\s+.*)$/gm, '<span class="md-heading">$1</span>');

  // Blockquotes: > Quote
  html = html.replace(/^(\s*&gt;.*)$/gm, '<span class="md-blockquote">$1</span>');

  // Horizontal rules: --- or *** or ___
  html = html.replace(/^(\s*(?:---+|\*\*\*+|___+)\s*)$/gm, '<span class="md-hr">$1</span>');

  // Bullet/Number Lists: - or * or 1.
  html = html.replace(/^(\s*(?:[-*+]|\d+[.)])\s+)/gm, '<span class="md-list-marker">$1</span>');

  // Code Blocks: ```lang ... ```
  html = html.replace(/(```[\s\S]*?```)/g, '<span class="md-code-block">$1</span>');

  // Inline Code: `code`
  html = html.replace(/(`[^`]+`)/g, '<span class="md-inline-code">$1</span>');

  // Links: [label](url)
  html = html.replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="md-link">$1</span>');

  // Images: ![alt](url)
  html = html.replace(/(!\[[^\]]*\]\([^)]+\))/g, '<span class="md-image">$1</span>');

  // HTML Tags
  html = html.replace(/(&lt;\/?[a-zA-Z0-9]+.*?&gt;)/g, '<span class="md-html-tag">$1</span>');

  // Fix trailing newline handling so the editor scroll aligns when typing at the bottom
  if (html.endsWith("\n")) {
    html += " ";
  }

  return html;
}

export default function MarkdownEditor({ value, onChange, onKeyDown, placeholder, id }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  // Sync scroll positions perfectly
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [value]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-background">
      {/* Syntax Highlighting Overlay (behind textarea) */}
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className="absolute inset-0 p-4 m-0 overflow-hidden font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words pointer-events-none border-0 bg-transparent text-foreground select-none"
        style={{
          boxSizing: "border-box",
        }}
        dangerouslySetInnerHTML={{ __html: highlightMarkdown(value) }}
      />
      
      {/* Invisible Interactive Textarea (on top) */}
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-4 m-0 overflow-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words bg-transparent border-0 outline-none resize-none focus:ring-0 focus:outline-none"
        style={{
          boxSizing: "border-box",
          color: "transparent",
          caretColor: "hsl(var(--foreground))",
          WebkitTextFillColor: "transparent", // Ensures Safari behaves
        }}
      />
    </div>
  );
}
