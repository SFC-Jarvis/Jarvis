import assert from 'node:assert/strict';
import { test } from 'node:test';
import { judge } from './check-tests.mjs';

test('コードだけ変えると NG', () => {
  assert.equal(judge(['apps/web/src/lib/a.ts']).ok, false);
  assert.equal(judge(['services/tools/src/jarvis_tools/x.py']).ok, false);
});
test('テストも変えれば OK', () => {
  assert.equal(judge(['apps/web/src/lib/a.ts', 'apps/web/src/lib/a.test.ts']).ok, true);
  assert.equal(
    judge(['services/voice/src/jarvis_voice/x.py', 'services/voice/tests/test_x.py']).ok,
    true,
  );
});
test('ドキュメントや生成物だけなら OK', () => {
  assert.equal(judge(['docs/PROJECT.md', 'apps/web/src/lib/generated/tools-api.ts']).ok, true);
});
