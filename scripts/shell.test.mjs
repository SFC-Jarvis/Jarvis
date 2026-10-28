import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT } from './jarvis.mjs';

// macOS 標準の bash 3.2 は、"$VAR（" のように変数の直後に日本語が続くと変数名を誤認して止まる。
// 変数の直後に ASCII 以外の文字が続く場合は ${VAR} と書く。
test('シェルスクリプトで変数の直後に日本語を続けていない', () => {
  const dir = join(ROOT, 'scripts');
  const bad = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sh'))) {
    readFileSync(join(dir, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/\$[A-Za-z_][A-Za-z0-9_]*[^\x00-\x7F]/.test(line)) bad.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(bad, []);
});
