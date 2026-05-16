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

# prepare-commit-msg: receives ($1=msg-file $2=source $3=sha) AFTER the message
# has been prepared. Lets us read the real commit subject for the changelog.
PREP="$ROOT/.git/hooks/prepare-commit-msg"
cat > "$PREP" <<'EOF'
#!/usr/bin/env bash
# Auto-bump patch version + prepend changelog entry using actual commit subject.
# Skip with: git commit --no-verify
set -e
REPO="$(git rev-parse --show-toplevel)"
node "$REPO/scripts/bump-version.mjs" "$1" "$2"
EOF
chmod +x "$PREP"

chmod +x "$ROOT/scripts/bump-version.mjs"
chmod +x "$ROOT/scripts/scan-secrets.mjs"

echo "✓ git hooks installed:"
echo "    pre-commit         → scripts/scan-secrets.mjs    (blocks commit on secret patterns)"
echo "    prepare-commit-msg → scripts/bump-version.mjs    (bumps patch + writes changelog)"
echo "  Skip both with: git commit --no-verify  (only when intentional)"
