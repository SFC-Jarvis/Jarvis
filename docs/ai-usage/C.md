# C（Sota）の Claude 利用記録

書き方と、何を残すかは [README.md](README.md)。

## 概要
- 使ったもの: Claude Code（VS Code の拡張・ターミナル。Mac と Windows の WSL2）、Claude アプリ（計画・スライド作成）
- 使い方の型: カスタムコマンドで作業を区切る（`/start` → テストから実装 → `/done`、発表前に `/report`、main の更新後に `/sync`）。Claude には「計画を示して了承を得てから実装」「確かめた手順だけチェックを付ける」を CLAUDE.md で指示している
- この PC（Mac）の記録にあるカスタムコマンドの利用（11/3〜11/11）: `/start` 4 回・`/done` 4 回・`/sync` 4 回・`/report` 3 回

## 記録がない期間（あとで追記する）
この記録は Mac の Claude Code の会話記録（2026-11-03〜11-11）から作った。次の期間・場所の記録は残っていないので、[collect-prompts.md](collect-prompts.md) のプロンプトで集めて追記する。

| 期間・場所 | その間にできたもの（Git の履歴・PR から） |
|---|---|
| 〜10/28（Mac・Claude Code）| 初期構築（モノレポ・Claude Code 用の文書・CI）、Windows（WSL2）対応、作業量の見直し、メンバー別ページ、tmux の表示、setup.sh の改善（#1〜#9） |
| 計画・発表準備（Claude アプリ） | 構成と技術の選定、スケジュール、発表スライド |
| 11/5〜11/9（Mac・Claude Code） | 画面のダークテーマ（#13）、進捗ページ（#14）、dev.sh をどこからでも起動（#15） |
| Windows（WSL2）の Claude Code | Ollama（`qwen3.5:9b`）の導入と速さの測定、WSL2 での手順書（INT-3-2・PR #11 の一部） |

## 記録

### 2026-11-03 INT-3-1 AI をどの PC で動かすか（Claude Code）
> i want to use ollama only on my windows pc with a rtx 4070, as the other device is a m3 macbook air (check if similar models or sufficient performance models can be ran though). lets start with (b)

- 結果: AI は PC ごとに決める方針にした（Mac は Gemini 無料枠、Windows は Ollama）。今学期は 1 台の中で切り替えない

### 2026-11-03 開発の進め方: Claude の応答を日本語にし、進み具合を見えるようにする（Claude Code）
> before working on this task, please update the claude instructions overall so that all response comes in japanese (custom command description as well), and the steps are easy to comprehend (the current task number and smaller steps are all visible, with the checkbox marked as checked once claude confirms that everything is done properly)

- 結果: CLAUDE.md とカスタムコマンドを日本語にした。作業中は応答の先頭に「タスク ID・手順のチェックリスト・いまここ」を出し、Claude が実際に確かめた手順だけ `[x]` にする決まりにした（PR #10）

### 2026-11-03 INT-3-1 OpenClaw の導入（Claude Code）
> i have created a gemini api key, but 2. did not work:（インストールのログを貼り付け）

> i installed openclaw, so do i select quick start or custom setup? tell me all the selections and inputs in the openclaw terminal

- 結果: インストールの失敗は `~/.npm` の権限が原因と分かり、直した。初期設定（onboard）の各選択は Claude に理由つきで決めてもらった（待ち受けは 127.0.0.1、認証は token、エージェントは 1 つ、テレメトリ off など）。答え方は openclaw/README.md の表にした
- 同じ目的の質問（エージェントの数・アクセス権・Gateway の場所・ポート・秘密の保存方法・プラグインなど 15 件ほど）は、この 1 件にまとめた

### 2026-11-03 INT-3-2 無料枠の上限に合わせてモデルを選ぶ（Claude Code）
> can the model be changed to gemma 4, as gemini-flash models have a small rpd?（AI Studio の上限の表を貼り付け）

> is there any way to use a different model with more rpd? this model seemed like a good option.（Gemini 3.5 Flash Lite の上限を貼り付け・11/5）

- 結果: Gemma 4 31B は、OpenClaw が 1 回に約 16K トークンを送るため、1 分あたりの上限（16K）で使えないと分かった。1 日 500 回使える Gemini 3.5 Flash Lite に決め、実測値を openclaw/README.md に記録した（PR #11）

### 2026-11-05 DT-3-1 仕様案を別の PR にする（Claude Code）
> /start DT-3-1

> yes, go ahead with the separate branch

- 結果: A・B に確認してもらう仕様（データ設計とツールの仕様案）を、実装とは別の小さな PR にした（PR #12）

### 2026-11-05 INT-3-2 Ollama の進め方（Claude Code）
> tell me more about int-3-2. does the gemini version already work, and we are just implementing the feature to run local llm using ollama?

