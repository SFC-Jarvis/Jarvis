/**
 * JARVIS のコア（粒子の球体）の計算と描画。
 * 計算は純粋な関数に分け、描画は canvas 2D の一部だけを使う（テストで偽物を渡せるように）。
 * 設計: docs/design/chat-screen.md「案 2」
 */

/** コアの状態。listening（聞いている）は WEB-4-3 で足す */
export type CoreMode = 'idle' | 'thinking' | 'speaking';

export const MODE_LABELS: Record<CoreMode, { en: string; ja: string }> = {
  idle: { en: 'STANDBY', ja: '待機中' },
  thinking: { en: 'THINKING', ja: '考えています' },
  speaking: { en: 'SPEAKING', ja: '話しています' },
};

export type Vec3 = { x: number; y: number; z: number };
export type CorePoint = Vec3 & { seed: number };

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEFAULT_RGB: [number, number, number] = [0x38, 0xbd, 0xf8];

/** 半径 1 の球面に、点をむらなく並べる（フィボナッチ球） */
export function spherePoints(count: number, random: () => number = Math.random): CorePoint[] {
  const points: CorePoint[] = [];
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * GOLDEN_ANGLE;
    points.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, seed: random() });
  }
  return points;
}

/** 縦の軸で angleY 回し、横の軸で tiltX 傾ける */
export function rotate(p: Vec3, angleY: number, tiltX: number): Vec3 {
  const ca = Math.cos(angleY);
  const sa = Math.sin(angleY);
  const cb = Math.cos(tiltX);
  const sb = Math.sin(tiltX);
  const x = p.x * ca + p.z * sa;
  const z1 = -p.x * sa + p.z * ca;
  return { x, y: p.y * cb - z1 * sb, z: p.y * sb + z1 * cb };
}

/** 状態ごとの、点の半径の倍率（1 が元の大きさ） */
export function displacement(mode: CoreMode, t: number, p: CorePoint): number {
  switch (mode) {
    case 'speaking':
      return (
        1 +
        0.07 * Math.sin(t * 7 + p.y * 5) * (0.6 + 0.4 * Math.sin(t * 2.3)) +
        0.02 * Math.sin(t * 13 + p.seed * 40)
      );
    case 'thinking':
      return 1 + 0.015 * Math.sin(t * 9 + p.seed * 50);
    default:
      return 1 + 0.01 * Math.sin(t * 1.2 + p.seed * 20);
  }
}

const MODES: CoreMode[] = ['idle', 'thinking', 'speaking'];
/** 状態ごとの回転の速さ（ラジアン/秒）。周りの輪の速さ */
const SPEED: Record<CoreMode, number> = { idle: 0.12, thinking: 0.9, speaking: 0.32 };
const ORBIT_SPEED: Record<CoreMode, number> = { idle: 0.3, thinking: 1.6, speaking: 0.5 };
/** 考えている間は少しだけ縮む（集中している感じ） */
const SCALE: Record<CoreMode, number> = { idle: 1, thinking: 0.96, speaking: 1 };
/**
 * 次の状態に移りきるまでの速さ（時定数・秒）。
 * 考え始めはすばやく、話し始めはやや穏やかに、待機に戻るときはゆっくり落ち着く
 */
const EASE_SEC: Record<CoreMode, number> = { idle: 0.6, thinking: 0.25, speaking: 0.45 };
/** タブを離れていた後などに、1 コマで進める時間の上限（秒） */
const MAX_STEP_SEC = 0.1;

/** 切り替えの途中も含めた、今の動き。weights は各状態の混ざり具合（合計 1） */
export type CoreMotion = {
  weights: Record<CoreMode, number>;
  angle: number;
  orbitAngle: number;
};

export function initialMotion(mode: CoreMode): CoreMotion {
  return {
    weights: { idle: 0, thinking: 0, speaking: 0, [mode]: 1 },
    angle: 0,
    orbitAngle: 0,
  };
}

const mix = (w: Record<CoreMode, number>, values: Record<CoreMode, number>) =>
  MODES.reduce((acc, m) => acc + w[m] * values[m], 0);

/** dt 秒ぶん、target の動きに近づける。回転は速さを積み重ねるので角度が飛ばない */
export function stepMotion(motion: CoreMotion, target: CoreMode, dt: number): CoreMotion {
  const step = Math.min(Math.max(dt, 0), MAX_STEP_SEC);
  const k = 1 - Math.exp(-step / EASE_SEC[target]);
  const weights = { ...motion.weights };
  for (const m of MODES) weights[m] += ((m === target ? 1 : 0) - weights[m]) * k;
  return {
    weights,
    angle: motion.angle + mix(weights, SPEED) * step,
    orbitAngle: motion.orbitAngle + mix(weights, ORBIT_SPEED) * step,
  };
}

/** 周りの粒子の輪の出具合（0 = 消えている、1 = 広がりきっている） */
export function orbitLevel(motion: CoreMotion): number {
  return Math.min(1, motion.weights.thinking + 0.6 * motion.weights.speaking);
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) return DEFAULT_RGB;
  const h = m[1].length === 3 ? Array.from(m[1], (c) => c + c).join('') : m[1];
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 描画に使う canvas 2D の一部 */
export type CoreCanvas = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'clearRect'
  | 'fillRect'
  | 'beginPath'
  | 'arc'
  | 'fill'
  | 'stroke'
  | 'createRadialGradient'
>;

const ORBIT_COUNT = 140;

/** 時刻 t（秒）・動き motion のコアを、size × size の正方形に描く */
export function drawCore(
  ctx: CoreCanvas,
  points: CorePoint[],
  motion: CoreMotion,
  t: number,
  accent: string,
  size: number,
): void {
  const [r, g, b] = hexToRgb(accent);
  const color = (a: number) => `rgba(${r},${g},${b},${a.toFixed(3)})`;
  const w = motion.weights;
  const active = 1 - w.idle;
  const c = size / 2;
  const radius = size * 0.31 * mix(w, SCALE);

  ctx.clearRect(0, 0, size, size);
  const glow = ctx.createRadialGradient(c, c, 0, c, c, radius * 1.25);
  glow.addColorStop(0, color(0.1 + 0.1 * active));
  glow.addColorStop(1, color(0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  for (const p of points) {
    const q = rotate(p, motion.angle, 0.38);
    // 各状態の揺れを、混ざり具合に合わせて足し合わせる
    const d = 1 + MODES.reduce((acc, m) => acc + w[m] * (displacement(m, t, p) - 1), 0);
    const depth = (q.z + 1) / 2;
    const persp = 1.7 / (2.7 - q.z);
    ctx.fillStyle = color(0.08 + 0.04 * active + 0.85 * depth * depth);
    ctx.beginPath();
    ctx.arc(
      c + q.x * radius * d * persp * 1.6,
      c + q.y * radius * d * persp * 1.6,
      0.5 + 1.3 * depth,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 周りの輪は、球の表面から広がって出てきて、待機に戻ると球の中へ縮んで消える
  const level = orbitLevel(motion);
  if (level < 0.01) return;
  const rx = radius * (1 + 0.45 * level);
  const ry = radius * 0.32 * level;
  for (let i = 0; i < ORBIT_COUNT; i++) {
    const a = (i / ORBIT_COUNT) * Math.PI * 2 + motion.orbitAngle;
    const front = (Math.sin(a) + 1) / 2;
    ctx.fillStyle = color((0.15 + 0.4 * front) * level);
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * rx, c + Math.sin(a) * ry, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}
