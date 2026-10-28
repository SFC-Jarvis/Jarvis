# OpenClaw の設定（担当: 統合）

OpenClaw の設定とエージェントの人格を、**誰の PC でも同じに再現できる形で**ここに置く（INT-3-1・INT-4-1）。

## 置くもの（予定）
- `openclaw.example.json5` … Gateway の設定例（トークンは書かない）
- `agents/jarvis/` … 人格・話し方の指示
- 自作スキル（公開マーケットの ClawHub のスキルは使わない）

## 必ず入れる設定
- OpenAI 互換 API を有効にする: `gateway.http.endpoints.chatCompletions.enabled: true`
- 認証は token モード。トークンは各自の `.env.local` の `OPENCLAW_GATEWAY_TOKEN` にだけ書く
- 待ち受けはループバック（127.0.0.1）のみ
- タスク・予定ツール（MCP）: `http://127.0.0.1:8700/mcp/`（INT-4-3 で登録）

## 導入手順
（INT-3-1 で記入: インストール、onboard、設定ファイルの場所、起動・停止の方法）

## 無料 AI の上限の実測（INT-3-2）
| AI | 1 分あたり | 1 日あたり | 測った日 | メモ |
|---|---|---|---|---|
| Ollama（PC 内） | — | — | | |
| Gemini Flash（無料枠） | | | | 内容が製品改善に使われる |

参考: https://docs.openclaw.ai/gateway/openai-http-api
