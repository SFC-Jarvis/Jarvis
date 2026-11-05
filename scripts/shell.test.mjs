import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './jarvis.mjs';

// macOS 標準の bash 3.2 は、"$VAR（" のように変数の直後に日本語が続くと変数名を誤認して止まる。
// 変数の直後に ASCII 以外の文字が続く場合は ${VAR} と書く。
test('シェルスクリプトで変数の直後に日本語を続けていない', () => {
  const dir = join(ROOT, 'scripts');
  const bad = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sh'))) {
    readFileSync(join(dir, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/\$[A-Za-z_]\w*\P{ASCII}/u.test(line)) bad.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(bad, []);
});

test('dev.sh は進捗ページを最後に足し、claude を前面のままにする', () => {
  const dev = readFileSync(join(ROOT, 'scripts/dev.sh'), 'utf8');
  assert.match(dev, /tmux new-window -d -t "\$SESSION" -n progress/);
  assert.ok(dev.indexOf('-n claude') < dev.indexOf('-n progress'));
});

// dev.sh を一時フォルダーに写し、外部コマンドを偽物に差し替えて動かす（本物の tmux や通信は使わない）
function devSandbox() {
  const root = mkdtempSync(join(tmpdir(), 'jarvis-dev-'));
  const bin = join(root, 'fakebin');
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'node_modules'));
  mkdirSync(bin);
  copyFileSync(join(ROOT, 'scripts/dev.sh'), join(root, 'scripts/dev.sh'));
  writeFileSync(join(root, 'scripts/jarvis.mjs'), '');
  writeFileSync(join(root, '.env.local'), '');
  const fake = (name, body) =>
    writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`, { mode: 0o755 });
  fake(
    'tmux',
    `echo "$*" >> "$FAKE_DIR/tmux.log"
case "$*" in
  *has-session*) [ -f "$FAKE_DIR/running" ] ;;
  *new-session*) touch "$FAKE_DIR/running" ;;
  *attach*) [ -z "$FAKE_STOP_ON_ATTACH" ] || rm -f "$FAKE_DIR/running" ;;
esac`,
  );
  fake('curl', 'exit 1');
  fake('sleep', 'exit 0');
  // git は偽物にしない: Windows の Git Bash は自分の git を PATH の先頭に足すため、偽物が使われない
  // 一時フォルダーを本物のリポジトリにする。中のファイルは未追跡なので「未コミットの変更あり」になる
  // GIT_DIR などを消す: git のフックから動いたときに、開発中のリポジトリを触らないように
  const gitEnv = { GIT_DIR: undefined, GIT_WORK_TREE: undefined, GIT_INDEX_FILE: undefined };
  const init = spawnSync('git', ['init', '-q'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...gitEnv },
  });
  assert.equal(init.status, 0, init.stderr);
  const run = (args, env = {}) =>
    spawnSync('bash', [join(root, 'scripts/dev.sh'), ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...gitEnv,
        PATH: `${bin}:${process.env.PATH}`,
        FAKE_DIR: root,
        ...env,
      },
    });
  const log = () => readFileSync(join(root, 'tmux.log'), 'utf8');
  return { root, run, log, markRunning: () => writeFileSync(join(root, 'running'), '') };
}

test('dev.sh install で、別のフォルダーからも dev.sh で起動できるファイルを置く', () => {
  const { root, run } = devSandbox();
  const binDir = join(root, 'localbin');
  const res = run(['install'], { JARVIS_BIN_DIR: binDir });
  assert.equal(res.status, 0, res.stderr);
  // bash から実行する: Windows の Node は #! で始まるファイルを直接実行できない
  const launched = spawnSync('bash', ['-c', './dev.sh --help'], {
    cwd: binDir,
    encoding: 'utf8',
  });
  assert.equal(launched.status, 0, launched.stderr);
  assert.match(launched.stdout, /開発環境を開く/);
  assert.equal(run(['install'], { JARVIS_BIN_DIR: binDir }).status, 0);
});

test('dev.sh install は同じ名前の別のファイルを上書きしない', () => {
  const { root, run } = devSandbox();
  const binDir = join(root, 'localbin');
  mkdirSync(binDir);
  writeFileSync(join(binDir, 'dev.sh'), '#!/bin/bash\necho other\n');
  const res = run(['install'], { JARVIS_BIN_DIR: binDir });
  assert.notEqual(res.status, 0);
  assert.equal(readFileSync(join(binDir, 'dev.sh'), 'utf8'), '#!/bin/bash\necho other\n');
});

test('dev.sh install は置き場所が PATH になければ足し方を案内する', () => {
  const { root, run } = devSandbox();
  const res = run(['install'], { JARVIS_BIN_DIR: join(root, 'localbin') });
  assert.match(res.stdout, /PATH/);
});

test('新しく起動すると、jarvis セッションだけで効く停止キーを登録する', () => {
  const { run, log } = devSandbox();
  const res = run(['--no-browser']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(
    log(),
    /bind-key X if-shell -F #\{==:#\{session_name\},jarvis\} confirm-before .*kill-session/,
  );
});

test('起動中のセッションに戻るときも停止キーを登録する', () => {
  const { run, log, markRunning } = devSandbox();
  markRunning();
  const res = run([]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(log(), /bind-key X /);
  assert.match(log(), /attach -t jarvis/);
});

test('tmux の中で停止すると、停止の知らせと未コミットの注意を出す', () => {
  const { run, markRunning } = devSandbox();
  markRunning();
  const res = run([], { FAKE_STOP_ON_ATTACH: '1' });
  assert.match(res.stdout, /停止しました/);
  assert.match(res.stdout, /未コミットの変更があります/);
});

test('tmux から抜けただけなら、停止したとは表示しない', () => {
  const { run, markRunning } = devSandbox();
  markRunning();
  const res = run([]);
  assert.doesNotMatch(res.stdout, /停止しました/);
  assert.match(res.stdout, /dev\.sh stop/);
});
