import { type ChatMessage, chat, loadOpenClawConfig, OpenClawError } from '@/lib/openclaw';

// POST /api/chat  { messages: ChatMessage[], sessionKey: string } -> { reply: string }
export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: ChatMessage[]; sessionKey?: string };
  if (!Array.isArray(body.messages) || typeof body.sessionKey !== 'string') {
    return Response.json({ error: 'messages と sessionKey が必要です' }, { status: 400 });
  }
  try {
    const reply = await chat(body.messages, body.sessionKey, loadOpenClawConfig());
    return Response.json({ reply });
  } catch (e) {
    const status = e instanceof OpenClawError ? 502 : 500;
    return Response.json({ error: e instanceof Error ? e.message : '不明なエラー' }, { status });
  }
}
