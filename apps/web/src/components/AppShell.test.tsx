import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it('タイトル・コア・会話の記録・入力欄を表示する', () => {
    render(<AppShell />);
    expect(screen.getByRole('heading', { level: 1, name: 'JARVIS' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /JARVIS のコア/ })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '会話の記録' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'メッセージ' })).toBeInTheDocument();
  });
});
