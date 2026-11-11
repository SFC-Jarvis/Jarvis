import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildProgress, collectProgress, mergeTaskStatus } from './progress-data.mjs';

const task = (id, over = {}) => ({
  id,
  area: 'integration',
  period: 'p3',
  size: 'M',
  title: `${id} の作業`,
  owner: 'C',
  done: false,
  condition: '',
  ...over,
});

const pr = (number, tasks, body = '') => ({
  number,
  title: `PR ${number}`,
  url: `https://github.com/o/r/pull/${number}`,
  isDraft: true,
  branch: `c/p3-${number}`,
  author: 'someone',
  additions: 1,
  deletions: 0,
  body,
  tasks,
});

const schedule = {
  timezone: 'Asia/Tokyo',
  members: { C: { name: 'Sota' }, A: { name: 'メンバーA' } },
  areas: { integration: { name: '統合', owner: 'C', file: 'docs/tasks/integration.md' } },
  periods: [
    { id: 'p2', label: '第2回', start: '2026-10-16', end: '2026-10-29', goal: '準備' },
    { id: 'p3', label: '第3回', start: '2026-10-30', end: '2026-11-12', goal: '単体で動く' },
  ],
};

test('main で完了したタスクは完了と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1', { done: true })], []);
  assert.equal(t.status, 'merged');
});

test('未マージの PR で完了したタスクは未マージの完了と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(11, [task('X-1', { done: true })])]);
  assert.equal(t.status, 'pr');
  assert.deepEqual(t.doneInPrs, [11]);
});

test('PR の本文に ID があるだけなら作業中と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(12, [task('X-1')], '- [ ] X-1 確認待ち')]);
  assert.equal(t.status, 'working');
  assert.deepEqual(t.mentionedInPrs, [12]);
});

test('ID の一部だけが一致しても作業中にしない', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(12, [], '- [ ] X-10 の話\n- [ ] AX-1 の話')]);
  assert.equal(t.status, 'open');
});

test('本文で今後の予定として触れただけなら作業中にしない', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(12, [], '- メモ: X-1 で減らす予定')]);
  assert.equal(t.status, 'open');
});

test('PR 本文の完了チェックだけでは完了にせず、作業中と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(12, [], '  - [x] X-1 終わった')]);
  assert.equal(t.status, 'working');
});

test('main で完了済みなら PR の状態より優先する', () => {
  const [t] = mergeTaskStatus(
    [task('X-1', { done: true })],
    [pr(11, [task('X-1', { done: true })], 'X-1')],
  );
  assert.equal(t.status, 'merged');
});

test('今の期間と残り日数、メンバーごとの今期のタスクをまとめる', () => {
  const tasks = [
    task('C-1', { done: true }),
    task('C-2', { period: 'p2' }),
    task('A-1', { owner: 'A' }),
    task('ALL-1', { owner: 'all' }),
  ];
  const p = buildProgress({ schedule, mainTasks: tasks, prs: [], date: '2026-11-05' });
  assert.equal(p.current.id, 'p3');
  assert.equal(p.current.daysLeft, 7);
  assert.deepEqual(p.overall, { total: 4, merged: 1, pr: 0, partial: 0, working: 0, open: 3 });
  const c = p.members.find((m) => m.id === 'C');
  assert.deepEqual(
    c.tasks.map((t) => t.id),
    ['C-1', 'ALL-1'],
  );
  assert.deepEqual(
    p.members.map((m) => m.id),
    ['A', 'C'],
  );
  assert.equal(p.periods.find((x) => x.id === 'p3').isCurrent, true);
  assert.equal(p.periods.find((x) => x.id === 'p3').summary.total, 3);
});

test('全員担当のタスクは PR の作者のカードにだけ PR の状況を出す', () => {
  const withGithub = {
    ...schedule,
    members: { C: { name: 'Sota', github: 'sota' }, A: { name: 'メンバーA', github: '' } },
  };
  const shared = task('ALL-1', { owner: 'all' });
  const mine = { ...pr(11, [], '- [ ] ALL-1 確認待ち'), author: 'sota' };
  const p = buildProgress({
    schedule: withGithub,
    mainTasks: [shared],
    prs: [mine],
    date: '2026-11-05',
  });
  const status = (id) => p.members.find((m) => m.id === id).tasks[0].status;
  assert.equal(status('C'), 'working');
  assert.equal(status('A'), 'open');
  assert.deepEqual(p.members.find((m) => m.id === 'A').tasks[0].mentionedInPrs, []);
  assert.equal(p.overall.working, 1);
});

