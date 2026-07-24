#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// This script acts as a proxy bridge between Claude Desktop (which uses Stdio) 
// and your hosted Next.js MCP API (which uses SSE).

const remoteUrl = process.argv[2] || "https://md2docs.cybertechmind.com/api/mcp";

async function main() {
  // 1. Connect to the remote Next.js SSE endpoint
  const sseTransport = new SSEClientTransport(new URL(remoteUrl));
  const sseClient = new Client({ name: "md2docs-proxy", version: "1.0.0" }, { capabilities: {} });
  
  await sseClient.connect(sseTransport);

  // 2. Setup Stdio transport to talk to Claude Desktop locally
  const stdioTransport = new StdioServerTransport();
  
  // Forward messages from Claude Desktop (Stdio) -> Remote Server (SSE)
  stdioTransport.onmessage = (message) => {
    sseTransport.send(message);
  };
  
  // Forward messages from Remote Server (SSE) -> Claude Desktop (Stdio)
  sseTransport.onmessage = (message) => {
    stdioTransport.send(message);
  };

  // Keep process alive
  process.stdin.resume();
}

main().catch((error) => {
  console.error("Proxy error:", error);
  process.exit(1);
});
