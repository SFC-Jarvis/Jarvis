import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'JARVIS',
  description: '声とテキストで話せる、自分のPCで動くAIエージェント',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
