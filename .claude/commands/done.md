---
description: 作業セッションを終える（チェック→タスク更新→コミット→Push→Draft PR 作成・更新）
allowed-tools: Bash(node scripts/jarvis.mjs:*), Bash(pnpm format:*), Bash(pnpm check), Bash(pnpm gen:contracts), Bash(uv run:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push -u origin HEAD), Bash(git rev-parse:*), Bash(gh pr view:*), Bash(gh pr create:*), Bash(gh pr edit:*), Read, Edit, Write
---

# セッションを終える

## いまの状況
!`node scripts/jarvis.mjs context`

!`git status -sb`

!`git diff --stat HEAD 2>/dev/null | tail -15`

## 手順
1. **main ブランチの上にいる場合は中止する。** `/start` でブランチを作るよう案内する。
2. **整形とチェックを行う。**
   - `pnpm format` → `pnpm check` の順に実行する。
   - services/tools の API を変えていたら、先に `pnpm gen:contracts` を実行する。
   - 失敗したら原因を直す。テストの削除・skip・期待値をごまかす修正は禁止。
   - 時間内に直せない場合: 状況を説明し、「CI が落ちる WIP として Push するか」をユーザーに確認する。
3. **タスクのチェックを更新する。**
   - このセッションで**完了条件を満たした**タスクだけを docs/tasks/<分野>.md で `[x]` にする。
   - どれを `[x]` にするかは、ユーザーに確認してから更新する。
4. **コミットする。**
   - `git status` で、`.env*`・`*.db`・大きなファイルが含まれていないことを確認する。
   - 変更を意味のまとまりに分けてコミットする。
   - コミットメッセージは Conventional Commits の形にし、日本語で書く（docs/CODING_RULES.md）。
     - 例: `feat(tools): タスク一覧ツールを追加`
5. **Push する。** `git push -u origin HEAD`
6. **PR を作成・更新する。**
   - `gh pr view --json number,url` で既存の PR を確認する。
   - 本文は下のテンプレートで作り、一時ファイルに書いて `--body-file` で渡す。
   - 既存の PR がない場合:
     - `gh pr create --draft --base main --title "<type>(<scope>): [<期間ID>] <この期間の作業の要約>" --body-file <ファイル>` を実行する。
     - 前の期間のブランチから分岐した場合は、`--base` にそのブランチを指定する。
   - 既存の PR がある場合:
     - `gh pr edit --body-file <ファイル>` で本文を最新にする。
     - 引き継ぎメモは**今回の内容で上書きする**。
7. **最後に次の 3 点を表示する。**
   - PR の URL
   - 残っている未完了タスク
   - 発表まで残り何日か

## PR 本文テンプレート
```markdown
## 概要
<!-- この期間の作業を 1〜2 文で -->

## 期間とタスク
- 期間: <ラベル>（発表 <日付>）／ 到達点: <到達点>
- [x] <ID> <作業内容>（完了条件: ...）
- [ ] <ID> <作業内容>（完了条件: ...）

## 変更点
- 

## テスト
- 追加・更新したテスト:
- `pnpm check`: 成功 / 失敗（理由）

## 動作確認の方法
1. `./scripts/dev.sh`
2. 

## 引き継ぎメモ（次のセッションの自分・他のメンバー向け）
- 次にやること:
- 詰まっていること・判断待ち:
- 他の担当への影響（contracts の変更など）:

## 報告用メモ
- できたことを一文で:
- 見せられるもの（デモ・スクリーンショット）:
- 数字（計測値など）:
```
