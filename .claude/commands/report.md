---
description: 今の期間の成果を、進捗報告スライド作成用の Markdown で出力する（all で全員分）
argument-hint: "[all] [YYYY-MM-DD]"
allowed-tools: Bash(node scripts/jarvis.mjs:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(gh pr list:*), Bash(gh pr view:*), Read
---

# 進捗報告用の Markdown を出力する

## データ
期間:
!`node scripts/jarvis.mjs period --json $ARGUMENTS`

全体の進捗表:
!`node scripts/jarvis.mjs progress`

自分のタスク:
!`node scripts/jarvis.mjs tasks $ARGUMENTS`

## 手順
1. 引数に `all` が**ない**場合は、自分の分だけを出力する。
   - 自分の PR の本文を読む: `gh pr list --author @me --state all --limit 10 --json number,title,state,isDraft,url,body,createdAt,additions,deletions`
   - この期間のコミットを読む: `git log --since=<期間の開始日> --oneline`
2. 引数に `all` が**ある**場合は、全員分をまとめる（主に Sota が発表の準備に使う）。
   - `git fetch origin` を実行する。
   - この期間に作られた全員の PR の本文を読む: `gh pr list --state all --limit 30 --search "created:>=<期間の開始日>" --json number,title,author,state,isDraft,url,body,additions,deletions`
   - 全員のタスクを確認する: `node scripts/jarvis.mjs tasks --member all`
3. **事実だけを書く。**
   - 根拠は次のものに限る。
     - PR の本文（特に「報告用メモ」）
     - コミット
     - チェックリスト
   - 分からない項目は推測で埋めず、`（要記入）` とする。
4. 下の形式で、**1 つの markdown コードブロックだけ**を出力する。
5. 最後に 1 行だけ添える。「このブロックを、スライド作成用の Claude のチャットにそのまま貼ってください」

## 出力形式
````markdown
# JARVIS <ラベル> 進捗報告用データ
- 期間: <開始>〜<発表日> ／ 到達点: <到達点> ／ 判定: 達成 / 一部達成 / 未達（理由を一言）

## 全体の進捗
<progress の表をそのまま>

## <メンバーID>（<名前>）: <分野>
### できたこと
- <ID> <作業内容> — 完了条件: <...> → 結果: <どう確かめたか>
### できなかったこと・遅れ
- <ID> <作業内容> — 理由: <...> ／ 見込み: <次回いつまでに>
### 見せられるもの
- デモ: <手順 1 行> ／ スクリーンショット候補: <画面名>
### 数字
- テスト: <追加数>件 ／ 変更: +<追加>/-<削除> 行 ／ 計測値: <あれば>
### 困っていること・リスク
- 
### 次の期間にやること
- <次の期間の ID と作業内容（docs/tasks から）>

<all の場合は、メンバーごとに上のセクションを繰り返す>

## 次回（<次のラベル>・<発表日>）の到達点
- <schedule.json の次の期間の到達点>
````
