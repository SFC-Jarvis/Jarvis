'use client';

import type { KeyboardEvent } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  /** 返答を待っている間は送れない */
  busy: boolean;
};

/** 下の中央の入力欄。Enter で送信、Shift+Enter で改行。マイクは WEB-4-3 で使えるようにする */
export function Composer({ value, onChange, onSend, busy }: Props) {
  const text = value.trim();
  const canSend = text !== '' && !busy;

  const send = () => {
    if (!canSend) return;
    onSend(text);
    onChange('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 日本語の変換を確定する Enter では送らない
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    send();
  };

  return (
    <div className="flex w-full max-w-3xl items-center gap-3.5">
      <div className="flex min-h-14 grow items-center gap-2 rounded-[28px] border border-sky-300/20 bg-slate-900/70 py-2 pr-2 pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] focus-within:border-sky-300/50">
        <textarea
          aria-label="メッセージ"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="JARVIS に話しかける（Enter で送信・Shift+Enter で改行）"
          className="field-sizing-content max-h-48 min-w-0 grow resize-none bg-transparent py-2 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          aria-label="送信"
          onClick={send}
          disabled={!canSend}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-300/15 text-sky-100 hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-40"
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
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        aria-label="録音を開始（第4回で使えるようになります）"
        title="第4回で使えるようになります"
        disabled
        className="flex size-16 shrink-0 items-center justify-center rounded-full border border-sky-400/60 bg-sky-400/10 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
    </div>
  );
}
