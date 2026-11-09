import {
  ChatRequestError,
  type Conversation,
  createConversation,
  createMessage,
  makeTitle,
  sendChat,
  sessionKeyOf,
} from './chat';

const NOW = new Date('2026-11-10T08:41:00+09:00');

const conversationWith = (text: string): Conversation => ({
  ...createConversation('c1', NOW),
  messages: [createMessage('m1', 'user', text, NOW)],
});

describe('makeTitle', () => {
  it('最初の発言の先頭 20 文字をタイトルにする', () => {
    expect(makeTitle('あいうえおかきくけこさしすせそたちつてとなにぬねの')).toBe(
      'あいうえおかきくけこさしすせそたちつてと',
    );
  });

  it('改行や連続した空白は 1 つの空白にまとめる', () => {
    expect(makeTitle('  今日の\n\n予定   は？ ')).toBe('今日の 予定 は？');
  });

  it('空なら「新しい会話」', () => {
    expect(makeTitle('   ')).toBe('新しい会話');
  });
});

describe('会話とメッセージ', () => {
  it('会話ごとのセッションキーは web:<会話ID>', () => {
    expect(sessionKeyOf('abc')).toBe('web:abc');
  });

  it('新しい会話はメッセージが空でタイトルは「新しい会話」', () => {
    const c = createConversation('c1', NOW);
    expect(c).toEqual({
      id: 'c1',
      title: '新しい会話',
      messages: [],
      updatedAt: NOW.toISOString(),
    });
  });
});

describe('sendChat', () => {
  it('/api/chat に会話のメッセージとセッションキーを送り、返答を返す', async () => {
    const fetchFn = vi.fn().mockResolvedValue(Response.json({ reply: '予定は 2 件です' }));
    const reply = await sendChat(conversationWith('今日の予定は？'), fetchFn);

    expect(reply).toBe('予定は 2 件です');
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/chat');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      messages: [{ role: 'user', content: '今日の予定は？' }],
      sessionKey: 'web:c1',
    });
  });

  it('エラーの返事なら ChatRequestError を投げる', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(Response.json({ error: 'OpenClaw が 500 を返しました' }, { status: 502 }));
    await expect(sendChat(conversationWith('こんにちは'), fetchFn)).rejects.toThrow(
      ChatRequestError,
    );
  });

  it('返答の形が違えば ChatRequestError を投げる', async () => {
    const fetchFn = vi.fn().mockResolvedValue(Response.json({ foo: 1 }));
    await expect(sendChat(conversationWith('こんにちは'), fetchFn)).rejects.toThrow(
      ChatRequestError,
    );
  });

  it('通信そのものに失敗しても ChatRequestError を投げる', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(sendChat(conversationWith('こんにちは'), fetchFn)).rejects.toThrow(
      ChatRequestError,
    );
  });
});
