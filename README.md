# JARVIS

声とテキストで話せる、自分の PC で動く AI エージェント。SFC 服部研究会・2026 年度秋学期の 3 名チーム開発。

**今学期のゴール: 第 13 週（2027-01-14）に MVP 完成**（完成条件は [docs/PROJECT.md](docs/PROJECT.md)）

---

## 1. まず自分のページを開く

| あなた | 担当 | 最初に読むページ |
|---|---|---|
| **C**（Sota） | 統合・データとツール | [docs/members/C.md](docs/members/C.md) |
| **A** | 音声 | [docs/members/A.md](docs/members/A.md) |
| **B** | 画面 | [docs/members/B.md](docs/members/B.md) |

自分のページに、**担当の作業・期間ごとのタスク・触るフォルダ・読む資料・最初の 1 日目にやること**がまとまっている。

**担当（A か B）がまだ決まっていない人へ**: A と B のページを両方読み、必要な技術・作業量・内容を比べて、チームで相談して決める。決まったら 2. に進む（setup.sh で ID を選ぶと登録の PR が作られ、一度登録された ID はほかの人は選べない）。

## 2. 環境を作る（初回だけ）

| PC | 手順書 |
|---|---|
| Mac | [docs/SETUP.md](docs/SETUP.md) |
| Windows | [docs/SETUP_WINDOWS.md](docs/SETUP_WINDOWS.md)（WSL2 の Ubuntu を使う） |

最後は共通で次の 2 つ:
```bash
./scripts/setup.sh          # メンバー ID（A/B/C）を聞かれる。担当が未定なら、先に 1. のページを読んで相談して決める
./scripts/dev.sh --mock     # ブラウザで http://localhost:3000 が開けば OK
```

## 3. 毎日の流れ

```bash
cd ~/Jarvis
./scripts/dev.sh --mock     # 開発環境を開く（OpenClaw の準備ができたら --mock なし）
```
1. ターミナルが **tmux**（画面を分ける道具）に切り替わり、Claude Code のウィンドウが前面に出る
2. **画面の一番下のバー**に、ウィンドウの一覧（`0:web 1:tools 2:claude`）と操作方法が出ている
   - ウィンドウを切り替えるときは **`Ctrl-b` を押して離してから番号**（例: `Ctrl-b` → `0` で画面のログ、`Ctrl-b` → `2` で claude）
   - 開いたまま抜ける: `Ctrl-b` → `d` ／ 戻る: `./scripts/dev.sh` ／ 止める: `./scripts/dev.sh stop`
3. claude のウィンドウで **`/start`** → 今の期間の自分のタスクと前回の引き継ぎメモが出る → Claude の計画を確認して OK
4. Claude に指示して開発する（テスト → 実装の順。画面は http://localhost:3000）
5. 終わるときは必ず **`/done`**（テスト → コミット → Push → Draft PR の更新）

発表の前日は `/report`、発表の後は `/ship`（レビュー依頼）と `/review <PR番号>`（他の人の PR を確認）。
詳しくは [docs/WORKFLOW.md](docs/WORKFLOW.md)。

## 4. 進捗を見る

- 全体の表: `pnpm progress`　自分のタスク: `pnpm tasks`
- チェックリスト（main の状態）: [docs/tasks/](docs/tasks/)
- 期間中の途中経過: 各自の Draft PR（[Pull requests](https://github.com/SFC-Jarvis/Jarvis/pulls)）

## 5. 資料の地図

| 知りたいこと | ファイル |
|---|---|
| 何を作るか・ゴール・体制・スケジュール | [docs/PROJECT.md](docs/PROJECT.md) |
| 全体の構成と部品のつながり | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 自分の担当（作業・資料・始め方） | [docs/members/](docs/members/) |
| 期間ごとのタスクと完了条件（= 進捗チェックリスト） | [docs/tasks/](docs/tasks/) |
| ブランチ・PR・レビュー・毎日の流れ | [docs/WORKFLOW.md](docs/WORKFLOW.md) |
| コードの書き方・テストのルール | [docs/CODING_RULES.md](docs/CODING_RULES.md) |
| 部品どうしのやりとり（API・イベント） | [contracts/](contracts/) |
| 品質保証（テスト・セキュリティ・計測）の記録 | [docs/qa/](docs/qa/) |
| GitHub の設定（Owner 用） | [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) |
| Claude Code が読む指示 | [CLAUDE.md](CLAUDE.md)、各フォルダの `CLAUDE.md`、[.claude/commands/](.claude/commands/) |

## 6. フォルダ

| フォルダ | 中身 | 主担当 |
|---|---|---|
| `apps/web` | JARVIS の画面（Next.js） | B |
| `services/voice` | 音声（Pipecat） | A |
| `services/tools` | タスク・予定のデータとツール（FastAPI + MCP） | C（画面用 API は A） |
| `openclaw/` | OpenClaw の設定・エージェントの人格 | C |
| `contracts/` | 部品間の仕様 | 全員で決める |
| `scripts/` | セットアップ・開発環境・補助コマンド | C |
