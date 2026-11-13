import {
  type CoreCanvas,
  type CoreMode,
  displacement,
  drawCore,
  hexToRgb,
  initialMotion,
  MODE_LABELS,
  orbitLevel,
  rotate,
  spherePoints,
  stepMotion,
} from './core';

const length = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z);

/** いろいろな時刻で揺れの大きさ（1 からのずれ）の最大を測る */
const maxSwing = (mode: CoreMode) => {
  const points = spherePoints(50, () => 0.5);
  let max = 0;
  for (let t = 0; t < 10; t += 0.05) {
    for (const p of points) max = Math.max(max, Math.abs(displacement(mode, t, p) - 1));
  }
  return max;
};

const fakeCanvas = () => {
  const ctx = {
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 1,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  return ctx;
};

describe('spherePoints', () => {
  it('指定した数の点を作り、すべて半径 1 の球面上にある', () => {
    const points = spherePoints(200);
    expect(points).toHaveLength(200);
    for (const p of points) expect(length(p)).toBeCloseTo(1, 9);
  });

  it('上下の端から端まで散らばる', () => {
    const ys = spherePoints(100).map((p) => p.y);
    expect(Math.max(...ys)).toBeCloseTo(1);
    expect(Math.min(...ys)).toBeCloseTo(-1);
  });
});

describe('rotate', () => {
  it('回しても球の大きさは変わらない', () => {
    for (const p of spherePoints(30)) {
      expect(length(rotate(p, 1.2, 0.38))).toBeCloseTo(1, 9);
    }
  });

  it('角度 0 なら動かない', () => {
    const r = rotate({ x: 0.6, y: 0, z: 0.8 }, 0, 0);
    expect(r.x).toBeCloseTo(0.6);
    expect(r.z).toBeCloseTo(0.8);
  });
});

describe('displacement', () => {
  it('待機中は揺れが小さく、話している間は大きい', () => {
    expect(maxSwing('idle')).toBeLessThan(0.02);
    expect(maxSwing('speaking')).toBeGreaterThan(0.05);
    expect(maxSwing('thinking')).toBeLessThan(maxSwing('speaking'));
  });
});

describe('MODE_LABELS', () => {
  it('状態ごとに英語と日本語の名前がある', () => {
    expect(MODE_LABELS.thinking).toEqual({ en: 'THINKING', ja: '考えています' });
    expect(MODE_LABELS.speaking.en).toBe('SPEAKING');
    expect(MODE_LABELS.idle.en).toBe('STANDBY');
  });
});

describe('hexToRgb', () => {
  it('#rrggbb と #rgb を数値にする', () => {
    expect(hexToRgb('#38bdf8')).toEqual([0x38, 0xbd, 0xf8]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('読めない色は既定の水色にする', () => {
    expect(hexToRgb('blue')).toEqual([0x38, 0xbd, 0xf8]);
  });
});

describe('drawCore', () => {
  it('点の数だけ円を描く（待機中）', () => {
    const ctx = fakeCanvas();
    drawCore(
      ctx as unknown as CoreCanvas,
      spherePoints(40),
      initialMotion('idle'),
      1,
      '#38bdf8',
      420,
    );
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 420, 420);
    expect(ctx.arc).toHaveBeenCalledTimes(40);
  });

  it('考えている間・話している間は、周りの粒子の輪も描く', () => {
    const idle = fakeCanvas();
    const thinking = fakeCanvas();
    const points = spherePoints(40);
    drawCore(idle as unknown as CoreCanvas, points, initialMotion('idle'), 1, '#38bdf8', 420);
    drawCore(
      thinking as unknown as CoreCanvas,
      points,
      initialMotion('thinking'),
      1,
      '#38bdf8',
      420,
    );
    expect(thinking.arc.mock.calls.length).toBeGreaterThan(idle.arc.mock.calls.length);
  });
});

/** 60fps で sec 秒ぶん、target に向けて動かす */
const run = (from: CoreMode, target: CoreMode, sec: number) => {
  let m = initialMotion(from);
  for (let t = 0; t < sec; t += 1 / 60) m = stepMotion(m, target, 1 / 60);
  return m;
};
const sum = (w: Record<CoreMode, number>) => w.idle + w.thinking + w.speaking;

describe('stepMotion（状態の切り替わりを滑らかにする）', () => {
  it('最初はその状態だけの動き', () => {
    expect(initialMotion('speaking').weights).toEqual({ idle: 0, thinking: 0, speaking: 1 });
  });

  it('切り替えた直後は、前の動きと次の動きが混ざる（急に変わらない）', () => {
    const m = stepMotion(initialMotion('idle'), 'thinking', 1 / 60);
    expect(m.weights.thinking).toBeGreaterThan(0);
    expect(m.weights.thinking).toBeLessThan(0.2);
    expect(sum(m.weights)).toBeCloseTo(1);
  });

  it('時間がたつと次の状態の動きになる', () => {
    expect(run('idle', 'thinking', 3).weights.thinking).toBeGreaterThan(0.99);
    expect(run('thinking', 'speaking', 3).weights.speaking).toBeGreaterThan(0.99);
    expect(run('speaking', 'idle', 5).weights.idle).toBeGreaterThan(0.99);
  });

  it('回転の角度は飛ばない（1 コマで進むのは最速の回転ぶんまで）', () => {
    let m = run('idle', 'idle', 2);
    for (const target of ['thinking', 'speaking', 'idle'] as const) {
      for (let i = 0; i < 120; i++) {
        const next = stepMotion(m, target, 1 / 60);
        expect(Math.abs(next.angle - m.angle)).toBeLessThanOrEqual(0.9 / 60 + 1e-9);
        m = next;
      }
    }
  });

  it('待機に戻るときは、考え始めるときよりゆっくり落ち着く', () => {
    const toThinking = run('idle', 'thinking', 0.3).weights.thinking;
    const toIdle = run('speaking', 'idle', 0.3).weights.idle;
    expect(toThinking).toBeGreaterThan(0.5);
    expect(toIdle).toBeLessThan(0.5);
  });

  it('タブを離れて間が空いても、1 コマで一気に変わらない', () => {
    const m = stepMotion(initialMotion('idle'), 'thinking', 5);
    expect(m.weights.thinking).toBeLessThan(0.5);
  });

  it('周りの輪は待機では消え、考えている間は広がりきる。途中は少しずつ', () => {
    expect(orbitLevel(initialMotion('idle'))).toBe(0);
    expect(orbitLevel(initialMotion('thinking'))).toBe(1);
    const mid = orbitLevel(stepMotion(initialMotion('idle'), 'thinking', 0.1));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});
