# a11yscope

**Fast accessibility scanning with European Accessibility Act reporting — one command, one clear report.**

`a11yscope` runs [axe-core](https://github.com/dequelabs/axe-core) (the industry-standard accessibility engine) against any URL in a headless browser and gives you a readable report. What makes it different: every finding is linked to the **European Accessibility Act (EAA)** via the harmonised standard **EN 301 549**, with a plain-language explanation — so you know not just *what* is broken, but *which law* it touches.

Everything runs locally. No account, no API key, no data leaves your machine.

```bash
npx a11yscope https://example.com --report report.html
```

---

## Why

Since June 2025 the **European Accessibility Act** requires many websites, web shops and digital services in the EU to be accessible. Most teams don't know where they stand. `a11yscope` gives them a 30-second first answer and a report they can act on — or hand to a specialist.

## Features

- 🚀 **One command.** `npx a11yscope <url>` — nothing to install.
- 🇪🇺 **EAA / EN 301 549 mapping.** Each issue is tied to the relevant clause, not just a WCAG number.
- 📄 **Self-contained HTML report.** One file, inline styles — open it anywhere or email it to a client.
- 🤖 **CI-friendly.** Exits non-zero when violations are found, so you can gate pull requests.
- 🔒 **Local & private.** Bundled Chromium + axe-core. No external service.
- 🧩 **JSON output.** Pipe the annotated results into your own tooling.

## Usage

```bash
# Scan a live site and print a summary
npx a11yscope https://example.com

# Write a shareable HTML report
npx a11yscope https://example.com --report report.html

# Scan a local file
npx a11yscope ./dist/index.html

# Only WCAG 2.1 AA rules, as JSON, for your pipeline
npx a11yscope https://example.com --tags wcag21aa --json results.json
```

### Options

| Option | Description |
|---|---|
| `--report <file>` | Write a self-contained HTML report |
| `--json <file>` | Write the annotated results as JSON |
| `--tags <list>` | axe tag filter (default: `wcag2a,wcag2aa,wcag21aa`) |
| `--timeout <ms>` | Navigation timeout (default: `30000`) |
| `--exit-zero` | Always exit `0`, even when violations are found |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

### In CI (GitHub Actions)

```yaml
- run: npx a11yscope https://staging.example.com --report a11y.html
# the step fails if accessibility violations are found
```

## An honest note on automated testing

Automated tools reliably catch **roughly 30–40%** of WCAG issues — things like missing alt text, low contrast and unlabeled controls. They **cannot** judge whether alt text is *meaningful*, whether focus order makes sense, or whether a screen-reader journey actually works. Treat `a11yscope` as a fast first pass, not a compliance certificate. For full EAA conformance you still need a manual audit.

## Need help becoming compliant?

`a11yscope` is built and maintained by **[BoonstraWorks](https://boonstraworks.nl)**. If the scan turns up problems you'd rather have fixed — or you need a full manual accessibility audit for the European Accessibility Act — [get in touch](https://boonstraworks.nl).

## License

[MIT](./LICENSE) © Steven Boonstra (BoonstraWorks). Built on [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems.
