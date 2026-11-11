// 進捗ページのデータを集める（依存なし）。
// 今いるブランチに左右されないように、origin/main と各 PR の先頭コミットからタスクを読む。
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { daysUntil, findPeriod, isMine, parseTasks, ROOT, today } from './jarvis.mjs';

const execFileAsync = promisify(execFile);
const OID_RE = /^[0-9a-f]{40}$/;
const PR_FIELDS = 'number,title,url,isDraft,headRefName,headRefOid,author,additions,deletions,body';

const NETWORK_RE =
  /Could not resolve host|error connecting to|check your internet|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNREFUSED|ECONNRESET|Network is unreachable|timed out/i;
const AUTH_RE = /gh auth login|not logged in|authentication|HTTP 401|Bad credentials/i;
const MISSING_RE = /ENOENT|command not found/i;
const NO_MAIN = '（main の情報だけを表示しています）';

/** gh pr list の失敗の原因（エラー文）から、画面に出す警告の文を作る */
export function describeGhFailure(message) {
  if (NETWORK_RE.test(message))
    return `GitHub につながらなかったため、未マージの PR を読めませんでした。ネットの接続を確認してください${NO_MAIN}`;
  if (AUTH_RE.test(message))
    return `GitHub にログインしていないため、未マージの PR を読めませんでした。\`gh auth login\` を実行してください${NO_MAIN}`;
  if (MISSING_RE.test(message))
    return `gh（GitHub CLI）が見つからないため、未マージの PR を読めませんでした。docs/SETUP.md の手順で入れてください${NO_MAIN}`;
  return `未マージの PR を読めませんでした。原因は進捗サーバーのログ（dev.sh の progress ウィンドウ）に出ています${NO_MAIN}`;
}

/** git fetch の失敗の原因（エラー文）から、画面に出す警告の文を作る */
export function describeFetchFailure(message) {
  if (NETWORK_RE.test(message))
    return 'GitHub につながらなかったため、前回取得した内容で表示しています。ネットの接続を確認してください';
  return '最新の情報を取得できなかったので、前回取得した内容で表示しています。原因は進捗サーバーのログに出ています';
}

const errorText = (e) => (e instanceof Error ? e.message : String(e));

