#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const HTML_FILE = path.join(__dirname, '..', 'index.html');
const PORT = process.env.PORT || 4849;

const server = http.createServer((req, res) => {
  // Strip query string before path matching
  let url = req.url.split('?')[0];

  // Route aliases
  if (url === '/' || url === '/index.html') url = '/index.html';
  else if (url === '/admin' || url === '/admin.html') url = '/admin.html';
  else if (url === '/user'  || url === '/user.html')  url = '/user.html';

  const filePath = path.join(__dirname, '..', url);

  const ext = path.extname(filePath);

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;

  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║       InfraAI Admin Console          ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Running at: ${url}`);
  console.log('  Press Ctrl+C to stop.');
  console.log('');

  // Open browser cross-platform
  const platform = process.platform;
  const open =
    platform === 'darwin' ? `open "${url}"` :
      platform === 'win32' ? `start "" "${url}"` :
        `xdg-open "${url}"`;

  exec(open, (err) => {
    if (err) {
      console.log(`  Could not open browser automatically.`);
      console.log(`  Open manually: ${url}`);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`  Port ${PORT} is already in use. Set PORT env var to use another.\n  e.g.  PORT=5000 npx infraai-admin`);
  } else {
    console.error('  Server error:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n  Shutting down. Bye!\n');
  server.close();
  process.exit(0);
});