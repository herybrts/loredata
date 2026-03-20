#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACKAGE_DIR="$REPO_DIR/packages/loredata"

echo "Building..."
pnpm --filter loredata run build

cp "$REPO_DIR/LICENSE" "$PACKAGE_DIR/LICENSE"
cp "$REPO_DIR/README.md" "$PACKAGE_DIR/README.md"

echo "Done. Package ready at: $PACKAGE_DIR"
