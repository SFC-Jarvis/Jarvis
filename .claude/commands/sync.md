---
description: 最新の main を自分の作業ブランチに取り込む（衝突の解決を手伝う）
allowed-tools: Bash(git status:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git log:*), Bash(git diff:*), Bash(git add:*), Bash(git branch:*), Bash(git push --force-with-lease:*), Bash(pnpm check), Bash(pnpm install:*), Bash(uv sync:*), Bash(gh pr view:*), Bash(gh pr edit:*), Read, Edit
---

# 最新の main を取り込む

!`git status -sb`

!`git fetch origin 2>&1 | tail -2; git log --oneline HEAD..origin/main | head -20`

## 手順
1. **未コミットの変更があれば止める。** 先に `/done` を案内する。
2. **ベースを確認する。**
   - `gh pr view --json baseRefName` を実行する。
   - 前の期間の自分のブランチから分岐していて、そのブランチがすでに main に squash マージ済みの場合:
     - `git rebase --onto origin/main <前のブランチ名> ` で付け替える。
     - `gh pr edit --base main` で PR のベースを main に戻す。
   - それ以外の場合は `git rebase origin/main` を実行する。
3. **衝突したら次の方針で解決する。**
   - 自分の分野以外のファイル、contracts/、共有設定は **main 側を優先**する。そのうえで自分の変更を合わせ直す。
   - 判断がつかない衝突は、該当箇所を示してユーザーに確認する。
   - 解決したら `git add` → `git rebase --continue` を実行する。
4. **依存が変わっていたら入れ直す。**
   - package.json・pnpm-lock.yaml・uv.lock が変わっていたら、`pnpm install` と各サービスの `uv sync` を実行する。
5. **確認して Push する。**
   - `pnpm check` が通ることを確認する。
   - `git push --force-with-lease` を実行する（自分の作業ブランチだけ）。
6. 取り込んだ主な変更（他のメンバーの成果）を 3 行程度で要約して伝える。
