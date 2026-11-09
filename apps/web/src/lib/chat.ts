/**
 * 画面側の会話のデータと、/api/chat の呼び出し。
 * ブラウザから使う。OpenClaw のトークンは扱わない（サーバー側の /api/chat が持つ）。
 */

export type Role = 'user' | 'assistant';

export type Message = { id: string; role: Role; content: string; createdAt: string };

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
};

export const TITLE_MAX = 20;
const UNTITLED = '新しい会話';

/** 最初の発言から会話のタイトルを作る（空白をまとめて先頭 20 文字） */
export function makeTitle(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat === '' ? UNTITLED : Array.from(flat).slice(0, TITLE_MAX).join('');
}

/** 会話 1 つにセッションキー 1 つ（contracts/openclaw.md） */
export function sessionKeyOf(conversationId: string): string {
  return `web:${conversationId}`;
}

export function createConversation(id: string, now: Date): Conversation {
  return { id, title: UNTITLED, messages: [], updatedAt: now.toISOString() };
}

export function createMessage(id: string, role: Role, content: string, now: Date): Message {
  return { id, role, content, createdAt: now.toISOString() };
}

/** 返答を受け取れなかったとき。message は開発者向けの原因 */
export class ChatRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatRequestError';
  }
}

type ChatResponse = { reply?: unknown; error?: unknown };

/** 会話のメッセージをすべて /api/chat に送り、返答の文字列を返す */
export async function sendChat(
  conversation: Conversation,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  let res: Response;
  try {
    res = await fetchFn('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversation.messages.map(({ role, content }) => ({ role, content })),
        sessionKey: sessionKeyOf(conversation.id),
      }),
    });
  } catch (e) {
    throw new ChatRequestError(`/api/chat に接続できません: ${String(e)}`);
  }

  const data = (await res.json().catch(() => ({}))) as ChatResponse;
  if (!res.ok) {
    const detail = typeof data.error === 'string' ? data.error : '';
    throw new ChatRequestError(`/api/chat が ${res.status} を返しました ${detail}`.trim());
  }
  if (typeof data.reply !== 'string') throw new ChatRequestError('返答の形式が想定と違います');
  return data.reply;
}
