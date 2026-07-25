import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { parseMarkdown } from "../lib/parser";
import { exportDocx } from "../lib/exportDocx";
import { TEMPLATES } from "../lib/templates";
import { Packer } from "docx";

export function createMCPServer(options: { isRemote?: boolean; baseUrl?: string } = {}) {
  const isRemote = options.isRemote || false;
  const baseUrl = options.baseUrl || "http://localhost:3000";

  const server = new Server(
    {
      name: "md2docs-mcp",
      version: "0.2.0",
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
          name: "generate_docx",
          description: "Convert a Markdown string into a styled DOCX file.",
          inputSchema: {
            type: "object",
            properties: {
              markdown: {
                type: "string",
                description: "The raw Markdown content to convert.",
              },
              templateId: {
                type: "string",
                description: "The ID of the style template (e.g., 'modern', 'classic', 'academic').",
                default: "modern",
              },
              fileName: {
                type: "string",
                description: "Desired output filename (without extension).",
                default: "Document",
              },
            },
            required: ["markdown"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "generate_docx") {
      try {
        const { markdown, templateId = "modern", fileName = "Document" } = request.params.arguments;
        const blocks = parseMarkdown(markdown);
        const template = TEMPLATES[templateId as keyof typeof TEMPLATES] || TEMPLATES.modern;
        
        const doc = await exportDocx(blocks, template.styles, fileName, {});
        const buffer = await Packer.toBuffer(doc);

        if (isRemote) {
          // In a Next.js environment, we should write to public/downloads
          const publicDir = path.resolve(process.cwd(), "public");
          const downloadsDir = path.join(publicDir, "downloads");
          
          if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
          }

          const safeFileName = `${fileName.replace(/[^a-z0-9_-]/gi, '_')}_${Date.now()}.docx`;
          const filePath = path.join(downloadsDir, safeFileName);
          
          fs.writeFileSync(filePath, buffer);
          
          const downloadUrl = `${baseUrl}/downloads/${safeFileName}`;

          return {
            content: [
              {
                type: "text",
                text: `Successfully generated DOCX file!\n\nYou can download it here:\n${downloadUrl}`,
              },
            ],
          };
        } else {
          // Local CLI / Stdio mode
          const outDir = path.resolve(process.cwd(), "output");
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          const safeFileName = `${fileName.replace(/[^a-z0-9_-]/gi, '_')}.docx`;
          const filePath = path.join(outDir, safeFileName);
          
          fs.writeFileSync(filePath, buffer);

          return {
            content: [
              {
                type: "text",
                text: `Successfully generated DOCX file!\nSaved locally to: ${filePath}`,
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to generate DOCX: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
    throw new Error("Tool not found");
  });

  return server;
}
