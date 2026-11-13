import type { Message } from '@/lib/chat';

export const SUGGESTIONS = ['今日の予定は？', 'タスクを追加して', '今週の締め切りは？'];

type Props = {
  messages: Message[];
  error: boolean;
  onRetry: () => void;
  onPick: (text: string) => void;
};

/** コアの下に出す字幕。最新の 1 往復だけ。空の会話では挨拶と例の質問 */
export function Subtitle({ messages, error, onRetry, onPick }: Props) {
  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
  const lastUser = messages[lastUserIndex];
  const reply = messages.slice(lastUserIndex + 1).findLast((m) => m.role === 'assistant');

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="最新の会話"
      className="flex min-h-32 w-full max-w-3xl flex-col items-center gap-2.5 text-center"
    >
      {messages.length === 0 ? (
        <>
          <p className="text-[26px] font-light tracking-wide text-slate-100">何をしましょうか？</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPick(s)}
                className="min-h-10 rounded-full border border-sky-300/30 bg-sky-300/5 px-4 text-[13px] text-slate-300 hover:border-sky-300/60 hover:text-slate-100"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {lastUser && (
            <p className="text-sm text-slate-400">
              <span className="mr-2.5 font-mono text-[11px] tracking-[0.2em]">YOU</span>
              <span className="sr-only">あなた: </span>
              <span className="whitespace-pre-wrap">{lastUser.content}</span>
            </p>
          )}
          {reply && (
            <p className="max-h-60 overflow-y-auto text-[22px] leading-relaxed font-light text-slate-100">
              <span className="sr-only">JARVIS: </span>
              <span className="whitespace-pre-wrap">{reply.content}</span>
            </p>
          )}
          {error && (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-red-400/70 bg-red-950/40 px-5 py-4"
            >
              <p className="font-bold text-red-200">返答を受け取れませんでした。</p>
              <p className="text-sm text-slate-300">
                JARVIS
                の頭脳（OpenClaw）につながりませんでした。少し待ってから、もう一度送ってください。
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 rounded-lg bg-slate-100 px-5 text-sm font-medium text-slate-950 hover:bg-white"
              >
                もう一度送る
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
