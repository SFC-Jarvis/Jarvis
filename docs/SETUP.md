# 開発環境の作り方（メンバー全員）

> **Windows の人は [SETUP_WINDOWS.md](SETUP_WINDOWS.md) から始める**（WSL2 を使う）。手順 3 以降の使い方は共通。
> 以下の 0〜2 は macOS の手順。

所要時間: 30〜60 分（OpenClaw・音声の準備は担当者以外は後回しでよい）

## 0. 事前に用意するもの
- GitHub アカウント（Sota に招待してもらい、メールの招待を承認する）
- Claude Code が使えるアカウント
- Homebrew（https://brew.sh）

## 1. Node.js 24 と Claude Code
```bash
brew install fnm
fnm install 24 && fnm default 24     # ~/.zshrc に eval "$(fnm env --use-on-cd)" を追加（fnm の案内に従う）
node -v                              # v24.x
```
Claude Code:
```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version      # 見つからなければ表示された PATH の設定を ~/.zshrc に追加
```
最新の手順は https://docs.claude.com/en/docs/claude-code/overview を確認する。

## 2. リポジトリを取得してセットアップ
```bash
git clone https://github.com/SFC-Jarvis/Jarvis.git
cd Jarvis
./scripts/setup.sh
```
`setup.sh` が行うこと:
- git / gh / uv / pnpm / tmux のインストール
- 依存ライブラリのインストール
- `.env.local` の作成
- **メンバー ID（A/B/C）の登録**
- GitHub へのログイン

## 3. 開いてみる
```bash
./scripts/dev.sh --mock      # OpenClaw なしで画面を開く（http://localhost:3000）
```
ターミナルは tmux（画面を分ける道具）に切り替わり、Claude Code のウィンドウが前面に出る（正常）。
**画面の一番下のバー**に、左はウィンドウの一覧（`0:web 1:tools 2:claude`、今いるウィンドウは色付き）、その下の 2 行目に操作方法が常に出ている（幅の狭い画面でも切れない）。
- ウィンドウの切り替え: **`Ctrl-b` を押して離してから、番号のキー**（例: `Ctrl-b` → `0` で画面のログ、`Ctrl-b` → `2` で claude）。マウスでバーをクリックしても選べる
- 開いたまま抜ける: `Ctrl-b` → `d` ／ 戻る: `./scripts/dev.sh`
- 全部止める: `./scripts/dev.sh stop`

## 4. Claude Code で作業する
tmux の `claude` ウィンドウ（または `claude` コマンド）で:
```
/start      今の期間のタスクを始める・再開する
/done       作業の終わりに毎回（テスト→コミット→Push→Draft PR）
```
詳しくは docs/WORKFLOW.md。自分の担当の作業と読む資料は **docs/members/<自分のID>.md**。

## 5. 部品ごとの準備（必要になったら）
各担当者が、自分の部品の導入手順をここに追記する（QA-3-1）。

### OpenClaw（統合: C が記入）
openclaw/README.md を参照。終わったら `.env.local` の `OPENCLAW_GATEWAY_TOKEN` を埋め、`JARVIS_MOCK=0` にする。

### Ollama（統合: C が記入）
```bash
brew install ollama        # またはアプリ版
ollama serve               # アプリ版なら起動するだけ
# 使うモデル名は INT-3-2 で決めて、ここに書く（ollama.com/library で正式な名前を確認）
```

### AivisSpeech（音声: A が記入）
（ダウンロード先・起動方法・使う声のモデルを記入）

### 音声サービスの依存（音声: A が記入）
```bash
cd services/voice && uv sync --extra runtime
```

## うまくいかないとき
- `./scripts/dev.sh status` で周辺サービスの状態を見る
- `pnpm check` で CI と同じチェックを手元で実行できる
- 解決したら、その方法をこのファイルに追記する
