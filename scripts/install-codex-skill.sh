#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src_dir="$repo_root/codex/skills/retroreversing-contributing"

codex_home="${CODEX_HOME:-$HOME/.codex}"
dest_dir="$codex_home/skills/retroreversing-contributing"

if [[ ! -d "$src_dir" ]]; then
  echo "Skill source directory not found: $src_dir" >&2
  exit 1
fi

mkdir -p "$dest_dir"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$src_dir/" "$dest_dir/"
else
  rm -rf "$dest_dir"
  mkdir -p "$dest_dir"
  cp -R "$src_dir/"* "$dest_dir/"
fi

echo "Installed Codex skill to: $dest_dir"

