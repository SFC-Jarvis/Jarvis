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

### 3. 設定スクリプトを実行する（Mac）
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

### 4. メンバーを招待する
1. A・B に GitHub のユーザー名を聞く
2. `./scripts/setup-github.sh <Aのユーザー名> <Bのユーザー名>` を実行する（招待メールが届く）
3. `docs/schedule.json` の `members.A.github` / `members.B.github` と、`docs/PROJECT.md` の体制表を更新する PR を出す
4. メンバーには docs/SETUP.md を渡す

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
