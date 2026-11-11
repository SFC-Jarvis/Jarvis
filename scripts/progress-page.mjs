// 進捗ページの HTML を作る（依存なし・JavaScript なし）。外から来た文字列は必ず esc() を通す。
const STATUS = {
  merged: { label: '完了（main）', cls: 'merged' },
  pr: { label: '完了（未マージ）', cls: 'pr' },
  partial: { label: '部分的に完了', cls: 'partial' },
  working: { label: '作業中（PR あり）', cls: 'working' },
  open: { label: '未完了', cls: 'open' },
};

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pct(n, total) {
  return total ? (n / total) * 100 : 0;
}

function bar(s) {
  const parts = ['merged', 'pr', 'partial', 'working']
    .filter((k) => s[k] > 0)
    .map((k) => `<span class="seg ${k}" style="width:${pct(s[k], s.total).toFixed(2)}%"></span>`)
    .join('');
  return `<div class="bar" role="img" aria-label="${s.merged + s.pr} / ${s.total} 件完了">${parts}</div>`;
}

function counts(s) {
  return `<p class="counts"><b>${s.merged + s.pr} / ${s.total}</b> 件完了
    <span>（main ${s.merged}・未マージ ${s.pr}・部分 ${s.partial ?? 0}・作業中 ${s.working}・未完了 ${s.open}）</span></p>`;
}

function prRefs(numbers) {
  return numbers.map((n) => `<a href="#pr-${esc(n)}">#${esc(n)}</a>`).join(' ');
}

function taskRow(t) {
  const st = STATUS[t.status] ?? STATUS.open;
  const refs = prRefs([
    ...(t.doneInPrs ?? []),
    ...(t.partialInPrs ?? []),
    ...(t.mentionedInPrs ?? []),
  ]);
  const rest = t.status === 'partial' && t.remaining ? ` ・ 残り: ${esc(t.remaining)}` : '';
  return `<li>
    <span class="badge ${st.cls}">${st.label}</span>
    <span class="task"><code>${esc(t.id)}</code> ${esc(t.title)}
      <small>${t.owner === 'all' ? '全員' : `担当 ${esc(t.owner)}`}${refs ? ` ・ ${refs}` : ''}${rest}</small></span>
  </li>`;
}

function memberCard(m) {
  return `<section class="card">
    <h3>${esc(m.id)}<small> ${esc(m.name)}</small></h3>
    ${bar(m.summary)}${counts(m.summary)}
    <ul class="tasks">${m.tasks.map(taskRow).join('') || '<li class="muted">今期のタスクなし</li>'}</ul>
  </section>`;
}

function periodBlock(p) {
  return `<details${p.isCurrent ? ' open' : ''}>
    <summary>
      <span class="plabel">${esc(p.label)}${p.isCurrent ? ' <em>今</em>' : ''}</span>
      <span class="pgoal">${esc(p.end)} ・ ${esc(p.goal)}</span>
      ${bar(p.summary)}
      <span class="pcount">${p.summary.merged + p.summary.pr} / ${p.summary.total}</span>
    </summary>
    <ul class="tasks">${p.tasks.map(taskRow).join('') || '<li class="muted">タスクなし</li>'}</ul>
  </details>`;
}

