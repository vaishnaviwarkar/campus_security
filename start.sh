#!/usr/bin/env bash
set -e

echo "==================================================="
echo " Starting CampusAssetSecurity Local Dev Server..."
echo "==================================================="
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/2] Installing dependencies with npm..."
  npm install
fi

echo ""
echo "[2/2] Starting server at http://localhost:3000 ..."
echo "Press Ctrl+C at any time to stop the server."
echo ""
npm run dev
