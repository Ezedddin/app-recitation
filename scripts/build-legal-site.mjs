/**
 * Builds the privacy policy and terms of use as static web pages in
 * legal-site/, from the same source the app shows (src/content/legal.ts).
 * App Store Connect and Google Play both need a public privacy policy URL —
 * deploy legal-site/ to any static host (e.g. Netlify) to get one:
 *   /privacy/  and  /terms/
 *
 * Run with `npm run legal:build`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 23.6+ strips the types when importing a .ts module.
import { LEGAL_DETAILS, LEGAL_DOCUMENTS } from '../src/content/legal.ts';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'legal-site');

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STYLE = `
  :root { color-scheme: light dark; --text: #1c1c1e; --muted: #555; --bg: #fff; --accent: #4a6b52; }
  @media (prefers-color-scheme: dark) { :root { --text: #f2f2f7; --muted: #b0b0b5; --bg: #111; --accent: #9cc3a4; } }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 -apple-system, system-ui, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { margin-bottom: 4px; } h2 { font-size: 18px; margin-top: 28px; }
  p, li { color: var(--muted); } a { color: var(--accent); }
  .updated { font-size: 14px; }
`;

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(LEGAL_DETAILS.appName)}</title>
<style>${STYLE}</style>
</head>
<body><main>
${body}
</main></body>
</html>
`;
}

function renderDocument(doc) {
  const sections = doc.sections
    .map((section) => {
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      const paragraphs = (section.paragraphs ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
      return `<h2>${escapeHtml(section.heading)}</h2>\n${bullets}\n${paragraphs}`;
    })
    .join('\n');
  return page(
    doc.title,
    `<h1>${escapeHtml(doc.title)}</h1>
<p class="updated">Last updated: ${escapeHtml(LEGAL_DETAILS.lastUpdated)}</p>
<p>${escapeHtml(doc.intro)}</p>
${sections}`,
  );
}

rmSync(outDir, { recursive: true, force: true });
for (const doc of Object.values(LEGAL_DOCUMENTS)) {
  mkdirSync(join(outDir, doc.id), { recursive: true });
  writeFileSync(join(outDir, doc.id, 'index.html'), renderDocument(doc));
}
writeFileSync(
  join(outDir, 'index.html'),
  page(
    LEGAL_DETAILS.appName,
    `<h1>${escapeHtml(LEGAL_DETAILS.appName)}</h1>
<ul>${Object.values(LEGAL_DOCUMENTS)
      .map((doc) => `<li><a href="/${doc.id}/">${escapeHtml(doc.title)}</a></li>`)
      .join('')}</ul>`,
  ),
);

const placeholders = JSON.stringify(LEGAL_DETAILS).match(/\[[A-Z ]+\]/g);
if (placeholders) {
  console.warn(`Warning: fill in ${placeholders.join(', ')} in src/content/legal.ts before publishing.`);
}
console.log(`Legal pages written to ${outDir}`);
