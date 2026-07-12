#!/bin/bash
# Clean, simple build & debug script for VS Code Extension

# Exit on any error
set -e

# Navigate to the directory containing this script
cd "$(dirname "$0")"

echo "📦 Installing extension dependencies..."
npm install

echo "⚙️ Building the extension bundle..."
npm run build

echo "🗜️ Packaging extension to .vsix format..."
# Package using local vsce or npx vsce (supports offline/local generation)
npx @vscode/vsce package --no-dependencies --allow-missing-repository || npx vsce package --no-dependencies --allow-missing-repository || npx vsce package --allow-missing-repository

# Locate VS Code command line interface binary
if command -v code >/dev/null 2>&1; then
  VSCODE_BIN="code"
elif [ -f "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  VSCODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
else
  echo "⚠️ 'code' CLI not found. Please install the command in your PATH."
  echo "Open VS Code -> Command Palette (Cmd+Shift+P) -> Search: 'Shell Command: Install \'code\' command in PATH'"
  exit 1
fi

echo "🔌 Installing the generated .vsix package into VS Code..."
$VSCODE_BIN --install-extension md-to-docs-*.vsix --force

echo "🚀 Launching VS Code with Extension Development Host..."
$VSCODE_BIN --extensionDevelopmentPath="$(pwd)" .

echo "✅ Ready! VS Code window launched in Extension Development mode."
