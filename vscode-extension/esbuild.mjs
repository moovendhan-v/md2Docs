// esbuild.mjs — bundles both the extension backend and the React frontend webview
import * as esbuild from "esbuild";
import { argv } from "process";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const watch = argv.includes("--watch");
const rootDir = path.resolve("..");

fs.mkdirSync(path.resolve("dist/client"), { recursive: true });

// 1. Compile Tailwind CSS from the main app
console.log("🎨 Compiling Tailwind CSS for extension webview...");
try {
  execSync("npx tailwindcss -i app/globals.css -o vscode-extension/dist/client/app.css -c tailwind.config.js --minify", {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch (e) {
  console.warn("Tailwind compilation note:", e.message);
}

const sharedAliases = {
  "@": path.resolve("../src"),
  "@shared/parser": path.resolve("../src/lib/parser.ts"),
  "@shared/renderHtml": path.resolve("../src/lib/renderHtml.ts"),
  "@shared/templates": path.resolve("../src/lib/templates.ts"),
};

// 2. Extension backend bundle (Node.js)
const extensionCtx = await esbuild.context({
  entryPoints: ["src/extension.js"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false,
  alias: sharedAliases,
  logLevel: "info",
});

// 3. React Frontend Webview bundle (Browser)
const webviewCtx = await esbuild.context({
  entryPoints: ["src/webview/index.tsx"],
  bundle: true,
  outfile: "dist/client/app.js",
  format: "iife",
  platform: "browser",
  target: ["es2020", "chrome100"],
  sourcemap: false,
  minify: false,
  define: {
    "process.env.NODE_ENV": '"production"',
    "global": "window",
  },
  alias: sharedAliases,
  loader: {
    ".woff2": "dataurl",
    ".woff": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
    ".png": "dataurl",
  },
  logLevel: "info",
});

if (watch) {
  await extensionCtx.watch();
  await webviewCtx.watch();
  console.log("Watching for changes…");
} else {
  await extensionCtx.rebuild();
  await webviewCtx.rebuild();
  await extensionCtx.dispose();
  await webviewCtx.dispose();
  console.log("Build complete → dist/extension.js & dist/client/app.js");
}
