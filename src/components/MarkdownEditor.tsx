//@ts-nocheck
import React, { useRef, useEffect, useState } from "react";

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

import SlashMenu, { SlashItem } from "./SlashMenu";

export default function MarkdownEditor({ value, onChange, onKeyDown, placeholder, id }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 45, left: 16 });
  const slashStartPosRef = useRef<number>(-1);

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

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check if slash menu was active and is being typed into
    if (slashOpen && slashStartPosRef.current !== -1) {
      if (cursorPos <= slashStartPosRef.current) {
        setSlashOpen(false);
      } else {
        const queryText = newVal.slice(slashStartPosRef.current + 1, cursorPos);
        if (queryText.includes("\n") || queryText.includes(" ")) {
          setSlashOpen(false);
        } else {
          setSlashQuery(queryText);
        }
      }
    } else {
      // Check if user just typed '/'
      const charJustTyped = newVal[cursorPos - 1];
      const charBefore = newVal[cursorPos - 2];
      if (charJustTyped === "/" && (!charBefore || charBefore === "\n" || charBefore === " ")) {
        slashStartPosRef.current = cursorPos - 1;
        setSlashQuery("");
        setSlashOpen(true);

        // Approximate position inside editor
        const linesBefore = newVal.slice(0, cursorPos).split("\n").length;
        const topOffset = Math.min(Math.max(linesBefore * 22 - (textareaRef.current?.scrollTop || 0), 45), 350);
        setSlashPos({ top: topOffset, left: 24 });
      }
    }

    onChange(e);
  };

  const handleSelectSlashItem = (item: SlashItem) => {
    if (!textareaRef.current) return;
    const text = value;
    const start = slashStartPosRef.current !== -1 ? slashStartPosRef.current : textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionStart;

    const before = text.slice(0, start);
    const after = text.slice(end);
    const updated = before + item.snippet + after;

    // Trigger synthetic event
    const syntheticEvent = {
      target: { value: updated },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    onChange(syntheticEvent);
    setSlashOpen(false);
    slashStartPosRef.current = -1;

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = start + item.snippet.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 20);
  };

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
        onChange={handleEditorChange}
        onKeyDown={(e) => {
          if (slashOpen && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) {
            // Handled by SlashMenu event listener
            return;
          }
          onKeyDown?.(e);
        }}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-4 m-0 overflow-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words bg-transparent border-0 outline-none resize-none focus:ring-0 focus:outline-none"
        style={{
          boxSizing: "border-box",
          color: "transparent",
          caretColor: "hsl(var(--foreground))",
          WebkitTextFillColor: "transparent",
        }}
      />

      {/* Floating Slash Menu Palette */}
      {slashOpen && (
        <SlashMenu
          query={slashQuery}
          position={slashPos}
          onSelect={handleSelectSlashItem}
          onClose={() => {
            setSlashOpen(false);
            slashStartPosRef.current = -1;
          }}
        />
      )}
    </div>
  );
}
