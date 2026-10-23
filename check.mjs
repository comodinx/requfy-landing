// Verificador sin dependencias. Uso: node check.mjs (después de node build.mjs)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { posix, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import es from './content/es.mjs';
import en from './content/en.mjs';

const DOCS = fileURLToPath(new URL('./docs', import.meta.url));
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(DOCS);
const html = files.filter((f) => f.endsWith('.html'));
const relp = (f) => f.slice(DOCS.length + 1);

// 1. Mismas páginas en ambos idiomas.
const keys = (c) => Object.keys(c.pages).sort().join(',');
if (keys(es) !== keys(en)) err(`Los idiomas tienen distintas páginas: es=${keys(es)} en=${keys(en)}`);
for (const [l, c] of Object.entries({ es, en })) {
  for (const k of ['', ...Object.values(c.slugs)]) {
    const f = join(DOCS, l, k, 'index.html');
    if (!existsSync(f)) err(`Falta ${relp(f)}`);
  }
  for (const k of Object.keys(c.pages)) if (!c.slugs[k]) err(`${l}: falta slug para ${k}`);
}
if (Object.keys(es.pages).length !== Object.keys(en.pages).length) err('Distinta cantidad de páginas legales');

const attrs = (src, re) => [...src.matchAll(re)].map((m) => m[1]);
for (const f of html) {
  const src = readFileSync(f, 'utf8');
  const name = relp(f);
  const dir = dirname(f);

  // 2. Links internos.
  for (const v of [...attrs(src, /\b(?:href|src)="([^"]*)"/g)]) {
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(v) || v === '') continue;
    const path = v.split('#')[0].split('?')[0];
    if (path === '') continue;
    let target = resolve(dir, path);
    if (path.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
    if (!existsSync(target)) err(`${name}: enlace roto «${v}»`);
  }

  // 3. Metadatos por página (la raíz y la 404 solo redirigen).
  const lang = (src.match(/<html lang="([^"]+)"/) || [])[1];
  if (!lang) err(`${name}: sin <html lang>`);
  if (!/<title>[^<]+<\/title>/.test(src)) err(`${name}: sin <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(src)) err(`${name}: sin meta description`);
  const top = name.split('/')[0];
  if (top === 'es' || top === 'en') {
    if (lang !== top) err(`${name}: lang="${lang}" no coincide con la carpeta`);
    const other = top === 'es' ? 'en' : 'es';
    if (!new RegExp(`<link rel="alternate" hreflang="${other}" href="[^"]+"`).test(src)) err(`${name}: sin hreflang="${other}"`);
    if (!new RegExp(`<link rel="alternate" hreflang="${top}" href="[^"]+"`).test(src)) err(`${name}: sin hreflang="${top}"`);
    if (!/<main[ >]/.test(src) || !/<header[ >]/.test(src) || !/<footer[ >]/.test(src)) err(`${name}: faltan landmarks`);
    if (!/class="skip"/.test(src)) err(`${name}: sin skip link`);
    if ((src.match(/<h1[ >]/g) || []).length !== 1) err(`${name}: debe haber un único h1`);
    for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) err(`${name}: img sin alt`);
  }

  // 4. Marcadores pendientes.
  const n = (src.match(/\[PENDIENTE/g) || []).length;
  if (n) {
    const ok = /^(es|en)\/(privacidad|privacy|soporte|support|eliminar-cuenta|delete-account|terminos|terms)\//.test(name);
    (ok ? warnings : errors).push(`${name}: ${n} marcador(es) «[PENDIENTE» ${ok ? '(contacto, esperado)' : 'fuera de los lugares de contacto'}`);
  }
}
for (const f of ['.nojekyll', 'assets/style.css', 'assets/app-icon.svg', 'assets/apple-touch-icon.png', 'assets/app-icon-512.png', 'assets/home-600.png', 'assets/response-600.png']) {
  if (!existsSync(join(DOCS, f))) err(`Falta docs/${f}`);
}

console.log(`Páginas HTML revisadas: ${html.length}`);
for (const w of warnings) console.warn(`ADVERTENCIA: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);
if (errors.length) { console.error(`${errors.length} error(es).`); process.exit(1); }
console.log('check OK');
