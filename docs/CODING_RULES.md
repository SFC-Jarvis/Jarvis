# コーディングルール

全員・Claude Code 共通。迷ったら「既存のコードと同じ書き方」に合わせる。

## 共通
- 言語: コメント・docstring・コミット・PR・UI の文言は**日本語**。識別子（変数・関数名）は英語
- 小さく作る: 1 関数 1 責務。1 ファイルが 300 行を超えそうなら分割を検討
- 設定値は環境変数から読む（`.env.example` に追記する）。コードに直書きしない
- 秘密情報（トークン・キー）とユーザーのデータをログ・エラーメッセージ・テストデータに入れない
- 外部通信は 127.0.0.1 のサービスか、同意を得たクラウド AI だけ
- エラーは握りつぶさない。ユーザーに見せる文言（日本語）と、開発者向けの原因を分ける
- 依存の追加は PR 本文に「なぜ必要か・代わりはないか」を書く

## テスト（必須）
- **実装と同じコミット（少なくとも同じ PR）でテストを書く。** CI の test-guard が、コードだけ変えた PR を落とす
- 先にテストで期待する動きを書いてから実装する（Claude Code にもそう指示する）
- 外部サービス（OpenClaw・Ollama・AivisSpeech・ネットワーク）にはテストで接続しない。関数の引数で差し替えられるように作り、モックを渡す
- テスト名は日本語で「何をすると何が起きるか」（例: `トークンがなければエラー`）
- カバレッジの下限: 各パッケージ 行 70%（CI で検査）。下限を下げる変更は全員の合意が必要
- 実機でしか確かめられないこと（マイク・スピーカー・GPU）は docs/qa/ の手動チェックに書く

## TypeScript（apps/web, scripts）
- `strict` + `noUncheckedIndexedAccess`。`any` 禁止（Biome がエラーにする）。`as` は外部入力の受け取り時だけ
- 整形・lint は Biome（`pnpm format`）。保存時に自動整形されるフックあり
- 部品: 関数コンポーネント + 名前付き export。ファイル名は `PascalCase.tsx`、ロジックは `camelCase.ts`
- サーバー専用の処理（トークンを使うもの）は `src/lib` に置き、Client Component から import しない
- tools API の型は `src/lib/generated/`（自動生成）を使う。手で同じ型を書かない
- 状態管理ライブラリは入れない（React の state と props で足りる間は）

## Python（services/*）
- Python 3.12、パッケージ管理は uv（`uv add` で追加。pip は使わない）
- 整形・lint は Ruff、型は mypy strict。関数には型注釈を必ず付ける
- データの形は Pydantic モデルか `dataclass(frozen=True)` で定義する。dict のまま受け渡ししない
- モジュールの役割: `config.py`（設定）/ `db.py`（接続）/ ドメインごとのモジュール / `api.py`・`mcp_server.py`（入口）。入口にロジックを書かない
- SQL はプレースホルダ（`?`）を使う。文字列連結で SQL を作らない

## OS の違い（macOS・WSL2・次学期の Windows ネイティブ）
- パスは `pathlib.Path` / `node:path` で組み立てる。`/` や `\` を文字列でつながない。ホームの下を直書きしない
- OS ごとに変わる値（データの保存先など）は `config.py` などの設定に閉じ込め、`sys.platform` を引数で差し替えられるようにしてテストする
- シェルスクリプトは bash（macOS と WSL で動く）。macOS 専用のコマンド（`open`・`pbcopy`・BSD 版 `sed -i ''`）を直接使わない
- macOS 標準の bash は 3.2。連想配列・`${var,,}`・`mapfile` などの bash 4 以降の機能を使わない。変数の直後に日本語が続くときは `${VAR}` と書く（`$VAR（` は 3.2 で止まる。テストで検査）
- 改行は LF（`.gitattributes` で強制）。ファイル名の大文字・小文字の違いだけで区別しない
- マイク・スピーカーはブラウザ経由で扱う（WSL ではサーバー側から直接使えないことがあるため）

## 部品間の仕様（contracts/）
- tools の HTTP API: `contracts/tools-api.json`（FastAPI から自動生成。CI が差分を検査）
- 音声と画面のイベント: `contracts/voice-events.md`
- OpenClaw との通信: `contracts/openclaw.md`
- 仕様を変える PR は、影響を受ける担当者をレビュアーに入れる

## Git
- ブランチ名: `<メンバーID小文字>/<期間>-<内容>` 例: `c/p3-agent-connect`（/start が作る）
- コミット: Conventional Commits + 日本語。例: `feat(web): チャットの送信ボタンを追加`
  - type: feat / fix / test / refactor / docs / chore / ci
  - scope: web / voice / tools / openclaw / contracts / docs / scripts / ci
- 1 コミット 1 まとまり。動かない状態でも作業ブランチへの Push は可（/done が Draft PR にする）
