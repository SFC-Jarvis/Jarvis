# contracts（部品間の仕様）

部品どうしのやりとりは、ここに書いた内容が正しい。期間の最初に全員で決め、小さな PR で先にマージする。
決めた後は、各自がこの仕様とモックを使って、他の人の作業を待たずに開発する。

| ファイル | 内容 | 作り方 |
|---|---|---|
| `tools-api.json` | services/tools の HTTP API（画面が使う） | **自動生成**: `pnpm gen:contracts`。手で編集しない |
| `openclaw.md` | 画面・音声 → OpenClaw の呼び方 | 手書き |
| `voice-events.md` | 音声サービス ⇄ 画面のイベント | 手書き（p3 の最初に A・B で決める） |

変更のルール: docs/WORKFLOW.md「仕様の変更」
