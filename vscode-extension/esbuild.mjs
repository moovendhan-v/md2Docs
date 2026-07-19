// esbuild.mjs — bundles the extension + shared frontend lib into dist/extension.js
import * as esbuild from "esbuild";
import { argv } from "process";
import * as fs from "fs";
import * as path from "path";

const watch = argv.includes("--watch");

// Function to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy built client assets into extension dist/client folder
const clientSrc = path.resolve("../dist");
const clientDest = path.resolve("dist/client");

function copyClientAssets() {
  if (fs.existsSync(clientSrc)) {
    console.log(`Copying frontend client from ${clientSrc} to ${clientDest}...`);
    fs.rmSync(clientDest, { recursive: true, force: true });
    copyDirSync(clientSrc, clientDest);
  } else {
    console.warn(`Warning: Frontend client source folder not found at ${clientSrc}`);
  }
}

copyClientAssets();

const ctx = await esbuild.context({
  entryPoints: ["src/extension.js"],
  bundle: true,
  outfile: "dist/extension.js",
  // VS Code extensions run in Node.js — mark vscode as external
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false,
  // Allow importing from ../src/lib/ (the shared frontend lib)
  alias: {
    "@shared/parser":     "../src/lib/parser.js",
    "@shared/renderHtml": "../src/lib/renderHtml.js",
    "@shared/templates":  "../src/lib/templates.js",
  },
  logLevel: "info",
});

if (watch) {
  await ctx.watch();
  console.log("Watching for changes…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Build complete → dist/extension.js");
}

