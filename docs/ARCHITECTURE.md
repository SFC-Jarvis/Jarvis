# 全体構成

```mermaid
flowchart LR
  subgraph PC["ユーザーの PC（すべて 127.0.0.1）"]
    web["apps/web<br/>Next.js :3000<br/>チャット・承認カード・設定"]
    voice["services/voice<br/>Pipecat :8710<br/>VAD→STT→TTS"]
    oc["OpenClaw Gateway :18789<br/>会話・記憶・定期実行"]
    tools["services/tools :8700<br/>FastAPI + FastMCP"]
    db[("SQLite<br/>端末内")]
    ollama["Ollama :11434"]
    aivis["AivisSpeech :10101"]
  end
  cloud["無料クラウド AI<br/>（同意後のみ）"]
  web -- "/api/chat → OpenAI 互換" --> oc
  voice -- "OpenAI 互換" --> oc
  voice --> aivis
  oc -- "MCP /mcp" --> tools
  web -- "HTTP API（一覧・承認）" --> tools
  tools --> db
  oc --> ollama
  oc -.-> cloud
```

## 主な流れ
1. **文字の会話**: 画面 → `/api/chat`（サーバー側）→ OpenClaw `/v1/chat/completions` → 返答を画面に表示
2. **声の会話**: マイク → voice（VAD・STT）→ OpenClaw → TTS → 再生。文字起こしと返答は画面の会話にも出す（contracts/voice-events.md）
3. **タスク操作**: OpenClaw が MCP ツールを呼ぶ → 変更系は「承認待ち」を返す → 画面に承認カード → 承認 API → 実行
4. **ブリーフ**: 起動時・設定時刻に、ブリーフ用ツールでまとめた内容を OpenClaw が文章化 → 画面表示と読み上げ

## 承認の設計
OpenClaw 自体の承認機能は Control UI 向けのため使わない。**承認は自作ツール側で実装する**:
変更系ツールは実行せずに `pending_id` を返す → 画面が承認カードを出す → `POST /approvals/{id}` で実行。

## データ設計・ツール仕様
（DT-2-1 で記入する: テーブル定義、ツール一覧と引数、エラー時の返し方）
