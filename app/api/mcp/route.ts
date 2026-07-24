import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "../../../src/mcp/core";

// We need to keep a global reference to the transport for the POST route to use.
(global as any).mcpServer = (global as any).mcpServer || createMCPServer({ isRemote: true, baseUrl: process.env.BASE_URL || "http://localhost:3000" });
(global as any).mcpTransport = (global as any).mcpTransport || null;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl = new URL(req.url).origin;
  
  // Re-init with correct base URL if needed
  (global as any).mcpServer = createMCPServer({ isRemote: true, baseUrl });
  
  // Create a stream for the SSE response
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  // Mock an Express response object for the SSEServerTransport
  const mockRes = {
    writeHead: (status: number, headers: any) => {},
    write: (chunk: string) => {
      writer.write(new TextEncoder().encode(chunk));
    },
    end: () => {
      writer.close();
    },
    on: (event: string, cb: any) => {
      if (event === "close") {
        req.signal.addEventListener("abort", cb);
      }
    },
  };

  const transport = new SSEServerTransport("/api/mcp/message", mockRes as any);
  (global as any).mcpTransport = transport;
  await (global as any).mcpServer.connect(transport);

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}
