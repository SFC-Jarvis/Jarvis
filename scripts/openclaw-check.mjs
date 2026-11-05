#!/usr/bin/env node
// OpenClaw Gateway に同じセッションキーで 3 往復話しかけ、会話が続くかを確かめる（INT-3-1）。
// 使い方: node scripts/openclaw-check.mjs   （.env.local の OPENCLAW_BASE_URL・OPENCLAW_GATEWAY_TOKEN を使う）
// 仕様: contracts/openclaw.md
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SECRET_WORD = 'みかん';
const QUESTIONS = [
  `合言葉は「${SECRET_WORD}」です。覚えておいて、短く返事だけしてください。`,
  '1 + 1 の答えを数字だけで答えてください。',
  '最初に伝えた合言葉は何でしたか？合言葉だけで答えてください。',
];

export class OpenClawCheckError extends Error {
  name = 'OpenClawCheckError';
}

/** .env.local の値に、空でない環境変数を上書きする（空の環境変数がファイルの値を隠さないように） */
export function mergeEnv(fileEnv, procEnv) {
  const set = Object.entries(procEnv).filter(([, v]) => v);
  return { ...fileEnv, ...Object.fromEntries(set) };
}

export function loadCheckConfig(env = process.env) {
  const token = env.OPENCLAW_GATEWAY_TOKEN ?? '';
  if (!token) {
    throw new OpenClawCheckError(
      '.env.local の OPENCLAW_GATEWAY_TOKEN が空です（openclaw/README.md の手順で設定）',
    );
  }
  const baseUrl = (env.OPENCLAW_BASE_URL || 'http://127.0.0.1:18789').replace(/\/+$/, '');
  return { baseUrl, token };
}

/** 1 回分の発言を送り、返答の本文を返す。会話の履歴はセッションキーで OpenClaw 側が持つ */
export async function ask(config, sessionKey, content, fetchFn = fetch) {
  let res;
  try {
    res = await fetchFn(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'x-openclaw-session-key': sessionKey,
      },
      body: JSON.stringify({ model: 'openclaw/default', messages: [{ role: 'user', content }] }),
    });
  } catch {
    throw new OpenClawCheckError(
      `OpenClaw（${config.baseUrl}）に接続できません。Gateway が起動しているか確認してください（openclaw gateway status）`,
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new OpenClawCheckError(
      `OpenClaw が ${res.status} を返しました。.env.local のトークンが Gateway の設定と一致しているか確認してください`,
    );
  }
  if (res.status === 404) {
    throw new OpenClawCheckError(
      'OpenClaw が 404 を返しました。gateway.http.endpoints.chatCompletions.enabled が true か確認してください',
    );
  }
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b) => b.error?.message ?? '')
      .catch(() => '');
    throw new OpenClawCheckError(
      `OpenClaw が ${res.status} を返しました${detail ? `: ${detail}` : ''}`,
    );
  }
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== 'string') throw new OpenClawCheckError('返答の形式が想定と違います');
  return answer;
}

/** 3 往復して、最後の返答に最初の合言葉が含まれるか（=話が続いているか）を返す */
export async function runCheck(config, sessionKey, fetchFn = fetch) {
  const turns = [];
  for (const q of QUESTIONS) turns.push({ q, a: await ask(config, sessionKey, q, fetchFn) });
  return { turns, remembered: turns.at(-1).a.includes(SECRET_WORD) };
}

async function main() {
  const envFile = join(root, '.env.local');
  const fileEnv = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
  const config = loadCheckConfig(mergeEnv(fileEnv, process.env));
  const sessionKey = `check:${Date.now()}`;
  console.log(`セッションキー ${sessionKey} で 3 往復します（${config.baseUrl}）`);
  const r = await runCheck(config, sessionKey);
  for (const [i, t] of r.turns.entries()) {
    console.log(`\n[${i + 1}] あなた: ${t.q}\n    JARVIS: ${t.a}`);
  }
  if (r.remembered) return console.log('\nOK: 3 往復目で最初の内容を覚えていました');
  console.error('\nNG: 3 往復目で最初の内容を覚えていません（セッションキーが効いていない可能性）');
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e instanceof OpenClawCheckError ? e.message : e);
    process.exit(1);
  });
}
