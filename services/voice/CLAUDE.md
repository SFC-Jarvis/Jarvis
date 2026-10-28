# services/voice（音声）

- Pipecat など重い依存は `runtime` extra（`uv sync --extra runtime`）。CI では入れないので、**Pipecat を import するのは `pipeline.py` など限られたモジュールだけ**にする
- テストしたい処理（文の区切り、承認の言葉の判定、設定の変換など）は Pipecat に依存しない純粋な関数として別モジュールに書き、pytest でテストする
- 外部サービス（AivisSpeech・OpenClaw）への通信は httpx。テストでは通信をモックする
- **マイク入力はブラウザから受け取る（WebRTC など）。** メンバーに WSL2 の人がいて、WSL の中のサーバーからはマイクを直接開けないことがあるため
- 画面との間のイベントは contracts/voice-events.md に従う
- 音声認識・声の比較結果は README.md に記録する
- 確認: `uv run ruff check . && uv run ruff format --check . && uv run mypy src && uv run pytest`
