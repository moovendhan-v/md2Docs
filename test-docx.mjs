// Node smoke test: parser + docx generation with the real templates
import { Packer } from "docx";
import fs from "fs";

const parserSrc = fs.readFileSync("src/lib/parser.js", "utf8");
const templatesSrc = fs.readFileSync("src/lib/templates.js", "utf8");
fs.mkdirSync("/tmp/t", { recursive: true });
fs.writeFileSync("/tmp/t/parser.mjs", parserSrc);
fs.writeFileSync("/tmp/t/templates.mjs", templatesSrc);
// exportDocx uses "@/..." alias + browser download; strip the download part
let ex = fs.readFileSync("src/lib/exportDocx.js", "utf8");
ex = ex.replace(/const blob = await Packer[\s\S]*$/m, "return doc;\n}\n");
fs.writeFileSync("/tmp/t/exportDocx2.mjs", ex);

const { parseMarkdown } = await import("/tmp/t/parser.mjs");
const { TEMPLATES, DEFAULT_MD } = await import("/tmp/t/templates.mjs");
const { exportDocx } = await import("/tmp/t/exportDocx2.mjs");

for (const [key, t] of Object.entries(TEMPLATES)) {
  const blocks = parseMarkdown(DEFAULT_MD);
  const doc = await exportDocx(blocks, t.styles, "test");
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(`/tmp/test-${key}.docx`, buf);
  console.log(key, "→", buf.length, "bytes");
}
