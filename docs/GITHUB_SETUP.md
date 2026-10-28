# GitHub の初期設定（Owner: Sota が 1 回だけ行う）

目標:
- main は PR 経由でしか変更できない
- PR は **CI（ci-ok）が全件成功** かつ **自分以外の 1 人が Approve** したときだけマージできる
- メンバー（A・B）は保護ルールを迂回できない。Owner だけ必要なときにセルフマージできる（PR 経由のみ）

> GitHub の仕様: 「CI が通るまで Approve できない」は設定できないため、「CI が通るまでマージできない」で代わりにしている。
> 自分の PR を自分で Approve することは GitHub が元々許していない。
> 非公開リポジトリでこの保護を使うには有料プランが必要。そのため公開リポジトリにしている。

## 手順

### 1. Claude の GitHub アプリ（任意）
Claude からこのリポジトリに直接 Push してもらう場合だけ必要。
https://github.com/apps/claude/installations/select_target → SFC-Jarvis → Jarvis を許可

### 2. 最初のコミットを main に入れる
初期構築のコミットが main に入っていることを確認する（保護ルールを入れる前に行う）。

### 3. 設定スクリプトを実行する（Mac または Windows の WSL2）
```bash
git clone https://github.com/SFC-Jarvis/Jarvis.git && cd Jarvis
./scripts/setup.sh                       # 自分の開発環境（メンバー ID は C）
gh auth status                           # 1110soda でログインしていること
./scripts/setup-github.sh                # 招待は後で: ./scripts/setup-github.sh <Aのユーザー名> <Bのユーザー名>
```
スクリプトが行うこと:
| 項目 | 設定 |
|---|---|
| Organization | メンバーの既定権限は Read、リポジトリ作成を禁止 |
| チーム `developers` | Jarvis に Write 権限（Admin ではないので保護ルールを迂回できない） |
| マージ方法 | Squash のみ（PR タイトルがコミットになる）、マージ後にブランチ削除、Update branch ボタン |
| Actions | トークンは読み取り専用、Actions による PR の Approve を禁止 |
| セキュリティ | 秘密情報の検出と Push ブロック、脆弱性アラートと自動修正 PR |
| ラベル | `no-test-needed`（テスト不要な PR 用。test-guard をスキップ） |
| 保護ルール | `.github/rulesets/main.json` を main に適用 |

保護ルールの中身:
- PR 必須。Approve 1 件、新しい Push で Approve を取り消し、最後に Push した人以外の Approve が必要
- コメントの会話がすべて解決済みであること
- 必須チェック `ci-ok`（GitHub Actions）が成功し、ブランチが main の最新を含むこと
- main の削除・force push を禁止
- 迂回できるのは Organization の Owner だけ、かつ PR 経由のみ（直接 Push は Owner でも不可）

### 4. メンバーを招待する（担当が未定でもよい）
1. 2 人に GitHub のユーザー名を聞く
2. `./scripts/setup-github.sh <ユーザー名1> <ユーザー名2>` を実行する（developers チーム・Write 権限で招待。メールが届く）
   - 招待はブラウザでも可: Organization の People →「Invite member」→ ユーザー名 → Role は **Member** → Team は **developers**
   - **Owner にはしない**（Owner は保護ルールを迂回できるため）
   - ユーザー名は表示名ではなく、プロフィールの URL `github.com/<ユーザー名>` の部分（英数字とハイフンのみ。`_` は使えない）
   - 初回は招待に必要な権限（admin:org）の追加を求められる。ブラウザでコードを入力する
3. 2 人にリポジトリのリンクを送り、「README の『1. まず自分のページを開く』で A（音声）・B（画面）を読んで相談し、担当を決めてから setup.sh を実行して」と伝える
4. 各自が `./scripts/setup.sh` で ID を選ぶと、`docs/schedule.json` に自分のユーザー名を書く **登録 PR** が自動で作られる
   - すでに登録された ID は、ほかの人は選べない（登録 PR がマージされるまでは確定しない）
5. 登録 PR を Owner が確認して Approve → マージ。docs/PROJECT.md の体制表の GitHub 欄も後で更新する

権限のまとめ:
| | Owner（Sota） | developers（A・B） |
|---|---|---|
| ブランチを作って Push・PR 作成 | ○ | ○ |
| ほかの人の PR を Approve | ○ | ○ |
| 自分の PR を Approve | ×（GitHub の仕様） | × |
| Approve と CI 成功の前にマージ | ○（bypass、PR 経由のみ） | × |
| main へ直接 Push | × | × |

### 5. 動作確認
- [ ] https://github.com/SFC-Jarvis/Jarvis/settings/rules に「main を守る」が Active で表示される
- [ ] 試しに PR を作ると、CI の `ci-ok` が走る
- [ ] Approve がない状態では Merge ボタンが押せない（Owner には「Bypass rules」の選択肢が出る）
- [ ] A・B の権限が Write になっている（Settings → Collaborators and teams）

## セルフマージ（Owner のみ）を使うとき
- 発表の直前で、レビューできる人がいない、などの例外に限る
- PR の画面で「Merge without waiting for requirements to be met (bypass rules)」にチェックを入れてマージする
- **CI が失敗している状態ではセルフマージしない。** 迂回した理由を PR にコメントで残す

## 困ったとき
- `ci-ok` が「Expected — Waiting for status」のまま: PR の CI が一度も走っていない。空コミットを Push するか、Actions タブで再実行する
- ルールの API がエラー: Owner でログインしているか（`gh api user -q .login`）、リポジトリが公開になっているかを確認する
