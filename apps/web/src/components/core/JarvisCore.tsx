'use client';

import { useEffect, useRef } from 'react';
import {
  type CoreMode,
  drawCore,
  initialMotion,
  MODE_LABELS,
  spherePoints,
  stepMotion,
} from '@/lib/core';

const SIZE = 420;
const POINT_COUNT = 1100;
export const CORE_ACCENT = '#38bdf8';

type Props = { mode: CoreMode; accent?: string };

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** 高解像度の画面でもぼやけないように canvas の大きさを合わせる。使えなければ null */
function setupCanvas(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** 真ん中の粒子の球体。状態（mode）で動きが変わり、切り替わりは滑らかにつなぐ */
export function JarvisCore({ mode, accent = CORE_ACCENT }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const label = MODE_LABELS[mode];
  modeRef.current = mode;

  // 動きを減らす設定の PC では、ループを回さず状態ごとに 1 枚だけ描く
  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const ctx = setupCanvas(canvasRef.current);
    if (ctx) drawCore(ctx, spherePoints(POINT_COUNT), initialMotion(mode), 4, accent, SIZE);
  }, [mode, accent]);

  // 描画のループは 1 つだけ動かし続ける。状態が変わっても作り直さず、動きを少しずつ寄せる
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = setupCanvas(canvasRef.current);
    if (!ctx) return;
    const points = spherePoints(POINT_COUNT);

    let motion = initialMotion(modeRef.current);
    let start: number | null = null;
    let last: number | null = null;
    let raf = 0;
    const frame = (now: number) => {
      start ??= now;
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      motion = stepMotion(motion, modeRef.current, dt);
      drawCore(ctx, points, motion, (now - start) / 1000, accent, SIZE);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [accent]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative size-[440px] max-w-[80vw] max-h-[80vw]">
        <svg
          aria-hidden="true"
          viewBox="0 0 500 500"
          className="absolute inset-0 size-full text-sky-400"
        >
          <g className="jv-spin-slow">
            <circle
              cx="250"
              cy="250"
              r="236"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="10"
              strokeDasharray="1 11"
            />
          </g>
          <circle
            cx="250"
            cy="250"
            r="222"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.12"
          />
          <g className="jv-spin-reverse">
            <circle
              cx="250"
              cy="250"
              r="208"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="120 540 40 606"
            />
          </g>
          <path
            d="M250 6v14M250 480v14M6 250h14M480 250h14"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        </svg>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`JARVIS のコア（${label.ja}）`}
          className="absolute inset-[8%] size-[84%]"
        />
      </div>
      <p className="font-mono text-xs tracking-[0.32em] text-sky-400">{label.en}</p>
      <p className="text-xs text-slate-400">{label.ja}</p>
    </div>
  );
}
