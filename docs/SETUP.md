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
- **メンバー ID（A/B/C）の選択と登録**（担当が未定なら、先に README の A・B のページを読んでチームで決める。登録済みの ID は選べない。選ぶと登録の PR が自動で作られ、Owner の Approve で確定）
- GitHub へのログイン

## 3. 開いてみる
```bash
./scripts/dev.sh --mock      # OpenClaw なしで画面を開く（http://localhost:3000）
```
ターミナルは tmux（画面を分ける道具）に切り替わり、Claude Code のウィンドウが前面に出る（正常）。
**画面の一番下のバー**に、左はウィンドウの一覧（`0:web 1:tools 2:claude`、今いるウィンドウは色付き）、その下の 2 行目に操作方法が常に出ている（幅の狭い画面でも切れない）。
- ウィンドウの切り替え: **`Ctrl-b` を押して離してから、番号のキー**（例: `Ctrl-b` → `0` で画面のログ、`Ctrl-b` → `2` で claude）。マウスでバーをクリックしても選べる
- 全部止める: `Ctrl-b` → `X`（大文字）→ `y`（tmux の外からなら `dev.sh stop`）
- 開いたまま抜ける: `Ctrl-b` → `d` ／ 戻る: `dev.sh`（`setup.sh` が登録。未登録なら `./scripts/dev.sh install`）

## 4. Claude Code で作業する
tmux の `claude` ウィンドウ（または `claude` コマンド）で:
```
/start      今の期間のタスクを始める・再開する
/done       作業の終わりに毎回（テスト→コミット→Push→Draft PR）
```
詳しくは docs/WORKFLOW.md。自分の担当の作業と読む資料は **docs/members/<自分のID>.md**。

## 5. 部品ごとの準備（必要になったら）
各担当者が、自分の部品の導入手順をここに追記する（QA-3-1）。

### 画面（apps/web）（画面: B が記入）
JARVIS の画面（真ん中の粒子の球体・字幕・右の会話の記録・入力欄）。設計は docs/design/chat-screen.md。

**追加で入れるもの**: なし（`setup.sh` で済む）。OpenClaw がなくても、モック（固定の返答）で動かせる。

**起動する**
```bash
dev.sh --mock               # いつもはこれ。OpenClaw なしで http://localhost:3000 が開く
```
画面だけを起動したいとき（リポジトリの一番上のフォルダで）:
```bash
set -a; source .env.local; set +a          # .env.local を読み込む（これを忘れるとモックにならない）
JARVIS_MOCK=1 pnpm --filter @jarvis/web dev
```
- `pnpm --filter @jarvis/web dev` だけで起動すると、リポジトリの一番上の `.env.local` が読まれない（Next.js は `apps/web/` の中しか見ない）。モックにならず、送信すると「返答を受け取れませんでした」になる
- Windows（WSL）の人も、開くのは Windows 側のブラウザでよい（http://localhost:3000）

**設定（`.env.local`）**
| 名前 | 意味 | 既定 |
|---|---|---|
| `JARVIS_MOCK` | `1` で OpenClaw なしの固定の返答。`dev.sh --mock` なら `1` になる | `1` |
| `JARVIS_MOCK_DELAY_MS` | モックの返答までの待ち時間（ミリ秒）。「考えています」の表示を確かめるため。`0` で待たない | `1500` |
| `OPENCLAW_BASE_URL`・`OPENCLAW_GATEWAY_TOKEN` | 本物の OpenClaw につなぐとき（下の「OpenClaw」の節） | — |

`.env.local` を変えたら、起動し直す（`dev.sh stop` → `dev.sh --mock`）。

**動いたことを確かめる**
1. http://localhost:3000 を開くと、真ん中で粒子の球体がゆっくり回り、下に `STANDBY` と出る
2. 「今日の予定は？」を押して Enter → 球体が速く回って `THINKING`（約 1.5 秒）→ 字幕に「（モック）「今日の予定は？」を受け取りました」→ 球体が波打って `SPEAKING` → 6 秒ほどで `STANDBY` に戻る
3. 右上の「＋」で新しい会話になり、前の会話が右の列に残る

