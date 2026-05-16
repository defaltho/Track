#!/usr/bin/env bash
# Installs the project's git hooks into .git/hooks.
# Run once after cloning: bash scripts/install-git-hooks.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# 1) Scan staged diff for secret patterns — block commit if found.
# 2) Auto-bump version + append changelog entry.
# Skip both with: git commit --no-verify
set -e
REPO="$(git rev-parse --show-toplevel)"
node "$REPO/scripts/scan-secrets.mjs"
node "$REPO/scripts/bump-version.mjs"
EOF

chmod +x "$HOOK"
chmod +x "$ROOT/scripts/bump-version.mjs"
chmod +x "$ROOT/scripts/scan-secrets.mjs"

echo "✓ pre-commit hook installed at $HOOK"
echo "  Step 1: Blocks commit if secret patterns detected in staged diff"
echo "  Step 2: Bumps patch version + writes changelog entry"
echo "  Skip both with: git commit --no-verify  (only when you've verified no secrets)"
