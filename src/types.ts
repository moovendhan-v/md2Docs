export interface MarkdownRun {
  t?: "text" | "code" | "link" | "image" | "linked-image" | "math" | "footnote-ref";
  text?: string;
  href?: string;
  src?: string;
  bold?: boolean;
  italic?: boolean;
  math?: string;
  footnoteId?: string;
}

export interface MarkdownBlock {
  type: string; // "paragraph" | "heading" | "list" | "code" | "table" | "html" | "hr" | "blockquote" | "callout" | "math" | "toc" | "footnotes"
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
  alertType?: "note" | "tip" | "important" | "warning" | "caution";
  alertTitle?: string;
  math?: string;
  notes?: Array<{ id: string; text: string; runs: MarkdownRun[] }>;
  _eid?: number | string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  color?: string;
  opacity?: number;
  angle?: number;
  fontSize?: number;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  leftText?: string;
  rightText?: string;
  centerText?: string;
  showRule?: boolean;
  logoUrl?: string;
}

export interface CoverPageConfig {
  enabled: boolean;
  template: "minimal" | "executive" | "tech" | "academic";
  title?: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  date?: string;
  version?: string;
  logoUrl?: string;
}

export interface TemplateStyles {
  page?: any;
  title?: any;
  heading?: any;
  table?: any;
  code?: any;
  blockquote?: any;
  link?: any;
  callout?: any;
  watermark?: WatermarkConfig;
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  coverPage?: CoverPageConfig;
}

export interface TemplateConfig {
  id: string;
  name: string;
  styles: TemplateStyles;
  isCustom?: boolean;
}

