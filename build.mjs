// Generador estático sin dependencias. Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import es from './content/es.mjs';
import en from './content/en.mjs';
import { CONTACT_EMAIL, SITE_URL, APP_STORE_URL, PLAY_STORE_URL } from './site.config.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = ROOT + 'docs';
const LANGS = { es, en };
const PAGE_KEYS = ['privacy', 'terms', 'support', 'delete'];
const FONT = 'https://fonts.googleapis.com/css2?family=Fustat:wght@400;500;600;700;800&display=swap';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Ruta (carpeta) de cada página, relativa a docs/, siempre con barra final.
const dirOf = (lang, key) => (key === 'home' ? `${lang}/` : `${lang}/${LANGS[lang].slugs[key]}/`);
// Link relativo entre dos carpetas del sitio (o a un archivo dentro de docs/).
function rel(fromDir, to) {
  const r = posix.relative(posix.join('/', fromDir), posix.join('/', to));
  const out = r === '' ? './' : r;
  return to.endsWith('/') && !out.endsWith('/') ? out + '/' : out;
}

const ICONS = {
  git: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  vars: '<path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
};
const APPLE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 5 3.5z"/></svg>';

const wordmark = readFileSync(ROOT + 'static/wordmark.svg', 'utf8')
  .replace(/<svg[^>]*>/, (m) => m.replace(/\s(width|height)="[^"]*"/g, '').replace('<svg', '<svg focusable="false"'))
  .trim();

const hasEmail = CONTACT_EMAIL.includes('@');
const emailHtml = hasEmail ? `<a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>` : esc(CONTACT_EMAIL);

function paragraph(text, c, fromDir) {
  if (text === '{deleteLink}') {
    return `<p><a href="${rel(fromDir, dirOf(c.lang, 'delete'))}">${esc(c.ui.deleteAccount)}</a></p>`;
  }
  const body = esc(text).replace('{email}', emailHtml).replace('{emailInline}', emailHtml);
  return `<p>${body}</p>`;
}

function store(href, label, glyph) {
  return href
    ? `<a class="store" href="${esc(href)}">${glyph}<span>${esc(label.name)}</span></a>`
    : `<span class="store" aria-disabled="true">${glyph}<span>${esc(label.soon)}</span></span>`;
}

function head(c, { title, description, fromDir, key }) {
  const other = c.lang === 'es' ? 'en' : 'es';
  const asset = (f) => rel(fromDir, `assets/${f}`);
  const abs = (dir) => (SITE_URL ? SITE_URL.replace(/\/?$/, '/') + dir : null);
  const alt = (l) => `<link rel="alternate" hreflang="${l}" href="${rel(fromDir, dirOf(l, key))}">`;
  const ogImg = SITE_URL ? abs('assets/app-icon-512.png') : asset('app-icon-512.png');
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${alt(c.lang)}
${alt(other)}
${SITE_URL ? `<link rel="canonical" href="${esc(abs(dirOf(c.lang, key)))}">\n<meta property="og:url" content="${esc(abs(dirOf(c.lang, key)))}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="requfy">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:locale" content="${c.locale}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#F2F3F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C0D11" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="${asset('app-icon.svg')}">
<link rel="apple-touch-icon" href="${asset('apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT}">
<link rel="stylesheet" href="${asset('style.css')}">`;
}

function nav(c, fromDir, key) {
  const other = c.lang === 'es' ? 'en' : 'es';
  const home = dirOf(c.lang, 'home');
  const pill = c.lang === 'es'
    ? `<a href="${rel(fromDir, dirOf('es', key))}" lang="es" hreflang="es" aria-current="true">ES</a><span aria-hidden="true">·</span><a href="${rel(fromDir, dirOf('en', key))}" lang="en" hreflang="en">EN</a>`
    : `<a href="${rel(fromDir, dirOf('es', key))}" lang="es" hreflang="es">ES</a><span aria-hidden="true">·</span><a href="${rel(fromDir, dirOf('en', key))}" lang="en" hreflang="en" aria-current="true">EN</a>`;
  return `<header class="wrap nav">
  <a class="logo" href="${rel(fromDir, home)}" aria-label="requfy">${wordmark}</a>
  <div class="nav-right">
    <nav class="nav-links" aria-label="${esc(c.ui.navLabel)}">
      <a href="${rel(fromDir, home)}#funciones">${esc(c.ui.features)}</a>
      <a href="${rel(fromDir, dirOf(c.lang, 'privacy'))}">${esc(c.ui.privacy)}</a>
      <a href="${rel(fromDir, dirOf(c.lang, 'support'))}">${esc(c.ui.support)}</a>
    </nav>
    <div class="lang-pill" role="group" aria-label="${esc(c.ui.langLabel)}">${pill}</div>
  </div>
</header>`;
}

function footer(c, fromDir, key) {
  const other = c.lang === 'es' ? 'en' : 'es';
  return `<footer class="footer">
  <div class="wrap">
    <p>${esc(c.copyright)}</p>
    <nav aria-label="${esc(c.ui.footerNav)}"><ul>
      <li><a href="${rel(fromDir, dirOf(c.lang, 'privacy'))}">${esc(c.ui.privacy)}</a></li>
      <li><a href="${rel(fromDir, dirOf(c.lang, 'terms'))}">${esc(c.ui.terms)}</a></li>
      <li><a href="${rel(fromDir, dirOf(c.lang, 'support'))}">${esc(c.ui.support)}</a></li>
      <li><a href="${rel(fromDir, dirOf(c.lang, 'delete'))}">${esc(c.ui.deleteAccount)}</a></li>
      <li><a class="lang" href="${rel(fromDir, dirOf(other, key))}" lang="${other}" hreflang="${other}">${esc(c.ui.otherLang)}</a></li>
    </ul></nav>
  </div>
</footer>`;
}

function shell(c, key, meta, main) {
  const fromDir = dirOf(c.lang, key);
  return `<!doctype html>
<html lang="${c.lang}">
<head>
${head(c, { ...meta, fromDir, key })}
</head>
<body>
<a class="skip" href="#contenido">${esc(c.ui.skip)}</a>
${nav(c, fromDir, key)}
<main id="contenido">
${main}
</main>
${footer(c, fromDir, key)}
</body>
</html>
`;
}

function homePage(c) {
  const h = c.home;
  const fromDir = dirOf(c.lang, 'home');
  const asset = (f) => rel(fromDir, `assets/${f}`);
  const main = `<section class="wrap hero" aria-labelledby="hero-title">
  <div>
    <p class="overline">${esc(h.overline)}</p>
    <h1 id="hero-title">${esc(h.h1)}</h1>
    <p class="sub">${esc(h.subtitle)}</p>
    <div class="stores">
      ${store(APP_STORE_URL, { name: c.ui.storeApple, soon: c.ui.soonApple }, APPLE)}
      ${store(PLAY_STORE_URL, { name: c.ui.storeGoogle, soon: c.ui.soonGoogle }, PLAY)}
    </div>
    <p class="note">${esc(h.note)}</p>
  </div>
  <div class="phones">
    <figure class="phone"><img src="${asset('home-600.png')}" width="600" height="1300" alt="${esc(c.ui.phoneHome)}"></figure>
    <figure class="phone second"><img src="${asset('response-600.png')}" width="600" height="1300" alt="${esc(c.ui.phoneResponse)}" loading="lazy"></figure>
  </div>
</section>
<section class="wrap features" id="funciones" aria-labelledby="features-title">
  <h2 id="features-title">${esc(h.featuresTitle)}</h2>
  <ul class="grid">
${h.features.map((f) => `    <li class="card"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[f.icon]}</svg></span><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></li>`).join('\n')}
  </ul>
</section>
<section class="bruno" aria-labelledby="bruno-title">
  <div class="wrap">
    <h2 id="bruno-title">${esc(h.brunoTitle)}</h2>
    <p>${esc(h.brunoBody)}</p>
  </div>
</section>`;
  return shell(c, 'home', { title: h.title, description: h.description }, main);
}

function legalPage(c, key) {
  const p = c.pages[key];
  const fromDir = dirOf(c.lang, key);
  const main = `<article class="legal">
  <a class="back" href="${rel(fromDir, dirOf(c.lang, 'home'))}">${esc(c.ui.back)}</a>
  <h1>${esc(p.h1)}</h1>
  <p class="updated">${esc(c.ui.updated)}</p>
${p.sections.map((s) => `  <section>\n    <h2>${esc(s.h)}</h2>\n    ${s.p.map((t) => paragraph(t, c, fromDir)).join('\n    ')}\n  </section>`).join('\n')}
</article>`;
  return shell(c, key, { title: p.title, description: p.description }, main);
}

function write(path, data) {
  const full = `${OUT}/${path}`;
  mkdirSync(posix.dirname(full), { recursive: true });
  writeFileSync(full, data);
}

function rootIndex() {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>requfy</title>
<meta name="description" content="requfy: cliente de APIs para el teléfono / API client for your phone.">
<link rel="alternate" hreflang="es" href="es/">
<link rel="alternate" hreflang="en" href="en/">
<link rel="alternate" hreflang="x-default" href="en/">
<link rel="icon" type="image/svg+xml" href="assets/app-icon.svg">
<link rel="stylesheet" href="${FONT}">
<link rel="stylesheet" href="assets/style.css">
<script>
  (function () {
    var l = (navigator.language || '').toLowerCase();
    location.replace(l.indexOf('es') === 0 ? 'es/' : 'en/');
  })();
</script>
</head>
<body>
<main class="center">
  <h1>requfy</h1>
  <p class="links"><a href="es/" lang="es" hreflang="es">Español</a> <a href="en/" lang="en" hreflang="en">English</a></p>
</main>
</body>
</html>
`;
}

function notFound() {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — requfy</title>
<meta name="description" content="Página no encontrada / Page not found.">
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="assets/app-icon.svg">
<link rel="stylesheet" href="${FONT}">
<style>${readFileSync(ROOT + 'static/style.css', 'utf8')}</style>
</head>
<body>
<main class="center">
  <h1>404</h1>
  <p lang="es">${esc(es.ui.notFoundText)}</p>
  <p lang="en">${esc(en.ui.notFoundText)}</p>
  <p class="links"><a href="./" lang="es">${esc(es.ui.notFoundHome)}</a> <a href="./" lang="en">${esc(en.ui.notFoundHome)}</a></p>
</main>
</body>
</html>
`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(ROOT + 'static', OUT + '/assets', { recursive: true });
writeFileSync(OUT + '/.nojekyll', '');
write('index.html', rootIndex());
for (const [lang, c] of Object.entries(LANGS)) {
  write(`${dirOf(lang, 'home')}index.html`, homePage(c));
  for (const k of PAGE_KEYS) write(`${dirOf(lang, k)}index.html`, legalPage(c, k));
}
write('404.html', notFound());

const pending = [];
if (!hasEmail) pending.push('CONTACT_EMAIL');
if (!SITE_URL) pending.push('SITE_URL');
if (!APP_STORE_URL) pending.push('APP_STORE_URL');
if (!PLAY_STORE_URL) pending.push('PLAY_STORE_URL');
console.log(`Sitio generado en docs/ (${2 * (1 + PAGE_KEYS.length) + 2} páginas HTML).`);
if (pending.length) console.warn(`ADVERTENCIA: valores pendientes en site.config.mjs: ${pending.join(', ')}`);
