# softwarejoe.com

Personal landing page for **Joe Fernandez ("Software Joe")** — an independent
software/AI consultant. Lead-gen funnel: visitor → book a consultation (Cal.com)
or send a message (contact form) → engagement.

## Positioning
**Software-first, AI as the edge.** Joe is a senior software engineer who builds
dependable custom software, with AI layered in where it gives a real edge — *not*
an "AI-only" shop. Audience: founders, small business, mid-market, enterprise.
Outcome framing: faster, leaner, more profitable. Keep messaging confident and
tech-agnostic (don't over-index on AI; don't hedge).

## Stack
- **Astro** (v5, `"type": "module"`, static output). Migrated from plain HTML on 2026-06-19
  to support the SEO content engine. Build step: `npm run build` → `dist/`. `npm run dev` to preview.
- Fonts: Inter + JetBrains Mono. Dark theme; accent green `#4ade80`,
  surface `#141414`, bg `#0a0a0a`. Tokens live in `:root` in `src/styles/global.css`.

### Files / structure
- `src/layouts/BaseLayout.astro` — shared `<head>`: title, description, canonical, OG, Twitter,
  favicon, fonts, `<slot name="head">` for per-page JSON-LD. Props: title, description, image, noindex.
- `src/pages/index.astro` — landing page (hero, value props, 3-tier services, process, contact);
  ProfessionalService JSON-LD; Cal.com loader + `/tracking.js` + `/form.js` (all `is:inline`).
- `src/pages/404.astro`, `src/pages/thanks.astro` — branded, `noindex`.
- `src/styles/global.css` — all styles.
- `public/` — served at root: `form.js` (fetch POST `/api/contact` → redirect `/thanks/`),
  `tracking.js` (UTM/`ref` capture + `data-cta` hooks; no analytics wired yet),
  `favicon.svg`, `og-image.png`, `robots.txt`.
- `api/contact.js` — **Vercel serverless function, ESM** (`export default handler`, no deps).
  Validates form, honeypot, sends via Resend (`noreply@` → `joe@softwarejoe.com`, reply-to visitor).
  Must stay ESM because the project is `"type": "module"`.
- `astro.config.mjs` — `site` + `@astrojs/sitemap` (filters out `/thanks`). Sitemap is
  auto-generated at `/sitemap-index.xml` (no static sitemap.xml).

### Blog / content engine (to build in the SEO phase)
Not yet created. Plan: `src/content.config.ts` (blog collection w/ schema), `src/pages/blog/[...slug].astro`
+ `src/pages/blog/index.astro`, an `ArticleLayout` with Article/FAQ JSON-LD. Articles as Markdown,
published via git (commit → auto-merge → Vercel deploy). Follows the Niche Site Playbook process
(see vault `Projects/Niche Site Playbook/`), adapted for lead-gen (CTA = book consultation, not affiliate).

### Regenerating the OG image
`og-image.png` (in `public/`) is rendered from an inline HTML template via headless Chrome:
write `.og-template.html` (1200×630), then
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot=public/og-image.png --window-size=1200,630 "file://$PWD/.og-template.html"`, then delete the template.

### Regenerating the OG image
`og-image.png` is rendered from an inline HTML template via headless Chrome:
write `.og-template.html` (1200×630), then
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot=og-image.png --window-size=1200,630 "file://$PWD/.og-template.html"`, then delete the template.

## Hosting & deploy
- **Vercel**, project `softwarejoe-com` (team `jfernandezdegodscoms-projects`,
  id `prj_HNYELqipxVPigBRze1IY5phihD9t`). Vercel auto-detects Astro (builds `dist/`)
  and deploys `/api/*` as serverless functions alongside it.
- **Git integration:** push to `master` → auto-deploys production. (No CLI deploy.)
  Verify risky changes on the branch's Vercel **preview** deployment before merging
  (use the Vercel MCP `web_fetch_vercel_url` / `get_access_to_vercel_url` for preview-auth).
- **Domain DNS at GoDaddy:** apex `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`.
  (Was on GitHub Pages before; migrated to Vercel — the old `CNAME` file was removed.)

## Integrations
- **Cal.com** — inline embed of event `softwarejoe/30min` ("Free Strategy Consultation",
  30 min). Themed dark + brand `#4ade80` via `cssVarsPerTheme`. Branding hidden (Cal.com Pro).
  Embedded in the `#book` section; all "Book" buttons scroll to it.
- **Resend** — sends the contact-form email. Requires env var **`RESEND_API_KEY`** set in
  Vercel (Production scope) — without it the function returns "not configured." Domain
  `softwarejoe.com` is verified in Resend (SPF/DKIM DNS records at GoDaddy).
- **Contact:** `joe@softwarejoe.com` (also a visible mailto link on the page).

## Workflow conventions
- **Branch → commit → PR → auto-merge** (squash + delete branch), then sync `master`.
  The user wants PRs auto-merged without being asked. Don't commit straight to `master`.
- Pushing to `master` ships to production via Vercel, so treat merges as deploys.
- **Never commit secrets.** `RESEND_API_KEY` lives only in Vercel env vars.

## Next session focus: SEO push
The user's stated next priority is SEO. Planned scope (refine with them first):
- **Google Search Console** — verify ownership, submit `sitemap.xml`, check coverage.
- **Analytics** — add GA4 or Plausible (decide which); `tracking.js` already has
  `data-cta` hooks + UTM capture ready to wire to events. Needed to measure SEO/ads.
- **Keyword & on-page** — target terms (e.g. "AI consultant", "custom software
  developer", "fractional engineer"); tune headings, copy, internal anchors, alt text.
- **Content/IA** — consider a resources/blog section for ranking long-tail queries.
- **Technical SEO** — Lighthouse/Core Web Vitals pass; add FAQ/Service structured data.

## Open items (housekeeping)
- **`www.softwarejoe.com` SSL** — cert was still not issued ~20 min after DNS setup
  (apex works fine). If still broken, in Vercel → Settings → Domains remove & re-add
  `www` to retrigger the cert.
- **Rotate `RESEND_API_KEY`** — the key was shared in a chat transcript; regenerate a
  send-only key in Resend, update the Vercel env var (Production), redeploy.
