#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { scan } from '../src/scan.js';
import { summarize } from '../src/eaa-mapping.js';
import { renderHtmlReport } from '../src/report.js';

const VERSION = '0.1.0';

const c = process.stdout.isTTY
  ? {
      dim: (s) => `\x1b[2m${s}\x1b[0m`,
      bold: (s) => `\x1b[1m${s}\x1b[0m`,
      red: (s) => `\x1b[31m${s}\x1b[0m`,
      orange: (s) => `\x1b[33m${s}\x1b[0m`,
      green: (s) => `\x1b[32m${s}\x1b[0m`,
      blue: (s) => `\x1b[34m${s}\x1b[0m`,
    }
  : new Proxy({}, { get: () => (s) => s });

const IMPACT_COLOR = { critical: c.red, serious: c.orange, moderate: c.orange, minor: c.blue };

function help() {
  console.log(`
${c.bold('a11yscan')} — accessibility scanner with EAA / EN 301 549 reporting

${c.bold('Usage:')}
  npx a11yscan <url> [options]

${c.bold('Options:')}
  --report <file>   Write a self-contained HTML report
  --json <file>     Write the annotated results as JSON
  --tags <list>     axe tag filter (default: wcag2a,wcag2aa,wcag21aa)
  --timeout <ms>    Navigation timeout in ms (default: 30000)
  --exit-zero       Always exit 0, even when violations are found
  -h, --help        Show this help
  -v, --version     Show version

${c.bold('Examples:')}
  npx a11yscan https://example.com
  npx a11yscan https://example.com --report report.html
  npx a11yscan ./index.html --tags wcag2aa
`);
}

function toUrl(input) {
  if (/^https?:\/\//i.test(input) || /^file:\/\//i.test(input)) return input;
  const abs = resolve(process.cwd(), input);
  if (existsSync(abs)) return pathToFileURL(abs).href;
  return 'https://' + input; // bare domain -> assume https
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        report: { type: 'string' },
        json: { type: 'string' },
        tags: { type: 'string' },
        timeout: { type: 'string' },
        'exit-zero': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (err) {
    console.error(c.red(`Error: ${err.message}`));
    help();
    process.exit(2);
  }

  const { values, positionals } = parsed;
  if (values.version) return console.log(`a11yscan v${VERSION}`);
  if (values.help || positionals.length === 0) return help();

  const url = toUrl(positionals[0]);
  const tags = (values.tags || 'wcag2a,wcag2aa,wcag21aa')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const timeout = values.timeout ? Number(values.timeout) : 30000;

  console.log(c.dim(`\nScanning ${url} …\n`));

  let results;
  try {
    results = await scan(url, { tags, timeout });
  } catch (err) {
    console.error(c.red(`Scan failed: ${err.message}`));
    process.exit(2);
  }

  const summary = summarize(results);

  // ── Terminal summary ──────────────────────────────────────────────
  const scoreTxt = summary.score >= 90 ? c.green : summary.score >= 70 ? c.orange : c.red;
  console.log(`${c.bold('Automated score:')} ${scoreTxt(summary.score + '/100')}`);
  console.log(
    c.dim(
      `${summary.passCount} checks passed · ${summary.violations.length} rule(s) failed · ` +
        `${summary.affectedElements} affected element(s)\n`
    )
  );

  if (summary.violations.length === 0) {
    console.log(c.green('No automated violations found. 🎉'));
  } else {
    for (const v of summary.violations) {
      const paint = IMPACT_COLOR[v.impact] || ((s) => s);
      const wcag = v.wcag.length ? ` ${c.dim('[WCAG ' + v.wcag.join(', ') + ']')}` : '';
      console.log(
        `${paint('●')} ${paint(v.impact.toUpperCase().padEnd(8))} ${v.help} ` +
          `${c.dim('(' + v.nodes.length + ')')}${wcag}`
      );
    }
  }

  console.log(
    c.dim(
      '\nNote: automated scans catch ~30–40% of WCAG issues. A manual audit is still recommended.'
    )
  );

  // ── Outputs ───────────────────────────────────────────────────────
  if (values.report) {
    writeFileSync(values.report, renderHtmlReport(summary), 'utf8');
    console.log(c.green(`\nHTML report written to ${values.report}`));
  }
  if (values.json) {
    writeFileSync(values.json, JSON.stringify(summary, null, 2), 'utf8');
    console.log(c.green(`JSON written to ${values.json}`));
  }

  if (!values['exit-zero'] && summary.violations.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(c.red(err.stack || String(err)));
  process.exit(2);
});
