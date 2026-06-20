#!/usr/bin/env node
// Generate branded 1200x630 OG images (one per page/article) into public/og/.
// Re-run anytime: `npm run og`. Reads blog frontmatter automatically.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'og');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

// Static pages (slug used for /og/<slug>.png + the page's image prop)
const pages = [
  { slug: 'home', eyebrow: 'Software that moves your business', title: 'Custom software &amp; AI that makes business faster, leaner, more profitable.' },
  { slug: 'ai-consulting-for-small-business', eyebrow: 'AI Consulting', title: 'AI Consulting for Small Business' },
  { slug: 'custom-software-development', eyebrow: 'Custom Software', title: 'Custom Software Development' },
  { slug: 'software-developer-ventura-county', eyebrow: 'Ventura County, CA', title: 'Software Developer in Ventura County' },
  { slug: 'about', eyebrow: 'About', title: 'The engineer behind Software Joe' },
  { slug: 'blog', eyebrow: 'Blog', title: 'Software &amp; AI, minus the hype' },
];

// Blog articles from frontmatter
const blogDir = path.join(ROOT, 'src', 'content', 'blog');
for (const file of fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
  const src = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const title = (src.match(/^title:\s*["'](.+?)["']\s*$/m) || [])[1];
  if (title) {
    pages.push({
      slug: file.replace(/\.md$/, ''),
      eyebrow: 'Blog',
      title: title.replace(/&/g, '&amp;'),
    });
  }
}

const tpl = (eyebrow, title) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1200px; height:630px; background:radial-gradient(circle at 75% 20%, rgba(74,222,128,0.18) 0%, #0a0a0a 55%);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; color:#e8e8e8;
  display:flex; flex-direction:column; justify-content:center; padding:90px; }
.eyebrow { font-family:'JetBrains Mono',monospace; color:#4ade80; text-transform:uppercase;
  letter-spacing:4px; font-size:24px; margin-bottom:28px; }
h1 { font-size:68px; font-weight:800; line-height:1.07; letter-spacing:-2px; max-width:1000px; }
.brand { position:absolute; bottom:70px; left:90px; font-size:30px; font-weight:800; letter-spacing:-1px; }
.dot { color:#4ade80; }
</style></head><body>
<div class="eyebrow">&#9679; ${eyebrow}</div>
<h1>${title}</h1>
<div class="brand">software<span class="dot">joe</span>.com</div>
</body></html>`;

for (const p of pages) {
  const tmp = path.join(ROOT, `.og-${p.slug}.html`);
  fs.writeFileSync(tmp, tpl(p.eyebrow, p.title));
  execSync(
    `"${CHROME}" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="${path.join(OUT, p.slug + '.png')}" "file://${tmp}"`,
    { stdio: 'ignore' }
  );
  fs.unlinkSync(tmp);
  console.log('  ✓ og/' + p.slug + '.png');
}
console.log(`Generated ${pages.length} OG images.`);
