// Comprobaciones de seguridad estáticas: CSP en todas las páginas, nada de scripts en línea, nada de innerHTML/eval,
// ninguna clave secreta en el repositorio y la base de datos con RLS en todas las tablas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const raiz = new URL('../', import.meta.url);
const leer = p => readFile(new URL(p, raiz), 'utf8');
const html = (await readdir(raiz)).filter(f => f.endsWith('.html'));
async function archivos(dir, ext) {
  const out = [];
  for (const e of await readdir(new URL(dir, raiz), { withFileTypes: true })) {
    const p = dir + e.name;
    if (e.isDirectory()) out.push(...await archivos(p + '/', ext));
    else if (ext.some(x => p.endsWith(x))) out.push(p);
  }
  return out;
}
const propios = [...await archivos('js/', ['.js']), ...await archivos('supabase/functions/', ['.ts'])];

test('todas las páginas tienen una CSP estricta', async () => {
  assert.ok(html.length >= 10);
  for (const f of html) {
    const s = await leer(f);
    const csp = s.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
    assert.ok(csp, f + ' sin CSP');
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.doesNotMatch(csp, /'unsafe-inline'|'unsafe-eval'|\s\*/, f);
  }
});

test('sin scripts ni manejadores de eventos en línea', async () => {
  for (const f of html) {
    const s = await leer(f);
    for (const tag of s.match(/<script\b[^>]*>/g) || []) assert.match(tag, /\ssrc="/, f + ': ' + tag);
    assert.doesNotMatch(s, /\son[a-z]+\s*=/i, f);
    assert.doesNotMatch(s, /\sstyle\s*=/i, f + ': atributo style bloqueado por la CSP');
  }
});

test('el código no usa innerHTML, eval ni Function', async () => {
  for (const f of propios) {
    const s = await leer(f);
    assert.doesNotMatch(s, /\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(|new Function\(/, f);
    assert.doesNotMatch(s, /setAttribute\(\s*['"]style['"]/, f);
  }
});

test('ninguna clave secreta en el repositorio', async () => {
  const config = JSON.parse(await leer('config.json'));
  assert.doesNotMatch(config.supabaseKey, /^sb_secret_|^sk-ant-/);
  if (config.supabaseKey.startsWith('eyJ')) assert.doesNotMatch(Buffer.from(config.supabaseKey.split('.')[1], 'base64').toString(), /service_role/);
  for (const f of [...propios, ...html, 'config.json']) assert.doesNotMatch(await leer(f), /sk-ant-[a-z0-9]|sb_secret_[a-z0-9]{8}/i, f);
});

test('la base de datos activa y fuerza RLS en todas sus tablas', async () => {
  const sql = await leer('supabase/migrations/20261111000000_aula.sql');
  const tablas = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map(m => m[1]);
  assert.ok(tablas.length >= 3);
  for (const t of tablas) {
    assert.match(sql, new RegExp(`alter table public\\.${t}\\s+enable row level security`));
    assert.match(sql, new RegExp(`alter table public\\.${t}\\s+force row level security`));
    assert.match(sql, new RegExp(`revoke all on [^;]*public\\.${t}[^;]* from anon`));
  }
  for (const f of sql.matchAll(/create or replace function (public\.\w+)[\s\S]*?security definer([^\n]*)/g)) assert.match(f[2], /set search_path = ''/, f[1]);
});

test('la función del tutor valida al usuario y no expone la clave de Anthropic', async () => {
  const s = await leer('supabase/functions/tutor/index.ts');
  assert.match(s, /auth\.getUser/);
  assert.match(s, /email_confirmed_at/);
  assert.match(s, /new Anthropic\(\)/); // la clave sale del secreto ANTHROPIC_API_KEY
  assert.doesNotMatch(s, /apiKey\s*:/);
  assert.match(s, /ALLOWED_ORIGINS/);
  assert.doesNotMatch(s, /Access-Control-Allow-Origin["']?\s*:\s*["']\*/);
});