- 結果: Gemini 側は動いていることを確認し、Windows で Ollama をつないで測る計画にした。Windows での作業は「記録がない期間」を参照

### 2026-11-09 main の状態の確認（Claude Code）
> check pr 15's changes (and all other merged prs) and see if the current main is up to date, since dev.sh does not work from Jarvis/.

- 結果: マージ済みの PR と main を照らし合わせ、dev.sh の起動の問題を調べた

### 2026-11-09 発表日の変更に合わせて日程を組み直す（Claude Code・Claude アプリ）
> the presentation date has been updated, so some tasks need to update their deadlines and content. which md can i hand to claude app to organize this and sync between the slide content and what is recognized by the system?

> i have updated all the relevant documents. please review each one and make any supporting changes. then, push it to the repo so i can force merge it and update the status

- 結果: 日付の正（docs/schedule.json）とタスクのファイルを Claude アプリで直し、Claude Code が確認した。作業量を計算し直して表と一致することを確かめ、古いタスク ID が残っていたメンバー別ページなども直した（PR #16）

### 2026-11-10 チームへの連絡文（Claude Code）
> please create a small message to send via line describing the steps to working on tasks and sharing the progress every 2 weeks, mentioning how and when to use each command (i will mostly use /review and merge prs) and other supplementary info like how a second window now pops up after running dev.sh which actively shows the current progress (progress will be updated only once the pr is merged to main).

- 結果: A・B 向けの LINE の文面を作った。Claude が進捗ページの実際の動き（マージ前の PR も表示する）をコードで確かめ、文面の誤りを指摘して直した
- 言い換え・語尾・長さの調整の依頼（3 件）は省いた

### 2026-11-11 他のメンバーの確認を、次の期間のタスクにする（Claude Code）
> what needs to be checked by others, like reading which document or running which files? i want to merge my part

> please add the openclaw testing/download as a task for a and b by next presentation time. change the form of the two prs so i can force merge as owner

> 仕様の確認はA, Bで/syncを実行してからClaudeの認識として更新されれば十分です。

- 結果: A・B が手順書どおりに OpenClaw を入れるタスク（QA-4-3・QA-4-4）を第4回に追加した。PR #11・#12 を最新の main に合わせ、セルフマージの理由を書いてマージした。仕様の確認は、A・B が `/sync` で取り込めば十分とした

### 2026-11-11 /report の報告文をファイルで保存する（Claude Code）
> edit the /report command so that the md file itself can be downloaded or is downloaded to the pc, titled with the presentation day and member name.

- 結果: `/report` が `<発表日>_<ID>_<名前>.md` をダウンロードフォルダに保存するようにした。Mac と WSL で保存先が違うので、保存先を決めるスクリプトをテストつきで作った（PR #17）

### 2026-11-11 「部分的に完了」の状態を加える（Claude Code）
> なぜ他2つのタスクは未完了となっているのですか？明日までの4/4タスクを終わらせたのでは？

> 部分的に完了（個人では、確認手順を除いて、など）というステータスを進捗ページと/reportで生成したmd, プロジェクトのタスク進捗状況に追加し、私の進捗を更新し、mdファイルを再度ダウンロードしてください

- 結果: タスクの書式に `[~]`（部分的に完了）と「残り」の行を加え、進捗表・進捗ページ・`/report` に出るようにした。DT-3-1・QA-3-1 を `[~]` にし、報告文を作り直した（PR #18）

### 2026-11-11 進捗ページの不具合の報告と修正（Claude Code）
> the progress page removed the 2 tasks out of 4 that i wanted to be marked as partially complete, showing this message: 最新の情報を取得できなかったので、前回取得した内容で表示しています（警告の文を貼り付け）

> implement both fixes as self force mergeable prs right now

- 結果: 原因は、進捗サーバーが古いコードのまま動いていたことと、一時的にネットにつながらなかったこと。再起動で直したうえで、再発を防ぐ 2 つの修正を入れた。警告の文を原因ごとに分けた（PR #19）。読めない書式のタスクの行を警告し、CI でも止めるようにした（PR #20）

### 2026-11-11 AI の利用記録を作る（Claude Code）
> ideally, i want to document the claude usage history per member on 3 separate docs saved in this repo, including only the key prompts during tasks regarding decision making, commands, etc like this example: "please create a document that keeps track of a summary of all influential prompts that were asked to formulate these idea documents, omitting unimportant prompts like clarifying questions, summary demand, rewording, etc." is it possible to create the doc for me right now, documenting all the history available in this platform, and you create a prompt to enter in claude app and claude code windows so that i can get their records and paste it back here for a complete history?

- 結果: この記録（docs/ai-usage/）を作った。Mac の会話記録から重要なプロンプトを選び、ほかの場所の記録を集めるプロンプト（collect-prompts.md）を用意した。以後は `/done` のたびに追記する
