# 開発環境の作り方（Windows）

Windows では **WSL2（Windows の中で動く Linux）の Ubuntu** で開発する。

- WSL2 はデュアルブートではない。Windows はいつもどおり使え、Ubuntu はターミナルの中だけで動く（ゲームもそのままできる）
- リポジトリ・Node.js・Python・Claude Code・各サービスは Ubuntu の中で動かす
- Windows 側に入れるのは Ollama・AivisSpeech・ブラウザ・VS Code だけ

| どこで動かすか | もの | 理由 |
|---|---|---|
| Ubuntu（WSL2） | リポジトリ、Node.js、uv、pnpm、tmux、Claude Code、OpenClaw、web / tools / voice | Mac と同じスクリプト（setup.sh・dev.sh）がそのまま動く |
| Windows | Ollama、AivisSpeech、ブラウザ、VS Code | GPU とスピーカーを直接使える。Ubuntu からは 127.0.0.1 で呼べる（ミラーモード） |

対象: **Windows 11 22H2 以降**（ミラーモードのため。Windows 10 は末尾を参照）／ 所要時間: 60〜90 分

## 最初に: いまどちらのターミナルにいるか
以下の手順は **PowerShell** で打つものと **Ubuntu** で打つものが混ざっている。行の先頭で見分ける。

| 行の先頭の表示 | どちら | 例 |
|---|---|---|
| `PS C:\Users\...>` | PowerShell（Windows） | `PS C:\Users\taro>` |
| `ユーザー名@PC名:~$` | Ubuntu | `taro@MyPC:~$` |

違う方に打つと `command not found` などのエラーになる（何も壊れないので、正しい方で打ち直せばよい）。

---

## 1. WSL2 と Ubuntu を入れる（PowerShell・管理者）
スタートメニューで「PowerShell」を右クリック →「管理者として実行」。
```powershell
wsl --install -d Ubuntu-24.04
```
- `-d` の後の名前の前に **`-` を付けない**（`-Ubuntu-24.04` にすると「ディストリビューション名 '.04' が無効」と出る）
- 名前が見つからないと言われたら `wsl --list --online` で一覧を出し、表示された名前をそのまま使う

PC を再起動 → Ubuntu が自動で開くので、ユーザー名とパスワードを作る（パスワードは後で `sudo` に使う。入力中は画面に何も表示されない）。

## 2. ネットワークをミラーモードにする（Ubuntu）
Windows と Ubuntu で `127.0.0.1` を共有するための設定ファイル `.wslconfig` を Windows のユーザーフォルダに作る。
エクスプローラーでは `.` で始まるファイルを作りにくいので、コマンドで作る。