async function runCommand(cmd, args) {
  const { stdout } = await execFileAsync(cmd, args, {
    cwd: ROOT,
    timeout: 30_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout;
}

// 今後の予定として触れただけのものを除くため、本文のチェックリストの行だけを見る
function listedInChecklist(body, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*- \\[[ xX~]\\] ${escaped}(?![A-Za-z0-9-])`, 'm').test(body ?? '');
}

// 全員担当のタスクは 1 つのチェックを共有するので、PR の作者以外のカードには PR の状況を出さない
function forMember(task, githubLogin, prs) {
  if (task.owner !== 'all' || task.status === 'merged') return task;
  const isOwn = (number) => prs.some((pr) => pr.number === number && pr.author === githubLogin);
  const doneInPrs = task.doneInPrs.filter(isOwn);
  const partialInPrs = task.partialInPrs.filter(isOwn);
  const mentionedInPrs = task.mentionedInPrs.filter(isOwn);
  let status = 'open';
  if (doneInPrs.length) status = 'pr';
  else if (task.partial || partialInPrs.length) status = 'partial';
  else if (mentionedInPrs.length) status = 'working';
  return { ...task, status, doneInPrs, partialInPrs, mentionedInPrs };
}

/** main のタスクに、未マージの PR の状況を重ねて status（merged / pr / partial / working / open）を付ける */
export function mergeTaskStatus(mainTasks, prs) {
  return mainTasks.map((t) => {
    const doneInPrs = prs
      .filter((pr) => pr.tasks.some((x) => x.id === t.id && x.done))
      .map((pr) => pr.number);
    const partialInPrs = prs
      .filter((pr) => !doneInPrs.includes(pr.number))
      .filter((pr) => pr.tasks.some((x) => x.id === t.id && x.partial))
      .map((pr) => pr.number);
    const counted = [...doneInPrs, ...partialInPrs];
    const mentionedInPrs = prs
      .filter((pr) => !counted.includes(pr.number) && listedInChecklist(pr.body, t.id))
      .map((pr) => pr.number);
    let status = 'open';
    if (t.done) status = 'merged';
    else if (doneInPrs.length) status = 'pr';
    else if (t.partial || partialInPrs.length) status = 'partial';
    else if (mentionedInPrs.length) status = 'working';
    return { ...t, status, doneInPrs, partialInPrs, mentionedInPrs };
  });
}

function summarize(tasks) {
  const count = (status) => tasks.filter((t) => t.status === status).length;
  return {
    total: tasks.length,
    merged: count('merged'),
    pr: count('pr'),
    partial: count('partial'),
    working: count('working'),
    open: count('open'),
  };
}

export function buildProgress({ schedule, mainTasks, prs, date, fetchedAt, warnings = [] }) {
  const tasks = mergeTaskStatus(mainTasks, prs);
  const current = findPeriod(schedule, date);
  const inCurrent = tasks.filter((t) => t.period === current.id);
  return {
    date,
    fetchedAt,
    warnings,
    prs,
    current: { ...current, daysLeft: daysUntil(date, current.end) },
    overall: summarize(tasks),
    periods: schedule.periods.map((p) => {
      const inPeriod = tasks.filter((t) => t.period === p.id);
      return {
        ...p,
        isCurrent: p.id === current.id,
        summary: summarize(inPeriod),
        tasks: inPeriod,
      };
    }),
    members: Object.entries(schedule.members)
      .map(([id, m]) => {
        const mine = inCurrent.filter((t) => isMine(t, id)).map((t) => forMember(t, m.github, prs));
        return { id, name: m.name, summary: summarize(mine), tasks: mine };
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

async function readTasksAt(schedule, ref, run) {
  const results = await Promise.all(
    Object.entries(schedule.areas).map(async ([key, area]) => {
      try {
        return {
          ok: true,
          tasks: parseTasks(await run('git', ['show', `${ref}:${area.file}`]), key, area.owner),
        };
      } catch {
        return { ok: false, tasks: [] };
      }
    }),
  );
  return { readable: results.some((r) => r.ok), tasks: results.flatMap((r) => r.tasks) };
}

async function loadOpenPrs(schedule, run, warnings) {
  let raw;
  try {
    const out = await run('gh', [
      'pr',
      'list',
      '--state',
      'open',
      '--limit',
      '50',
      '--json',
      PR_FIELDS,
    ]);
    raw = JSON.parse(out);
  } catch (e) {
    console.error('gh pr list に失敗:', errorText(e));
    warnings.push(describeGhFailure(errorText(e)));
    return [];
  }
  return Promise.all(
    raw.map(async (pr) => {
      const shape = {
        number: pr.number,
        title: pr.title,
        url: pr.url,
        isDraft: pr.isDraft,
        branch: pr.headRefName,
        author: pr.author?.login ?? '不明',
        additions: pr.additions,
        deletions: pr.deletions,
        body: pr.body,
        tasks: [],
      };
      const read = OID_RE.test(pr.headRefOid)
        ? await readTasksAt(schedule, pr.headRefOid, run)
        : { readable: false, tasks: [] };
      if (!read.readable) warnings.push(`#${pr.number} のタスクを読めませんでした`);
      return { ...shape, tasks: read.tasks };
    }),
  );
}

/** git と gh から最新の進捗を集める。run を差し替えればテストで外部に接続しない */
export async function collectProgress({ run = runCommand, date, now = () => new Date() } = {}) {
  const warnings = [];
  try {
    await run('git', ['fetch', '--quiet', 'origin']);
  } catch (e) {
    console.error('git fetch に失敗:', errorText(e));
    warnings.push(describeFetchFailure(errorText(e)));
  }
  const schedule = JSON.parse(await run('git', ['show', 'origin/main:docs/schedule.json']));
  const { tasks: mainTasks } = await readTasksAt(schedule, 'origin/main', run);
  const prs = await loadOpenPrs(schedule, run, warnings);
  return buildProgress({
    schedule,
    mainTasks,
    prs,
    date: date ? date() : today(schedule.timezone),
    fetchedAt: now().toLocaleString('sv-SE', { timeZone: schedule.timezone }),
    warnings,
  });
}
