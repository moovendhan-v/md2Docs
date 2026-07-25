import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "../../../src/mcp/core";

// Global reference to the transport for the POST route to use.
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

  // We set the POST endpoint to the EXACT same URL (/api/mcp)
  const transport = new SSEServerTransport("/api/mcp", mockRes as any);
  (global as any).mcpTransport = transport;
  await (global as any).mcpServer.connect(transport);

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}

export async function POST(req: Request) {
  if (!(global as any).mcpTransport) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32002, message: "No active MCP SSE connection. Please reconnect." }
      }),
      { 
        status: 200, // Return 200 so Claude parses the JSON-RPC error instead of triggering OAuth fallback
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );
  }

  const body = await req.json();

  const mockReq = { 
    body,
    headers: Object.fromEntries(req.headers.entries()),
    url: req.url,
    method: req.method,
    query: {}
  };
  const mockRes = {
    status: (code: number) => mockRes,
    send: (text: string) => {},
    end: () => {},
  };

  await (global as any).mcpTransport.handlePostMessage(mockReq, mockRes);
  return new Response("Accepted", {
    status: 202,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}
