// esbuild.mjs — bundles the extension + shared frontend lib into dist/extension.js
import * as esbuild from "esbuild";
import { argv } from "process";

const watch = argv.includes("--watch");

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
