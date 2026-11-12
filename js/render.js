// Convierte los bloques del temario (data/curso.json) en DOM, sin innerHTML.
// Los elementos interactivos ([[anim:x]], [[lab:x]], [[cli:x]], [[sql:x]]) se cargan bajo demanda.
import { el } from './core.js';

const CALLOUT_TITLES = { nota: 'Nota', examen: 'Para el examen', cuidado: 'Cuidado', practica: 'Practica', comando: 'Comando', reto: 'Reto sin ayuda', externo: 'Laboratorio externo', solucion: 'Ver una solución posible' };

export function inline(segs) {
  return segs.map(s => {
    if (s.t === 'b') return el('strong', {}, s.v);
    if (s.t === 'i') return el('em', {}, s.v);
    if (s.t === 'code') return el('code', {}, s.v);
    if (s.t === 'link') {
      const external = /^https:\/\//.test(s.href);
      return el('a', { href: s.href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, s.v);
    }
    return document.createTextNode(s.v);
  });
}

// Resaltado mínimo por líneas: indicador del prompt de IOS y comentarios.
function codeLine(line, lang) {
  if (lang === 'ios') {
    const m = line.match(/^([\w.-]+(?:\([\w-]+\))?[>#])(\s?.*)$/);
    if (m) {
      const [cmd, comment] = splitComment(m[2], '!');
      return [el('span', { class: 'pr' }, m[1]), cmd, comment ? el('span', { class: 'cm' }, comment) : null];
    }
    if (/^\s*!/.test(line)) return [el('span', { class: 'cm' }, line)];
    return [line];
  }
  const marker = { sql: '--', python: '#', bash: '#', yaml: '#' }[lang];
  if (marker) {
    const [code, comment] = splitComment(line, marker);
    return [code, comment ? el('span', { class: 'cm' }, comment) : null];
  }
  return [line];
}
function splitComment(text, marker) {
  let inQuote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ((c === '"' || c === "'") && text[i - 1] !== '\\') inQuote = inQuote === c ? null : inQuote || c;
    if (!inQuote && text.startsWith(marker, i) && (i === 0 || /\s/.test(text[i - 1]))) return [text.slice(0, i), text.slice(i)];
  }
  return [text, ''];
}

export function codeBlock(text, lang = 'texto') {
  const code = el('code');
  text.split('\n').forEach((line, i) => { if (i) code.append('\n'); code.append(...codeLine(line, lang).filter(x => x != null && x !== '')); });
  const copy = el('button', { type: 'button', class: 'copy', 'aria-label': 'Copiar el código' }, 'Copiar');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Copiado'; } catch { copy.textContent = 'No se pudo'; }
    setTimeout(() => { copy.textContent = 'Copiar'; }, 1500);
  });
  const names = { ios: 'Cisco IOS', bash: 'Terminal', python: 'Python', sql: 'SQL', json: 'JSON', yaml: 'YAML', texto: 'Texto', javascript: 'JavaScript', typescript: 'TypeScript', java: 'Java', csharp: 'C#', c: 'C', cpp: 'C++', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', kotlin: 'Kotlin', swift: 'Swift', powershell: 'PowerShell', html: 'HTML', css: 'CSS', r: 'R', dockerfile: 'Dockerfile' };
  return el('pre', { class: 'code', tabindex: '0' }, el('span', { class: 'lang' }, names[lang] || lang), copy, code);
}

export function renderBlocks(blocks, ctx = {}) {
  const frag = document.createDocumentFragment();
  for (const b of blocks) {
    switch (b.t) {
      case 'p': frag.append(el('p', {}, inline(b.c))); break;
      case 'h': frag.append(el('h' + b.level, {}, inline(b.c))); break;
      case 'ul': frag.append(el('ul', {}, b.items.map(it => el('li', {}, inline(it))))); break;
      case 'ol': frag.append(el('ol', {}, b.items.map(it => el('li', {}, inline(it))))); break;
      case 'code': frag.append(codeBlock(b.v, b.lang)); break;
      case 'table':
        frag.append(el('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Tabla', tabindex: '0' }, el('table', {},
          el('thead', {}, el('tr', {}, b.head.map(c => el('th', { scope: 'col' }, inline(c))))),
          el('tbody', {}, b.rows.map(r => el('tr', {}, r.map(c => el('td', {}, inline(c)))))))));
        break;
      case 'callout':
        // La solución de un reto va plegada: primero se intenta sin ayuda.
        if (b.kind === 'solucion') frag.append(el('details', { class: 'callout callout-solucion' }, el('summary', { class: 'callout-title' }, CALLOUT_TITLES.solucion), renderBlocks(b.c, ctx)));
        else frag.append(el('aside', { class: 'callout callout-' + b.kind }, el('div', { class: 'callout-title' }, CALLOUT_TITLES[b.kind] || b.kind), renderBlocks(b.c, ctx)));
        break;
      case 'embed': {
        const holder = el('div', { class: 'embed', dataset: { kind: b.kind, id: b.id } }, el('p', { class: 'muted small' }, 'Cargando el elemento interactivo…'));
        frag.append(holder);
        montarEmbed(holder, b.kind, b.id, ctx);
        break;
      }
    }
  }
  return frag;
}

const LOADERS = {
  anim: () => import('./anim/escenas.js').then(m => m.montarAnimacion),
  lab: () => import('./labs/numeros.js').then(m => m.montarLab),
  cli: () => import('./labs/cli-ui.js').then(m => m.montarCli),
  sql: () => import('./labs/sql-lab.js').then(m => m.montarSql),
  code: () => import('./codigo/codigo-ui.js').then(m => m.montarCodigo),
  proyecto: () => import('./proyectos/proyecto-ui.js').then(m => m.montarProyecto),
  caso: () => import('./casos/caso-ui.js').then(m => m.montarCaso),
  turno: () => import('./casos/caso-ui.js').then(m => m.montarTurno),
  video: () => import('./video/reproductor.js').then(m => m.montarVideo),
};

async function montarEmbed(holder, kind, id, ctx) {
  try {
    const montar = await LOADERS[kind]();
    holder.replaceChildren();
    await montar(holder, id, ctx);
  } catch (err) {
    console.error(err);
    holder.replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar este elemento interactivo. Recarga la página para intentarlo de nuevo.')));
  }
}
