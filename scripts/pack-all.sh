#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PACKS_DIR="packs"
SOURCE_DIR="pack-source"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "No pack-source/ directory found - nothing to pack." >&2
  exit 1
fi

for src_path in "$SOURCE_DIR"/*/; do
  name="$(basename "$src_path")"
  echo "==> Packing $name"
  fvtt package pack \
    -n "$name" \
    --in "$SOURCE_DIR/$name" \
    --out "$PACKS_DIR" \
    --yaml --recursive
done

echo "Done. Reload the world in Foundry (or restart) to see changes."
