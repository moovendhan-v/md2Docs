#!/usr/bin/env bash
# publish.sh — Build, package, and publish MD → Docs extension to VS Code Marketplace
#
# Prerequisites:
#   1. npm install        (install devDependencies including vsce + esbuild)
#   2. Set VSCE_PAT env   — Azure DevOps Personal Access Token with Marketplace > Manage scope
#      export VSCE_PAT="your-pat-here"
#
# Usage:
#   ./publish.sh            # build + publish latest version
#   ./publish.sh --dry-run  # build + package only, skip publish (test locally)
#   ./publish.sh --bump     # auto-increment patch version, then publish

set -euo pipefail

cd "$(dirname "$0")"

DRY_RUN=false
BUMP=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --bump)    BUMP=true ;;
    *)         echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ── Pre-flight checks ────────────────────────────────────────────────────────

echo "── MD → Docs Publisher ──"

# Ensure vsce is available
if ! npx vsce --version &>/dev/null; then
  echo "Installing @vscode/vsce..."
  npm install --save-dev @vscode/vsce
fi

# ── Version bump ──────────────────────────────────────────────────────────────

if [ "$BUMP" = true ]; then
  echo "Bumping patch version..."
  npm version patch --no-git-tag-version
fi

VERSION=$(node -p "require('./package.json').version")
DISPLAY_NAME=$(node -p "require('./package.json').displayName")
echo "Publishing: $DISPLAY_NAME v$VERSION"

# ── Clean old dist ───────────────────────────────────────────────────────────

echo "Cleaning dist/..."
rm -rf dist

# ── Build ─────────────────────────────────────────────────────────────────────

echo "Building with esbuild..."
node esbuild.mjs

if [ ! -f dist/extension.js ]; then
  echo "ERROR: dist/extension.js not found after build."
  exit 1
fi

# ── Package ───────────────────────────────────────────────────────────────────

echo "Packaging .vsix..."
npx vsce package

VSIX="md-to-docs-${VERSION}.vsix"
if [ ! -f "$VSIX" ]; then
  echo "ERROR: $VSIX not created."
  exit 1
fi
echo "Created: $VSIX ($(du -h "$VSIX" | cut -f1))"

# ── Publish ───────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "── Dry run complete ──"
  echo "  .vsix: $VSIX"
  echo "  To publish manually: npx vsce publish"
  echo "  Or re-run: ./publish.sh"
  exit 0
fi

# Check for PAT
if [ -z "${VSCE_PAT:-}" ]; then
  echo ""
  echo "ERROR: VSCE_PAT environment variable is not set."
  echo ""
  echo "To publish you need a Personal Access Token from Azure DevOps:"
  echo "  1. Go to https://dev.azure.com"
  echo "  2. Click your profile → Personal access tokens"
  echo "  3. Create token with 'Marketplace > Manage' scope"
  echo "  4. Then run:"
  echo ""
  echo "     export VSCE_PAT=\"your-token-here\""
  echo "     ./publish.sh"
  echo ""
  echo "Or publish manually:"
  echo "     npx vsce publish -p \$VSCE_PAT"
  exit 1
fi

echo "Publishing to VS Code Marketplace..."
npx vsce publish -p "$VSCE_PAT"

echo ""
echo "── Published! ──"
echo "  $DISPLAY_NAME v$VERSION is now live."
echo "  https://marketplace.visualstudio.com/items?itemName=moovendhan.md-to-docs"
