'use client';

import { useEffect, useRef, useState } from 'react';
import {
  type Conversation,
  createConversation,
  createMessage,
  makeTitle,
  sendChat,
} from '@/lib/chat';
import type { CoreMode } from '@/lib/core';
import { JarvisCore } from '../core/JarvisCore';
import { Composer } from './Composer';
import { ConversationLog } from './ConversationLog';
import { HistoryPanel } from './HistoryPanel';
import { Subtitle } from './Subtitle';

/** 返答を受け取ってから「話している」を続ける時間（読み上げは WEB-4-3 でつなぐ） */
const SPEAKING_MS = 6000;

type Props = {
  /** 会話を送り、返答を返す。テストではモックを渡す */
  sendMessage?: (conversation: Conversation) => Promise<string>;
  newId?: () => string;
  now?: () => Date;
};

/** 案 2（コア）の画面全体。会話の一覧・選択中の会話・送信の状態を持つ */
export function ChatView({
  sendMessage = (c) => sendChat(c),
  newId = () => crypto.randomUUID(),
  now = () => new Date(),
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    createConversation(newId(), now()),
  ]);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const speakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(speakTimer.current), []);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = active?.messages ?? [];
  const mode: CoreMode =
    pendingId === activeId ? 'thinking' : speakingId === activeId ? 'speaking' : 'idle';

  const replace = (next: Conversation) =>
    setConversations((list) => list.map((c) => (c.id === next.id ? next : c)));

  const request = async (conv: Conversation) => {
    setPendingId(conv.id);
    setErrorId(null);
    try {
      const reply = await sendMessage(conv);
      const msg = createMessage(newId(), 'assistant', reply, now());
      setConversations((list) =>
        list.map((c) =>
          c.id === conv.id ? { ...c, messages: [...c.messages, msg], updatedAt: msg.createdAt } : c,
        ),
      );
      setSpeakingId(conv.id);
      clearTimeout(speakTimer.current);
      speakTimer.current = setTimeout(() => setSpeakingId(null), SPEAKING_MS);
    } catch (e) {
      // 原因は開発者向けにコンソールへ。画面には日本語の文言だけを出す
      console.error('返答を受け取れませんでした', e);
      setErrorId(conv.id);
    } finally {
      setPendingId(null);
    }
  };

  const send = (text: string) => {
    if (!active) return;
    const msg = createMessage(newId(), 'user', text, now());
    const next: Conversation = {
      ...active,
      title: active.messages.length === 0 ? makeTitle(text) : active.title,
      messages: [...active.messages, msg],
      updatedAt: msg.createdAt,
    };
    replace(next);
    void request(next);
  };

  const retry = () => {
    const conv = conversations.find((c) => c.id === errorId);
    if (conv) void request(conv);
  };

  const startNew = () => {
    setShowLog(false);
    if (messages.length === 0) return;
    const conv = createConversation(newId(), now());
    setConversations((list) => [conv, ...list]);
    setActiveId(conv.id);
  };

  const select = (id: string) => {
    setShowLog(false);
    setActiveId(id);
  };

  return (
    <div className="jv-backdrop grid min-h-screen grid-cols-1 text-slate-100 md:grid-cols-[minmax(0,1fr)_320px]">
      <main className="flex min-w-0 flex-col md:h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between px-8">
          <div className="flex items-baseline gap-3.5">
            <h1 className="font-mono text-lg font-medium tracking-[0.42em]">JARVIS</h1>
            <span className="hidden font-mono text-[11px] tracking-[0.18em] text-slate-400 sm:inline">
              PERSONAL AGENT
            </span>
          </div>
        </header>

        <section
          aria-label="JARVIS の状態"
          className="flex min-h-0 grow flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-4"
        >
          <JarvisCore mode={mode} />
          {showLog ? (
            <ConversationLog messages={messages} />
          ) : (
            <Subtitle
              messages={messages}
              error={errorId === activeId}
              onRetry={retry}
              onPick={setInput}
            />
          )}
          {messages.length > 0 && (
            <button
              type="button"
              aria-expanded={showLog}
              onClick={() => setShowLog((v) => !v)}
              className="min-h-9 px-3 text-xs tracking-wider text-slate-400 hover:text-slate-200"
            >
              {showLog ? '字幕に戻る' : '会話の全文を見る'}
            </button>
          )}
        </section>

        <div className="flex shrink-0 justify-center px-8 pb-7">
          <Composer value={input} onChange={setInput} onSend={send} busy={pendingId !== null} />
        </div>
      </main>

      <HistoryPanel
        conversations={conversations}
        activeId={activeId}
        onSelect={select}
        onNew={startNew}
      />
    </div>
  );
}
