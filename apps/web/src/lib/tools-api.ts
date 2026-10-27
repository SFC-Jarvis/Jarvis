/**
 * services/tools の HTTP API クライアント。
 * 型は contracts/tools-api.json から自動生成（pnpm gen:contracts）。手で型を書かないこと。
 */
import type { components } from './generated/tools-api';

export type Health = components['schemas']['Health'];

export function toolsBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return `http://127.0.0.1:${env.JARVIS_TOOLS_PORT ?? '8700'}`;
}

export async function getHealth(baseUrl: string, fetchFn: typeof fetch = fetch): Promise<Health> {
  const res = await fetchFn(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`tools API が ${res.status} を返しました`);
  return (await res.json()) as Health;
}
