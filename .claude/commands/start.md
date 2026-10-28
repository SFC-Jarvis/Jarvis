---
description: 日付から今の期間を判定し、自分のタスクを始める（作業中なら再開する）
argument-hint: "[YYYY-MM-DD]（省略時は今日）"
allowed-tools: Bash(node scripts/jarvis.mjs:*), Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git switch:*), Bash(git pull --ff-only:*), Bash(git branch:*), Bash(gh pr list:*), Bash(gh pr view:*), Read, Grep, Glob
---

# 期間のタスクを始める・再開する

## いまの状況
!`node scripts/jarvis.mjs context $ARGUMENTS`

!`git status -sb 2>/dev/null | head -20`

自分の未マージの PR:
!`gh pr list --author @me --state open --json number,title,headRefName,isDraft,url 2>/dev/null || echo "（gh が未ログイン: gh auth login を実行）"`

## 手順
1. **メンバーが未設定**なら止めて、`./scripts/setup.sh` の実行を案内する。
2. **再開か開始かを判定する。**
   - 今のブランチが `<自分のID小文字>/<今の期間ID>-*` なら **再開**。
   - 手元にそのブランチがなくても、`git fetch origin` 後に `git branch -r --list 'origin/<自分のID小文字>/<今の期間ID>-*'` で見つかれば、`git switch <ブランチ名>`（origin を追跡）してから **再開**（別の PC で作業していた場合）。
   - それ以外なら **開始**。
3. **再開の場合**
   - `gh pr view --json body,url` で PR 本文の「引き継ぎメモ」を読む。
   - `git log origin/main..HEAD --oneline` と `git status` で、どこまで進んだかを確認する。
   - 次の 3 点を 5 行以内で示し、ユーザーの了承を得てから続ける。
     - 前回までにできたこと
     - 次にやること
     - 未完了タスクの完了条件
4. **開始の場合**
   - 未コミットの変更があれば、先に `/done` するか確認して止める。
   - `git fetch origin && git switch main && git pull --ff-only` を実行する。
   - 前の期間の自分の PR がまだ未マージの場合:
     - その成果が今回のタスクに**必要なら**、そのブランチから分岐する。マージ後に `/sync` で付け替えると伝える。
     - **必要でなければ**、main から分岐する。
   - 未完了タスクの一覧を示し、今回取り組むタスクを選んでもらう。
     - 品質保証のタスクを引き受けるなら、docs/tasks/qa.md の行末に `@自分のID` を付ける。
   - `node scripts/jarvis.mjs branch <英語の短い内容>` でブランチ名を作り、`git switch -c <名前>` を実行する。
5. **計画を立てる**（コードを書く前に必ず行う）
   - 次の資料を読む。
     - `docs/members/<自分のID>.md`（担当・受け渡し・必要な技術）
     - 選んだタスクの完了条件
     - 関係するフォルダの CLAUDE.md
     - contracts/
     - docs/ARCHITECTURE.md
   - 他のメンバーの未マージの成果が必要な場合:
     - `gh pr list` で相手の Draft PR を確認する。
     - 依存部分は contracts/ に沿ったモックで進める。相手のブランチは取り込まない。
   - 次の形で計画を示し、了承を得る。
     - 変更するファイル
     - 先に書くテスト（何を確かめるか）
     - 実装の順番
     - 完了条件をどう確かめるか
6. 了承後、**テスト → 実装 → `pnpm check`** の順に進める。
   - 区切りのよいところで、`/done` でセッションを終えられることを伝える。
