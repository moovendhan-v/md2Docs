#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import os from "os";
import { parseMarkdown } from "../src/lib/parser.js";
import { exportDocx } from "../src/lib/exportDocx.js";
import { TEMPLATES } from "../src/lib/templates.js";
import { Packer } from "docx";

const server = new Server(
  {
    name: "md2docs-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "convert_markdown_to_docx",
        description: "Converts Markdown text into a styled Word Document (.docx) and saves it to a file.",
        inputSchema: {
          type: "object",
          properties: {
            markdown: {
              type: "string",
              description: "The Markdown content to convert",
            },
            template: {
              type: "string",
              description: "The style template to use (e.g., technical, modern, elegant)",
              default: "technical",
            },
            outputPath: {
              type: "string",
              description: "Absolute path where the output .docx file should be saved",
            },
            hrPageBreak: {
              type: "boolean",
              description: "Whether to treat horizontal rules (---) as page breaks",
              default: false,
            },
          },
          required: ["markdown", "outputPath"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "convert_markdown_to_docx") {
    const { markdown, template = "technical", outputPath, hrPageBreak = false } = request.params.arguments;

    try {
      const selectedTemplate = TEMPLATES[template];
      if (!selectedTemplate) {
        throw new Error(`Template '${template}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`);
      }

      const outPath = path.resolve(outputPath);
      const outDir = path.dirname(outPath);
      
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const blocks = parseMarkdown(markdown);
      const doc = await exportDocx(blocks, selectedTemplate.styles, "mcp-export", { hrPageBreak });
      const buffer = await Packer.toBuffer(doc);
      
      fs.writeFileSync(outPath, buffer);

      return {
        content: [
          {
            type: "text",
            text: `Successfully converted Markdown to Docx using the '${template}' template.\nFile saved to: ${outPath}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to convert markdown: ${error.message}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("md2docs MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
