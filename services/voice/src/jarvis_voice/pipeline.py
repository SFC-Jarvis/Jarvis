"""音声パイプラインの組み立て（担当: 音声。docs/tasks/voice.md）。

流れ: マイク → 発話検出(VAD) → 文字起こし(STT) → OpenClaw → 読み上げ(TTS) → スピーカー
- Pipecat に依存するコードはこのモジュールと runtime 依存の中に閉じ込める
- テストできる処理（文の区切り、設定の変換など）は別モジュールの純粋な関数にする
"""


def build_pipeline() -> None:
    raise NotImplementedError("p2〜p3 で音声担当が実装する")
