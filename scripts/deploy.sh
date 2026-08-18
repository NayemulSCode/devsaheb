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

# content/ is written by the running app, so it will always look dirty here.
# Anything else dirty means a hand-edit that a pull would silently destroy.
DIRTY="$(git status --porcelain -- . ':!content' | head -5)"
if [ -n "$DIRTY" ]; then
  echo "Refusing to deploy: uncommitted changes outside content/"
  echo "$DIRTY"
  exit 1
fi

echo "==> git pull"
git pull --ff-only

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
