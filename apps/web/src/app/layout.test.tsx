import { renderToStaticMarkup } from 'react-dom/server';
import RootLayout, { viewport } from './layout';

describe('RootLayout', () => {
  it('CSS を読み込む前から暗い配色をブラウザに伝える', () => {
    expect(viewport.colorScheme).toBe('dark');
  });

  it('本文を暗い背景と明るい文字で表示する', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>本文</p>
      </RootLayout>,
    );
    expect(html).toContain('bg-neutral-950');
    expect(html).toContain('text-neutral-100');
    expect(html).not.toContain('bg-neutral-50 ');
  });
});
