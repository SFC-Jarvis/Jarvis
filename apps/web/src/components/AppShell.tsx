// 画面の骨組みだけ。チャット・履歴・承認カードは担当者が実装する（docs/tasks/web.md）
export function AppShell() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside aria-label="会話の履歴" className="border-r border-neutral-200 p-4">
        <h2 className="text-sm font-bold">会話の履歴</h2>
      </aside>
      <main className="flex flex-col p-6">
        <h1 className="text-2xl font-bold">JARVIS</h1>
        <p className="text-neutral-500">ここにチャット画面が入ります</p>
      </main>
    </div>
  );
}
