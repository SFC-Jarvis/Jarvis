import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'JARVIS',
  description: '声とテキストで話せる、自分のPCで動くAIエージェント',
};

// CSS を読み込む前の一瞬も白くならないように、暗い配色をブラウザに伝える
export const viewport: Viewport = {
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
