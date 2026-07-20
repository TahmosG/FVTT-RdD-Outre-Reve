#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PACKS_DIR="packs"
SOURCE_DIR="pack-source"

if [ ! -d "$PACKS_DIR" ]; then
  echo "No packs/ directory found - nothing to unpack." >&2
  exit 1
fi

for pack_path in "$PACKS_DIR"/*/; do
  name="$(basename "$pack_path")"
  echo "==> Unpacking $name"
  fvtt package unpack \
    -n "$name" \
    --in "$PACKS_DIR" \
    --out "$SOURCE_DIR/$name" \
    --yaml --folders --clean --omitVolatile
done

echo "Done. Review with: git status pack-source/ / git diff pack-source/"
