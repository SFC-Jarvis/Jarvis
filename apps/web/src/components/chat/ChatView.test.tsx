import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Conversation } from '@/lib/chat';
import { ChatView } from './ChatView';

/** 返答を外から決められる送信関数 */
function deferredSender() {
  let resolve: (reply: string) => void = () => {};
  let reject: (e: Error) => void = () => {};
  const send = vi.fn(
    (_c: Conversation) =>
      new Promise<string>((res, rej) => {
        resolve = res;
        reject = rej;
      }),
  );
  return { send, resolve: (r: string) => resolve(r), reject: (e: Error) => reject(e) };
}

const setup = (sendMessage: (c: Conversation) => Promise<string>) => {
  let n = 0;
  render(
    <ChatView
      sendMessage={sendMessage}
      newId={() => `id${++n}`}
      now={() => new Date('2026-11-10T08:41:00')}
    />,
  );
};

const box = () => screen.getByRole('textbox', { name: 'メッセージ' });
const latest = () => screen.getByRole('log', { name: '最新の会話' });
const history = () => screen.getByRole('complementary', { name: '会話の記録' });

describe('ChatView', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it('最初は待機中で、挨拶と例の質問を出す', () => {
    setup(vi.fn());
    expect(screen.getByText('STANDBY')).toBeInTheDocument();
    expect(within(latest()).getByText('何をしましょうか？')).toBeInTheDocument();
  });

  it('例の質問を押すと入力欄に入る（すぐには送らない）', async () => {
    const send = vi.fn();
    setup(send);
    await userEvent.click(screen.getByRole('button', { name: '今日の予定は？' }));
    expect(box()).toHaveValue('今日の予定は？');
    expect(send).not.toHaveBeenCalled();
  });

  it('送るとすぐ自分の発言が出て、返答を待つ間は「考えています」になる', async () => {
    const s = deferredSender();
    setup(s.send);
    await userEvent.type(box(), '今日の予定は？{Enter}');

    expect(within(latest()).getByText('今日の予定は？')).toBeInTheDocument();
    expect(screen.getByText('THINKING')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  it('モックの返答が字幕に出て、話している状態になる', async () => {
    setup(vi.fn().mockResolvedValue('（モック）「こんにちは」を受け取りました'));
    await userEvent.type(box(), 'こんにちは{Enter}');

    expect(
      await within(latest()).findByText('（モック）「こんにちは」を受け取りました'),
    ).toBeInTheDocument();
    expect(screen.getByText('SPEAKING')).toBeInTheDocument();
  });

  it('送るときは会話のメッセージをすべて渡す', async () => {
    const send = vi.fn().mockResolvedValueOnce('はい').mockResolvedValueOnce('どうぞ');
    setup(send);
    await userEvent.type(box(), '1 つ目{Enter}');
    await within(latest()).findByText('はい');
    await userEvent.type(box(), '2 つ目{Enter}');
    await within(latest()).findByText('どうぞ');

    const conv = send.mock.calls[1]?.[0] as Conversation;
    expect(conv.messages.map((m) => m.content)).toEqual(['1 つ目', 'はい', '2 つ目']);
  });

  it('失敗するとエラーと［もう一度送る］が出て、押すと再送する', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce('届きました');
    setup(send);
    await userEvent.type(box(), 'テスト{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('返答を受け取れませんでした');
    await userEvent.click(screen.getByRole('button', { name: 'もう一度送る' }));

    expect(await within(latest()).findByText('届きました')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(2);
    const retried = send.mock.calls[1]?.[0] as Conversation;
    expect(retried.messages.map((m) => m.content)).toEqual(['テスト']);
  });

  it('「新しい会話」で待機中に戻り、前の会話は右の列に残る。押すと戻れる', async () => {
    setup(vi.fn().mockResolvedValue('了解です'));
    await userEvent.type(box(), '買い物リストを作って{Enter}');
    await within(latest()).findByText('了解です');

    await userEvent.click(screen.getByRole('button', { name: '新しい会話' }));
    expect(within(latest()).getByText('何をしましょうか？')).toBeInTheDocument();

    const item = within(history()).getByRole('button', { name: /買い物リストを作って/ });
    await userEvent.click(item);
    expect(within(latest()).getByText('了解です')).toBeInTheDocument();
    expect(item).toHaveAttribute('aria-current', 'true');
  });

  it('「会話の全文を見る」で、すべての発言が見える', async () => {
    const send = vi.fn().mockResolvedValueOnce('はい').mockResolvedValueOnce('どうぞ');
    setup(send);
    await userEvent.type(box(), '1 つ目{Enter}');
    await within(latest()).findByText('はい');
    await userEvent.type(box(), '2 つ目{Enter}');
    await within(latest()).findByText('どうぞ');

    await userEvent.click(screen.getByRole('button', { name: '会話の全文を見る' }));
    const log = screen.getByRole('log', { name: '会話の全文' });
    for (const text of ['1 つ目', 'はい', '2 つ目', 'どうぞ']) {
      expect(within(log).getByText(text)).toBeInTheDocument();
    }
  });
});
