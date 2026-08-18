#!/usr/bin/env bash
#
# Deploys on the server: pull, install, build, restart.
#
#   cd ~/devsaheb-app && ./scripts/deploy.sh
#
# Safe to re-run. It refuses to clobber uncommitted work, and it never touches
# content/ - after launch that directory is live content edited through /admin,
# and git has no business overwriting it.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "==> $ROOT"

# Anything dirty outside content/ is a hand-edit on the server that a pull
# would silently destroy. Stop rather than lose it.
DIRTY="$(git status --porcelain -- . ':!content' | head -5)"
if [ -n "$DIRTY" ]; then
  echo "Refusing to deploy: uncommitted changes outside content/"
  echo "$DIRTY"
  exit 1
fi

# content/ is different: after launch it is live content edited through /admin,
# and it is also tracked in git, so a pull that touches the same file would
# either refuse or overwrite the edit. Setting it aside and restoring it makes
# the server's copy win, which is correct - it is the one people actually used.
#
# If both sides changed the same file the restore conflicts, which is also
# correct: that needs a human, not a silent overwrite.
STASHED=0
if [ -n "$(git status --porcelain -- content)" ]; then
  echo "==> setting aside live content edits"
  git stash push --quiet -- content
  STASHED=1
fi

echo "==> git pull"
git pull --ff-only

if [ "$STASHED" = "1" ]; then
  echo "==> restoring live content edits"
  if ! git stash pop; then
    echo
    echo "CONFLICT: content changed both on the server and in git."
    echo "Resolve the files above, then re-run. Previous versions are in"
    echo "content/.versions/ if you need to recover one."
    exit 1
  fi
fi

echo "==> npm install"
# Not --omit=dev: vite, satori and resvg are devDependencies and the build
# needs all three.
npm install --no-audit --no-fund

echo "==> build"
npm run build

# Passenger watches this file's mtime and restarts the app when it changes.
echo "==> restart"
mkdir -p tmp
touch tmp/restart.txt

echo
echo "deployed. verify:"
echo "  curl -s https://www.devsaheb.com/api/health"
