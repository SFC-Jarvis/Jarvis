import type { Conversation } from '@/lib/chat';

type Props = {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

/** 右の列。発言のある会話を新しい順に並べる */
export function HistoryPanel({ conversations, activeId, onSelect, onNew }: Props) {
  const items = conversations
    .filter((c) => c.messages.length > 0)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <aside
      aria-label="会話の記録"
      className="flex flex-col gap-5 border-t border-sky-300/10 bg-slate-950/80 px-4.5 py-5 md:h-screen md:border-t-0 md:border-l"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-medium tracking-[0.24em] text-slate-400">
          会話の記録
        </h2>
        <button
          type="button"
          aria-label="新しい会話"
          onClick={onNew}
          className="flex size-11 items-center justify-center rounded-xl border border-sky-300/20 text-sky-100 hover:border-sky-300/50"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <nav aria-label="会話の一覧" className="flex grow flex-col gap-1 overflow-y-auto">
        {items.length === 0 && <p className="px-3 text-sm text-slate-500">まだ会話はありません</p>}
        {items.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(c.id)}
              className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left ${
                active
                  ? 'bg-sky-300/10 text-slate-100 ring-1 ring-sky-300/25 ring-inset'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="truncate text-sm">{c.title}</span>
              <span className="font-mono text-[11px] text-slate-400">{timeOf(c.updatedAt)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
