import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  daysUntil,
  findPeriod,
  fmtTask,
  isMine,
  loadSchedule,
  loadTasks,
  parseTasks,
  progressCell,
} from './jarvis.mjs';

const s = loadSchedule();

test('日付から期間を決める（発表日はその期間に含む）', () => {
  assert.equal(findPeriod(s, '2026-10-29').id, 'p2');
  assert.equal(findPeriod(s, '2026-10-30').id, 'p3');
  assert.equal(findPeriod(s, '2026-11-26').id, 'p4');
  assert.equal(findPeriod(s, '2027-01-21').id, 'final');
  assert.equal(findPeriod(s, '2026-09-01').id, 'p1');
  assert.equal(findPeriod(s, '2027-03-01').id, 'final');
});

test('期間が隙間なく連続している', () => {
  for (let i = 1; i < s.periods.length; i++) {
    assert.equal(daysUntil(s.periods[i - 1].end, s.periods[i].start), 1, s.periods[i].id);
  }
});

test('タスクの書式を読める', () => {
  const md = [
    '## p3 第3回',
    '- [ ] X-1 [M] 作る @A',
    '  - 完了条件: 動く',
    '- [x] X-2 [S] 確認する',
  ].join('\n');
  const ts = parseTasks(md, 'qa', 'all');
  assert.deepEqual(
    ts.map((t) => [t.id, t.size, t.owner, t.done, t.condition]),
    [
      ['X-1', 'M', 'A', false, '動く'],
      ['X-2', 'S', 'all', true, ''],
    ],
  );
  assert.ok(isMine(ts[1], 'B'));
  assert.ok(!isMine(ts[0], 'B'));
});

test('docs/tasks の全タスクが読め、ID が重複しない', () => {
  const ts = loadTasks(s);
  assert.ok(ts.length > 30);
  const ids = ts.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of ts)
    assert.ok(
      s.periods.some((p) => p.id === t.period),
      t.id,
    );
});

test('[~] は部分的に完了として読み、残りの作業も読む', () => {
  const md = [
    '## p3 第3回',
    '- [~] X-1 [M] 作る',
    '  - 完了条件: 全員で確認した',
    '  - 残り: A・B の確認',
  ].join('\n');
  const [t] = parseTasks(md, 'qa', 'C');
  assert.equal(t.done, false);
  assert.equal(t.partial, true);
  assert.equal(t.condition, '全員で確認した');
  assert.equal(t.remaining, 'A・B の確認');
});

test('[ ] と [x] は部分的に完了にならない', () => {
  const md = ['## p3 第3回', '- [ ] X-1 [M] 作る', '- [x] X-2 [S] 確認する'].join('\n');
  assert.deepEqual(
    parseTasks(md, 'qa', 'C').map((t) => t.partial),
    [false, false],
  );
});

test('部分的に完了のタスクは [~] と残りの作業を表示する', () => {
  const t = {
    area: 'qa',
    id: 'X-1',
    size: 'M',
    title: '作る',
    owner: 'C',
    done: false,
    partial: true,
    condition: '動く',
    remaining: 'A の確認',
  };
  const out = fmtTask(t, { areas: { qa: { name: '品質保証' } } });
  assert.match(out, /- \[~\] X-1 \[M\]/);
  assert.match(out, /残り: A の確認/);
});

test('進捗表のセルに部分的に完了の件数を添える', () => {
  assert.equal(progressCell([{ done: true }, { partial: true }, {}]), '1/3（部分 1）');
  assert.equal(progressCell([{ done: true }, {}]), '1/2');
  assert.equal(progressCell([]), '—');
});
