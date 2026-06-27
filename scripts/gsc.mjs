#!/usr/bin/env node
// Query Google Search Console (Search Analytics) headlessly via a service account.
// Dependency-free: signs the OAuth2 JWT with Node's built-in crypto, no npm install.
//
// Setup (one-time): create a GCP service account, enable the Search Console API,
// download its JSON key to ~/.config/softwarejoe/gsc-key.json, and add the service
// account's email as a user on the sc-domain:softwarejoe.com property in GSC.
//
// Usage:
//   node scripts/gsc.mjs --days 90 --dim query --limit 50
//   node scripts/gsc.mjs --dim page --days 28
//   node scripts/gsc.mjs --dim query,page --days 90 --limit 100
//   node scripts/gsc.mjs --start 2026-04-01 --end 2026-06-26 --dim query
//   node scripts/gsc.mjs --json            # raw JSON (for machine parsing)
//
// Env overrides: GSC_KEY (key path), GSC_SITE (default sc-domain:softwarejoe.com)

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const KEY_PATH = process.env.GSC_KEY || `${homedir()}/.config/softwarejoe/gsc-key.json`;
const SITE = process.env.GSC_SITE || 'sc-domain:softwarejoe.com';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// --- date range ---
const fmt = (d) => d.toISOString().slice(0, 10);
const days = parseInt(opt('days', '90'), 10);
const now = new Date();
// GSC data lags ~2-3 days; end 3 days back unless explicitly set
const defEnd = new Date(now.getTime() - 3 * 86400000);
const end = opt('end', fmt(defEnd));
const start = opt('start', fmt(new Date(new Date(end).getTime() - days * 86400000)));

const dims = opt('dim', 'query').split(',').map((s) => s.trim());
const rowLimit = parseInt(opt('limit', '50'), 10);

function loadKey() {
  let raw;
  try {
    raw = readFileSync(KEY_PATH, 'utf8');
  } catch {
    console.error(`\n✖ No key at ${KEY_PATH}\n  Set GSC_KEY or drop the service-account JSON there.\n`);
    process.exit(1);
  }
  return JSON.parse(raw);
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(key) {
  const iat = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp: iat + 3600,
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key);
  const jwt = `${unsigned}.${b64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('\n✖ Token error:', JSON.stringify(data, null, 2), '\n');
    process.exit(1);
  }
  return data.access_token;
}

async function query(token) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: dims, rowLimit }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('\n✖ Query error:', JSON.stringify(data, null, 2), '\n');
    if (data?.error?.message?.match(/permission|forbidden/i)) {
      console.error('  → Make sure the service-account email is added as a user on the GSC property.\n');
    }
    process.exit(1);
  }
  return data.rows || [];
}

function printTable(rows) {
  if (!rows.length) {
    console.log('\n(no rows — either no data in range, or property/permission not set up yet)\n');
    return;
  }
  const head = [...dims, 'clicks', 'impr', 'ctr%', 'pos'];
  const body = rows.map((r) => [
    ...r.keys,
    String(r.clicks),
    String(r.impressions),
    (r.ctr * 100).toFixed(1),
    r.position.toFixed(1),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  console.log(`\n${SITE}   ${start} → ${end}   (${dims.join(' × ')})\n`);
  console.log(line(head));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  body.forEach((b) => console.log(line(b)));
  const tc = rows.reduce((s, r) => s + r.clicks, 0);
  const ti = rows.reduce((s, r) => s + r.impressions, 0);
  console.log(`\nTotals: ${tc} clicks, ${ti} impressions, ${ti ? ((tc / ti) * 100).toFixed(2) : '0'}% CTR across ${rows.length} rows\n`);
}

const key = loadKey();
const token = await getAccessToken(key);
const rows = await query(token);
if (flag('json')) console.log(JSON.stringify({ site: SITE, start, end, dims, rows }, null, 2));
else printTable(rows);
