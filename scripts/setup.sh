#!/usr/bin/env bash
# 初回セットアップ（macOS）。何度実行しても安全。
#   ./scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
step() { printf "\n\033[1m%s\033[0m\n" "$1"; }

step "1. 必要なツール（Homebrew）"
if ! command -v brew >/dev/null; then
  warn "Homebrew がありません。https://brew.sh の手順で入れてから再実行してください"; exit 1
fi
for f in git gh uv pnpm tmux; do
  if command -v "$f" >/dev/null; then ok "$f"; else brew install "$f"; ok "$f をインストール"; fi
done

NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/v([0-9]+).*/\1/' || echo 0)
if [ "${NODE_MAJOR:-0}" -lt 24 ]; then
  warn "Node.js 24 以上が必要です（今: $(node -v 2>/dev/null || echo なし)）"
  echo "    おすすめ: brew install fnm && fnm install 24 && fnm default 24  （シェルの設定は fnm の案内に従う）"
  exit 1
fi
ok "Node.js $(node -v)"

if command -v ollama >/dev/null; then ok "Ollama"; else warn "Ollama が未インストール: brew install ollama（または https://ollama.com から）"; fi
if command -v claude >/dev/null; then ok "Claude Code"; else warn "Claude Code が未インストール: https://docs.claude.com/en/docs/claude-code/overview の手順で入れる"; fi
if command -v openclaw >/dev/null; then ok "OpenClaw"; else warn "OpenClaw が未インストール（会話を試すときに必要。手順は openclaw/README.md）"; fi
if curl -fs -m 2 http://127.0.0.1:10101/version >/dev/null 2>&1; then ok "AivisSpeech（起動中）"; else warn "AivisSpeech は音声担当・音声を試すときに必要（手順は docs/SETUP.md）"; fi

step "2. 依存ライブラリ"
pnpm install
(cd services/tools && uv sync)
(cd services/voice && uv sync)
ok "pnpm / uv の依存をインストール"

step "3. 環境変数"
if [ -f .env.local ]; then ok ".env.local あり"; else cp .env.example .env.local; ok ".env.local を作成（OPENCLAW_GATEWAY_TOKEN は後で記入）"; fi

step "4. あなたは誰？"
mkdir -p .jarvis
if [ -f .jarvis/member.json ]; then
  ok "設定済み: $(node scripts/jarvis.mjs whoami)"
else
  echo "    C = Sota（統合・データとツール） / A = 音声 / B = 画面"
  read -r -p "    メンバー ID を入力 [A/B/C]: " MID
  MID=$(echo "$MID" | tr '[:lower:]' '[:upper:]')
  case "$MID" in A|B|C) printf '{\n  "id": "%s"\n}\n' "$MID" > .jarvis/member.json ;; *) warn "A/B/C のどれかを入力してください"; exit 1 ;; esac
  ok "$(node scripts/jarvis.mjs whoami)"
fi

step "5. GitHub"
if gh auth status >/dev/null 2>&1; then ok "gh ログイン済み（$(gh api user -q .login)）"; else gh auth login -h github.com -p https -w; fi
GH_USER=$(gh api user -q .login)
MID=$(node -e "console.log(require('./.jarvis/member.json').id)")
REG=$(node -e "console.log(require('./docs/schedule.json').members['$MID']?.github||'')")
if [ "$REG" != "$GH_USER" ]; then
  warn "docs/schedule.json の members.$MID.github が「${REG:-未設定}」です。「$GH_USER」に直す PR を出してください"
fi
git config --local pull.ff only
git config --local push.autoSetupRemote true
ok "git の設定（pull は fast-forward のみ）"

step "完了"
echo "  開発環境を開く: ./scripts/dev.sh"
echo "  作業を始める:   claude を起動して /start"
echo "  詳しい手順:     docs/SETUP.md"
