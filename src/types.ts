export interface MarkdownRun {
  t?: "text" | "code" | "link";
  text?: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface MarkdownBlock {
  type: string; // e.g. "paragraph", "heading", "list", "code", "table", "html", "hr"
  level?: number;
  runs?: MarkdownRun[];
  items?: any[];
  headers?: any[];
  rows?: any[][];
  alignments?: string[];
  code?: string;
  text?: string;
  raw?: string;
  lines?: MarkdownRun[][];
  inline?: MarkdownRun[];
  lang?: string;
  html?: string;
  id?: string;
  isTitle?: boolean;
  ordered?: boolean;
  start?: number;
  children?: any;
}

export interface StyleNode {
  font?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  alignment?: "left" | "center" | "right" | "justify";
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  border?: {
    top?: BorderOptions;
    bottom?: BorderOptions;
    left?: BorderOptions;
    right?: BorderOptions;
  };
  bg?: string;
  indent?: number;
  hanging?: number;
  lineHeight?: number;
}

export interface BorderOptions {
  color?: string;
  size?: number;
  space?: number;
}

export interface TemplateStyles {
  page?: any;
  title?: any;
  heading?: any;
  table?: any;
  code?: any;
  blockquote?: any;
  link?: any;
  watermark?: {
    text?: string;
    color?: string;
    opacity?: number;
  };
  header?: {
    logoUrl?: string;
    text?: string;
    layout?: "logo-left" | "logo-right" | "center";
    borderBottom?: boolean;
    height?: number;
  };
  footer?: {
    text?: string;
    bannerColor?: string;
    textColor?: string;
    layout?: "center" | "split";
    height?: number;
  };
}

export interface TemplateConfig {
  id: string;
  name: string;
  styles: TemplateStyles;
}
