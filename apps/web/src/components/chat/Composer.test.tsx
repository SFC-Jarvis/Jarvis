import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Composer } from './Composer';

function Harness({ onSend, busy = false }: { onSend: (text: string) => void; busy?: boolean }) {
  const [value, setValue] = useState('');
  return <Composer value={value} onChange={setValue} onSend={onSend} busy={busy} />;
}

const box = () => screen.getByRole('textbox', { name: 'メッセージ' });

describe('Composer', () => {
  it('Enter で送り、入力欄が空になる', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await userEvent.type(box(), 'こんにちは{Enter}');
    expect(onSend).toHaveBeenCalledWith('こんにちは');
    expect(box()).toHaveValue('');
  });

  it('送信ボタンでも送れる。前後の空白は取る', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await userEvent.type(box(), '  予定は？ ');
    await userEvent.click(screen.getByRole('button', { name: '送信' }));
    expect(onSend).toHaveBeenCalledWith('予定は？');
  });

  it('Shift+Enter では送らずに改行する', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await userEvent.type(box(), '1 行目{Shift>}{Enter}{/Shift}2 行目');
    expect(onSend).not.toHaveBeenCalled();
    expect(box()).toHaveValue('1 行目\n2 行目');
  });

  it('日本語の変換中の Enter では送らない', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await userEvent.type(box(), 'よてい');
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    fireEvent.keyDown(box(), { key: 'Enter', keyCode: 229 });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('空白だけのときは送信ボタンを押せない', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await userEvent.type(box(), '   {Enter}');
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('送信中は送れない', async () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} busy />);
    await userEvent.type(box(), 'もう一回{Enter}');
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('マイクボタンはあるが、第4回までは押せない', () => {
    render(<Harness onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: /録音を開始/ })).toBeDisabled();
  });
});
