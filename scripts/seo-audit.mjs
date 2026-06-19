#!/usr/bin/env node
// On-page SEO audit — reproduces the core Rank Math checklist for any URL.
// Usage: node scripts/seo-audit.mjs <url> "<focus keyword>"
// Example: node scripts/seo-audit.mjs https://softwarejoe.com/ai-consulting-for-small-business/ "ai consulting for small business"

const url = process.argv[2];
const kw = (process.argv[3] || '').toLowerCase();

if (!url || !kw) {
  console.error('Usage: node scripts/seo-audit.mjs <url> "<focus keyword>"');
  process.exit(1);
}

// A loose keyword match: also matches the first 2-3 significant words (e.g. "ai consulting").
const kwStem = kw.split(' ').slice(0, 2).join(' ');
const hasKw = (s) => s.toLowerCase().includes(kw) || s.toLowerCase().includes(kwStem);

const html = await (await fetch(url)).text();
const pick = (re) => (html.match(re)?.[1] || '').trim();

const title = pick(/<title>([^<]*)<\/title>/i);
const desc = pick(/name="description" content="([^"]*)"/i);
const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
const canonical = /rel="canonical"/.test(html);
const schemaCount = (html.match(/application\/ld\+json/g) || []).length;
const ogImage = /property="og:image"/.test(html);

const body = (html.split(/<\/header>/i)[1] || html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ');
const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = text.split(' ').filter(Boolean).length;
const first100 = text.split(' ').slice(0, 100).join(' ');
const headings = (html.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi) || []).map((h) =>
  h.replace(/<[^>]+>/g, '')
);
const kwHeadings = headings.filter((h) => hasKw(h)).length;
const internalLinks = (html.match(/href="(\/[^"#][^"]*|https:\/\/softwarejoe\.com[^"]*)"/g) || []).length;
const imgs = html.match(/<img\b[^>]*>/gi) || [];
const imgsNoAlt = imgs.filter((i) => !/\balt=/.test(i)).length;

let pass = 0;
const checks = [];
const add = (label, ok, detail = '') => { checks.push({ label, ok, detail }); if (ok) pass++; };

add('Focus keyword in <title>', hasKw(title), `"${title}"`);
add('Title length ≤ 60', title.length > 0 && title.length <= 60, `${title.length} chars`);
add('Meta description present & ≤ 160', desc.length > 0 && desc.length <= 160, `${desc.length} chars`);
add('Focus keyword in meta description', hasKw(desc));
add('Focus keyword in H1', hasKw(h1), `"${h1}"`);
add('Focus keyword in first 100 words', hasKw(first100));
add('Focus keyword in ≥ 2 subheadings', kwHeadings >= 2, `${kwHeadings} of ${headings.length}`);
add('Word count ≥ 600', words >= 600, `${words} words`);
add('Internal links ≥ 2', internalLinks >= 2, `${internalLinks} links`);
add('Structured data (JSON-LD)', schemaCount >= 1, `${schemaCount} block(s)`);
add('Canonical tag', canonical);
add('OG image', ogImage);
add('All images have alt text', imgsNoAlt === 0, imgs.length ? `${imgsNoAlt} missing of ${imgs.length}` : 'no images');

const score = Math.round((pass / checks.length) * 100);
console.log(`\nON-PAGE SEO AUDIT — ${url}`);
console.log(`Focus keyword: "${kw}"`);
console.log(`Score: ${pass}/${checks.length}  (${score}%)\n`);
for (const c of checks) console.log(`${c.ok ? '✅' : '❌'} ${c.label}${c.detail ? '  — ' + c.detail : ''}`);
console.log('');
process.exit(checks.every((c) => c.ok) ? 0 : 1);
