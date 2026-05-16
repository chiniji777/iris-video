#!/usr/bin/env bash
# Install iris-video as a Claude Code skill.
# After install, type /iris-video in Claude Code to load the skill.
set -euo pipefail

SKILL_NAME="iris-video"
SRC="$(cd "$(dirname "$0")" && pwd)/SKILL.md"
DEST="${HOME}/.claude/skills/${SKILL_NAME}"

mkdir -p "${DEST}"
cp "${SRC}" "${DEST}/SKILL.md"
echo "✅ Installed iris-video skill → ${DEST}/SKILL.md"
echo "   Type /iris-video in Claude Code to use it."
