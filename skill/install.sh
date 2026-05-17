#!/usr/bin/env bash
# Install iris-video as a global Claude Code skill + CLI.
#
# What this does:
#   1. Copies SKILL.md → ~/.claude/skills/iris-video/ (Claude Code picks it up
#      automatically — any agent on this Mac can use /iris-video).
#   2. Runs `bun link` so the `iris-video` CLI lands on PATH globally
#      (via ~/.bun/bin/iris-video). Works from any directory.
#   3. Installs bun if missing.
set -euo pipefail

SKILL_NAME="iris-video"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${SCRIPT_DIR}/SKILL.md"
DEST="${HOME}/.claude/skills/${SKILL_NAME}"

echo "==> Installing iris-video skill"

# 1) Skill markdown
mkdir -p "${DEST}"
cp "${SRC}" "${DEST}/SKILL.md"
echo "  • Skill → ${DEST}/SKILL.md"

# 2) bun (required to run the CLI)
if ! command -v bun >/dev/null 2>&1; then
  echo "  • bun not found — installing..."
  curl -fsSL https://bun.sh/install | bash
  # shellcheck disable=SC1090,SC1091
  source "${HOME}/.bun/env" 2>/dev/null || export PATH="${HOME}/.bun/bin:${PATH}"
fi

# 3) Install repo deps (idempotent)
if [ ! -d "${REPO_DIR}/node_modules" ]; then
  echo "  • Installing repo dependencies (bun install)..."
  (cd "${REPO_DIR}" && bun install --silent)
fi

# 4) Register CLI globally via `bun link`
echo "  • Registering CLI via bun link..."
(cd "${REPO_DIR}" && bun link >/dev/null 2>&1 || true)

if command -v iris-video >/dev/null 2>&1; then
  echo "  • CLI → $(command -v iris-video)"
else
  echo "  ⚠ CLI not on PATH yet. Ensure ~/.bun/bin is in your PATH."
fi

echo ""
echo "✅ iris-video installed globally."
echo "   Skill: type /iris-video in Claude Code"
echo "   CLI:   iris-video --help"
