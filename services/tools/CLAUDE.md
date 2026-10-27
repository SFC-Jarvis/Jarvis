# services/tools（データとツール）

- `api.py` が画面用 HTTP API と MCP（`/mcp`）をまとめた FastAPI アプリ。MCP ツールは `mcp_server.py`
- DB 接続は `db.py` の `connect()` だけを使う（暗号化を後から入れるため）。SQL はリポジトリ層に閉じ込める
- データは端末内（`JARVIS_DATA_DIR`）にだけ保存。外部への送信処理を書かない
- **追加・変更・削除のツールは直接実行しない。** 「承認待ち」を返し、承認 API で実行する（p5 で実装）
- ツールの docstring は OpenClaw の AI が読む。日本語で「何をするか・いつ使うか・引数の意味」を書く
- API を変えたら `pnpm gen:contracts` を実行し、contracts/tools-api.json の差分も一緒にコミット（CI が差分を検査）
- テストは `tests/` に。DB は `tmp_path` を使い、本物のデータ保存先に触れない
- 確認: `uv run ruff check . && uv run ruff format --check . && uv run mypy src && uv run pytest`
