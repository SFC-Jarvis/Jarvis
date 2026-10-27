# JARVIS

声とテキストで話せる、自分の PC で動く AI エージェント。SFC 服部研究会・2026 年度秋学期プロジェクト。

- 今学期のゴール: 第 13 週（2027-01-14）に MVP 完成 → [docs/PROJECT.md](docs/PROJECT.md)
- 構成: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## はじめに
```bash
./scripts/setup.sh        # 初回だけ（手順: docs/SETUP.md）
./scripts/dev.sh --mock   # 開発環境を開く
claude                    # → /start
```

## ドキュメント
| 読む人 | ファイル |
|---|---|
| 全員（最初に） | [docs/SETUP.md](docs/SETUP.md) / [docs/WORKFLOW.md](docs/WORKFLOW.md) / [docs/CODING_RULES.md](docs/CODING_RULES.md) |
| 進捗を見る | [docs/tasks/](docs/tasks/)（チェックリスト）、`pnpm progress`、各自の Draft PR |
| Owner | [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) |
| Claude Code | [CLAUDE.md](CLAUDE.md) と各フォルダの CLAUDE.md、[.claude/commands/](.claude/commands/) |

## 進捗チェックリスト
| 分野 | 主担当の目安 | チェックリスト |
|---|---|---|
| 統合 | C | [docs/tasks/integration.md](docs/tasks/integration.md) |
| データとツール | C | [docs/tasks/data-tools.md](docs/tasks/data-tools.md) |
| 音声 | A | [docs/tasks/voice.md](docs/tasks/voice.md) |
| 画面 | B | [docs/tasks/web.md](docs/tasks/web.md) |
| 品質保証 | 全員 | [docs/tasks/qa.md](docs/tasks/qa.md) |

main のチェックリストは発表後のマージで更新される。期間中の途中経過は [Pull requests](https://github.com/SFC-Jarvis/Jarvis/pulls) の各 Draft PR を見る。
