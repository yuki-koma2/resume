#!/bin/bash
# git hooks installer
#
# scripts/hooks/ 配下のフックを .git/hooks/ にシンボリックリンクで配置する。
# 新環境セットアップ時に以下を 1 度実行する:
#
#   bash scripts/install-hooks.sh

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

HOOKS_SRC_DIR="scripts/hooks"
HOOKS_DST_DIR=".git/hooks"

if [ ! -d "$HOOKS_SRC_DIR" ]; then
  echo "ERROR: $HOOKS_SRC_DIR が存在しません。" >&2
  exit 1
fi

if [ ! -d "$HOOKS_DST_DIR" ]; then
  echo "ERROR: $HOOKS_DST_DIR が存在しません（git リポジトリではない？）。" >&2
  exit 1
fi

for hook_file in "$HOOKS_SRC_DIR"/*; do
  hook_name=$(basename "$hook_file")
  dst="$HOOKS_DST_DIR/$hook_name"

  # 既存のフックがあれば事前に確認
  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    echo "WARN: $dst が既存（シンボリックリンクではない）。スキップします。" >&2
    echo "      手動で .git/hooks/$hook_name を確認してください。" >&2
    continue
  fi

  ln -sf "../../$hook_file" "$dst"
  echo "Installed: $dst -> ../../$hook_file"
done

# secrets ファイルが無ければ案内
if [ ! -f "dictionary/prh_secrets.yml" ]; then
  echo ""
  echo "NOTE: dictionary/prh_secrets.yml が未作成です。"
  echo "      以下を実行して禁止語リストを作成してください:"
  echo ""
  echo "        cp dictionary/prh_secrets.yml.example dictionary/prh_secrets.yml"
  echo ""
  echo "      その後 prh_secrets.yml に実値（病院名・個人名・社内コードネーム等）を書いてください。"
fi

echo ""
echo "Done."
