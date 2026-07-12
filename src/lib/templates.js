/* Templates — each is a complete style sheet for the document. */
export const TEMPLATES = {
  boardroom: {
    name: "Boardroom",
    styles: {
      page: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, textColor: "#1f2937", lineHeight: 1.55 },
      title: { fontSize: 26, color: "#0f3460", align: "left", uppercase: false, rule: true, ruleColor: "#0f3460" },
      heading: { fontSize: 16, color: "#0f3460", uppercase: false },
      table: { headerBg: "#0f3460", headerColor: "#ffffff", borderColor: "#c7d2e0", striped: true, stripeColor: "#f1f5fb" },
      code: { bg: "#f3f4f6", color: "#111827" },
      blockquote: { borderColor: "#0f3460", italic: true, color: "#475569" },
      link: { color: "#1d4ed8" },
    },
  },
  editorial: {
    name: "Editorial",
    styles: {
      page: { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, textColor: "#292524", lineHeight: 1.7 },
      title: { fontSize: 32, color: "#292524", align: "center", uppercase: false, rule: false, ruleColor: "#292524" },
      heading: { fontSize: 18, color: "#7c2d12", uppercase: false },
      table: { headerBg: "#fff7ed", headerColor: "#7c2d12", borderColor: "#e7d8c9", striped: false, stripeColor: "#faf7f2" },
      code: { bg: "#f5f5f4", color: "#44403c" },
      blockquote: { borderColor: "#7c2d12", italic: true, color: "#57534e" },
      link: { color: "#9a3412" },
    },
  },
  technical: {
    name: "Technical",
    styles: {
      page: { fontFamily: "'Segoe UI', Verdana, sans-serif", fontSize: 10.5, textColor: "#18181b", lineHeight: 1.6 },
      title: { fontSize: 22, color: "#18181b", align: "left", uppercase: true, rule: true, ruleColor: "#18181b" },
      heading: { fontSize: 14, color: "#18181b", uppercase: true },
      table: { headerBg: "#18181b", headerColor: "#fafafa", borderColor: "#d4d4d8", striped: true, stripeColor: "#f4f4f5" },
      code: { bg: "#18181b", color: "#e4e4e7" },
      blockquote: { borderColor: "#a1a1aa", italic: false, color: "#52525b" },
      link: { color: "#0d9488" },
    },
  },
};

export const DEFAULT_MD = `# Quarterly Product Report

A short **demo document** so you can see every element styled. Replace this with your own markdown, or upload a \`.md\` file.

## Highlights

- Shipped the *self-serve onboarding* flow
- Reduced page load time by **38%**
- Signed 3 enterprise customers

## Metrics

| Metric | Q1 | Q2 | Change |
|---|---|---|---|
| Active users | 12,400 | 18,900 | +52% |
| Churn | 4.1% | 2.9% | -1.2pt |
| NPS | 41 | 55 | +14 |

> Focus for next quarter: retention over acquisition.

### Sample code

\`\`\`
npm install
npm run build
\`\`\`

Read the full analysis at [example.com](https://example.com).

---

*Prepared by the product team.*
`;