ターミナルから確かめるとき（返答が 1 行出れば OK）:
```bash
curl -s -X POST http://127.0.0.1:3000/api/chat -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"こんにちは"}],"sessionKey":"web:test"}'
# → {"reply":"（モック）「こんにちは」を受け取りました"}
```

**テスト**
```bash
pnpm --filter @jarvis/web test     # 画面のテストだけ（ブラウザは使わない）
```

**うまくいかないとき**
| 症状 | 原因と直し方 |
|---|---|
| 送ると「返答を受け取れませんでした」 | モックになっていない（`.env.local` を読み込まずに起動した、または `JARVIS_MOCK=0`）。`dev.sh --mock` で起動し直す。本物の OpenClaw を使うときは `dev.sh status` で OpenClaw が起動中か見る。原因はブラウザの開発者ツールのコンソールに出る |
| 球体が出ない（リングだけ見える） | ブラウザのハードウェアアクセラレーション（グラフィック処理を GPU に任せる設定）が切れている。Chrome なら 設定 → システム →「グラフィック アクセラレーションが使用可能な場合は使用する」をオン |
| 球体が止まっている | PC の「動きを減らす」設定がオンだと、わざと止めて表示する（仕様）。macOS: システム設定 → アクセシビリティ → ディスプレイ →「視差効果を減らす」、Windows: 設定 → アクセシビリティ → 視覚効果 →「アニメーション効果」 |
| `Another next dev server is already running.` と出る | 画面はすでに別のところ（`dev.sh` の tmux など）で動いている。表示された URL をそのまま開けばよい。起動し直したいときは `dev.sh stop` で止めてから起動する |
| `Port 3000 is in use` と出る | 別の `dev.sh` か画面が動いている。`dev.sh stop` で止める。止まらなければ `lsof -iTCP:3000 -sTCP:LISTEN` で動いているものを確かめる |

### OpenClaw（統合: C が記入）
画面や音声を本物の AI とつなぐときに必要（それまでは `--mock` で開発できる）。所要時間 20〜30 分。
詳しい手順・画面での答え方・うまくいかないときは **[openclaw/README.md](../openclaw/README.md)**。
Windows（WSL2）で Ollama を使うときは、README の「Windows（WSL2）で Ollama を使うとき」に従う（Gemini のキーはいらない）。Mac の流れ:

1. Gemini の API キーを作る（https://aistudio.google.com/apikey）
2. `curl -fsSL https://openclaw.ai/install.sh | bash` でインストール
3. README のコマンドで `openclaw onboard`（待ち受けは 127.0.0.1・認証は token・エージェントは `jarvis` 1 つ）
4. `openclaw models set google/gemini-3.5-flash-lite` と `openclaw config set gateway.http.endpoints.chatCompletions.enabled true`
5. `openclaw gateway auth-token --show` の値を `.env.local` の `OPENCLAW_GATEWAY_TOKEN` に貼り、`JARVIS_MOCK=0` にする
6. `node scripts/openclaw-check.mjs` で `OK` が出れば完了（3 往復して話が続くかを確かめる）

トークンと API キーは、チャット・PR・スクリーンショットに出さない。

### Ollama（統合: C が記入）
Windows（WSL2）は Windows 側にアプリ版を入れ、WSL2 の OpenClaw から `http://127.0.0.1:11434` でつなぐ（RTX 4070 で確認）。
```bash
brew install ollama        # Mac。Windows は https://ollama.com からアプリ版を入れる
ollama serve               # アプリ版なら起動するだけ
ollama pull qwen3.5:9b     # 使うモデル（6.6GB）。Windows ではアプリ版に付いてくる ollama を使う
curl http://127.0.0.1:11434/api/tags   # qwen3.5:9b が出れば OK（WSL2 からも確かめる）
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
