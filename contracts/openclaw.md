# OpenClaw との通信

- エンドポイント: `POST {OPENCLAW_BASE_URL}/v1/chat/completions`（OpenAI 互換。既定は無効なので設定で有効にする）
- 認証: `Authorization: Bearer {OPENCLAW_GATEWAY_TOKEN}`。**トークンはサーバー側だけで使う**（ブラウザに渡さない）
- モデル: `openclaw/default`（設定したエージェント）。特定のエージェントは `openclaw/<agentId>`
- 会話の継続: `x-openclaw-session-key: <セッションキー>` を毎回付ける
  - セッションキーは画面の「会話 1 つ」ごとに 1 つ（例: `web:<会話ID>`、音声は `voice:<会話ID>`）
  - `subagent:` `cron:` `acp:` で始まるキーは使えない
- ストリーミング: `"stream": true` で SSE（`data: ...` 行、最後に `data: [DONE]`）
- 実装: apps/web/src/lib/openclaw.ts

参考: https://docs.openclaw.ai/gateway/openai-http-api
