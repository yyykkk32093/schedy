#!/bin/bash
# =============================================================================
# VS Code Copilot チャット履歴移行スクリプト
#
# ディレクトリ名の変更 + 旧ワークスペースのチャット履歴を新ワークスペースへ移行する。
# 1. ~/旧ディレクトリ → ~/新ディレクトリ にリネーム
# 2. VS Code を新ディレクトリで開いて新ワークスペースストレージを作成
# 3. 旧ストレージからチャット履歴をマージ
#
# 使い方:
#   bash restore-chat-history.sh <旧ディレクトリ名> <新ディレクトリ名>
#
# 例:
#   bash restore-chat-history.sh tsudocan tsunaca
# =============================================================================

set -euo pipefail

# ---------- 引数チェック ----------
if [[ $# -ne 2 ]]; then
  echo "使い方: $0 <旧ディレクトリ名> <新ディレクトリ名>"
  echo "例:     $0 tsudocan tsunaca"
  exit 1
fi

OLD_DIR="$1"
NEW_DIR="$2"
WS_BASE="$HOME/Library/Application Support/Code/User/workspaceStorage"

# ---------- VS Code が起動していないことを確認 ----------
echo "✅ VS Codeが終了していることを確認"
if pgrep -x "Electron" >/dev/null 2>&1 || pgrep -f "Visual Studio Code" >/dev/null 2>&1; then
  echo "⚠️  VS Code が起動中です。先に閉じてください。"
  exit 1
fi

# ---------- ディレクトリリネーム ----------
OLD_PATH="$HOME/$OLD_DIR"
NEW_PATH="$HOME/$NEW_DIR"

if [[ -d "$OLD_PATH" ]]; then
  echo "📂 ディレクトリをリネーム中..."
  echo "   $OLD_PATH → $NEW_PATH"
  mv "$OLD_PATH" "$NEW_PATH"
elif [[ -d "$NEW_PATH" ]]; then
  echo "📂 ディレクトリは既にリネーム済み: $NEW_PATH"
else
  echo "❌ ディレクトリが見つかりません: $OLD_PATH"
  exit 1
fi

# ---------- VS Code で新ワークスペースストレージを作成 ----------
echo "🚀 VS Code を新ディレクトリで起動します..."
echo "   → 起動したら VS Code を閉じてください（ウィンドウを閉じるだけでOK）"
code --wait "$NEW_PATH"
echo "✅ VS Code を閉じました"

# ---------- ワークスペースストレージを探す ----------
# 同名ディレクトリのストレージが複数ある場合、chatSessions が最も多いものを選ぶ
find_workspace() {
  local dir_name="$1"
  local best=""
  local best_count=0
  for ws in "$WS_BASE"/*/workspace.json; do
    if grep -q "$dir_name" "$ws" 2>/dev/null; then
      local candidate="$(dirname "$ws")"
      local count=0
      if [[ -d "$candidate/chatSessions" ]]; then
        count=$(ls "$candidate/chatSessions/" 2>/dev/null | wc -l | tr -d ' ')
      fi
      if [[ $count -gt $best_count ]]; then
        best="$candidate"
        best_count=$count
      fi
    fi
  done
  echo "$best"
}

OLD_WS=$(find_workspace "$OLD_DIR")
NEW_WS=$(find_workspace "$NEW_DIR")

if [[ -z "$OLD_WS" ]]; then
  echo "❌ 旧ワークスペースストレージが見つかりません: $OLD_DIR"
  echo "   $WS_BASE 内に該当する workspace.json がありません。"
  exit 1
fi

if [[ -z "$NEW_WS" ]]; then
  echo "❌ 新ワークスペースストレージが見つかりません: $NEW_DIR"
  echo "   VS Code で ~/$NEW_DIR を開いて閉じてからやり直してください。"
  exit 1
fi

echo "   旧: $OLD_WS"
echo "   新: $NEW_WS"

# ---------- バックアップ ----------
echo "📦 バックアップを作成中..."
BACKUP_DIR="$NEW_WS.backup.$(date +%Y%m%d%H%M%S)"
cp -r "$NEW_WS" "$BACKUP_DIR"
echo "   → $BACKUP_DIR"

# ---------- state.vscdb のチャットインデックスをマージ ----------
echo "🔄 state.vscdb のチャットインデックスをマージ中..."

OLD_DB="$OLD_WS/state.vscdb"
NEW_DB="$NEW_WS/state.vscdb"

if [[ -f "$OLD_DB" && -f "$NEW_DB" ]]; then
  # マージ対象のキー一覧
  CHAT_KEYS=(
    "chat.ChatSessionStore.index"
    "agentSessions.state.cache"
  )

  for key in "${CHAT_KEYS[@]}"; do
    old_val=$(sqlite3 "$OLD_DB" "SELECT value FROM ItemTable WHERE key = '$key';" 2>/dev/null || echo "")
    new_val=$(sqlite3 "$NEW_DB" "SELECT value FROM ItemTable WHERE key = '$key';" 2>/dev/null || echo "")

    if [[ -z "$old_val" ]]; then
      continue
    fi

    if [[ -z "$new_val" ]]; then
      # 新側にキーがなければ旧側の値をそのまま挿入
      sqlite3 "$NEW_DB" "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('$key', '$(echo "$old_val" | sed "s/'/''/g")');"
      count=$(echo "$old_val" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else len(d) if isinstance(d,dict) else 1)" 2>/dev/null || echo "?")
      echo "  $key: $count entries (inserted)"
    else
      # 両方にある場合はマージ（JSON配列 or オブジェクト）
      merged=$(python3 -c "
import json, sys

old = json.loads('''$old_val''')
new = json.loads('''$new_val''')

if isinstance(old, list) and isinstance(new, list):
    # 配列: 重複除去しつつ結合
    seen = set()
    result = []
    for item in new + old:
        key_id = json.dumps(item, sort_keys=True) if isinstance(item, dict) else str(item)
        if key_id not in seen:
            seen.add(key_id)
            result.append(item)
    print(json.dumps(result))
elif isinstance(old, dict) and isinstance(new, dict):
    # オブジェクト: entries等のネストされたdictも深くマージ
    merged = {}
    for k in set(list(old.keys()) + list(new.keys())):
        ov = old.get(k)
        nv = new.get(k)
        if isinstance(ov, dict) and isinstance(nv, dict):
            merged[k] = {**ov, **nv}
        elif nv is not None:
            merged[k] = nv
        else:
            merged[k] = ov
    print(json.dumps(merged))
else:
    # それ以外は新側を維持
    print(json.dumps(new))
" 2>/dev/null || echo "")

      if [[ -n "$merged" ]]; then
        sqlite3 "$NEW_DB" "UPDATE ItemTable SET value = '$(echo "$merged" | sed "s/'/''/g")' WHERE key = '$key';"
        count=$(echo "$merged" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else len(d) if isinstance(d,dict) else 1)" 2>/dev/null || echo "?")
        echo "  $key: $count entries"
      fi
    fi
  done

  # memento 系のキーをコピー（新側に存在しないもののみ）
  MEMENTO_KEYS=$(sqlite3 "$OLD_DB" "SELECT key FROM ItemTable WHERE key LIKE 'memento/%chat%' OR key LIKE 'memento/%todo%';" 2>/dev/null || echo "")
  for mkey in $MEMENTO_KEYS; do
    existing=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM ItemTable WHERE key = '$mkey';" 2>/dev/null || echo "0")
    if [[ "$existing" == "0" ]]; then
      mval=$(sqlite3 "$OLD_DB" "SELECT value FROM ItemTable WHERE key = '$mkey';" 2>/dev/null || echo "")
      if [[ -n "$mval" ]]; then
        sqlite3 "$NEW_DB" "INSERT INTO ItemTable (key, value) VALUES ('$mkey', '$(echo "$mval" | sed "s/'/''/g")');"
        echo "  Copied: $mkey"
      fi
    fi
  done

  echo "  Done"
else
  echo "  ⚠️  state.vscdb が見つかりません。スキップします。"
fi

# ---------- chatSessions をマージ ----------
echo "📁 chatSessions をマージ中..."
if [[ -d "$OLD_WS/chatSessions" ]]; then
  mkdir -p "$NEW_WS/chatSessions"
  cp -n "$OLD_WS/chatSessions/"*.json "$NEW_WS/chatSessions/" 2>/dev/null || true
  cp -n "$OLD_WS/chatSessions/"*.jsonl "$NEW_WS/chatSessions/" 2>/dev/null || true
fi

# ---------- chatEditingSessions をマージ ----------
echo "📁 chatEditingSessions をマージ中..."
if [[ -d "$OLD_WS/chatEditingSessions" ]]; then
  mkdir -p "$NEW_WS/chatEditingSessions"
  cp -n "$OLD_WS/chatEditingSessions/"*.json "$NEW_WS/chatEditingSessions/" 2>/dev/null || true
  cp -n "$OLD_WS/chatEditingSessions/"*.jsonl "$NEW_WS/chatEditingSessions/" 2>/dev/null || true
fi

# ---------- GitHub.copilot-chat をマージ ----------
if [[ -d "$OLD_WS/GitHub.copilot-chat" ]]; then
  echo "📁 GitHub.copilot-chat をマージ中..."
  mkdir -p "$NEW_WS/GitHub.copilot-chat"
  cp -rn "$OLD_WS/GitHub.copilot-chat/"* "$NEW_WS/GitHub.copilot-chat/" 2>/dev/null || true
fi

echo ""
echo "✅ 完了！VS Codeを開いてください:"
echo "   code ~/$NEW_DIR"
