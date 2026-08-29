//@ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  Flame,
  Sigma,
  GitBranch,
  CheckSquare,
  Table2,
  Scissors,
  Bookmark,
  Code2,
  Layers,
  Search,
} from "lucide-react";

export interface SlashItem {
  id: string;
  title: string;
  description: string;
  category: "Callouts" | "Math & Tech" | "Diagrams" | "Structure";
  icon: React.ComponentType<{ className?: string }>;
  snippet: string;
}

export const SLASH_ITEMS: SlashItem[] = [
  // Callouts
  {
    id: "note",
    title: "Note Callout",
    description: "Informational highlight block",
    category: "Callouts",
    icon: MessageSquare,
    snippet: "\n> [!NOTE]\n> Key takeaway or important context goes here.\n\n",
  },
  {
    id: "tip",
    title: "Tip Callout",
    description: "Helpful hint or best practice",
    category: "Callouts",
    icon: Lightbulb,
    snippet: "\n> [!TIP]\n> Pro-tip or recommendation for the reader.\n\n",
  },
  {
    id: "important",
    title: "Important Notice",
    description: "High-priority essential info",
    category: "Callouts",
    icon: AlertCircle,
    snippet: "\n> [!IMPORTANT]\n> Crucial information that must not be missed.\n\n",
  },
  {
    id: "warning",
    title: "Warning Notice",
    description: "Cautious advice or potential pitfall",
    category: "Callouts",
    icon: AlertTriangle,
    snippet: "\n> [!WARNING]\n> Potential risk or critical constraint.\n\n",
  },
  {
    id: "caution",
    title: "Caution Alert",
    description: "High-risk breaking warning",
    category: "Callouts",
    icon: Flame,
    snippet: "\n> [!CAUTION]\n> Danger or destructive action alert.\n\n",
  },

  // Math
  {
    id: "math-block",
    title: "Math Formula Block",
    description: "Display LaTeX mathematical equation",
    category: "Math & Tech",
    icon: Sigma,
    snippet: "\n$$\n\\text{Throughput} = \\frac{\\sum_{i=1}^{k} \\text{Req}_i}{\\Delta t}\n$$\n\n",
  },
  {
    id: "math-inline",
    title: "Inline Math",
    description: "Inline LaTeX equation ($...$)",
    category: "Math & Tech",
    icon: Sigma,
    snippet: " $E = mc^2$ ",
  },

  // Diagrams
  {
    id: "mermaid-flow",
    title: "Flowchart Diagram",
    description: "Mermaid horizontal workflow diagram",
    category: "Diagrams",
    icon: GitBranch,
    snippet: "\n```mermaid\ngraph LR\n    A[🌐 Start] --> B[⚙️ Process]\n    B --> C[✅ Complete]\n```\n\n",
  },
  {
    id: "mermaid-arch",
    title: "System Architecture",
    description: "Mermaid 3-tier cloud architecture",
    category: "Diagrams",
    icon: Layers,
    snippet: "\n```mermaid\ngraph TD\n    Client[🌐 Client] --> ALB[⚖️ Load Balancer]\n    ALB --> App[🚀 Application]\n    App --> DB[(🗄️ Database)]\n```\n\n",
  },

  // Structure
  {
    id: "checklist",
    title: "Task Checklist",
    description: "Interactive task list with check boxes",
    category: "Structure",
    icon: CheckSquare,
    snippet: "\n- [x] Initial setup completed\n- [ ] Pending verification task\n- [ ] Final deployment\n\n",
  },
  {
    id: "table",
    title: "Data Table",
    description: "Preformatted 3x3 table with headers",
    category: "Structure",
    icon: Table2,
    snippet: "\n| Feature | Status | Priority |\n| :--- | :--- | :--- |\n| Core Engine | ✅ Ready | High |\n| Custom Theme | ✅ Active | Medium |\n| Cloud Sync | ⏳ Planned | Low |\n\n",
  },
  {
    id: "codeblock",
    title: "Code Block",
    description: "Fenced code with syntax highlighting",
    category: "Structure",
    icon: Code2,
    snippet: "\n```typescript\nfunction initializeSystem(): void {\n  console.log(\"System online\");\n}\n```\n\n",
  },
  {
    id: "pagebreak",
    title: "Page Break",
    description: "Force next content to start on a new page",
    category: "Structure",
    icon: Scissors,
    snippet: "\n---\n\n",
  },
  {
    id: "toc",
    title: "Table of Contents",
    description: "Insert [TOC] marker for automated index",
    category: "Structure",
    icon: Bookmark,
    snippet: "\n[TOC]\n\n",
  },
];

interface SlashMenuProps {
  query: string;
  position?: { top: number; left: number };
  onSelect: (item: SlashItem) => void;
  onClose: () => void;
}

export default function SlashMenu({ query = "", position, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_ITEMS.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filtered.length === 0) return null;

  const style: React.CSSProperties = position
    ? { top: `${Math.min(position.top, window.innerHeight - 340)}px`, left: `${Math.min(position.left, window.innerWidth - 300)}px` }
    : { top: "45px", left: "16px" };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 rounded-xl border border-border/80 bg-background/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      style={style}
    >
      <div className="flex items-center gap-1.5 border-b border-border/50 px-2 py-1.5 text-[11px] text-muted-foreground font-semibold">
        <Search className="h-3 w-3 text-primary" />
        <span>Quick Insert Menu</span>
        <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono">ESC to close</kbd>
      </div>

      <div className="max-h-64 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                isSelected ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  isSelected
                    ? "border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground"
                    : "border-border bg-muted/50 text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{item.title}</div>
                <div className={`truncate text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {item.description}
                </div>
              </div>
              <span className={`text-[9px] font-mono shrink-0 uppercase tracking-wider ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                {item.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
