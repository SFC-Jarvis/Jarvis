#!/usr/bin/env bash
# 開発環境を開く（tmux で web / tools /（voice）/ Claude を並べる）
#   ./scripts/dev.sh            web + tools + Claude 用のウィンドウ
#   ./scripts/dev.sh --voice    音声サービスも起動
#   ./scripts/dev.sh --mock     OpenClaw なしで画面を開発（JARVIS_MOCK=1）
#   ./scripts/dev.sh --no-claude / --no-browser
#   ./scripts/dev.sh status     周辺サービスの状態だけ確認
#   ./scripts/dev.sh stop       すべて止める
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
SESSION=jarvis

VOICE=0; MOCK=""; CLAUDE=1; BROWSER=1; CMD=start
for a in "$@"; do
  case "$a" in
    --voice) VOICE=1 ;;
    --mock) MOCK=1 ;;
    --no-claude) CLAUDE=0 ;;
    --no-browser) BROWSER=0 ;;
    status|stop) CMD=$a ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "不明なオプション: $a"; exit 1 ;;
  esac
done

# ブラウザを開く（mac: open / WSL: Windows の既定ブラウザ / Linux: xdg-open）
open_url() {
  if [ "$(uname)" = Darwin ]; then open "$1"
  elif grep -qi microsoft /proc/version 2>/dev/null; then cmd.exe /c start "" "$1" >/dev/null 2>&1 || explorer.exe "$1"
  else xdg-open "$1" >/dev/null 2>&1 || echo "ブラウザで $1 を開いてください"; fi
}
IS_WSL=0; grep -qi microsoft /proc/version 2>/dev/null && IS_WSL=1

[ -f .env.local ] || { echo ".env.local がありません。先に ./scripts/setup.sh を実行してください"; exit 1; }
set -a; source .env.local; set +a
[ -n "$MOCK" ] && export JARVIS_MOCK=1

probe() { curl -fs -m 2 "$1" >/dev/null 2>&1 && printf "\033[32m起動中\033[0m" || printf "\033[33m停止\033[0m"; }
status() {
  echo "── 周辺サービス ──"
  printf "  OpenClaw    %s  %s\n" "$(probe "${OPENCLAW_BASE_URL:-http://127.0.0.1:18789}/v1/models")" "（停止なら: openclaw gateway）"
  printf "  Ollama      %s  %s\n" "$(probe "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags")" "$([ $IS_WSL = 1 ] && echo '（停止なら: Windows 側で Ollama を起動）' || echo '（停止なら: ollama serve / アプリを起動）')"
  printf "  AivisSpeech %s  %s\n" "$(probe "${AIVIS_BASE_URL:-http://127.0.0.1:10101}/version")" "（音声を使うときだけ必要$([ $IS_WSL = 1 ] && echo '。Windows 側で起動'))"
  [ "${JARVIS_MOCK:-0}" = "1" ] && echo "  ※ JARVIS_MOCK=1: 画面は OpenClaw なしで固定の返答を返します"
  echo "── 今の作業 ──"
  node scripts/jarvis.mjs context --brief | sed 's/^/  /'
}

remind() {
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    printf "\n\033[33m未コミットの変更があります。Claude で /done を実行して Push・PR 更新をしてください。\033[0m\n"
  fi
}

case "$CMD" in
  status) status; exit 0 ;;
  stop) tmux kill-session -t "$SESSION" 2>/dev/null && echo "停止しました" || echo "起動していません"; remind; exit 0 ;;
esac

command -v tmux >/dev/null || { echo "tmux がありません: brew install tmux"; exit 1; }
[ -d node_modules ] || pnpm install
status

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "すでに起動中です。接続します（止めるには ./scripts/dev.sh stop）"
  exec tmux attach -t "$SESSION"
fi

# 各ウィンドウで .env.local を読み込んでから実行する
run() { printf "cd '%s' && set -a && source .env.local && set +a && export JARVIS_MOCK=%s && %s" "$ROOT" "${JARVIS_MOCK:-0}" "$1"; }

tmux new-session -d -s "$SESSION" -n web -c "$ROOT" "bash -c \"$(run 'pnpm --filter @jarvis/web dev'); exec bash\""
tmux new-window -t "$SESSION" -n tools -c "$ROOT" "bash -c \"$(run 'cd services/tools && uv run python -m jarvis_tools'); exec bash\""
if [ "$VOICE" = 1 ]; then
  tmux new-window -t "$SESSION" -n voice -c "$ROOT" "bash -c \"$(run 'cd services/voice && uv run --extra runtime python -m jarvis_voice'); exec bash\""
fi
if [ "$CLAUDE" = 1 ] && command -v claude >/dev/null; then
  tmux new-window -t "$SESSION" -n claude -c "$ROOT" "claude; bash"
else
  tmux new-window -t "$SESSION" -n shell -c "$ROOT"
fi
# 画面下のバー: 左に今のウィンドウ一覧、右に操作方法を常に表示する
# （文字化けしないよう、バーの中は英数字だけにする）
tset() { tmux set-option -t "$SESSION" "$@" >/dev/null; }
tset mouse on
tset status-style "bg=colour24,fg=colour255"
tset status-left-length 20
tset status-left "#[bold] JARVIS #[nobold]| "
tset window-status-format " #I:#W "
tset window-status-current-format "#[bg=colour214,fg=colour16,bold] #I:#W "
# 操作方法はバーの 2 行目に出す（縦長のモニターなど幅が狭くても切れないように）
HELP="Switch: press Ctrl-b, release, then 0-9 | Detach: Ctrl-b d | Stop: ./scripts/dev.sh stop"
if tmux set-option -t "$SESSION" status 2 2>/dev/null; then
  tset status-right ""
  tset 'status-format[1]' "#[align=left,bg=colour236,fg=colour252] $HELP"
else
  # 古い tmux（2.9 未満）は 1 行だけ。短い説明を右に出す
  tset status-right-length 60
  tset status-right " Ctrl-b 0-9: switch | Ctrl-b d: detach "
fi

if [ "$BROWSER" = 1 ]; then
  ( for _ in $(seq 1 30); do curl -fs -m 1 http://localhost:3000 >/dev/null 2>&1 && { open_url http://localhost:3000; break; }; sleep 1; done ) &
fi

cat <<'MSG'

  ── tmux（画面を分ける道具）で開きます ──
  ・画面の一番下のバーに、ウィンドウの一覧（0:web 1:tools 2:claude ...）と操作方法が出ます
  ・ウィンドウの切り替え: Ctrl-b を押して離してから、番号のキー
      例) Ctrl-b → 0 で web（画面のログ）、Ctrl-b → 2 で claude。マウスでクリックしても選べる
  ・開いたまま抜ける: Ctrl-b → d ／ 戻る: ./scripts/dev.sh ／ 止める: ./scripts/dev.sh stop
  ・作業を始める: claude のウィンドウで /start

MSG
sleep 2
tmux attach -t "$SESSION" || true
remind