Ubuntu で（`<Windowsのユーザー名>` は `C:\Users\` の後の名前。`ls /mnt/c/Users/` で確認できる）:
```bash
printf '[wsl2]\nnetworkingMode=mirrored\n' > /mnt/c/Users/<Windowsのユーザー名>/.wslconfig
cat /mnt/c/Users/<Windowsのユーザー名>/.wslconfig     # 2 行表示されれば OK
wsl.exe --shutdown                                     # Ubuntu が閉じる
```
スタートメニューから Ubuntu を開き直す。

<details><summary>PowerShell で作る場合</summary>

```powershell
@"
[wsl2]
networkingMode=mirrored
"@ | Set-Content -Path "$env:USERPROFILE\.wslconfig" -Encoding ascii
wsl --shutdown
```
</details>

## 3. Windows Terminal を Ubuntu で開けるようにする
1. Windows Terminal を**全部閉じて開き直す**（Ubuntu を入れた後に一度開き直さないと、一覧に出ないことがある）
2. タブの「＋」の右の「∨」に「Ubuntu 24.04」が出る。これを使う
   - 出ない場合: 「∨」→「設定」→「＋ 新しいプロファイルを追加」→「新しい空のプロファイル」→ コマンドラインに `wsl.exe -d Ubuntu-24.04 --cd ~` → 保存
   - とりあえず使うだけなら、PowerShell のタブで `wsl ~` と打てば Ubuntu に切り替わる
3. 「∨」→「設定」で次の 2 つを変えて保存する
   - 「スタートアップ」→「既定のプロファイル」→ **Ubuntu 24.04**（新しいタブが最初から Ubuntu になる）
   - 「Ubuntu 24.04」→「開始ディレクトリ」→ `\\wsl$\Ubuntu-24.04\home\<Ubuntuのユーザー名>`
     （これをしないと `/mnt/c/Users/...`＝ Windows 側のフォルダで開く）

開いたときに `ユーザー名@PC名:~$`（`~` = Ubuntu のホーム）になっていれば OK。

## 4. Windows 側に入れるもの
- **Ollama**: https://ollama.com から Windows 版を入れて起動しておく（NVIDIA の GPU があれば自動で使う）
- **VS Code**: 拡張機能「**WSL**」も入れる
- **AivisSpeech**: 音声を試すときだけ必要（後回しでよい）
- ブラウザは何でもよい（Chrome・Edge・Firefox）

## 5. Ubuntu の中で準備する（Ubuntu）
**1 行ずつ**貼り付けて実行する（`exec $SHELL` はシェルを入れ替えるので、まとめて貼ると後ろの行が実行されないことがある）。

```bash
cd ~
sudo apt-get update && sudo apt-get install -y unzip curl     # fnm のインストールに unzip が必要
```
```bash
curl -fsSL https://fnm.vercel.app/install | bash
```
```bash
exec $SHELL
```
```bash
fnm install 24 && fnm default 24
node -v                                                         # v24.x と表示されれば OK
```

Claude Code（**Ubuntu の中に**入れる。Windows 側ではない）:
```bash
curl -fsSL https://claude.ai/install.sh | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
claude --version
```
インストール後に「`~/.local/bin is not in your PATH`」と出るのは正常。2 行目で直る。
最新の手順は https://docs.claude.com/en/docs/claude-code/overview を確認する。

## 6. リポジトリを取得してセットアップ（Ubuntu）
```bash
cd ~                                   # 必ず Ubuntu のホームに置く（/mnt/c の下は遅く、権限も壊れる）
git clone https://github.com/SFC-Jarvis/Jarvis.git
cd Jarvis
./scripts/setup.sh
```
途中で聞かれること:
| 表示 | すること |
|---|---|
| `[sudo] password for ...` | Ubuntu のパスワードを入力して Enter（画面には表示されない）。何も出ずに止まって見えるときは、apt の更新中なので 1〜2 分待つ |
| `メンバー ID を入力 [A/B/C]` | 自分の担当の ID。未定なら README の A・B のページを読んでチームで決めてから入力する。「使用中」の ID は選べない |
| `登録する PR を作りますか？` | Enter（Y）。自分のユーザー名を docs/schedule.json に書く PR が作られ、Owner が Approve すると確定する |
| GitHub のログイン | 「GitHub.com」→「HTTPS」→「Login with a web browser」→ 表示されたコードを Windows のブラウザで入力 |

`! OpenClaw が未インストール` と `! AivisSpeech ...` は、この時点では出ていてよい（必要になったら入れる）。
最後に「完了」と出れば OK。

## 7. 開いてみる（Ubuntu）
```bash
./scripts/dev.sh --mock
```
- Windows のブラウザで http://localhost:3000 が開き、JARVIS のページが出れば OK
- ターミナルは tmux（画面を分ける道具）に切り替わり、Claude Code のウィンドウが前面に出る（正常）。
  **画面の一番下のバー**に、左はウィンドウの一覧（`0:web 1:tools 2:claude`、今いるウィンドウは色付き）、その下の 2 行目に操作方法が常に出ている（幅の狭い画面でも切れない）。
  - ウィンドウの切り替え: **`Ctrl-b` を押して離してから、番号のキー**（例: `Ctrl-b` → `0` で画面のログ、`Ctrl-b` → `2` で claude）。マウスでバーをクリックしても選べる
  - 開いたまま抜ける: `Ctrl-b` → `d` ／ 戻る: `./scripts/dev.sh`
  - 全部止める: `./scripts/dev.sh stop`
- 作業を始めるには、claude のウィンドウで `/start`。自分の担当の作業と読む資料は **docs/members/<自分のID>.md**

## 8. VS Code で開く（WSL モード）
```bash
cd ~/Jarvis && code .
```
- 左下に「**WSL: Ubuntu-24.04**」と出ていれば正しい開き方。VS Code のターミナルも Ubuntu になる
- エクスプローラーや「フォルダーを開く」から `\\wsl.localhost\...` を開くと
  「the host 'wsl.localhost' was not found in the list of allowed hosts」と聞かれる。
  これは **Windows 側の VS Code が開こうとしている**合図。キャンセルして上の `code .` で開き直す
  （そのまま許可しても危険はないが、git や整形が Windows 側で動き、遅く・壊れやすくなる）
- VS Code の中からなら: `Ctrl+Shift+P` →「WSL: Connect to WSL」→「フォルダーを開く」→ `/home/<ユーザー名>/Jarvis`

## エクスプローラーでプロジェクトを見る
```bash
cd ~/Jarvis && explorer.exe .
```
またはエクスプローラー左下の「Linux」（ペンギン）→ `Ubuntu-24.04` → `home` → `<ユーザー名>` → `Jarvis`。
**見る・コピーするだけにする。** 編集は VS Code（WSL モード）か Claude Code で（Windows のメモ帳などで編集すると改行や権限が崩れる）。

## ゲームなど、重いことをする前に
WSL は動いている間メモリを使う（タスクマネージャーの `VmmemWSL`）。
```bash
./scripts/dev.sh stop          # Ubuntu で
```
```powershell
wsl --shutdown                 # PowerShell で（Ubuntu を完全に止める）
```
Ollama もタスクトレイから終了すると GPU のメモリが空く。

普段から WSL のメモリに上限をかけたいときは、`.wslconfig` に 1 行足して `wsl --shutdown`:
```ini
[wsl2]
networkingMode=mirrored
memory=8GB
```
（PC のメモリの半分以下が目安）

WSL2 を入れると Windows の仮想化機能が有効になる。一部のアンチチート付きゲームで相性の問題が報告されているので、起動しないゲームがあればチームに共有する。

## うまくいかないとき
| 症状 | 原因と対処 |
|---|---|
| `wsl --install` で「ディストリビューション名が無効」 | 名前の前の `-` を消す。`wsl --list --online` で正しい名前を確認 |
| `Set-Content: command not found` / `@: command not found` | PowerShell 用のコマンドを Ubuntu で打っている。手順 2 の Ubuntu 用を使う |
| fnm のインストールで `unzip... Missing!` | `sudo apt-get install -y unzip` してからやり直す |
| `claude: command not found` | `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc` |
| setup.sh が `Unable to locate package gh` で止まる | 最新の setup.sh は公式の配布元から入れる。`git pull` してから再実行 |
| ブラウザで localhost:3000 が開かない | `.wslconfig` のミラーモードを確認 → PowerShell で `wsl --shutdown` → Ubuntu を開き直して `./scripts/dev.sh` |
| `./scripts/dev.sh status` で Ollama が「停止」 | Windows 側で Ollama を起動する |
| プロンプトが `/mnt/c/Users/...` になっている | `cd ~` する。手順 3 の「開始ディレクトリ」を設定する |

## 注意
- **マイク**: 音声サービスは Ubuntu の中で動くため、マイクはブラウザから受け取る（contracts/voice-events.md）
- **GPU**: NVIDIA なら Windows に最新のドライバを入れるだけで Ubuntu から CUDA が使える。Ubuntu の中にドライバを入れない
- **改行**: リポジトリは `.gitattributes` で LF に統一してある。Windows 側で clone しない

## Windows 10 の場合
ミラーモードが使えないので、Ubuntu から Windows 側の `127.0.0.1`（Ollama・AivisSpeech）に届かない（Windows のブラウザ → Ubuntu の localhost:3000 は動く）。
- おすすめ: Ollama も Ubuntu の中に入れる（`curl -fsSL https://ollama.com/install.sh | sh`）
- AivisSpeech を Windows 側で使う場合: Ubuntu で `ip route show default | awk '{print $3}'` で Windows の IP を調べ、`.env.local` の `AIVIS_BASE_URL` を変える。Windows のファイアウォールで WSL からの接続を許可する

## 1 人で Mac と Windows の両方を使う場合
- `./scripts/setup.sh` は PC ごとに実行する（メンバー ID は同じ）
- **PC を替える前に必ず `/done`**（Push）。別の PC では `/start` で Push 済みのブランチから再開する
- `.env.local`（トークン）も PC ごとに設定する。トークンはチャットやリポジトリに貼らない
