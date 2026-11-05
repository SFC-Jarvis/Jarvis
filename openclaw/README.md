# OpenClaw の設定（担当: 統合）

OpenClaw の設定とエージェントの人格を、**誰の PC でも同じに再現できる形で**ここに置く（INT-3-1・INT-4-1）。

## 置くもの
- `openclaw.example.json5` … チームでそろえる設定の例（トークン・キーは書かない）
- `agents/jarvis/` … 人格・話し方の指示
- 自作スキル（公開マーケットの ClawHub のスキルは使わない）

## 必ず入れる設定
- OpenAI 互換 API を有効にする: `gateway.http.endpoints.chatCompletions.enabled: true`
- 認証は token モード。トークンは onboard が作って `~/.openclaw/openclaw.json` に保存する。同じ値を各自の `.env.local` の `OPENCLAW_GATEWAY_TOKEN` に書く（リポジトリには書かない）
- 待ち受けはループバック（127.0.0.1）のみ
- タスク・予定ツール（MCP）: `http://127.0.0.1:8700/mcp/`（INT-5-1 で登録）

## 導入手順（OpenClaw 2026.10.10・macOS で確認。WSL2 も同じコマンド）
所要時間: 20〜30 分。先に Node.js 24.22.1 以上（`node -v`）と、使う AI の API キーを用意する。
Mac は Gemini 無料枠（キーは https://aistudio.google.com/apikey で作る。無料枠は送った内容が製品改善に使われるので、試しの会話だけにする）。

### 1. インストール
```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw --version
```

### 2. 初期設定（onboard）
大事な答えはオプションで先に決める（Gemini のキーはコマンドに書かず、画面で貼る）:
```bash
openclaw onboard --flow manual --mode local --agent-name jarvis \
  --auth-choice gemini-api-key \
  --gateway-bind loopback --gateway-port 18789 --gateway-auth token \
  --tailscale off \
  --skip-channels --skip-search --skip-skills --skip-hooks
```
画面で聞かれたら:

| 聞かれること | 答え |
|---|---|
| Quick start / Custom setup | Custom（上のコマンドなら聞かれない） |
| テレメトリ | No |
| エージェント 1 つか small team か | One agent（名前は `jarvis`） |
| アクセスの範囲 | Ask first（full access にしない） |
| AI を自動で探すか（look around） | No |
| Gemini の API キー | 貼る |
| Workspace | 既定（`~/.openclaw/workspace`。リポジトリの中にしない） |
| Gateway secret の保存 | Plaintext（既定。LaunchAgent から環境変数が読めないため） |
| `.claude` の記憶の取り込み | No |
| Memory embeddings | Skip（なければ Ollama） |
| プラグインの追加・設定 | 何も入れない |
| Gateway service を入れるか | Yes（ランタイムは node） |
| シェルの補完 | どちらでも |

### 3. モデルと OpenAI 互換 API の設定
```bash
openclaw models set google/gemini-3.5-flash-lite
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
openclaw agents list        # jarvis (default) と Model: google/gemini-3.5-flash-lite を確認
```
他の設定が `openclaw.example.json5` と同じかは `openclaw config get gateway` で確かめる（トークンは伏せ字で出る）。

### 4. トークンを .env.local に書く
```bash
openclaw gateway auth-token --show   # 本物のトークン（config get の大文字の値は伏せ字で、トークンではない）
```
表示された値を `.env.local` の `OPENCLAW_GATEWAY_TOKEN=` に貼り、`JARVIS_MOCK=0` にする。

### 5. 会話が続くか確かめる
```bash
node scripts/openclaw-check.mjs
```
同じセッションキー（会話を続けるための ID）で 3 往復し、3 往復目で最初の合言葉を覚えていれば `OK`。

### 起動・停止・状態
| やること | コマンド |
|---|---|
| 状態を見る | `openclaw gateway status` |
| 止める | `openclaw gateway stop --force`（バックグラウンドのサービスを止めるときは `--force` が必要） |
| 動かす | `openclaw gateway start` |
| ログ | `/tmp/openclaw/openclaw-<日付>.log` |
| ターミナルで話す | `openclaw tui` |

サインイン情報の一覧・削除（`openclaw models auth list` / `logout <ID>`）と `models status --probe` は、Gateway を止めているときしか使えない。

### うまくいかないとき
| 症状 | 原因と対処 |
|---|---|
| インストールで `EACCES: permission denied`・「openclaw binary already exists」 | 過去の `sudo npm` で `~/.npm` に root のファイルがある。`sudo chown -R "$(id -u):$(id -g)" ~/.npm` のあと入れ直す（`--force` では直らない） |
| onboard の接続テストで 429 | 選ばれたモデルが無料枠の対象外。onboard 後に `openclaw models set google/gemini-3.5-flash-lite` |
| `gemini-2.5-flash` で 404 | 新しい利用者には提供終了 |
| 400「API key not valid」 | 間違ったキーのサインイン情報が残っている。Gateway を止めて `openclaw models auth list` で探し、`openclaw models auth logout <ID>` |
| 確認スクリプトで 401 | `.env.local` のトークンが違う。`openclaw gateway auth-token --show` の値を貼り直す |
| 確認スクリプトで「トークンが空」 | `.env.local` を保存したか確かめる |
| 再起動後に Gateway が動かない | サービスは fnm の Node 24.22.2 を直接使う。その版を消したら `openclaw gateway install` で入れ直す |

## 無料 AI の上限の実測（INT-3-2）
測り方: `node scripts/openclaw-check.mjs` が往復ごとに「かかった時間」と「入力・出力のトークン数」を出す。
**OpenClaw は 1 回の発言ごとに約 15K トークン（指示文・ツールの説明・会話の履歴）を AI に送る**ので、
「1 分あたりのトークン数（TPM）」の上限が小さい AI は、回数の上限より先にそちらで止まる。

| AI | 1 回あたり（実測） | 実際に話せる回数（計算） | 測った日 | メモ |
|---|---|---|---|---|
| Gemini 3.5 Flash Lite（無料枠・Mac の既定） | 入力 15.3〜15.6K・出力 64〜167 トークン、1.4〜4.0 秒 | 1 分 15 回・1 日 500 回（上限: 1 分 15 回・250K トークン・1 日 500 回） | 2026-11-05 | 内容が製品改善に使われる。ツールを使う発言は AI を複数回呼ぶので、回数はもっと減る |
| Gemini 3.8 Flash（無料枠） | 未測定 | 1 日 20 回（上限の表示） | — | 接続テストがタイムアウト。1 日の回数が少なく開発に向かない |
| Gemma 4 31B（Gemini API 無料枠） | — | **0 回**（1 回の入力 約 15K が、1 分 16K トークンの上限にほぼ届く） | 2026-11-05 | 上限の表示は 1 分 30 回・16K トークン・1 日 14,400 回。OpenClaw からは最初の 1 回目から 429 |
| Ollama（Windows・RTX 4070） | （Windows で測る） | 上限なし（速さで決まる） | | |

参考: https://docs.openclaw.ai/gateway/openai-http-api
