#!/usr/bin/env node
// Inspect index status of URLs via the Search Console URL Inspection API.
// Dependency-free. Reuses the same service-account key as gsc.mjs.
//
// Usage:
//   node scripts/gsc-inspect.mjs                 # inspect every URL in the live sitemap
//   node scripts/gsc-inspect.mjs <url> [<url>..] # inspect specific URLs

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const KEY_PATH = process.env.GSC_KEY || `${homedir()}/.config/softwarejoe/gsc-key.json`;
const SITE = process.env.GSC_SITE || 'sc-domain:softwarejoe.com';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function token() {
  const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
  const iat = Math.floor(Date.now() / 1000);
  const claim = { iss: key.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 };
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claim))}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const d = await res.json();
  if (!res.ok) { console.error('token error', d); process.exit(1); }
  return d.access_token;
}

async function sitemapUrls() {
  const idx = await (await fetch('https://softwarejoe.com/sitemap-index.xml')).text();
  const childs = [...idx.matchAll(/<loc>([^<]+\.xml)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const c of childs) {
    const xml = await (await fetch(c)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return urls;
}

async function inspect(tok, url) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE, languageCode: 'en-US' }),
  });
  const d = await res.json();
  if (!res.ok) return { url, error: d?.error?.message || JSON.stringify(d) };
  const r = d.inspectionResult?.indexStatusResult || {};
  return {
    url,
    verdict: r.verdict,                 // PASS / NEUTRAL / FAIL
    coverage: r.coverageState,          // e.g. "Submitted and indexed" / "Crawled - currently not indexed"
    robots: r.robotsTxtState,
    indexingState: r.indexingState,
    lastCrawl: r.lastCrawlTime ? r.lastCrawlTime.slice(0, 10) : '—',
    googleCanonical: r.googleCanonical,
  };
}

const tok = await token();
const urls = process.argv.slice(2).length ? process.argv.slice(2) : await sitemapUrls();

console.log(`\nURL Inspection — ${SITE}   (${urls.length} URLs)\n`);
const rows = [];
for (const u of urls) {
  rows.push(await inspect(tok, u));
}

const path = (u) => u.replace('https://softwarejoe.com', '') || '/';
const w = Math.max(...rows.map((r) => path(r.url).length), 4);
console.log(`${'path'.padEnd(w)}  verdict   lastCrawl   coverage`);
console.log(`${'-'.repeat(w)}  -------   ---------   --------`);
for (const r of rows) {
  if (r.error) { console.log(`${path(r.url).padEnd(w)}  ERROR     —           ${r.error}`); continue; }
  console.log(`${path(r.url).padEnd(w)}  ${(r.verdict || '—').padEnd(7)}   ${(r.lastCrawl || '—').padEnd(9)}   ${r.coverage || '—'}`);
}

const indexed = rows.filter((r) => r.coverage && /indexed/i.test(r.coverage) && !/not indexed/i.test(r.coverage)).length;
const notIndexed = rows.length - indexed;
console.log(`\n${indexed}/${rows.length} indexed · ${notIndexed} not yet indexed\n`);
