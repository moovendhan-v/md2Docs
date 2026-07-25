#!/bin/bash
echo "========================================================="
echo "Building and Starting md2Docs Production Server & Tunnel"
echo "========================================================="

echo "[1/4] Cleaning up existing processes on port 3000 and 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "[2/4] Starting Next.js Dev Server (Port 3000)..."
npm run dev &
NEXT_PID=$!

echo "[3/4] Starting Standalone MCP Server (Port 3001)..."
npx tsx bin/mcp-server.mjs &
MCP_PID=$!

# Wait for servers to boot up
sleep 3

echo "========================================================="
echo "[4/4] Starting Localhost.run tunnel for MCP (Port 3001)..."
echo "IMPORTANT: Copy the 'https://xxxxx.lhr.life' URL printed below,"
echo "and add /api/mcp to the end of it for Claude Web!"
echo "Press Ctrl+C to safely stop both the tunnel and servers."
echo "========================================================="

# Kill both servers when this script is stopped (via Ctrl+C)
trap "kill $NEXT_PID $MCP_PID" EXIT

ssh -o StrictHostKeyChecking=no -R 80:localhost:3001 nokey@localhost.run
