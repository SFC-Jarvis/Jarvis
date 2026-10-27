#!/usr/bin/env node
// PR で「コードを変えたのにテストを 1 つも変えていない」ことを検出する（CI の test-guard）。
// 使い方: node scripts/check-tests.mjs <base-ref>   例: origin/main
// 例外: PR に no-test-needed ラベル（環境変数 SKIP_TEST_GUARD=1）
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SOURCE = [
  /^apps\/web\/src\/.+\.(ts|tsx)$/,
  /^services\/[^/]+\/src\/.+\.py$/,
  /^scripts\/[^/]+\.mjs$/,
];
const IGNORE = [
  /\.test\.(ts|tsx|mjs)$/,
  /\/generated\//,
  /\/__main__\.py$/,
  /\/__init__\.py$/,
  /\/layout\.tsx$/,
];
const TEST = [/\.test\.(ts|tsx|mjs)$/, /^services\/[^/]+\/tests\/.+\.py$/];

export function judge(files) {
  const src = files.filter((f) => SOURCE.some((r) => r.test(f)) && !IGNORE.some((r) => r.test(f)));
  const tests = files.filter((f) => TEST.some((r) => r.test(f)));
  return { ok: src.length === 0 || tests.length > 0, src, tests };
}

function main() {
  if (process.env.SKIP_TEST_GUARD === '1')
    return console.log('no-test-needed ラベルのためスキップ');
  const base = process.argv[2] ?? 'origin/main';
  const files = execSync(`git diff --name-only ${base}...HEAD`)
    .toString()
    .split('\n')
    .filter(Boolean);
  const r = judge(files);
  if (r.ok) return console.log(`OK: コード ${r.src.length} 件 / テスト ${r.tests.length} 件の変更`);
  console.error('コードが変わっているのに、テストの変更がありません。');
  console.error('実装と同じ PR でテストを追加・更新してください（docs/CODING_RULES.md）。');
  console.error(
    '本当に不要な場合は PR に no-test-needed ラベルを付け、理由を本文に書いてください。',
  );
  console.error(r.src.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
