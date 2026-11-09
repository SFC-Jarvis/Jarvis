import type { Message } from '@/lib/chat';

/** 「会話の全文を見る」で開く、すべての発言の一覧 */
export function ConversationLog({ messages }: { messages: Message[] }) {
  return (
    <div
      role="log"
      aria-label="会話の全文"
      className="flex max-h-[45vh] w-full max-w-3xl flex-col gap-5 overflow-y-auto rounded-2xl border border-sky-300/15 bg-slate-950/70 p-6 text-left"
    >
      {messages.map((m) =>
        m.role === 'user' ? (
          <div key={m.id} className="flex justify-end">
            <p className="max-w-[80%] rounded-2xl bg-slate-800 px-4 py-2.5">
              <span className="sr-only">あなた: </span>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </p>
          </div>
        ) : (
          <div key={m.id} className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[0.2em] text-sky-400">JARVIS</span>
            <p className="whitespace-pre-wrap text-slate-100">{m.content}</p>
          </div>
        ),
      )}
    </div>
  );
}
