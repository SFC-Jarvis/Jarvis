# メンバー B: 画面

JARVIS の「顔」を担当する。
- ChatGPT のように使えるチャット画面、タスク・予定の画面、承認カード、設定画面を Next.js で作る
- ブリーフを流すタイミング（起動時・設定した時刻）を作る
- 体験の計測とタスク操作のテストを担当する

| 作業量の目安 | 難しさ | 主なフォルダ |
|---|---|---|
| 42 | ★★ | `apps/web/` |

作業量は規模を S=1・M=3・L=8 で数えた目安。全員の作業を含む。

## 期間ごとのタスク
完了条件と進み具合（チェック）は [docs/tasks/web.md](../tasks/web.md)・[integration.md](../tasks/integration.md)・[data-tools.md](../tasks/data-tools.md)・[qa.md](../tasks/qa.md) が正。ここは概要。

| 期間（発表日） | ID | 内容 | 規模 |
|---|---|---|---|
| 第2回（10/29） | WEB-2-1 | チャット画面（会話・履歴・入力欄）の設計案。骨組みは用意済み | M |
| 第3回（11/12） | WEB-3-1 | チャット画面（送信・表示・履歴）を作り、/api/chat で OpenClaw とつなぐ | L |
| | QA-3-2 | 体験の測り方（応答時間・使いやすさ）を決める | S |
| 第4回（12/10） | WEB-4-1 | タスク・予定の画面（一覧・完了） | M |
| | QA-4-1 | タスク操作のテスト | M |
| 第5回（12/24） | WEB-5-1 | 承認カード、ブリーフの表示、設定画面（AI・声・ブリーフの時刻） | L |
| | INT-5-3 | ブリーフの起動条件（起動時・設定した時刻）を画面側で作る | M |
| | QA-5-2 | 体験の計測 | S |
| 第6回（1/14） | WEB-6-1 | 画面の不具合を直し、使いやすさを改善 | M |
| 最終（1/21） | WEB-7-1 | 初期リリースの画面案（初回セットアップ画面） | M |
| | DT-7-1 | デモ用のデータ | S |
| 全員 | QA-2-2・QA-6-1・QA-7-1 | 手順書の初版・通しテスト・リハーサル | S/M/S |

## 読む資料（この順で）
1. [docs/PROJECT.md](../PROJECT.md): ゴール・画面でできること
2. [docs/ARCHITECTURE.md](../ARCHITECTURE.md): 全体の構成（画面は `/api/chat` と tools API を使う）
3. [apps/web/CLAUDE.md](../../apps/web/CLAUDE.md): 画面のルール。トークンはサーバー側だけ、テストの書き方
4. [contracts/openclaw.md](../../contracts/openclaw.md): OpenClaw の呼び方。実装は `apps/web/src/lib/openclaw.ts`
5. [contracts/voice-events.md](../../contracts/voice-events.md): 音声とのイベント（第3回の最初に A と決める）
6. 第4回から: `contracts/tools-api.json` と `apps/web/src/lib/generated/`（自動生成の型）

## ほかのメンバーとの受け渡し
| 渡すもの | 相手 | いつまでに |
|---|---|---|
| チャット画面の設計案 | 全員で確認 | 第2回 |
| 音声と画面のイベントの仕様（`contracts/voice-events.md`） | A と一緒に決める | 第3回の最初 |
| マイクボタン・読み上げの再生をつなぐ場所 | A（VO-3-1） | 第3回 |
| 承認カード（承認・却下の操作） | C・A（第5回の結合） | 第5回 |

| 受け取るもの | 相手 |
|---|---|
| OpenClaw の導入手順とトークン | C（第2回）。それまでは `--mock` で開発する |
| 画面用 HTTP API と型 | A（第4回）。届くまでは型に合わせたモックで進める |
| 「承認待ち」の形とブリーフ用のまとめ | C・A（第5回の最初） |

## 必要な技術
- React・Next.js（App Router、Server と Client の違い）、TypeScript、Tailwind CSS
- Testing Library（役割・ラベル・文言でテストする）
- 返答を少しずつ表示する仕組み（ストリーミング）
- タイマー処理（ブリーフの時刻）
- 使いやすさ・アクセシビリティの基本

## 始め方
1. 環境を作る: [SETUP.md](../SETUP.md)（Mac）／ [SETUP_WINDOWS.md](../SETUP_WINDOWS.md)（Windows）。メンバー ID は **B**
2. `./scripts/dev.sh --mock` → http://localhost:3000 を開いたまま、claude のウィンドウで `/start`
3. `--mock` の間は、`/api/chat` が固定の返答を返す。これで画面を作り込める
4. 画面の確認は、ファイルを保存すると自動で反映される。ログは `Ctrl-b` → `0`
