import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ask, loadCheckConfig, mergeEnv, OpenClawCheckError, runCheck } from './openclaw-check.mjs';

const config = { baseUrl: 'http://127.0.0.1:18789', token: 'secret-token' };

/** 送られたリクエストを記録し、決まった返答を順に返す fetch のモック */
function fakeFetch(replies, status = 200) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const content = replies[calls.length - 1] ?? '';
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
  };
  return { fn, calls };
}

test('トークンがなければエラー', () => {
  assert.throws(() => loadCheckConfig({ OPENCLAW_GATEWAY_TOKEN: '' }), OpenClawCheckError);
});

test('設定は環境変数から読み、URL の既定は 127.0.0.1:18789', () => {
  assert.deepEqual(loadCheckConfig({ OPENCLAW_GATEWAY_TOKEN: 't' }), {
    baseUrl: 'http://127.0.0.1:18789',
    token: 't',
  });
  assert.equal(
    loadCheckConfig({ OPENCLAW_GATEWAY_TOKEN: 't', OPENCLAW_BASE_URL: 'http://127.0.0.1:1/' })
      .baseUrl,
    'http://127.0.0.1:1',
  );
});

test('環境変数が空なら .env.local の値を使い、空でなければ環境変数を優先する', () => {
  const file = { OPENCLAW_GATEWAY_TOKEN: 'from-file', OPENCLAW_BASE_URL: 'http://127.0.0.1:1' };
  assert.equal(mergeEnv(file, { OPENCLAW_GATEWAY_TOKEN: '' }).OPENCLAW_GATEWAY_TOKEN, 'from-file');
  assert.equal(
    mergeEnv(file, { OPENCLAW_GATEWAY_TOKEN: 'from-shell' }).OPENCLAW_GATEWAY_TOKEN,
    'from-shell',
  );
  assert.equal(mergeEnv(file, {}).OPENCLAW_BASE_URL, 'http://127.0.0.1:1');
});

test('3 往復すべてに同じセッションキーとトークンが付く', async () => {
  const { fn, calls } = fakeFetch(['はい', '2', 'みかんです']);
  await runCheck(config, 'check:1', fn);
  assert.equal(calls.length, 3);
  for (const c of calls) {
    assert.equal(c.url, 'http://127.0.0.1:18789/v1/chat/completions');
    assert.equal(c.init.headers['x-openclaw-session-key'], 'check:1');
    assert.equal(c.init.headers.Authorization, 'Bearer secret-token');
    assert.equal(c.body.model, 'openclaw/default');
  }
});

test('毎回の送信は今の発言 1 つだけ（会話の記憶は OpenClaw 側に任せる）', async () => {
  const { fn, calls } = fakeFetch(['はい', '2', 'みかんです']);
  await runCheck(config, 'check:1', fn);
  for (const c of calls) assert.equal(c.body.messages.length, 1);
});

test('3 回目の返答に合言葉があれば、話が続いていると判定する', async () => {
  const ok = await runCheck(config, 'k', fakeFetch(['はい', '2', '合言葉はみかんです']).fn);
  assert.equal(ok.remembered, true);
  assert.equal(ok.turns.length, 3);
  const ng = await runCheck(config, 'k', fakeFetch(['はい', '2', '覚えていません']).fn);
  assert.equal(ng.remembered, false);
});

test('401 ならトークンの確認を促し、メッセージにトークンを含めない', async () => {
  await assert.rejects(
    ask(config, 'k', 'こんにちは', fakeFetch([], 401).fn),
    (e) =>
      e instanceof OpenClawCheckError &&
      /トークン/.test(e.message) &&
      !e.message.includes('secret-token'),
  );
});

test('接続できなければ Gateway の起動を促す', async () => {
  const refused = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(
    ask(config, 'k', 'こんにちは', refused),
    (e) => e instanceof OpenClawCheckError && /起動/.test(e.message),
  );
});

test('返答の形が違えばエラー', async () => {
  const odd = async () => new Response('{}', { status: 200 });
  await assert.rejects(ask(config, 'k', 'こんにちは', odd), OpenClawCheckError);
});

test('その他のエラーは OpenClaw のエラー文を添える', async () => {
  const bad = async () =>
    new Response(JSON.stringify({ error: { message: 'model not supported' } }), { status: 400 });
  await assert.rejects(
    ask(config, 'k', 'こんにちは', bad),
    (e) =>
      e instanceof OpenClawCheckError &&
      /400/.test(e.message) &&
      /model not supported/.test(e.message),
  );
});

test('各往復のトークン数（usage）と所要時間を記録する', async () => {
  let t = 0;
  const clock = () => {
    t += 500;
    return t;
  };
  const fn = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: 'みかん' } }],
        usage: { prompt_tokens: 9000, completion_tokens: 5, total_tokens: 9005 },
      }),
    );
  const r = await runCheck(config, 'k', fn, clock);
  assert.equal(r.turns[0].ms, 500);
  assert.deepEqual(r.turns[0].usage, { prompt: 9000, completion: 5 });
});

test('usage がない返事でも動き、トークン数は null にする', async () => {
  const r = await runCheck(config, 'k', fakeFetch(['はい', '2', 'みかん']).fn);
  assert.equal(r.turns[0].usage, null);
  assert.equal(r.remembered, true);
});
