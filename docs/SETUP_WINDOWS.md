# 開発環境の作り方（Windows）

Windows では **WSL2（Windows の中で動く Linux）の Ubuntu** で開発する。
リポジトリ・Node.js・Python・Claude Code・各サービスは WSL の中で動かす。
Windows 側に入れるのは次の 3 つだけ。

| どこで動かすか | もの | 理由 |
|---|---|---|
| WSL（Ubuntu） | リポジトリ、Node.js、uv、pnpm、tmux、Claude Code、OpenClaw、web / tools / voice | Mac と同じスクリプト（setup.sh・dev.sh）がそのまま動く。OpenClaw も WSL2 を「最も Linux 互換な実行環境」としている |
| Windows | Ollama、AivisSpeech、ブラウザ | GPU とスピーカーを直接使える。WSL からは 127.0.0.1 で呼べる（ミラーモード） |

- 対象は **Windows 11 22H2 以降**です。ミラーモードを使うため。
- Windows 10 の場合は、末尾の「Windows 10 の場合」を見てください。
- 所要時間は 60〜90 分です。

## 1. WSL2 と Ubuntu を入れる（PowerShell を管理者で開く）
```powershell
wsl --install -d Ubuntu-24.04
```
1. 再起動する。
2. Ubuntu が開いたら、ユーザー名とパスワードを作る。パスワードは sudo で使う。

## 2. ネットワークをミラーモードにする
WSL と Windows で `127.0.0.1` を共有するための設定です。

1. エクスプローラーで `%UserProfile%` を開き、`.wslconfig` というファイルを作る。中身は次のとおり。
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
2. PowerShell で WSL を再起動する。
   ```powershell
   wsl --shutdown
   ```
3. Ubuntu を開き直す。
4. 確認: Ubuntu で `systemctl --user status` がエラーにならなければ OK（OpenClaw が常駐に使う）。
   - エラーになる場合は、`/etc/wsl.conf` に次を書いて、もう一度 `wsl --shutdown` する。
     ```ini
     [boot]
     systemd=true
     ```

## 3. Windows 側に入れるもの
- **Ollama**: https://ollama.com から Windows 版を入れ、起動しておく。
  - NVIDIA の GPU があれば自動で使われる。
- **AivisSpeech**: Windows 版を入れる（音声を試すときに起動）。
- **VS Code**（任意）: 拡張機能「WSL」を入れる。
- ブラウザは Chrome か Edge。

## 4. WSL（Ubuntu）の中で準備する
以降はすべて Ubuntu のターミナルで行う。

```bash
# Node.js 24
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL                       # ターミナルを読み込み直す
fnm install 24 && fnm default 24
node -v                           # v24.x
```
Claude Code は **WSL の中に**入れる: https://docs.claude.com/en/docs/claude-code/overview の Linux / WSL の手順に従う。

## 5. リポジトリを取得してセットアップ
```bash
cd ~                              # 必ず WSL のホームに置く（/mnt/c の下はとても遅く、権限も壊れる）
git clone https://github.com/SFC-Jarvis/Jarvis.git
cd Jarvis
./scripts/setup.sh                # apt のために sudo のパスワードを聞かれる
```

## 6. 開いてみる
```bash
./scripts/dev.sh --mock           # Windows のブラウザで http://localhost:3000 が開けば OK
code .                            # VS Code を WSL モードで開く（任意）
```
以降の使い方（tmux、`/start`、`/done`）は Mac と同じです。docs/SETUP.md の 3・4 を参照してください。

## 注意
- **ファイルは WSL 側（`~/Jarvis`）で編集する。**
  - Windows のエディタで直接開く場合は、VS Code の WSL モードを使う。
  - `\\wsl$\...` をメモ帳などで編集しない。
- **マイクについて**: 音声サービスは WSL の中で動くため、マイクはブラウザから受け取る（WebRTC）。サーバー側で直接マイクを開く方式は使わない（contracts/voice-events.md）。
- **GPU**: NVIDIA なら、Windows に最新のドライバを入れるだけで WSL から CUDA が使える。WSL の中にドライバを入れない。
- **改行**: リポジトリは `.gitattributes` で LF に統一してある。Windows 側で clone しない。

## Windows 10 の場合
ミラーモードが使えないため、WSL から Windows 側の `127.0.0.1` に届きません。
Windows → WSL（ブラウザで localhost:3000 を開く）は動きます。

- **おすすめ**: Ollama も WSL の中に入れる（`curl -fsSL https://ollama.com/install.sh | sh`）。
  - AivisSpeech が必要なのは音声担当だけ。
- **AivisSpeech を Windows 側で使う場合**:
  1. WSL で `ip route show default | awk '{print $3}'` を実行し、Windows の IP を調べる。
  2. `.env.local` の `AIVIS_BASE_URL` をその IP に変える。
  3. Windows のファイアウォールで、WSL からの接続だけを許可する。

## 1 人で Mac と Windows の両方を使う場合
- `./scripts/setup.sh` は PC ごとに実行する（メンバー ID は同じ）。
- **PC を替える前に、必ず `/done` で Push する。**
- 別の PC では `/start` を実行すると、Push 済みの作業ブランチを取ってきて再開する。
- `.env.local` のトークンも PC ごとに設定する。トークンはチャットやリポジトリに貼らない。
