import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderPage } from './progress-page.mjs';
import { createProgressServer, LISTEN_HOST } from './progress-server.mjs';

const task = (over = {}) => ({
  id: 'X-1',
  title: '作業',
  owner: 'C',
  size: 'M',
  status: 'open',
  doneInPrs: [],
  mentionedInPrs: [],
  ...over,
});
const summary = { total: 1, merged: 0, pr: 0, working: 0, open: 1 };
const progress = (over = {}) => ({
  date: '2026-11-05',
  fetchedAt: '2026-11-05 12:00:00',
  current: { id: 'p3', label: '第3回', end: '2026-11-12', goal: '単体で動く', daysLeft: 7 },
  overall: summary,
  periods: [
    {
      id: 'p3',
      label: '第3回',
      end: '2026-11-12',
      goal: '単体で動く',
      isCurrent: true,
      summary,
      tasks: [task()],
    },
  ],
  members: [{ id: 'C', name: 'Sota', summary, tasks: [task()] }],
  prs: [],
  warnings: [],
  ...over,
});

test('タスクの状態を文字で表示する', () => {
  const html = renderPage(
    progress({
      members: [
        {
          id: 'C',
          name: 'Sota',
          summary,
          tasks: [
            task({ id: 'M-1', status: 'merged' }),
            task({ id: 'P-1', status: 'pr', doneInPrs: [11] }),
            task({ id: 'W-1', status: 'working', mentionedInPrs: [12] }),
            task({ id: 'O-1', status: 'open' }),
          ],
        },
      ],
    }),
  );
  for (const label of ['完了（main）', '完了（未マージ）', '作業中（PR あり）', '未完了']) {
    assert.ok(html.includes(label), label);
  }
  assert.ok(html.includes('#11'));
  assert.ok(html.includes('#12'));
  assert.ok(html.includes('残り 7 日'));
});

test('PR のタイトルやタスク名の HTML を無害化する', () => {
  const evil = '<script>alert(1)</script>';
  const html = renderPage(
    progress({
      members: [{ id: 'C', name: evil, summary, tasks: [task({ title: evil })] }],
      prs: [
        {
          number: 1,
          title: evil,
          url: 'https://github.com/o/r/pull/1',
          isDraft: false,
          branch: evil,
          author: evil,
          additions: 0,
          deletions: 0,
        },
      ],
      warnings: [evil],
    }),
  );
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('GitHub 以外の URL はリンクにしない', () => {
  const html = renderPage(
    progress({
      prs: [
        {
          number: 1,
          title: 'PR',
          url: 'javascript:alert(1)',
          isDraft: false,
          branch: 'x',
          author: 'y',
          additions: 0,
          deletions: 0,
        },
      ],
    }),
  );
  assert.ok(!html.includes('javascript:'));
});

test('取得日時と警告を表示する', () => {
  const html = renderPage(progress({ warnings: ['警告の文'] }));
  assert.ok(html.includes('警告の文'));
  assert.ok(html.includes('2026-11-05 12:00:00'));
});

async function withServer(options, fn) {
  const server = createProgressServer(options);
  await new Promise((resolve) => server.listen(0, LISTEN_HOST, resolve));
  const base = `http://${LISTEN_HOST}:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('待ち受けは 127.0.0.1 だけ', () => {
  assert.equal(LISTEN_HOST, '127.0.0.1');
});

test('トップページで進捗の HTML を返す', async () => {
  await withServer({ load: async () => progress() }, async (base) => {
    const res = await fetch(base);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
    assert.ok((await res.text()).includes('第3回'));
  });
});

test('期限内は再取得せず、refresh を付けると再取得する', async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;
    return progress();
  };
  await withServer({ load, ttlMs: 60_000 }, async (base) => {
    await (await fetch(base)).text();
    await (await fetch(base)).text();
    assert.equal(calls, 1);
    await (await fetch(`${base}/?refresh=1`)).text();
    assert.equal(calls, 2);
  });
});

test('取得に失敗したら原因を画面に出さず 500 を返し、次回は取り直す', async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;
    if (calls === 1) throw new Error('秘密の内部情報');
    return progress();
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await withServer({ load }, async (base) => {
      const res = await fetch(base);
      assert.equal(res.status, 500);
      assert.ok(!(await res.text()).includes('秘密の内部情報'));
      assert.equal((await fetch(base)).status, 200);
    });
  } finally {
    console.error = originalError;
  }
});

test('/health は進捗を取得せずに応答する', async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;
    return progress();
  };
  await withServer({ load }, async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal(calls, 0);
  });
});

test('GET 以外は 405、知らないパスは 404 を返す', async () => {
  await withServer({ load: async () => progress() }, async (base) => {
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  });
});

test('Host がローカルでなければ 403 を返す', async () => {
  const { request } = await import('node:http');
  await withServer({ load: async () => progress() }, async (base) => {
    const status = await new Promise((resolve, reject) => {
      const req = request(base, { headers: { Host: 'evil.example' } }, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(status, 403);
  });
});
