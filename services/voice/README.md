# services/voice（音声）

## 起動
```bash
uv sync --extra runtime              # Pipecat などの重い依存（runtime extra に追加していく）
uv run --extra runtime python -m jarvis_voice
```

## 音声認識の比較（VO-3-1）
同じ録音（10 文程度）で比べる。

| 項目 | kotoba-whisper v2.0 | Qwen3-ASR |
|---|---|---|
| 誤り（文字数） | | |
| 処理時間（10 文） | | |
| メモリ | | |
| 判定 | | |

## 読み上げの声（VO-3-1）
- AivisSpeech のモデル:
- 選んだ理由:
