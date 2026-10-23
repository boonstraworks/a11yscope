/**
 * Standalone HTML report generator.
 *
 * Produces a single self-contained .html file (inline CSS, no external
 * assets) so it can be opened anywhere or emailed to a client. The design is
 * deliberately calm and readable: one accent colour, generous whitespace,
 * clear impact badges.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

const IMPACT_LABEL = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

function scoreColor(score) {
  if (score >= 90) return '#1f8a4c';
  if (score >= 70) return '#b7791f';
  return '#c0392b';
}

function violationCard(v) {
  const wcag = v.wcag.length
    ? v.wcag.map((sc) => `WCAG ${esc(sc)}`).join(', ')
    : '—';
  const en = v.en301549.length ? v.en301549.map(esc).join(', ') : '—';

  const nodes = v.nodes
    .slice(0, 5)
    .map(
      (n) => `
        <li>
          <code class="target">${esc(n.target)}</code>
          <pre class="snippet">${esc(n.html)}</pre>
        </li>`
    )
    .join('');

  const more =
    v.nodes.length > 5
      ? `<p class="more">+ ${v.nodes.length - 5} more element(s) with this issue</p>`
      : '';

  return `
    <article class="violation">
      <header class="v-head">
        <span class="badge badge-${esc(v.impact)}">${esc(IMPACT_LABEL[v.impact] || v.impact)}</span>
        <h3>${esc(v.help)}</h3>
      </header>
      <p class="desc">${esc(v.description)}</p>
      <div class="meta">
        <span><strong>WCAG:</strong> ${wcag}</span>
        <span><strong>EN 301 549:</strong> ${en}</span>
        <span><strong>Elements:</strong> ${v.nodes.length}</span>
      </div>
      <div class="eaa">
        <strong>Wat betekent dit? (EAA / EN 301 549)</strong>
        <p>${esc(v.dutch)}</p>
      </div>
      <details>
        <summary>Affected elements &amp; how to fix</summary>
        <p class="fix"><a href="${esc(v.helpUrl)}" target="_blank" rel="noopener">How to fix: ${esc(v.id)} &rarr;</a></p>
        <ul class="nodes">${nodes}</ul>
        ${more}
      </details>
    </article>`;
}

export function renderHtmlReport(summary) {
  const { score, violations, byImpact, affectedElements, passCount, url, timestamp } = summary;
  const when = new Date(timestamp || Date.now()).toLocaleString('en-GB');
  const color = scoreColor(score);

  const cards = ['critical', 'serious', 'moderate', 'minor']
    .map(
      (k) => `
      <div class="stat">
        <span class="stat-num badge-${k}-text">${byImpact[k] || 0}</span>
        <span class="stat-label">${IMPACT_LABEL[k]}</span>
      </div>`
    )
    .join('');

  const body = violations.length
    ? violations.map(violationCard).join('\n')
    : `<p class="clean">No automated accessibility violations were found. 🎉<br>
       Remember: automated tools catch roughly 30–40% of WCAG issues — a manual check is still recommended.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility report — ${esc(url)}</title>
<style>
  :root { --accent:#2b6cb0; --ink:#1a202c; --muted:#5a6673; --line:#e2e8f0; --bg:#f7f9fc; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 64px; }
  header.top { display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
  h1 { font-size: 1.5rem; margin:0 0 4px; }
  .sub { color:var(--muted); font-size:.9rem; word-break:break-all; }
  .score { text-align:center; }
  .score .num { font-size:3rem; font-weight:700; line-height:1; color:${color}; }
  .score .cap { font-size:.75rem; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .disclaimer { background:#fff8e1; border:1px solid #f0e0a8; border-radius:10px;
                padding:12px 16px; margin:20px 0; font-size:.9rem; color:#6b5900; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:16px 0 28px; }
  .stat { background:#fff; border:1px solid var(--line); border-radius:10px; padding:16px; text-align:center; }
  .stat-num { display:block; font-size:1.8rem; font-weight:700; }
  .stat-label { font-size:.8rem; color:var(--muted); }
  .badge-critical-text{color:#c0392b;} .badge-serious-text{color:#d35400;}
  .badge-moderate-text{color:#b7791f;} .badge-minor-text{color:#2b6cb0;}
  .violation { background:#fff; border:1px solid var(--line); border-left:4px solid var(--accent);
               border-radius:10px; padding:20px; margin:0 0 16px; }
  .v-head { display:flex; align-items:center; gap:12px; }
  .v-head h3 { margin:0; font-size:1.1rem; }
  .badge { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
           padding:3px 9px; border-radius:999px; color:#fff; white-space:nowrap; }
  .badge-critical{background:#c0392b;} .badge-serious{background:#d35400;}
  .badge-moderate{background:#b7791f;} .badge-minor{background:#2b6cb0;}
  .desc { color:var(--muted); margin:10px 0; }
  .meta { display:flex; gap:20px; flex-wrap:wrap; font-size:.85rem; color:var(--muted);
          border-top:1px solid var(--line); padding-top:12px; }
  .eaa { background:#eef5fb; border-radius:8px; padding:12px 14px; margin:14px 0; font-size:.92rem; }
  .eaa strong { color:var(--accent); }
  .eaa p { margin:6px 0 0; }
  details { margin-top:10px; }
  summary { cursor:pointer; font-weight:600; font-size:.9rem; color:var(--accent); }
  .fix a { color:var(--accent); }
  ul.nodes { list-style:none; padding:0; margin:12px 0 0; }
  ul.nodes li { margin:0 0 12px; }
  code.target { background:#f0f4f8; padding:2px 6px; border-radius:4px; font-size:.82rem; }
  pre.snippet { background:#1a202c; color:#e2e8f0; padding:10px 12px; border-radius:6px;
                overflow:auto; font-size:.8rem; margin:6px 0 0; }
  .more { font-size:.85rem; color:var(--muted); }
  .clean { background:#fff; border:1px solid var(--line); border-radius:10px; padding:24px; text-align:center; }
  footer { margin-top:40px; padding-top:20px; border-top:1px solid var(--line);
           font-size:.85rem; color:var(--muted); text-align:center; }
  footer a { color:var(--accent); font-weight:600; text-decoration:none; }
  .cta { background:var(--accent); color:#fff; border-radius:10px; padding:18px 20px;
         margin-top:28px; text-align:center; }
  .cta a { color:#fff; font-weight:700; }
</style>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <div>
        <h1>Accessibility report</h1>
        <div class="sub">${esc(url)}</div>
        <div class="sub">${esc(when)}</div>
      </div>
      <div class="score">
        <div class="num">${score}</div>
        <div class="cap">Automated score</div>
      </div>
    </header>

    <div class="disclaimer">
      This is an <strong>automated</strong> scan (axe-core). Automated tools reliably catch roughly
      30–40% of WCAG issues — things like keyboard traps, focus order and meaningful alt text still
      need a human check. Use this as a fast first pass, not a compliance certificate.
    </div>

    <div class="stats">
      ${cards}
      <div class="stat"><span class="stat-num">${passCount}</span><span class="stat-label">Passed checks</span></div>
      <div class="stat"><span class="stat-num">${affectedElements}</span><span class="stat-label">Affected elements</span></div>
    </div>

    <h2>Findings</h2>
    ${body}

    <div class="cta">
      Need the remaining issues fixed, or a full manual audit for the European Accessibility Act?<br>
      <a href="https://boonstraworks.nl" target="_blank" rel="noopener">BoonstraWorks helps you become compliant &rarr;</a>
    </div>

    <footer>
      Generated by <a href="https://boonstraworks.nl" target="_blank" rel="noopener">a11yscope</a>
      — an open-source accessibility scanner by BoonstraWorks. Powered by axe-core.
    </footer>
  </div>
</body>
</html>`;
}
