#!/bin/bash
echo "1. Opening SSE connection in background..."
curl -N -s http://localhost:3001/api/mcp > sse.log &
SSE_PID=$!
sleep 2

echo "2. Sending POST request..."
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'

echo -e "\n\n3. Checking SSE logs:"
cat sse.log

kill $SSE_PID
