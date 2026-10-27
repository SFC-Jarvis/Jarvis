import { getHealth, toolsBaseUrl } from './tools-api';

describe('tools-api', () => {
  it('ポートを環境変数から決める', () => {
    expect(toolsBaseUrl({})).toBe('http://127.0.0.1:8700');
    expect(toolsBaseUrl({ JARVIS_TOOLS_PORT: '9000' })).toBe('http://127.0.0.1:9000');
  });

  it('health を返す', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(Response.json({ status: 'ok', version: '0.1.0' }, { status: 200 }));
    await expect(getHealth('http://t', fetchFn)).resolves.toEqual({
      status: 'ok',
      version: '0.1.0',
    });
    expect(fetchFn).toHaveBeenCalledWith('http://t/health');
  });

  it('エラーを投げる', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
    await expect(getHealth('http://t', fetchFn)).rejects.toThrow('500');
  });
});
