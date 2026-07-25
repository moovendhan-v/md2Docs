#!/usr/bin/env node
import { createServer } from "http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMCPServer } from "../src/mcp/core.js";

const PORT = 3001;
const serverBaseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
const mcpServer = createMCPServer({ isRemote: true, baseUrl: serverBaseUrl });
const transports = new Map();

const server = createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle SSE GET
  if (req.method === "GET" && req.url.split("?")[0] === "/api/mcp") {
    console.log(`[MCP Server] Received GET request: ${req.url}`);
    const transport = new SSEServerTransport("/api/mcp", res);
    transports.set(transport.sessionId, transport);
    await mcpServer.connect(transport);
    
    res.on('close', () => {
      console.log(`[MCP Server] SSE Connection Closed for session: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
    });
    
    console.log(`[MCP Server] SSE Connection Established!`);
    return;
  }
  // OAuth Discovery Endpoints
  if (req.method === "GET" && req.url.endsWith("/.well-known/oauth-authorization-server")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    const base = `https://${req.headers.host}`;
    res.end(JSON.stringify({
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/token`,
      registration_endpoint: `${base}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"]
    }));
    return;
  }

  // Mock OAuth Dynamic Client Registration Endpoint
  if (req.method === "POST" && req.url.endsWith("/register")) {
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      client_id: "mock_client_id_" + Date.now(),
      client_secret: "mock_client_secret_" + Date.now(),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0
    }));
    return;
  }

  if (req.method === "GET" && req.url.endsWith("/.well-known/oauth-protected-resource")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    const base = `https://${req.headers.host}`;
    res.end(JSON.stringify({
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ["header"]
    }));
    return;
  }

  // Mock OAuth Authorization Endpoint
  if (req.method === "GET" && req.url.includes("/authorize")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const redirect_uri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    
    if (!redirect_uri || !state) {
      res.writeHead(400);
      res.end("Missing redirect_uri or state");
      return;
    }
    
    const code = "mock_auth_code_" + Date.now();
    const sep = redirect_uri.includes("?") ? "&" : "?";
    const location = `${redirect_uri}${sep}code=${code}&state=${state}`;
    
    res.writeHead(302, { Location: location });
    res.end();
    return;
  }

  // Mock OAuth Token Endpoint
  if (req.method === "POST" && req.url.endsWith("/token")) {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({
      access_token: "mock_access_token_" + Date.now(),
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "mock_refresh_token_" + Date.now()
    }));
    return;
  }


  // Handle POST message
  if (req.method === "POST" && req.url.split("?")[0] === "/api/mcp") {
    console.log(`[MCP Server] Received POST request: ${req.url}`);

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      let sessionId = url.searchParams.get("sessionId");
      
      if (!sessionId && transports.size === 1) {
        sessionId = Array.from(transports.keys())[0];
      }
      
      if (!sessionId) {
        res.writeHead(400);
        res.end("Missing sessionId");
        return;
      }
      
      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404);
        res.end("Session not found");
        return;
      }
      
      console.log(`[MCP Server] Handling POST Message...`);
      await transport.handlePostMessage(req, res);
      console.log(`[MCP Server] POST Message Handled Successfully!`);
    } catch (e) {
      console.error("[MCP Server] POST Handler Error:", e);
      // Ensure we only write if the headers aren't already sent by the transport
      if (!res.headersSent) {
        res.writeHead(400);
        res.end("Internal Server Error");
      }
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Standalone MCP Server running on port ${PORT}`);
});
