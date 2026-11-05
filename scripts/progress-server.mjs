#!/usr/bin/env node
// 進捗ページのサーバー（依存なし）。製品の画面（apps/web）とは別のポートで動く開発用の道具。
//   node scripts/progress-server.mjs   → http://127.0.0.1:3100（JARVIS_PROGRESS_PORT で変更）
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { collectProgress } from './progress-data.mjs';
import { renderError, renderPage } from './progress-page.mjs';

export const LISTEN_HOST = '127.0.0.1';
const DEFAULT_PORT = 3100;
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1)(:\d+)?$/;
const HEADERS = {
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { ...HEADERS, 'Content-Type': type });
  res.end(body);
}

/** 短時間に何度開いても git と gh を呼びすぎないように、結果をしばらく覚えておく */
function cachedLoader(load, ttlMs) {
  let value = null;
  let expiresAt = 0;
  let inFlight = null;
  return (force) => {
    if (inFlight) return inFlight;
    if (!force && value && Date.now() < expiresAt) return Promise.resolve(value);
    inFlight = load()
      .then((result) => {
        value = result;
        expiresAt = Date.now() + ttlMs;
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  };
}

export function createProgressServer({ load = collectProgress, ttlMs = 60_000 } = {}) {
  const getProgress = cachedLoader(load, ttlMs);
  return createServer(async (req, res) => {
    // 別のサイトから DNS を使って入り込まれないように、Host を確かめる
    if (!LOCAL_HOST_RE.test(req.headers.host ?? '')) return send(res, 403, 'Forbidden');
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed');
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/health') return send(res, 200, 'ok');
    if (url.pathname !== '/') return send(res, 404, 'Not Found');
    try {
      const progress = await getProgress(url.searchParams.has('refresh'));
      return send(res, 200, renderPage(progress), 'text/html; charset=utf-8');
    } catch (e) {
      console.error('進捗の取得に失敗:', e instanceof Error ? e.message : e);
      const html = renderError(
        '進捗を読めませんでした。`git fetch origin` を試してください（原因はサーバーのログにあります）',
      );
      return send(res, 500, html, 'text/html; charset=utf-8');
    }
  });
}

function main() {
  const port = Number(process.env.JARVIS_PROGRESS_PORT || DEFAULT_PORT);
  const server = createProgressServer();
  server.on('error', (e) => {
    const inUse = e instanceof Error && 'code' in e && e.code === 'EADDRINUSE';
    console.error(
      inUse ? `ポート ${port} はすでに使われています（JARVIS_PROGRESS_PORT で変更できます）` : e,
    );
    process.exit(1);
  });
  server.listen(port, LISTEN_HOST, () => {
    console.log(`進捗ページ: http://${LISTEN_HOST}:${port}`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
