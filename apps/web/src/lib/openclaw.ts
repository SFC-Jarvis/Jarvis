/**
 * OpenClaw Gateway（OpenAI 互換 /v1/chat/completions）のクライアント。
 * サーバー側（Route Handler）からのみ使う。トークンをブラウザに渡さないこと。
 * 仕様: contracts/openclaw.md
 */

export type ChatRole = 'system' | 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

export type OpenClawConfig = {
  baseUrl: string;
  token: string;
  mock: boolean;
};

export function loadOpenClawConfig(
  env: Record<string, string | undefined> = process.env,
): OpenClawConfig {
  return {
    baseUrl: env.OPENCLAW_BASE_URL ?? 'http://127.0.0.1:18789',
    token: env.OPENCLAW_GATEWAY_TOKEN ?? '',
    mock: env.JARVIS_MOCK === '1',
  };
}

export class OpenClawError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'OpenClawError';
  }
}

type CompletionResponse = { choices?: { message?: { content?: string } }[] };

/** 1 回分の返答を取得する（ストリーミングは担当者が追加する） */
export async function chat(
  messages: ChatMessage[],
  sessionKey: string,
  config: OpenClawConfig,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (config.mock) {
    const last = messages.at(-1)?.content ?? '';
    return `（モック）「${last}」を受け取りました`;
  }
  if (!config.token) throw new OpenClawError('OPENCLAW_GATEWAY_TOKEN が未設定です');

  const res = await fetchFn(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'x-openclaw-session-key': sessionKey,
    },
    body: JSON.stringify({ model: 'openclaw/default', messages }),
  });
  if (!res.ok) throw new OpenClawError(`OpenClaw が ${res.status} を返しました`, res.status);

  const data = (await res.json()) as CompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new OpenClawError('返答の形式が想定と違います');
  return content;
}
