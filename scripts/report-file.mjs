#!/usr/bin/env node
// /report の保存先を決める（依存なし）。保存先の絶対パスを 1 行で出し、フォルダがなければ作る。
//   node scripts/report-file.mjs [all] [YYYY-MM-DD]
// ファイル名: <発表日>_<メンバーID>_<名前>.md（all なら <発表日>_全員.md）
// 保存先: PC のダウンロードフォルダ（Mac: ~/Downloads、WSL: Windows 側のユーザーの Downloads）。
//         見つからなければリポジトリの reports/（.gitignore 済み）
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentMember, findPeriod, loadSchedule, ROOT, today } from './jarvis.mjs';

/** ファイル名に使えない文字と空白を - にする */
function safe(s) {
  return s
    .replace(/[\s\\/:*?"<>|]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function reportFileName({ date, memberId, memberName, all = false }) {
  if (all) return `${date}_全員.md`;
  const name = memberName ? `_${safe(memberName)}` : '';
  return `${date}_${safe(memberId)}${name}.md`;
}

const defaultRun = (cmd, args) =>
  execFileSync(cmd, args, { encoding: 'utf8', cwd: '/', stdio: ['ignore', 'pipe', 'ignore'] });

/** WSL なら Windows 側のホーム（/mnt/c/Users/...）を返す。分からなければ null */
function windowsHome(run) {
  try {
    const win = run('cmd.exe', ['/c', 'echo %USERPROFILE%']).trim();
    if (!win || win.includes('%')) return null;
    return run('wslpath', ['-u', win]).trim() || null;
  } catch {
    return null;
  }
}

/** PC のダウンロードフォルダ。見つからなければ null */
export function downloadsDir({
  platform = process.platform,
  env = process.env,
  home = homedir(),
  exists = existsSync,
  run = defaultRun,
} = {}) {
  if (platform === 'darwin' || platform === 'win32') return join(home, 'Downloads');
  const candidates = [];
  if (env.WSL_DISTRO_NAME) {
    const winHome = windowsHome(run);
    if (winHome) candidates.push(join(winHome, 'Downloads'));
  }
  if (env.XDG_DOWNLOAD_DIR) candidates.push(env.XDG_DOWNLOAD_DIR);
  candidates.push(join(home, 'Downloads'));
  return candidates.find((d) => exists(d)) ?? null;
}

/** 保存先を決める。dir が null ならリポジトリの reports/ にする */
export function reportPath({ schedule, date, memberId, all, root, dir }) {
  if (!all && !memberId) {
    throw new Error('メンバーが未設定です。./scripts/setup.sh を実行してください');
  }
  const p = findPeriod(schedule, date);
  const name = reportFileName({
    date: p.end,
    memberId,
    memberName: schedule.members?.[memberId]?.name,
    all,
  });
  const fallback = dir === null;
  return { path: join(fallback ? join(root, 'reports') : dir, name), fallback };
}

function main(argv) {
  const s = loadSchedule();
  const all = argv.includes('all');
  const date = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? today(s.timezone);
  const r = reportPath({
    schedule: s,
    date,
    memberId: currentMember(),
    all,
    root: ROOT,
    dir: downloadsDir(),
  });
  mkdirSync(join(r.path, '..'), { recursive: true });
  console.log(r.path);
  if (r.fallback) console.error('ダウンロードフォルダが見つからないため、reports/ に保存します');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
