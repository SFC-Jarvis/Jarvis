import { render, screen } from '@testing-library/react';
import { JarvisCore } from './JarvisCore';

describe('JarvisCore', () => {
  beforeEach(() => {
    // jsdom には canvas の描画がないので、使えない環境として扱う
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it('状態の名前を文字でも出す', () => {
    render(<JarvisCore mode="thinking" />);
    expect(screen.getByText('THINKING')).toBeInTheDocument();
    expect(screen.getByText('考えています')).toBeInTheDocument();
  });

  it('球体は状態を含む名前の画像として読める', () => {
    render(<JarvisCore mode="speaking" />);
    expect(screen.getByRole('img', { name: 'JARVIS のコア（話しています）' })).toBeInTheDocument();
  });

  it('状態が変わると表示も変わる', () => {
    const { rerender } = render(<JarvisCore mode="idle" />);
    expect(screen.getByText('STANDBY')).toBeInTheDocument();
    rerender(<JarvisCore mode="speaking" />);
    expect(screen.getByText('SPEAKING')).toBeInTheDocument();
  });

  it('canvas が使えない環境でも落ちない', () => {
    expect(() => render(<JarvisCore mode="idle" />)).not.toThrow();
  });
});

describe('JarvisCore の描画ループ', () => {
  const fakeCtx = () => ({
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  });
  const setMotionPref = (reduce: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: reduce })),
    );

  let ctx: ReturnType<typeof fakeCtx>;
  beforeEach(() => {
    ctx = fakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('状態が変わってもループを作り直さず、動き続けたまま切り替える', () => {
    setMotionPref(false);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => frames.push(cb)),
    );
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);

    const { rerender } = render(<JarvisCore mode="idle" />);
    frames.shift()?.(0);
    frames.shift()?.(16);
    rerender(<JarvisCore mode="thinking" />);
    frames.shift()?.(32);

    expect(cancel).not.toHaveBeenCalled();
    expect(ctx.clearRect).toHaveBeenCalledTimes(3);
  });

  it('動きを減らす設定では、ループを回さず 1 枚だけ描く', () => {
    setMotionPref(true);
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);

    const { rerender } = render(<JarvisCore mode="idle" />);
    rerender(<JarvisCore mode="speaking" />);

    expect(raf).not.toHaveBeenCalled();
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
  });
});
