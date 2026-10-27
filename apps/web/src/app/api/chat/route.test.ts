import { POST } from './route';

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify(body) }));

describe('POST /api/chat', () => {
  beforeEach(() => vi.stubEnv('JARVIS_MOCK', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('入力が足りなければ 400', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('モックの返答を返す', async () => {
    const res = await post({ messages: [{ role: 'user', content: 'テスト' }], sessionKey: 's' });
    expect(res.status).toBe(200);
    expect((await res.json()).reply).toContain('テスト');
  });

  it('OpenClaw のエラーは 502', async () => {
    vi.stubEnv('JARVIS_MOCK', '0');
    vi.stubEnv('OPENCLAW_GATEWAY_TOKEN', '');
    const res = await post({ messages: [], sessionKey: 's' });
    expect(res.status).toBe(502);
  });
});
