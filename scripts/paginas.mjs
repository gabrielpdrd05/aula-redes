// Monta las páginas HTML a partir de src/paginas/*.html y genera js/config.js desde config.json.
// Cada página empieza con un comentario JSON: <!--{"title": "...", "description": "...", "script": "x.js", ...}-->
// La política de seguridad (CSP) se calcula aquí: solo se permite conectar con este sitio y con el proyecto de Supabase.
// Uso: node scripts/paginas.mjs [--check]
import { readdir, readFile, writeFile } from 'node:fs/promises';

const check = process.argv.includes('--check');
const config = JSON.parse(await readFile('config.json', 'utf8'));
const ia = config.tutorIA === true;
// Bloques condicionales en las páginas: <!--ia-->…<!--/ia--> solo con el tutor con IA; <!--sin-ia-->…<!--/sin-ia--> sin él.
const condicional = t => t.replace(/<!--(sin-)?ia-->([\s\S]*?)<!--\/(?:sin-)?ia-->/g, (_, sin, dentro) => (!!sin !== ia ? dentro : ''));
const supa = config.supabaseUrl ? new URL(config.supabaseUrl).origin : '';
if (supa && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supa)) throw new Error('supabaseUrl no parece un proyecto de Supabase: ' + supa);
if (config.supabaseKey && /service_role|sb_secret_/.test(config.supabaseKey + atobSafe(config.supabaseKey))) throw new Error('¡Esa es una clave secreta! En config.json solo va la clave publishable/anon.');
function atobSafe(k) { try { return Buffer.from(k.split('.')[1] || '', 'base64').toString(); } catch { return ''; } }

const connect = ["'self'", supa, supa && supa.replace('https://', 'wss://')].filter(Boolean).join(' ');
const CSP = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src ${connect}; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><path d="M22.5 10.5A8.5 8.5 0 1 1 9.5 10.5" fill="none" stroke="var(--accent-ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M12.6 6.9 12.1 12.9 6.9 8.6Z" fill="var(--accent-ink)" stroke="var(--accent-ink)" stroke-width="1" stroke-linejoin="round"/><circle cx="16" cy="16" r="3.4" fill="var(--accent-ink)"/></svg>';
const ICON = {
  luces: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/></svg>',
  curso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z"/><path d="M8 7h7M8 11h5"/></svg>',
  practica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="m7 9 3 2-3 2M12 14h5"/></svg>',
  buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  tutor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/></svg>',
  examen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  cuenta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  tema: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
};
const NAV = [['curso.html', 'Curso', 'curso'], ['practica.html', 'Práctica', 'practica'], ['comandos.html', 'Comandos', 'comandos'], ['examen.html', 'Examen', 'examen'], ['repaso.html', 'Repaso', 'repaso'], ['rutas.html', 'Rutas', 'rutas'], ia ? ['tutor.html', 'Tutor IA', 'tutor'] : ['tutor.html', 'Buscar', 'buscar']];

function header(active) {
  const links = NAV.map(([href, label]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<header class="site-header"><div class="container">
  <a class="brand" href="./">${LOGO}<span>Loopback</span></a>
  <nav class="nav" aria-label="Principal">${links}</nav>
  <div class="header-actions">
    <button type="button" class="btn btn-quiet theme-toggle luces-toggle" id="lucesToggle" aria-pressed="true" aria-label="Luces LED de la interfaz" title="Encender o apagar las luces LED">${ICON.luces}</button>
    <button type="button" class="btn btn-quiet theme-toggle" id="themeToggle" aria-label="Cambiar entre tema claro y oscuro">${ICON.tema}</button>
    <a class="btn btn-ghost btn-sm" href="cuenta.html" data-auth="out">Entrar</a>
    <a class="avatar" href="cuenta.html" data-auth="in" hidden aria-label="Mi cuenta"><span data-user="initials">?</span></a>
  </div>
</div></header>`;
}
function mobileNav(active) {
  return `<nav class="mobile-nav" aria-label="Navegación móvil">${[...NAV.filter(([h]) => h !== 'comandos.html' && h !== 'repaso.html' && h !== 'rutas.html'), ['cuenta.html', 'Cuenta', 'cuenta']].map(([href, label, icon]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${ICON[icon]}<span>${label}</span></a>`).join('')}</nav>`;
}
const footer = `<footer class="site-footer"><div class="container">
  <span>Loopback · Redes, bases de datos, programación y empleo en TI desde cero. El temario de redes sigue el Cisco CCNA 200-301; no es un curso oficial de Cisco.</span>
  <span><a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a></span>
</div></footer>`;

function page(meta, body) {
  const url = config.url + '/' + (meta.file === 'index.html' ? '' : meta.file);
  const scripts = [
    '<script src="js/proteccion.js"></script>',
    meta.supabase !== false ? '<script src="vendor/supabase.js" defer></script>' : '',
    `<script type="module" src="js/paginas/${meta.script}"></script>`,
  ].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
${meta.private ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0b7285">
<link rel="icon" href="img/icono.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="css/aula.css">
${scripts}
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ''}>
<a class="skip" href="#main">Saltar al contenido</a>
${header(meta.file)}
<main id="main">
${body.trim()}
</main>
${meta.noFooter ? '' : footer}
${mobileNav(meta.file)}
</body>
</html>
`;
}

const outputs = new Map();
for (const name of (await readdir('src/paginas')).filter(n => n.endsWith('.html')).sort()) {
  const src = await readFile('src/paginas/' + name, 'utf8');
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(name + ': falta la cabecera JSON');
  const meta = JSON.parse(m[1]);
  if (!ia && meta.sinIa) Object.assign(meta, meta.sinIa);
  outputs.set(name, page({ ...meta, file: name }, condicional(src.slice(m[0].length))));
}
outputs.set('js/config.js', `// Generado por scripts/paginas.mjs a partir de config.json. No editar a mano.
export const CONFIG = Object.freeze(${JSON.stringify({ nombre: config.nombre, url: config.url, supabaseUrl: supa, supabaseKey: config.supabaseKey || '', tutorIA: ia }, null, 2)});
`);

const stale = [];
for (const [file, content] of outputs) {
  if (check) { if ((await readFile(file, 'utf8').catch(() => '')) !== content) stale.push(file); }
  else await writeFile(file, content);
}
if (stale.length) { console.error('Sin regenerar (ejecuta node scripts/paginas.mjs): ' + stale.join(', ')); process.exit(1); }
console.log(check ? 'Páginas al día.' : 'Páginas generadas: ' + (outputs.size - 1) + ' y js/config.js.');
