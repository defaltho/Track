#!/usr/bin/env bash
# Installs the project's git hooks into .git/hooks.
# Run once after cloning: bash scripts/install-git-hooks.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# pre-commit: secret scan only (runs BEFORE the commit message is set, so it
# cannot reliably read the subject — that's why bump is in prepare-commit-msg)
PRE="$ROOT/.git/hooks/pre-commit"
cat > "$PRE" <<'EOF'
#!/usr/bin/env bash
# Block commit if secret patterns appear in staged diff.
# Skip with: git commit --no-verify  (only when you've verified no secrets)
set -e
REPO="$(git rev-parse --show-toplevel)"
node "$REPO/scripts/scan-secrets.mjs"
EOF
chmod +x "$PRE"

# Remove any old broken auto-bump hook (was unreliable — git's snapshot of the
# index is taken before prepare-commit-msg runs, so files added there leak out).
rm -f "$ROOT/.git/hooks/prepare-commit-msg"

chmod +x "$ROOT/scripts/scan-secrets.mjs"
chmod +x "$ROOT/scripts/bump-version.mjs"

echo "✓ git hook installed:"
echo "    pre-commit → scripts/scan-secrets.mjs    (blocks commit on secret patterns)"
echo ""
echo "Manual version bump (when you want to ship a release):"
echo "    npm run bump          # bumps patch in package.json + version.ts + changelog"
echo ""
echo "Skip secret scan with: git commit --no-verify  (only when intentional)"
