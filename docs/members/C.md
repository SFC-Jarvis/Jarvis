# メンバー C（Sota）: 統合・データとツール

JARVIS の「頭脳」と「記憶」を担当する。
- OpenClaw を動かして AI（Ollama・無料のクラウド AI）につなぐ
- 画面・音声・ツールが一緒に動くように結合する
- タスク・予定を PC 内に安全に保存する MCP ツールを作る
- リポジトリの Owner として、レビューとマージの最終確認をする

| 作業量の目安 | 難しさ | 主なフォルダ |
|---|---|---|
| 52（A の 1.27 倍・B の 1.18 倍） | ★★★ | `openclaw/`、`services/tools/`、`scripts/`、`.github/` |

作業量は規模を S=1・M=3・L=8 で数えた目安。全員の作業を含む。

## 期間ごとのタスク
完了条件と進み具合（チェック）は [docs/tasks/integration.md](../tasks/integration.md)・[data-tools.md](../tasks/data-tools.md)・[qa.md](../tasks/qa.md) が正。ここは概要。

2026-10-28 改訂: 第2回は「環境構築と役割分担」に変更。もとの第2回の作業は第3回へ、第3回と第4回の作業は第4回（11/19・11/26 が休みのため 4 週間）にまとめた。

| 期間（発表日） | ID | 内容 | 規模 | 期間の作業量 |
|---|---|---|---|---|
| 第2回（10/29） | QA-2-1 | リポジトリ・Organization・保護ルール・CI（済） | S | 4 |
| | QA-2-2 | 進め方・役割分担・ルール・メンバー別ページ（済） | S | |
| | QA-2-3 | Windows（WSL2）の検証と手順書（済） | S | |
| | QA-2-4 | 自分の PC に環境を作る（全員） | S | |
| 第3回（11/12） | INT-3-1 | OpenClaw を導入し、OpenAI 互換 API とトークン認証を有効にする | M | 10 |
| | INT-3-2 | Ollama と Gemini 無料枠をつなぎ、上限を測る | M | |
| | DT-3-1 | タスク・予定のデータ設計とツールの仕様案 | M | |
| | QA-3-1 | 手順書に OpenClaw・Ollama の導入手順を追記（全員） | S | |
| 第4回（12/10・4 週間） | INT-4-1 | エージェントの人格と話し方 | M | 16 |
| | INT-4-2 | 画面・音声と OpenClaw の結合確認、セッションキー | M | |
| | INT-4-3 | ツールを OpenClaw に登録し、使い分けを調整 | M | |
| | DT-4-1 | MCP の一覧ツールとテスト用データ | M | |
| | DT-4-2 | 追加・完了・削除の MCP ツールと処理（関数の形を期間の最初に A と共有） | M | |
| | QA-4-4 | 手順書の更新 | S | |
| 第5回（12/24） | INT-5-1 | 承認の流れの結合確認と指示文の調整 | M | 9 |
| | INT-5-2 | 記憶の設定 | M | |
| | DT-5-1 | 変更系ツールが「承認待ち」を返し、承認 API で実行する仕組み | M | |
| 第6回（1/14） | INT-6-1 | 全体の結合と不具合の修正 | M | 9 |
| | DT-6-1 | データの暗号化と全削除 | M | |
| | QA-6-1 | 通しテスト（全員） | M | |
| 最終（1/21） | INT-7-1 | 初期リリースの計画 | M | 4 |
| | QA-7-1 | リハーサル（全員） | S | |

## 読む資料（この順で）
1. [docs/PROJECT.md](../PROJECT.md): ゴール・データの方針
2. [docs/ARCHITECTURE.md](../ARCHITECTURE.md): 全体の構成と承認の設計。DT-3-1 で「データ設計・ツール仕様」の節を書く
3. [openclaw/README.md](../../openclaw/README.md) と [contracts/openclaw.md](../../contracts/openclaw.md): OpenClaw の必須設定と呼び方
4. [services/tools/CLAUDE.md](../../services/tools/CLAUDE.md): ツールのルール
5. [docs/GITHUB_SETUP.md](../GITHUB_SETUP.md): Owner の作業（保護ルール・招待）

## ほかのメンバーとの受け渡し
| 渡すもの | 相手 | いつまでに |
|---|---|---|
| OpenClaw の導入手順とトークンの設定方法（`docs/SETUP.md`） | A・B | 第3回 |
| データ設計とツールの仕様案（`docs/ARCHITECTURE.md`） | A・B（確認） | 第3回 |
| セッションキーの決め方（`contracts/openclaw.md`） | A・B | 第4回の最初 |
| 追加・完了・削除の関数の形（main に入れて共有） | A（DT-4-3） | 第4回の最初 |
| 「承認待ち」の返し方と承認 API の形 | B（WEB-5-1）・A（VO-5-1） | 第5回の最初 |

| 受け取るもの | 相手 |
|---|---|
| 画面のチャット（WEB-4-1）と音声の流れ（VO-4-1・WEB-4-3） | B・A（第4回で結合） |
| 画面用 HTTP API（DT-4-3） | A（第4回） |

## 必要な技術
- Python（FastAPI・型注釈・pytest）、MCP（FastMCP）、SQLite
- OpenClaw・Ollama の設定と運用
- 暗号化と OS のキーチェーン
- 結合時の不具合調査
- レビュー

## 始め方
1. 環境を作る: [SETUP.md](../SETUP.md)（Mac）／ [SETUP_WINDOWS.md](../SETUP_WINDOWS.md)（Windows）
2. Owner の作業: [GITHUB_SETUP.md](../GITHUB_SETUP.md)。保護ルールの設定と、A・B の招待
3. `./scripts/dev.sh --mock` → claude のウィンドウで `/start`
4. OpenClaw が動いたら（INT-3-1）、`.env.local` にトークンを入れて `--mock` を外す。A・B にも手順を共有する
