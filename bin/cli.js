#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";
import { parseMarkdown } from "../src/lib/parser.js";
import { exportDocx } from "../src/lib/exportDocx.js";
import { TEMPLATES } from "../src/lib/templates.js";
import { Packer } from "docx";

program
  .name("md2docs")
  .description("Convert Markdown to professional Word (.docx) documents")
  .version("0.1.0")
  .argument("<file>", "input markdown file")
  .option("-o, --output <file>", "output docx file path")
  .option("-t, --template <name>", "template name (e.g., technical, modern, elegant)", "technical")
  .option("--hr-page-break", "treat horizontal rules (---) as page breaks", false)
  .action(async (file, options) => {
    try {
      const inputPath = path.resolve(file);
      if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file '${file}' not found.`);
        process.exit(1);
      }

      const markdown = fs.readFileSync(inputPath, "utf-8");
      
      const template = TEMPLATES[options.template];
      if (!template) {
        console.error(`Error: Template '${options.template}' not found. Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
        process.exit(1);
      }

      const outputPath = options.output 
        ? path.resolve(options.output) 
        : inputPath.replace(/\.md$/i, "") + ".docx";

      console.log(`Parsing markdown from ${file}...`);
      const blocks = parseMarkdown(markdown);
      
      console.log(`Generating Word document using '${options.template}' template...`);
      const doc = await exportDocx(blocks, template.styles, "output", { hrPageBreak: options.hrPageBreak });
      
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Successfully created: ${outputPath}`);
    } catch (error) {
      console.error("Failed to generate document:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
