#!/usr/bin/env bash
# 初回セットアップ（macOS / Windows の WSL2）。何度実行しても安全。
#   ./scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
step() { printf "\n\033[1m%s\033[0m\n" "$1"; }

# 実行環境の判定: mac / wsl（Windows の WSL2）/ linux
OS=linux
if [ "$(uname)" = "Darwin" ]; then OS=mac
elif grep -qi microsoft /proc/version 2>/dev/null; then OS=wsl; fi

step "1. 必要なツール（${OS}）"
if [ "$OS" = wsl ]; then
  case "$ROOT" in
    /mnt/*) warn "リポジトリが Windows 側（${ROOT}）にあります。WSL のホーム（~/）に clone し直してください（遅く、権限も壊れやすいため）"; exit 1 ;;
  esac
fi

if [ "$OS" = mac ]; then
  if ! command -v brew >/dev/null; then
    warn "Homebrew がありません。https://brew.sh の手順で入れてから再実行してください"; exit 1
  fi
  for f in git gh uv tmux; do
    if command -v "$f" >/dev/null; then ok "$f"; else brew install "$f"; ok "$f をインストール"; fi
  done
else
  NEED=""
  for f in git tmux curl unzip wget; do command -v "$f" >/dev/null || NEED="$NEED $f"; done
  if [ -n "$NEED" ]; then
    echo "  apt でインストール:${NEED}（sudo のパスワードを聞かれます。入力しても画面には表示されません）"
    sudo apt-get update -qq && sudo apt-get install -y -qq $NEED build-essential
  fi
  if ! command -v gh >/dev/null; then
    # GitHub CLI は公式の配布元から入れる（Ubuntu 標準のものは古いことがあるため）
    echo "  GitHub CLI（gh）をインストール"
    sudo mkdir -p -m 755 /etc/apt/keyrings
    wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
    sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
    sudo apt-get update -qq && sudo apt-get install -y -qq gh
  fi
  for f in git tmux gh; do ok "$f"; done
  if command -v uv >/dev/null; then ok "uv"; else
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"; ok "uv をインストール（新しいターミナルから PATH が通ります）"
  fi
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/v([0-9]+).*/\1/' || echo 0)
if [ "${NODE_MAJOR:-0}" -lt 24 ]; then
  warn "Node.js 24 以上が必要です（今: $(node -v 2>/dev/null || echo なし)）"
  if [ "$OS" = mac ]; then
    echo "    brew install fnm && fnm install 24 && fnm default 24"
  else
    echo "    curl -fsSL https://fnm.vercel.app/install | bash   # その後ターミナルを開き直す"
    echo "    fnm install 24 && fnm default 24"
  fi
  echo "    （シェルの設定は fnm の案内に従う。終わったらこのスクリプトを再実行）"
  exit 1
fi
ok "Node.js $(node -v)"

# Linux・WSL: ~/.local/bin（uv・Claude Code の置き場所）を PATH に入れる
if [ "$OS" != mac ] && ! grep -q 'HOME/.local/bin' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  ok "~/.bashrc に ~/.local/bin の PATH を追加（新しいターミナルから有効）"
fi
export PATH="$HOME/.local/bin:$PATH"

# pnpm のダウンロード確認（[Y/n]）を出さない
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if command -v pnpm >/dev/null; then ok "pnpm"; else
  corepack enable pnpm 2>/dev/null || npm install -g pnpm@10
  ok "pnpm をインストール"
fi