// git と gh の代わりに、呼び出しに応じた結果を返す
function fakeRun(files, prs, fail = {}) {
  return async (cmd, args) => {
    if (cmd === 'git' && args[0] === 'fetch') {
      if (fail.fetch) throw new Error('fetch できない');
      return '';
    }
    if (cmd === 'git' && args[0] === 'show') {
      if (!(args[1] in files)) throw new Error('ファイルがない');
      return files[args[1]];
    }
    if (cmd === 'gh') {
      if (fail.gh) throw new Error('gh できない');
      return JSON.stringify(prs);
    }
    throw new Error(`想定外の呼び出し: ${cmd}`);
  };
}

const OID = 'a'.repeat(40);
const ghPr = {
  number: 11,
  title: 'PR',
  url: 'https://github.com/o/r/pull/11',
  isDraft: true,
  headRefName: 'c/p3-x',
  headRefOid: OID,
  author: { login: 'someone' },
  additions: 3,
  deletions: 1,
  body: '',
};
const md = (mark) => `## p3 第3回\n- [${mark}] X-1 [M] 作る\n`;
const baseFiles = {
  'origin/main:docs/schedule.json': JSON.stringify(schedule),
  'origin/main:docs/tasks/integration.md': md(' '),
  [`${OID}:docs/tasks/integration.md`]: md('x'),
};
const clock = { date: () => '2026-11-05', now: () => new Date('2026-11-05T03:00:00Z') };

test('main と PR の先頭コミットのタスクを読み、未マージの完了を反映する', async () => {
  const p = await collectProgress({ run: fakeRun(baseFiles, [ghPr]), ...clock });
  assert.equal(p.overall.pr, 1);
  assert.deepEqual(p.warnings, []);
  assert.equal(p.prs[0].branch, 'c/p3-x');
  assert.equal(p.prs[0].author, 'someone');
  assert.equal(p.fetchedAt, '2026-11-05 12:00:00');
});

test('fetch に失敗しても手元の情報で表示し、警告を出す', async () => {
  const p = await collectProgress({
    run: fakeRun(baseFiles, [ghPr], { fetch: true }),
    ...clock,
  });
  assert.equal(p.overall.pr, 1);
  assert.equal(p.warnings.length, 1);
  assert.match(p.warnings[0], /最新/);
});

test('gh が使えなければ main の情報だけで表示し、警告を出す', async () => {
  const p = await collectProgress({ run: fakeRun(baseFiles, [], { gh: true }), ...clock });
  assert.equal(p.overall.open, 1);
  assert.deepEqual(p.prs, []);
  assert.match(p.warnings[0], /gh auth login/);
});

test('先頭コミットの形がおかしい PR は読まずに警告を出す', async () => {
  const run = fakeRun(baseFiles, [{ ...ghPr, headRefOid: '--output=/tmp/x' }]);
  const p = await collectProgress({ run, ...clock });
  assert.equal(p.overall.pr, 0);
  assert.match(p.warnings[0], /#11/);
});

test('PR のタスクファイルを読めなければ警告を出す', async () => {
  const run = fakeRun({ ...baseFiles, [`${OID}:docs/tasks/integration.md`]: undefined }, [ghPr]);
  const onlyMain = async (cmd, args) => {
    if (cmd === 'git' && args[0] === 'show' && args[1].startsWith(OID)) throw new Error('ない');
    return run(cmd, args);
  };
  const p = await collectProgress({ run: onlyMain, ...clock });
  assert.equal(p.overall.pr, 0);
  assert.match(p.warnings[0], /#11/);
});

test('schedule を読めなければエラーにする', async () => {
  await assert.rejects(collectProgress({ run: fakeRun({}, []), ...clock }));
});

test('main で [~] のタスクは部分的に完了と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1', { partial: true })], []);
  assert.equal(t.status, 'partial');
});

test('未マージの PR で [~] のタスクは部分的に完了と判定する', () => {
  const [t] = mergeTaskStatus([task('X-1')], [pr(7, [task('X-1', { partial: true })])]);
  assert.equal(t.status, 'partial');
  assert.deepEqual(t.partialInPrs, [7]);
});

test('main で [~] でも、未マージの PR で [x] なら未マージの完了を優先する', () => {
  const [t] = mergeTaskStatus(
    [task('X-1', { partial: true })],
    [pr(8, [task('X-1', { done: true })])],
  );
  assert.equal(t.status, 'pr');
});

test('集計に部分的に完了の件数を含める', () => {
  const p = buildProgress({
    schedule,
    mainTasks: [task('X-1', { partial: true }), task('X-2', { done: true })],
    prs: [],
    date: '2026-11-05',
    fetchedAt: 'now',
  });
  assert.equal(p.overall.partial, 1);
  assert.equal(p.overall.merged, 1);
});
