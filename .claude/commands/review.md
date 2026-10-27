---
description: 他のメンバーの PR を確認し、レビューコメントの案を作る（Approve は人が行う）
argument-hint: "<PR番号>"
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr checks:*), Bash(gh pr checkout:*), Bash(gh pr review --comment:*), Bash(pnpm check), Bash(pnpm install:*), Bash(uv sync:*), Bash(git switch:*), Bash(git status:*), Read, Grep, Glob
---

# PR #$ARGUMENTS をレビューする

!`gh pr view $ARGUMENTS --json title,author,body,baseRefName,headRefName,files,additions,deletions,url`

!`gh pr checks $ARGUMENTS 2>&1 | tail -15`

## 手順
1. **差分を読む。** `gh pr diff $ARGUMENTS` を実行する。必要に応じて関係する既存コードも読む。
2. **次の観点で確認する。**
   - [ ] PR 本文のタスクと完了条件に合っているか。範囲外の変更が混ざっていないか
   - [ ] 変更したコードに、意味のあるテストが付いているか（通るだけの空テストではないか）
   - [ ] docs/CODING_RULES.md に沿っているか（型、命名、日本語の文言、設定は環境変数）
   - [ ] 秘密情報やユーザーのデータが含まれていないか。127.0.0.1 以外で待ち受けていないか
   - [ ] contracts/ を変えている場合、影響を受ける担当者がレビュアーに入っているか
   - [ ] 新しい依存について、PR 本文に理由があるか
3. **（ユーザーが望めば）手元で動かす。**
   - `gh pr checkout $ARGUMENTS` → `pnpm install` → `pnpm check` を実行する。
   - 動作確認の手順を試す。
   - 終わったら元のブランチに戻る。
4. **結果を出力する。**
   - 「必ず直してほしい点」「できれば」「良い点」に分け、ファイル名と行番号つきで出力する。
5. **コメントを投稿する。**
   - ユーザーが了承した場合だけ `gh pr review $ARGUMENTS --comment --body-file <ファイル>` で投稿する。
   - **Approve は Claude からは行わない。** 判断したユーザー本人が GitHub 上で行う。
