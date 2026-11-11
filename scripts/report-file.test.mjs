import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { downloadsDir, reportFileName, reportPath } from './report-file.mjs';

const schedule = {
  timezone: 'Asia/Tokyo',
  periods: [
    { id: 'p3', label: '第3回', start: '2026-10-30', end: '2026-11-12' },
    { id: 'p4', label: '第4回', start: '2026-11-13', end: '2026-12-03' },
  ],
  members: { C: { name: 'Sota' }, A: { name: 'メンバーA' } },
};

test('ファイル名は発表日・メンバー ID・名前にする', () => {
  assert.equal(
    reportFileName({ date: '2026-11-12', memberId: 'C', memberName: 'Sota' }),
    '2026-11-12_C_Sota.md',
  );
});

test('all のときは全員分のファイル名にする', () => {
  assert.equal(reportFileName({ date: '2026-11-12', all: true }), '2026-11-12_全員.md');
});

test('名前の空白やファイル名に使えない文字は - に置き換える', () => {
  assert.equal(
    reportFileName({ date: '2026-11-12', memberId: 'B', memberName: 'Taro Yamada/Dev:1' }),
    '2026-11-12_B_Taro-Yamada-Dev-1.md',
  );
});

test('名前がなければ ID だけにする', () => {
  assert.equal(reportFileName({ date: '2026-11-12', memberId: 'A' }), '2026-11-12_A.md');
});

test('Mac はホームの Downloads を使う', () => {
  const dir = downloadsDir({
    platform: 'darwin',
    env: {},
    home: '/Users/sota',
    exists: () => true,
  });
  assert.equal(dir, join('/Users/sota', 'Downloads'));
});

test('WSL は Windows 側のユーザーの Downloads を使う', () => {
  const calls = [];
  const run = (cmd, args) => {
    calls.push(cmd);
    if (cmd === 'cmd.exe') return 'C:\\Users\\sota\r\n';
    if (cmd === 'wslpath') return `/mnt/c/Users/sota\n`;
    throw new Error('unexpected');
  };
  const dir = downloadsDir({
    platform: 'linux',
    env: { WSL_DISTRO_NAME: 'Ubuntu' },
    home: '/home/sota',
    exists: () => true,
    run,
  });
  assert.equal(dir, join('/mnt/c/Users/sota', 'Downloads'));
  assert.deepEqual(calls, ['cmd.exe', 'wslpath']);
});

test('WSL で Windows 側が分からなければ Linux のホームを試す', () => {
  const dir = downloadsDir({
    platform: 'linux',
    env: { WSL_DISTRO_NAME: 'Ubuntu' },
    home: '/home/sota',
    exists: (p) => p === join('/home/sota', 'Downloads'),
    run: () => {
      throw new Error('cmd.exe がない');
    },
  });
  assert.equal(dir, join('/home/sota', 'Downloads'));
});

test('Downloads が見つからなければ null を返す', () => {
  const dir = downloadsDir({ platform: 'linux', env: {}, home: '/home/x', exists: () => false });
  assert.equal(dir, null);
});

test('保存先は今の期間の発表日と自分の名前で決まる', () => {
  const r = reportPath({
    schedule,
    date: '2026-11-11',
    memberId: 'C',
    all: false,
    root: '/repo',
    dir: '/Users/sota/Downloads',
  });
  assert.equal(r.path, join('/Users/sota/Downloads', '2026-11-12_C_Sota.md'));
  assert.equal(r.fallback, false);
});

test('Downloads がなければリポジトリの reports/ に保存する', () => {
  const r = reportPath({
    schedule,
    date: '2026-11-20',
    memberId: 'A',
    all: false,
    root: '/repo',
    dir: null,
  });
  assert.equal(r.path, join('/repo', 'reports', '2026-12-03_A_メンバーA.md'));
  assert.equal(r.fallback, true);
});

test('メンバーが未設定ならエラー', () => {
  assert.throws(
    () =>
      reportPath({
        schedule,
        date: '2026-11-11',
        memberId: null,
        all: false,
        root: '/r',
        dir: '/d',
      }),
    /setup\.sh/,
  );
});
