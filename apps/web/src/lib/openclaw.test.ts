import { chat, loadOpenClawConfig, OpenClawError } from './openclaw';

const real = { baseUrl: 'http://gw.test', token: 't0k', mock: false };

describe('loadOpenClawConfig', () => {
  it('環境変数がなければ既定値を使う', () => {
    expect(loadOpenClawConfig({})).toEqual({
      baseUrl: 'http://127.0.0.1:18789',
      token: '',
      mock: false,
    });
  });
  it('JARVIS_MOCK=1 でモックになる', () => {
    expect(loadOpenClawConfig({ JARVIS_MOCK: '1' }).mock).toBe(true);
  });
});

describe('chat', () => {
  it('モックでは通信せずに返す', async () => {
    const fetchFn = vi.fn();
    const out = await chat(
      [{ role: 'user', content: 'こんにちは' }],
      's1',
      { ...real, mock: true },
      fetchFn,
    );
    expect(out).toContain('こんにちは');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('トークンとセッションキーを付けて送る', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'はい' } }] }), {
        status: 200,
      }),
    );
    const out = await chat([{ role: 'user', content: 'hi' }], 'session-1', real, fetchFn);
    expect(out).toBe('はい');
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://gw.test/v1/chat/completions');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer t0k',
      'x-openclaw-session-key': 'session-1',
    });
  });

  it('トークンがなければエラー', async () => {
    await expect(chat([], 's', { ...real, token: '' }, vi.fn())).rejects.toBeInstanceOf(
      OpenClawError,
    );
  });

  it('HTTP エラーをステータス付きで投げる', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    await expect(chat([], 's', real, fetchFn)).rejects.toMatchObject({ status: 401 });
  });

  it('形式が違う返答はエラー', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(chat([], 's', real, fetchFn)).rejects.toThrow('形式');
  });
});
