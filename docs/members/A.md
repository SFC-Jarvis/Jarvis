# メンバー A: 音声

JARVIS の「耳と口」を担当する。
- マイクの声を文字にして OpenClaw に渡し、返答を読み上げる流れを Pipecat で作る（画面のマイクボタンは B）
- 声での承認（はい・いいえ）とブリーフの読み上げを作る
- 画面用 HTTP API（Python）とブリーフ用のまとめを作る
- セキュリティ確認と承認のテストを担当する

| 作業量の目安 | 難しさ | 主なフォルダ |
|---|---|---|
| 41 | ★★ | `services/voice/`、`services/tools/`（画面用 API）、`docs/qa/` |

作業量は規模を S=1・M=3・L=8 で数えた目安。全員の作業を含む。

## 期間ごとのタスク
完了条件と進み具合（チェック）は [docs/tasks/voice.md](../tasks/voice.md)・[data-tools.md](../tasks/data-tools.md)・[qa.md](../tasks/qa.md) が正。ここは概要。

2026-10-28 改訂: 第2回は「環境構築と役割分担」に変更。もとの第2回の作業は第3回へ、第3回と第4回の作業は第4回（11/19・11/26 が休みのため 4 週間）にまとめた。

| 期間（発表日） | ID | 内容 | 規模 | 期間の作業量 |
|---|---|---|---|---|
| 第2回（10/29） | QA-2-4 | 自分の PC に環境を作る（setup.sh → dev.sh --mock） | S | 1 |
| 第3回（11/12） | VO-3-1 | 同じ録音で kotoba-whisper と Qwen3-ASR を比べる。読み上げの声を選ぶ | M | 8 |
| | VO-3-2 | Pipecat でマイクの声を文字にする | M | |
| | VO-3-3 | 音声と画面のイベントの仕様を B と決める | S | |
| | QA-3-1 | 手順書に音声の導入手順を追記（全員） | S | |
| 第4回（12/10・4 週間） | VO-4-1 | マイク → 文字起こし → OpenClaw → 読み上げの流れ（サーバー側）とブラウザとの接続 | L | 15 |
| | VO-4-2 | 返答を 1 文ずつ読み上げる | M | |
| | DT-4-3 | 画面用 HTTP API（一覧・追加・完了・削除）を FastAPI で作る | M | |
| | QA-4-3 | セキュリティ確認 | S | |
| 第5回（12/24） | VO-5-1 | 声での承認とエラー時の案内、ブリーフの読み上げ | M | 7 |
| | DT-5-2 | ブリーフ用に今日の予定とタスクをまとめるツール | S | |
| | QA-5-1 | 承認とブリーフのテスト、承認なしで変更できないかの確認 | M | |
| 第6回（1/14） | VO-6-1 | 音声まわりの不具合を直す | M | 7 |
| | QA-6-1・QA-6-2 | 通しテスト（全員）・体験の計測と手順書の完成 | M・S | |
| 最終（1/21） | VO-7-1 | デモ用に声と話し方を調整 | S | 3 |
| | DT-7-1・QA-7-1 | デモ用のデータ・リハーサル（全員） | S・S | |

## 読む資料（この順で）
1. [docs/PROJECT.md](../PROJECT.md): ゴール・音声の技術の選定理由
2. [docs/ARCHITECTURE.md](../ARCHITECTURE.md): 全体の構成（音声は「声の会話」の流れ）
3. [services/voice/CLAUDE.md](../../services/voice/CLAUDE.md): 音声のルール。Pipecat に依存する部分を閉じ込める。マイクはブラウザ経由
4. [services/voice/README.md](../../services/voice/README.md): 比較結果を書く表（VO-3-1）
5. [contracts/voice-events.md](../../contracts/voice-events.md): 画面とのイベント（第3回に B と決める・VO-3-3）
6. [contracts/openclaw.md](../../contracts/openclaw.md): OpenClaw の呼び方
7. 第4回から: [services/tools/CLAUDE.md](../../services/tools/CLAUDE.md)。画面用 API のルールと `pnpm gen:contracts`

## ほかのメンバーとの受け渡し
| 渡すもの | 相手 | いつまでに |
|---|---|---|
| 音声と画面のイベントの仕様（`contracts/voice-events.md`） | B と一緒に決める（VO-3-3） | 第3回 |
| 音声サービスの接続先（ブラウザから音声を送る口） | B（WEB-4-3） | 第4回の前半 |
| 画面用 HTTP API と、自動生成した型（`contracts/tools-api.json`） | B（WEB-4-2） | 第4回の途中（先に API の形だけ PR にする） |
| ブリーフ用のまとめ（DT-5-2） | B（INT-5-3） | 第5回 |

| 受け取るもの | 相手 |
|---|---|
| OpenClaw の導入手順とトークン | C（第3回）。それまでは OpenClaw の部分をモックにする |
| 追加・完了・削除の関数の形 | C（第4回の最初） |
| 画面のマイクボタン・再生の部品（WEB-4-3） | B（第4回） |

## 必要な技術
- Python（非同期処理 async/await・型注釈・pytest）
- 音声の基礎: サンプリング周波数、発話検出（VAD）
- Pipecat、ブラウザから音声を送る仕組み（WebRTC）
- 音声認識モデルを手元で動かす経験（GPU・CPU）
- FastAPI（第4回）

## 始め方
1. 環境を作る: [SETUP.md](../SETUP.md)（Mac）／ [SETUP_WINDOWS.md](../SETUP_WINDOWS.md)（Windows）。メンバー ID は **A**
2. AivisSpeech を入れる。音声の重い依存は `cd services/voice && uv sync --extra runtime`（入れるものは VO-3-1 で決めて `pyproject.toml` に追加）
3. `./scripts/dev.sh --mock --voice` → claude のウィンドウで `/start`
4. OpenClaw がまだ動かない間は、OpenClaw の部分をモック（決まった返答を返す関数）にして進める
