#!/usr/bin/env node
// PostToolUse フック: Claude が編集したファイルをその場で整形する（失敗しても作業は止めない）
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let input = '';
process.stdin.on('data', (c) => {
  input += c;
});
process.stdin.on('end', () => {
  try {
    const file = JSON.parse(input)?.tool_input?.file_path;
    if (!file || !existsSync(file)) return;
    const rel = relative(root, file);
    if (rel.startsWith('..')) return;
    const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'ignore' });
    if (/\.(ts|tsx|js|mjs|json|css)$/.test(rel) && !rel.includes('/generated/')) {
      run(join(root, 'node_modules/.bin/biome'), [
        'check',
        '--write',
        '--no-errors-on-unmatched',
        file,
      ]);
    } else if (/^services\/[^/]+\/.+\.py$/.test(rel)) {
      const svc = join(root, rel.split('/').slice(0, 2).join('/'));
      run('uv', ['run', 'ruff', 'format', file], svc);
      run('uv', ['run', 'ruff', 'check', '--fix', '--quiet', file], svc);
    }
  } catch {
    // 整形できなくても続ける（CI と /done で検出される）
  }
});