if [ "$OS" = wsl ]; then
  # Ollama・AivisSpeech は Windows 側にインストールする（GPU とスピーカーを直接使えるため）
  OLLAMA_HINT="Windows 側に https://ollama.com からインストール（docs/SETUP_WINDOWS.md）"
  AIVIS_HINT="Windows 側にインストール（docs/SETUP_WINDOWS.md）"
  if grep -qi mirrored /mnt/c/Users/*/.wslconfig 2>/dev/null; then ok ".wslconfig: networkingMode=mirrored"
  else warn ".wslconfig のミラーモードが未設定かもしれません（docs/SETUP_WINDOWS.md の手順 1）"; fi
else
  OLLAMA_HINT="brew install ollama（または https://ollama.com から）"
  AIVIS_HINT="手順は docs/SETUP.md"
fi
if curl -fs -m 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || command -v ollama >/dev/null; then ok "Ollama"; else warn "Ollama が見つかりません: $OLLAMA_HINT"; fi
if command -v claude >/dev/null; then ok "Claude Code"; else warn "Claude Code が未インストール: https://docs.claude.com/en/docs/claude-code/overview の手順で入れる（WSL では WSL の中に入れる）"; fi
if command -v openclaw >/dev/null; then ok "OpenClaw"; else warn "OpenClaw が未インストール（会話を試すときに必要。手順は openclaw/README.md）"; fi
if curl -fs -m 2 http://127.0.0.1:10101/version >/dev/null 2>&1; then ok "AivisSpeech（起動中）"; else warn "AivisSpeech は音声を試すときに必要: $AIVIS_HINT"; fi

step "2. 依存ライブラリ"
pnpm install
(cd services/tools && uv sync)
(cd services/voice && uv sync)
ok "pnpm / uv の依存をインストール"

step "3. 環境変数"
if [ -f .env.local ]; then ok ".env.local あり"; else cp .env.example .env.local; ok ".env.local を作成（OPENCLAW_GATEWAY_TOKEN は後で記入）"; fi

step "4. GitHub"
if gh auth status >/dev/null 2>&1; then ok "gh ログイン済み（$(gh api user -q .login)）"; else gh auth login -h github.com -p https -w; fi
GH_USER=$(gh api user -q .login)

step "5. あなたの担当（メンバー ID）"
# docs/schedule.json の members.<ID>.github に登録済みの ID は、ほかの人は選べない
mkdir -p .jarvis
owner_of() { node -e "console.log(require('./docs/schedule.json').members['$1']?.github||'')"; }
MINE=$(node -e "const m=require('./docs/schedule.json').members;console.log(Object.keys(m).find(k=>m[k].github==='$GH_USER')||'')")
if [ -n "$MINE" ]; then
  printf '{\n  "id": "%s"\n}\n' "$MINE" > .jarvis/member.json
  ok "GitHub の $GH_USER は $MINE として登録済み: $(node scripts/jarvis.mjs whoami)"
elif [ -f .jarvis/member.json ] && [ -z "$(owner_of "$(node -e "console.log(require('./.jarvis/member.json').id)")")" ]; then
  ok "設定済み（登録の PR がまだマージされていない）: $(node scripts/jarvis.mjs whoami)"
else
  echo "    担当がまだ決まっていなければ、README の「1. まず自分のページを開く」で A・B のページを読み、チームで相談して決めてから入力する"
  for id in C A B; do
    o=$(owner_of "$id")
    case "$id" in C) area="統合・データとツール";; A) area="音声";; B) area="画面";; esac
    if [ -n "$o" ]; then echo "      $id = ${area}（使用中: ${o}）"; else echo "      $id = ${area}（空き）"; fi
  done
  read -r -p "    メンバー ID を入力 [A/B/C]: " MID
  MID=$(echo "$MID" | tr '[:lower:]' '[:upper:]')
  case "$MID" in A|B|C) ;; *) warn "A/B/C のどれかを入力してください"; exit 1 ;; esac
  TAKEN=$(owner_of "$MID")
  if [ -n "$TAKEN" ] && [ "$TAKEN" != "$GH_USER" ]; then
    warn "$MID はすでに $TAKEN が使っています。空いている ID を選んでください（間違いなら Owner に相談）"; exit 1
  fi
  printf '{\n  "id": "%s"\n}\n' "$MID" > .jarvis/member.json
  ok "$(node scripts/jarvis.mjs whoami)"

  # 担当の登録: docs/schedule.json に自分の GitHub ユーザー名を書いて PR を出す（Owner が Approve したら確定）
  read -r -p "    $MID を自分の担当として登録する PR を作りますか？ [Y/n]: " YN
  if [ "${YN:-Y}" != "n" ] && [ "${YN:-Y}" != "N" ]; then
    BR="$(echo "$MID" | tr '[:upper:]' '[:lower:]')/register-$GH_USER"
    git switch -q main && git pull -q --ff-only
    git switch -q -c "$BR"
    # 自分の行だけを書き換える（ほかの人の登録 PR と衝突しないように、ファイル全体は整形し直さない）
    node -e "const f='docs/schedule.json',fs=require('fs');const t=fs.readFileSync(f,'utf8');const r=t.replace(/(\"$MID\": \{[^}]*\"github\": \")[^\"]*/,'\$1$GH_USER');if(r===t)process.exit(1);fs.writeFileSync(f,r)"
    git commit -q -m "docs: $MID の担当を $GH_USER として登録" -- docs/schedule.json
    git push -q -u origin "$BR"
    gh pr create --base main --head "$BR" --title "docs: $MID の担当を $GH_USER として登録" \
      --body "setup.sh から自動で作成。docs/schedule.json の members.$MID.github に自分のユーザー名を登録する。" >/dev/null
    git switch -q main
    ok "登録の PR を作成しました。Owner（Sota）が Approve してマージしたら確定します"
  else
    warn "後で docs/schedule.json の members.$MID.github に $GH_USER を書く PR を出してください"
  fi
fi

git config --local pull.ff only
git config --local push.autoSetupRemote true
ok "git の設定（pull は fast-forward のみ）"

step "完了"
echo "  開発環境を開く: ./scripts/dev.sh"
echo "  作業を始める:   claude を起動して /start"
echo "  詳しい手順:     docs/SETUP.md"
