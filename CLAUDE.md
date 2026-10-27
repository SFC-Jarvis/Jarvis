# JARVIS — Claude Code 用ガイド

声とテキストで話せる、自分の PC で動く AI エージェント。SFC 服部研究会・秋学期の 3 名チーム開発。
今学期のゴールは **第 13 週（2027-01-14）に MVP 完成**。詳細は @docs/PROJECT.md

## 最初に必ず確認すること
- セッション開始時に `[JARVIS]` で始まる行（今の期間・あなた・未完了タスク）が表示される。表示がなければ `node scripts/jarvis.mjs context` を実行する
- 作業は **今の期間の、そのメンバーのタスク**（docs/tasks/*.md）に限る。範囲外の改修や「ついでのリファクタ」はしない。必要なら提案だけする
- 部品どうしのやりとりは contracts/ が正。勝手に変えない（変えるときは docs/WORKFLOW.md の「仕様の変更」に従う）
- main は発表後にしか更新されない前提。他メンバーの未マージの成果に依存しない。必要ならモックで進める

## 構成
| 場所 | 中身 | 言語・主なツール | 主担当の目安 |
|---|---|---|---|
| `apps/web` | JARVIS の Web アプリ（チャット・承認カード・設定） | Next.js 16 / React 19 / TypeScript / Tailwind / Vitest | B |
| `services/voice` | 音声層（発話検出→文字起こし→OpenClaw→読み上げ） | Python 3.12 / Pipecat / uv / pytest | A |
| `services/tools` | タスク・予定ツール（MCP + 画面用 HTTP API、SQLite） | Python 3.12 / FastAPI / FastMCP / uv / pytest | C |
| `openclaw/` | OpenClaw の設定・エージェントの人格 | JSON5 / Markdown | C |
| `contracts/` | 部品間の仕様（OpenAPI・イベント定義） | — | 全員で決める |
| `docs/` | 計画・ルール・タスク（=進捗チェックリスト） | — | 全員 |

ポート: web 3000 / tools 8700 / voice 8710 / OpenClaw 18789 / Ollama 11434 / AivisSpeech 10101（すべて 127.0.0.1 のみ）

## よく使うコマンド
- 開発環境を開く: `./scripts/dev.sh`（`--voice` で音声も起動）
- 全チェック（CI と同じ）: `pnpm check`
- テストだけ: `pnpm test` ／ 画面だけ: `pnpm --filter @jarvis/web test`
- Python: `cd services/tools && uv run pytest`
- 整形: `pnpm format`
- tools の API を変えたら: `pnpm gen:contracts`（contracts/tools-api.json と画面の型を再生成）
- 進捗表: `pnpm progress` ／ 自分のタスク: `pnpm tasks`

## カスタムコマンド
`/start [日付]` 期間のタスクを始める・再開する ／ `/done` セッション終了（テスト→コミット→Push→PR 作成・更新） ／
`/report [all]` 期間の成果を報告用 Markdown で出す ／ `/ship` 発表後にレビュー依頼 ／ `/sync` 最新の main を取り込む ／ `/review <PR番号>` 他メンバーの PR を確認

## 絶対に守ること
- **実装とテストは同じ変更で書く。** テストのないコード変更は CI（test-guard）で落ちる
- `pnpm check` が通らない状態でコミットしない（/done が確認する）
- main へ直接 Push しない。force push は自分の作業ブランチで `--force-with-lease` のみ
- `.env.local`、トークン、API キー、ユーザーのデータ（*.db）をコミットしない・読み上げない・ログに出さない
- サーバーは 127.0.0.1 以外で待ち受けない
- 新しい依存ライブラリを追加する前に、理由を説明してユーザーの了承を得る

コーディングルール: @docs/CODING_RULES.md
作業の流れ（ブランチ・PR・レビュー）: @docs/WORKFLOW.md
