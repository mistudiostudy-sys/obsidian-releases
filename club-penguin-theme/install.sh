#!/usr/bin/env bash
# Instalador del tema Club Penguin para macOS / Linux.
# Uso: bash install.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  🐧 Instalador Club Penguin Isla"
echo "  ================================"
echo ""

# ---------- 1. Visual Studio Code ----------
echo "[1/2] Instalando extensión para Visual Studio Code..."
VSIX="$(ls "$HERE"/club-penguin-isla-*.vsix 2>/dev/null | sort | tail -n 1 || true)"
CODE="$(command -v code || true)"
if [ -z "$CODE" ] && [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  CODE="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
fi

if [ -n "$CODE" ] && [ -n "$VSIX" ]; then
  "$CODE" --install-extension "$VSIX" --force
  echo "  ✔ Extensión instalada."
else
  VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$HERE/vscode-extension/package.json" | head -n 1)"
  DEST="$HOME/.vscode/extensions/pinguino-fan.club-penguin-isla-$VERSION"
  rm -rf "$DEST"
  mkdir -p "$HOME/.vscode/extensions"
  cp -R "$HERE/vscode-extension" "$DEST"
  echo "  ✔ Extensión copiada a $DEST"
fi
echo "  → Reinicia VS Code: el tema 'Club Penguin Isla' se activa solo y tu pingüino"
echo "    aparece en el Explorador (panel '🐧 Club Penguin')."
echo ""

# ---------- 2. Google Chrome ----------
echo "[2/2] Preparando tema de Halloween para Google Chrome..."
CHROME_DEST="$HOME/.club-penguin-theme/chrome-theme-halloween"
rm -rf "$CHROME_DEST"
mkdir -p "$(dirname "$CHROME_DEST")"
cp -R "$HERE/chrome-theme-halloween" "$CHROME_DEST"
echo "  ✔ Tema copiado a: $CHROME_DEST"
echo ""
echo "  Para aplicarlo en Chrome (solo una vez):"
echo "   1. Abre chrome://extensions"
echo "   2. Activa 'Modo de desarrollador' (arriba a la derecha)"
echo "   3. Clic en 'Cargar extensión sin empaquetar' y elige la carpeta de arriba"
echo ""
echo "🎃 ¡Listo! Waddle on 🐧"