function prRow(pr) {
  const safeUrl = /^https:\/\/github\.com\//.test(pr.url ?? '') ? pr.url : null;
  const title = `#${esc(pr.number)} ${esc(pr.title)}`;
  const done = (pr.tasks ?? []).filter((t) => t.done).length;
  return `<li id="pr-${esc(pr.number)}">
    <span class="badge ${pr.isDraft ? 'open' : 'working'}">${pr.isDraft ? 'Draft' : 'レビュー待ち'}</span>
    <span class="task">${safeUrl ? `<a href="${esc(safeUrl)}" rel="noreferrer">${title}</a>` : title}
      <small>${esc(pr.author)} ・ <code>${esc(pr.branch)}</code> ・ +${esc(pr.additions)}/-${esc(pr.deletions)} ・ このブランチのタスク完了 ${done} 件</small></span>
  </li>`;
}

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0a0a0a;color:#f5f5f5;font:15px/1.6 system-ui,"Hiragino Sans","Yu Gothic UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 20px 56px}
a{color:#7dd3fc}
h1{margin:0;font-size:24px}
h2{margin:32px 0 12px;font-size:17px}
h3{margin:0 0 8px;font-size:17px}
h3 small{color:#a3a3a3;font-weight:400;font-size:13px}
header{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;justify-content:space-between}
.muted,small,.counts span,.pgoal{color:#a3a3a3}
small{display:block;font-size:12px}
.hero,.card{background:#171717;border:1px solid #262626;border-radius:10px;padding:16px}
.hero{margin-top:16px}
.hero .days{font-size:30px;font-weight:700}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
.bar{display:flex;height:10px;background:#262626;border-radius:5px;overflow:hidden;margin:8px 0}
.seg.merged{background:#22c55e}.seg.pr{background:#38bdf8}.seg.partial{background:#a78bfa}.seg.working{background:#f59e0b}
.counts{margin:0 0 8px}
.tasks{list-style:none;margin:0;padding:0}
.tasks li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid #262626}
.task{min-width:0;overflow-wrap:anywhere}
code{color:#d4d4d4;font-size:12px}
.badge{flex:none;width:118px;padding:1px 6px;border:1px solid;border-radius:5px;font-size:11px;text-align:center}
.badge.merged{color:#4ade80}.badge.pr{color:#7dd3fc}.badge.partial{color:#c4b5fd}.badge.working{color:#fbbf24}.badge.open{color:#a3a3a3}
.legend{display:flex;flex-wrap:wrap;gap:4px 16px;margin:8px 0 0;font-size:12px;color:#a3a3a3}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
.dot.merged{background:#22c55e}.dot.pr{background:#38bdf8}.dot.partial{background:#a78bfa}.dot.working{background:#f59e0b}.dot.open{background:#404040}
details{background:#171717;border:1px solid #262626;border-radius:10px;margin-bottom:8px;padding:0 16px}
summary{display:grid;grid-template-columns:90px minmax(0,1fr) 160px 60px;gap:12px;align-items:center;padding:12px 0;cursor:pointer}
summary .bar{margin:0}
.pcount{text-align:right}
em{color:#fbbf24;font-style:normal;font-size:11px}
.warn{margin:16px 0 0;padding:10px 14px;border:1px solid #92400e;border-radius:8px;background:#27190a;color:#fde68a}
.warn p{margin:0}
@media(max-width:640px){summary{grid-template-columns:1fr 60px}.pgoal,summary .bar{grid-column:1/-1}.badge{width:92px}}
`;

function shell(title, body) {
  return `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8">
<meta name="color-scheme" content="dark">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head><body><main>${body}</main></body></html>`;
}

export function renderPage(p) {
  const warnings = p.warnings.length
    ? `<div class="warn">${p.warnings.map((w) => `<p>${esc(w)}</p>`).join('')}</div>`
    : '';
  const prs = p.prs.length
    ? `<ul class="tasks">${p.prs.map(prRow).join('')}</ul>`
    : '<p class="muted">未マージの PR はありません</p>';
  const body = `
<header>
  <h1>JARVIS 進捗</h1>
  <small>${esc(p.fetchedAt)} 時点 ・ <a href="/?refresh=1">最新にする</a></small>
</header>
${warnings}
<section class="hero">
  <small>今の期間: ${esc(p.current.label)} ・ 到達点: ${esc(p.current.goal)}</small>
  <div class="days">発表まで残り ${esc(p.current.daysLeft)} 日 <small>（${esc(p.current.end)}）</small></div>
  <h3>全体</h3>
  ${bar(p.overall)}${counts(p.overall)}
  <p class="legend">
    <span><i class="dot merged"></i>完了（main）</span>
    <span><i class="dot pr"></i>完了（未マージの PR で [x]）</span>
    <span><i class="dot partial"></i>部分的に完了（[~]。確認などが残っている）</span>
    <span><i class="dot working"></i>作業中（PR のチェックリストにあり）</span>
    <span><i class="dot open"></i>未完了</span>
  </p>
</section>
<h2>メンバー別（${esc(p.current.label)}）</h2>
<div class="cards">${p.members.map(memberCard).join('')}</div>
<h2>期間ごと</h2>
${p.periods.map(periodBlock).join('')}
<h2>未マージの PR（${p.prs.length} 件）</h2>
<section class="card">${prs}</section>`;
  return shell('JARVIS 進捗', body);
}

export function renderError(message) {
  return shell('JARVIS 進捗', `<h1>JARVIS 進捗</h1><div class="warn"><p>${esc(message)}</p></div>`);
}
