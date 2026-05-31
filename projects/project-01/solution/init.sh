#!/usr/bin/env bash
# init.sh -- Restore the project to a runnable state.
# Usage: bash init.sh
# After completion, run: npm start (or npm run dev)
set -euo pipefail

echo "=== Project 01 Init ==="
echo ""

echo "[1/3] Installing dependencies..."
npm install
echo ""

echo "[2/3] Running type checks..."
npm run check
echo ""

echo "[3/3] Building project..."
npm run build
echo ""

echo "=== Init complete. All checks passed. ==="
echo "Run 'npm start' to launch the application."
