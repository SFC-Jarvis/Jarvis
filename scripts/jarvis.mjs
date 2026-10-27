#!/usr/bin/env node
// JARVIS 開発補助 CLI（依存なし）。カスタムコマンドと SessionStart フックから呼ばれる。
//   node scripts/jarvis.mjs period   [--date YYYY-MM-DD] [--json]
//   node scripts/jarvis.mjs whoami
//   node scripts/jarvis.mjs tasks    [--period p3] [--member C|all] [--date ...]
//   node scripts/jarvis.mjs progress [--period p3]
//   node scripts/jarvis.mjs context  [YYYY-MM-DD] [--brief]
//   node scripts/jarvis.mjs branch   <slug>
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadSchedule(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'docs/schedule.json'), 'utf8'));
}

export function today(tz = 'Asia/Tokyo') {
  return new Date().toLocaleDateString('sv-SE', { timeZone: tz });
}

export function findPeriod(schedule, date) {
  const ps = schedule.periods;
  return (
    ps.find((p) => p.start <= date && date <= p.end) ?? (date < ps[0].start ? ps[0] : ps.at(-1))
  );
}

export function daysUntil(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function currentMember(root = ROOT, env = process.env) {
  if (env.JARVIS_MEMBER) return env.JARVIS_MEMBER;
  const f = join(root, '.jarvis/member.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8')).id;
  return null;
}

const TASK_RE = /^- \[( |x|X)\] (\S+) \[(S|M|L|-)\] (.+?)(?:\s+@([A-Za-z]+))?\s*$/;
const DONE_RE = /^\s+- 完了条件[:：]\s*(.+)$/;

/** docs/tasks/*.md を読んで [{area, period, id, size, title, owner, done, condition}] を返す */
export function parseTasks(text, area, defaultOwner) {
  const tasks = [];
  let period = null;
  for (const line of text.split('\n')) {
    const h = line.match(/^## (p\d+|final)\b/);
    if (h) {
      period = h[1];
      continue;
    }
    const m = line.match(TASK_RE);
    if (m && period) {
      tasks.push({
        area,
        period,
        done: m[1] !== ' ',
        id: m[2],
        size: m[3],
        title: m[4],
        owner: m[5] ?? defaultOwner,
        condition: '',
      });
      continue;
    }
    const d = line.match(DONE_RE);
    if (d && tasks.length) tasks.at(-1).condition = d[1];
  }
  return tasks;
}

export function loadTasks(schedule, root = ROOT) {
  return Object.entries(schedule.areas).flatMap(([key, a]) => {
    const f = join(root, a.file);
    return existsSync(f) ? parseTasks(readFileSync(f, 'utf8'), key, a.owner) : [];
  });
}

export function isMine(task, member) {
  return member === 'all' || task.owner === member || task.owner === 'all';
}

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const BOOL_FLAGS = new Set(['brief', 'json']);

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next && !next.startsWith('--') && !BOOL_FLAGS.has(a.slice(2))) {
        out[a.slice(2)] = next;
        i++;
      } else out[a.slice(2)] = true;
    } else out._.push(a);
  }
  return out;
}

function fmtTask(t, s) {
  const area = s.areas[t.area]?.name ?? t.area;
  const cond = t.condition ? `\n      完了条件: ${t.condition}` : '';
  return `  - [${t.done ? 'x' : ' '}] ${t.id} [${t.size}] (${area}${t.owner === 'all' ? '・全員' : ''}) ${t.title}${cond}`;
}

function periodLine(p, date) {
  const left = daysUntil(date, p.end);
  return `${p.label}（第${p.week}週・発表 ${p.end}）到達点: ${p.goal} ／ 期間 ${p.start}〜${p.end} ／ 発表まで残り ${left} 日${p.note ? ` ／ ${p.note}` : ''}`;
}

function main(argv) {
  const o = args(argv);
  const [cmd, ...rest] = o._;
  const s = loadSchedule();
  const posDate = rest.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const date = o.date ?? posDate ?? today(s.timezone);
  const p = o.period ? s.periods.find((x) => x.id === o.period) : findPeriod(s, date);
  if (!p) throw new Error(`期間 ${o.period} が docs/schedule.json にありません`);
  const member = o.member ?? currentMember();

  switch (cmd) {
    case 'period':
      console.log(
        o.json
          ? JSON.stringify({ ...p, date, daysLeft: daysUntil(date, p.end) })
          : periodLine(p, date),
      );
      return;
    case 'whoami': {
      if (!member)
        return console.log(
          '未設定: ./scripts/setup.sh を実行するか .jarvis/member.json を作ってください',
        );
      const m = s.members[member];
      const areas = Object.values(s.areas)
        .filter((a) => a.owner === member)
        .map((a) => a.name);
      console.log(
        `${member}（${m?.name ?? '?'} / GitHub: ${m?.github || '未設定'}）主担当の目安: ${areas.join('・') || 'なし'}＋品質保証`,
      );
      return;
    }
    case 'tasks': {
      const ts = loadTasks(s).filter((t) => t.period === p.id && isMine(t, member ?? 'all'));
      console.log(`# ${periodLine(p, date)}\n# 対象: ${member ?? 'all'}`);
      console.log(ts.length ? ts.map((t) => fmtTask(t, s)).join('\n') : '  （該当タスクなし）');
      return;
    }
    case 'progress': {
      const all = loadTasks(s);
      const ids = o.period ? [p.id] : s.periods.map((x) => x.id);
      console.log(
        '| 期間 | ' +
          Object.values(s.areas)
            .map((a) => a.name)
            .join(' | ') +
          ' | 合計 |',
      );
      console.log(
        '|---|' +
          Object.keys(s.areas)
            .map(() => '---|')
            .join('') +
          '---|',
      );
      for (const id of ids) {
        const per = s.periods.find((x) => x.id === id);
        const cells = Object.keys(s.areas).map((k) => {
          const ts = all.filter((t) => t.period === id && t.area === k);
          return ts.length ? `${ts.filter((t) => t.done).length}/${ts.length}` : '—';
        });
        const ts = all.filter((t) => t.period === id);
        const mark = id === findPeriod(s, date).id ? ' ◀ 今' : '';
        console.log(
          `| ${per.label}${mark} | ${cells.join(' | ')} | ${ts.filter((t) => t.done).length}/${ts.length} |`,
        );
      }
      return;
    }
    case 'context': {
      const mine = loadTasks(s).filter((t) => t.period === p.id && isMine(t, member ?? 'all'));
      const open = mine.filter((t) => !t.done);
      const branch = sh('git rev-parse --abbrev-ref HEAD');
      const dirty = sh('git status --porcelain').split('\n').filter(Boolean).length;
      const lines = [
        `[JARVIS] 今日: ${date}`,
        `[JARVIS] 期間: ${periodLine(p, date)}`,
        `[JARVIS] あなた: ${member ?? '未設定（./scripts/setup.sh を実行）'}`,
        `[JARVIS] ブランチ: ${branch || '不明'}（未コミット ${dirty} 件）`,
        `[JARVIS] 未完了タスク ${open.length}/${mine.length} 件`,
      ];
      if (!o.brief) lines.push(...mine.map((t) => fmtTask(t, s)));
      console.log(lines.join('\n'));
      return;
    }
    case 'branch': {
      const slug = (rest[0] ?? 'work')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '');
      console.log(`${(member ?? 'x').toLowerCase()}/${p.id}-${slug}`);
      return;
    }
    default:
      console.log('使い方: node scripts/jarvis.mjs <period|whoami|tasks|progress|context|branch>');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main(process.argv.slice(2));
