# apps/web（画面）

- App Router。ページは `src/app`、部品は `src/components/<機能>/`、ロジックは `src/lib`
- **トークンやキーを扱う処理はサーバー側（Route Handler / Server Component）だけ。** ブラウザに出さない
- OpenClaw との通信は `src/lib/openclaw.ts` 経由。tools API は `src/lib/tools-api.ts` 経由（型は `src/lib/generated/` を使い、手書きしない）
- 部品ごとに `*.test.tsx` を同じフォルダに置く。Testing Library で「ユーザーに見えるもの」（role・ラベル・文言）で検証する
- fetch は引数で差し替えられるようにして、テストでは `vi.fn()` を渡す（実際の通信をしない）
- スタイルは Tailwind のみ。色・余白はクラスで統一し、独自 CSS は globals.css に最小限
- 文言は日本語。ボタンなどには必ずアクセシブルな名前を付ける（aria-label など）
- `JARVIS_MOCK=1` なら OpenClaw なしで開発できる
- 確認（このフォルダで）: `pnpm lint && pnpm typecheck && pnpm test`
