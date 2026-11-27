// Builds the blog from Markdown files. No dependencies.
//
//   node scripts/build-blog.mjs
//
// Input:  content/blog/<slug>.md  (front matter + Markdown body)
// Output: blog/index.html, blog/<slug>.html, sitemap.xml
//
// Front matter fields:
//   title:       כותרת הפוסט (required)
//   date:        2026-11-27 (required, YYYY-MM-DD)
//   description: תקציר קצר לכרטיס ולגוגל (required)
//   tags:        פרסום ממומן, AI (optional, comma separated)
//   cover:       assets/blog/<file>.jpg (optional)
//   draft:       true (optional – skipped when building)

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'content', 'blog');
const OUT = join(ROOT, 'blog');
const SITE = 'https://talmarketing.co.il';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseFrontMatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter (--- ... ---)`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  for (const k of ['title', 'date', 'description']) if (!meta[k]) throw new Error(`${file}: missing "${k}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date must be YYYY-MM-DD`);
  meta.tags = meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  meta.draft = meta.draft === 'true';
  return { meta, body: m[2] };
}

// Inline Markdown: links, images, bold, italics, code.
function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}

// Block Markdown: ## / ### headings, paragraphs, - and 1. lists, > quotes, --- rules.
function markdown(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const html = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { html.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = []; } };
  const flush = () => { flushPara(); flushList(); flushQuote(); };
  for (const line of lines) {
    let m;
    if (!line.trim()) { flush(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) { flush(); const n = m[1].length; html.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^---+\s*$/.test(line)) { flush(); html.push('<hr>'); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote();
      const tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push(m[1]);
      continue;
    }
    if (list && /^\s{2,}/.test(line)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    flushList(); flushQuote();
    para.push(line.trim());
  }
  flush();
  return html.join('\n');
}

const heDate = (d) => new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));
const readMinutes = (text) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));

const head = ({ title, description, url, type = 'website', image }) => `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F9F7F3">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${SITE}/${image}">\n` : ''}<link rel="icon" type="image/png" href="/assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&amp;family=Heebo:wght@300;500;600&amp;family=Jost:wght@300&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog.css">
</head>
<body>
<a class="skip-link" href="#main">דילוג לתוכן הראשי</a>
<header class="b-header">
<div class="b-bar">
<a href="/" class="b-logo" aria-label="Tal Marketing – לעמוד הבית"><img src="/assets/logo.png" alt="" width="52"></a>
<nav aria-label="ניווט ראשי" class="b-nav">
<a href="/">בית</a>
<a href="/#services">שירותים</a>
<a href="/blog" aria-current="${type === 'website' ? 'page' : 'false'}">בלוג</a>
<a class="b-cta" href="https://wa.me/972549599976">לשיחת היכרות</a>
</nav>
</div>
</header>
`;

const foot = `<section class="b-contact" aria-labelledby="b-contact-h">
<div class="b-wrap">
<span class="b-eyebrow" dir="ltr">LET'S TALK</span>
<h2 id="b-contact-h">רוצה שנבנה את זה <span>גם לעסק שלך?</span></h2>
<p>שיחת היכרות קצרה, בלי התחייבות. נבין איפה העסק נמצא היום ומה הצעד הבא.</p>
<div class="b-actions">
<a class="b-btn" href="https://wa.me/972549599976">שליחת הודעה בוואטסאפ</a>
<a class="b-btn b-btn-ghost" href="tel:0549599976"><span dir="ltr">054-959-9976</span></a>
</div>
</div>
</section>
</main>
<footer class="b-footer">
<div class="b-bar">
<span><span dir="ltr">Tal Marketing</span> · טל רחבי · שיווק דיגיטלי, קריאייטיב ו-AI</span>
<span class="b-foot-links"><a href="/blog">בלוג</a><a href="/accessibility">הצהרת נגישות</a></span>
</div>
</footer>
</body>
</html>
`;

function card(p) {
  return `<article class="b-card">
<a href="/blog/${p.slug}" class="b-card-link">
${p.cover ? `<img class="b-card-img" src="/${p.cover}" alt="" loading="lazy">` : `<div class="b-card-art" aria-hidden="true"><span></span><span></span><span></span></div>`}
<div class="b-card-body">
${p.tags.length ? `<div class="b-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
<h2>${esc(p.title)}</h2>
<p>${esc(p.description)}</p>
<span class="b-meta"><time datetime="${p.date}">${heDate(p.date)}</time> · ${p.minutes} דק' קריאה</span>
</div>
</a>
</article>`;
}

// ── Build ──
const posts = readdirSync(SRC)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md")
  .map((f) => {
    const { meta, body } = parseFrontMatter(readFileSync(join(SRC, f), 'utf8'), f);
    return { ...meta, slug: f.replace(/\.md$/, ''), body, minutes: readMinutes(body) };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

for (const [i, p] of posts.entries()) {
  const url = `${SITE}/blog/${p.slug}`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description,
    datePublished: p.date, inLanguage: 'he', mainEntityOfPage: url,
    author: { '@type': 'Person', name: 'טל רחבי', url: SITE }, ...(p.cover ? { image: `${SITE}/${p.cover}` } : {}),
  };
  const others = posts.filter((_, j) => j !== i).slice(0, 2);
  const html = head({ title: `${p.title} | בלוג Tal Marketing`, description: p.description, url, type: 'article', image: p.cover })
    + `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<main id="main" tabindex="-1">
<article class="b-post">
<header class="b-post-head b-wrap">
<a class="b-back" href="/blog">→ כל הפוסטים</a>
${p.tags.length ? `<div class="b-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
<h1>${esc(p.title)}</h1>
<p class="b-lead">${esc(p.description)}</p>
<p class="b-meta">טל רחבי · <time datetime="${p.date}">${heDate(p.date)}</time> · ${p.minutes} דק' קריאה</p>
</header>
${p.cover ? `<img class="b-cover" src="/${p.cover}" alt="">` : ''}
<div class="b-prose b-wrap">
${markdown(p.body)}
</div>
</article>
${others.length ? `<section class="b-more b-wrap-wide" aria-labelledby="b-more-h"><h2 id="b-more-h">עוד מהבלוג</h2><div class="b-grid">${others.map(card).join('\n')}</div></section>` : ''}
` + foot;
  writeFileSync(join(OUT, `${p.slug}.html`), html);
}

const index = head({ title: 'בלוג | Tal Marketing – טל רחבי', description: 'מאמרים וטיפים על שיווק דיגיטלי, פרסום ממומן, אתרים, קריאייטיב ו-AI לעסקים – מטל רחבי.', url: `${SITE}/blog` })
  + `<main id="main" tabindex="-1">
<section class="b-hero b-wrap-wide">
<span class="b-eyebrow" dir="ltr">THE BLOG</span>
<h1>מחשבות, טיפים <span>ומה שעובד בשטח</span></h1>
<p>שיווק דיגיטלי, פרסום ממומן, אתרים ו-AI, בשפה פשוטה ובלי באזוורדס.</p>
</section>
<section class="b-wrap-wide" aria-label="פוסטים">
${posts.length ? `<div class="b-grid">${posts.map(card).join('\n')}</div>` : '<p class="b-empty">פוסטים ראשונים בדרך.</p>'}
</section>
` + foot;
writeFileSync(join(OUT, 'index.html'), index);

const urls = ['', '/blog', ...posts.map((p) => `/blog/${p.slug}`), '/accessibility'];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${posts.length} post(s) → blog/`);
