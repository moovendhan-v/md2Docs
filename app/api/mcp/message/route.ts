export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(global as any).mcpTransport) {
    return new Response("No active MCP SSE connection.", { status: 400 });
  }

  const body = await req.json();

  const mockReq = { body };
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
  });
}
