---
description: 発表後、この期間の PR を Draft から外してレビューを依頼する
allowed-tools: Bash(node scripts/jarvis.mjs:*), Bash(pnpm check), Bash(pnpm format:*), Bash(git status:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git log:*), Bash(git push -u origin HEAD), Bash(git push --force-with-lease:*), Bash(gh pr view:*), Bash(gh pr ready:*), Bash(gh pr edit:*), Bash(gh pr checks:*), Read
---

# レビューを依頼する（発表後）

!`git status -sb`

!`gh pr view --json number,title,isDraft,baseRefName,url,mergeStateStatus 2>/dev/null || echo "PR がありません。先に /done を実行してください"`

メンバー一覧（GitHub ユーザー名）:
!`node -e "const s=require('./docs/schedule.json');for(const[k,m]of Object.entries(s.members))console.log(k,m.github||'(未設定)')"`

## 手順
1. **未コミットの変更があれば止める。** 先に `/done` を案内する。
2. **最新の main を取り込む。**
   - `git fetch origin && git rebase origin/main` を実行する。
   - 衝突した場合は `/sync` の手順で解決する。
   - その後 `pnpm check` を実行し、`git push --force-with-lease` する。
3. **PR の本文を確認する。**
   - 「期間とタスク」と「報告用メモ」が最新か確認する。古ければ `/done` の手順で更新する。
   - PR のタイトルがそのまま squash コミットになる。Conventional Commits の形になっているか確認する。
4. **Draft を外してレビューを依頼する。**
   - `gh pr ready` で Draft を外す。
   - `gh pr edit --add-reviewer <自分以外のメンバーの GitHub ユーザー名>` でレビューを依頼する。未設定の人は飛ばす。
5. **`gh pr checks` で CI の状況を表示する。**
   - CI が全部通り、自分以外の 1 人が Approve すればマージできる（マージは人が GitHub 上で行う）。
