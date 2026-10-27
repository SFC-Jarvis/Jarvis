import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('履歴サイドバーとタイトルを表示する', () => {
    render(<AppShell />);
    expect(screen.getByRole('complementary', { name: '会話の履歴' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'JARVIS' })).toBeInTheDocument();
  });
});
