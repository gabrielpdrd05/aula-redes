// Tutor con IA: chat en streaming contra la función de Supabase "tutor" (Claude).
// Envía con cada pregunta el texto de la lección que se está estudiando y los apuntes del curso más relacionados
// (búsqueda local en data/buscar.json), para que las respuestas encajen con el temario.
// Las respuestas se pintan con un mini-Markdown seguro (sin innerHTML).
import { el, local } from './core.js';
import { CONFIG } from './config.js';
import { cuentasActivas, token, usuarioActual } from './auth.js';
import { codeBlock } from './render.js';

// ---------------------------------------------------------------- búsqueda local en el temario
let indice = null;
const fold = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const VACIAS = new Set('el la los las un una unos unas de del al a en y o u que es son por para con sin como qué cual cuál cómo se lo le les mi tu su sus me te nos más muy ya hay este esta esto eso ese entre sobre cuando donde dónde porque pero si no'.split(' '));
const palabras = t => fold(t).split(/[^a-z0-9.\/-]+/).filter(w => w.length > 2 && !VACIAS.has(w));
export async function buscarEnCurso(pregunta, n = 3) {
  if (!indice) indice = fetch('data/buscar.json').then(r => r.json()).then(lista => lista.map(l => ({ ...l, bolsa: fold(l.titulo + ' ' + l.texto) })));
  const lista = await indice;
  const q = [...new Set(palabras(pregunta))];
  if (!q.length) return [];
  return lista.map(l => {
    let p = 0;
    for (const w of q) { if (fold(l.titulo).includes(w)) p += 5; const k = l.bolsa.split(w).length - 1; p += Math.min(k, 6); }
    return { l, p };
  }).filter(x => x.p > 2).sort((a, b) => b.p - a.p).slice(0, n).map(x => x.l);
}
function extracto(texto, pregunta, max) {
  if (texto.length <= max) return texto;
  const q = palabras(pregunta);
  const f = fold(texto);
  const pos = q.map(w => f.indexOf(w)).filter(i => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const ini = Math.max(0, pos - Math.floor(max / 3));
  return (ini ? '…' : '') + texto.slice(ini, ini + max) + '…';
}

// ---------------------------------------------------------------- mini-Markdown seguro
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https:\/\/[^)\s]+\)|(?<![\w*])\*[^*\s][^*]*?\*(?!\w)|(?<![\w_])_[^_\s][^_]*?_(?!\w))/g;
function inline(text) {
  const out = []; let pos = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > pos) out.push(text.slice(pos, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(el('strong', {}, t.slice(2, -2)));
    else if (t.startsWith('`')) out.push(el('code', {}, t.slice(1, -1)));
    else if (t.startsWith('[')) { const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/); out.push(el('a', { href, target: '_blank', rel: 'noopener noreferrer nofollow' }, label)); }
    else out.push(el('em', {}, t.slice(1, -1)));
    pos = m.index + t.length;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}
export function markdown(md) {
  const frag = document.createDocumentFragment();
  const lines = md.replace(/\r/g, '').split('\n');
  let i = 0, para = [];
  const flush = () => { if (para.length) { frag.append(el('p', {}, inline(para.join(' ')))); para = []; } };
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```(\w*)/);
    if (fence) {
      flush();
      const code = []; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      i++;
      frag.append(codeBlock(code.join('\n'), fence[1] || 'texto'));
      continue;
    }
    if (!line.trim()) { flush(); i++; continue; }
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) { flush(); frag.append(el('p', {}, el('strong', {}, inline(h[1])))); i++; continue; }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      flush();
      const ordered = /^\s*\d+[.)]/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) items.push(el('li', {}, inline(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, ''))));
      frag.append(el(ordered ? 'ol' : 'ul', {}, items));
      continue;
    }
    if (/^\|.*\|\s*$/.test(line)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { const cells = lines[i++].trim().slice(1, -1).split('|').map(c => c.trim()); if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells); }
      frag.append(el('div', { class: 'table-wrap' }, el('table', {}, rows.map((r, k) => el('tr', {}, r.map(c => el(k ? 'td' : 'th', {}, inline(c))))))));
      continue;
    }
    para.push(line.trim()); i++;
  }
  flush();
  return frag;
}

// ---------------------------------------------------------------- conexión con la función
async function* streamRespuesta(mensajes, contexto, signal) {
  const t = await token();
  const res = await fetch(CONFIG.supabaseUrl + '/functions/v1/tutor', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t, apikey: CONFIG.supabaseKey },
    body: JSON.stringify({ mensajes, contexto }),
  });
  if (!res.ok) {
    let msg = 'No se pudo contactar con el tutor.';
    try { msg = (await res.json()).error || msg; } catch { /* nada */ }
    if (res.status === 404) msg = 'La función del tutor todavía no está desplegada en Supabase.';
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let k;
    while ((k = buf.indexOf('\n\n')) >= 0) {
      const bloque = buf.slice(0, k); buf = buf.slice(k + 2);
      const ev = bloque.match(/^event: (\w+)/m)?.[1];
      const data = bloque.match(/^data: (.*)$/m)?.[1];
      if (!ev || !data) continue;
      yield { ev, data: JSON.parse(data) };
    }
  }
}

const SUGERENCIAS = {
  general: ['Explícame el subnetting con un ejemplo', 'Ponme un ejercicio de VLAN', '¿Qué diferencia hay entre TCP y UDP?', 'Hazme una entrevista técnica de prueba'],
  leccion: ['Explícamelo de forma más sencilla', 'Dame un ejemplo práctico', 'Ponme 3 preguntas tipo examen sobre esto', '¿Qué suele preguntar el CCNA de este tema?'],
};

// Monta el chat. opciones: { leccion: {id, titulo, texto}, contenedor (para página completa) }
export function crearTutor({ leccion = null, paginaCompleta = false } = {}) {
  const clave = 'aula:tutor:' + (leccion?.id || 'general');
  let historial = local.get(clave, []).slice(-20);
  let controlador = null;

  const mensajesBox = el('div', { class: 'tutor-messages', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversación con el tutor' });
  const entrada = el('textarea', { rows: 2, placeholder: leccion ? `Pregunta sobre «${leccion.titulo}» o cualquier tema de redes…` : 'Pregunta lo que quieras sobre redes o bases de datos…', 'aria-label': 'Tu pregunta para el tutor', maxlength: 4000 });
  const enviar = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Enviar');
  const form = el('form', { class: 'tutor-form', novalidate: true }, entrada, enviar);
  const borrar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', title: 'Empezar una conversación nueva' }, 'Nueva');
  const cerrar = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Cerrar el tutor' }, '✕');
  const head = el('div', { class: 'tutor-head' }, el('span', { class: 'badge badge-violet' }, 'IA'), el('h2', { id: 'tutorTitle' }, 'Tutor de redes'), el('span', { style: undefined }), borrar, paginaCompleta ? null : cerrar);
  head.children[2].style.flex = '1';

  const panel = paginaCompleta
    ? el('section', { class: 'tutor-page', 'aria-labelledby': 'tutorTitle' }, head, mensajesBox, form)
    : el('aside', { class: 'tutor-panel', 'aria-labelledby': 'tutorTitle', 'data-closed': '', role: 'dialog', 'aria-modal': 'false' }, head, mensajesBox, form);

  function bienvenida() {
    mensajesBox.replaceChildren(el('div', { class: 'msg msg-ai' }, el('p', {}, leccion
      ? `Hola. Estoy al tanto de la lección «${leccion.titulo}». Pregúntame lo que no te haya quedado claro, pídeme ejemplos o ejercicios.`
      : 'Hola, soy tu tutor de redes. Puedo explicarte cualquier tema del CCNA o de bases de datos, ponerte ejercicios, corregirte o hacerte una entrevista de prueba.')),
    el('div', { class: 'suggestions' }, SUGERENCIAS[leccion ? 'leccion' : 'general'].map(s => el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { entrada.value = s; form.requestSubmit(); } }, s))));
  }
  function pintarHistorial() {
    if (!historial.length) { bienvenida(); return; }
    mensajesBox.replaceChildren(...historial.map(m => m.role === 'user' ? el('div', { class: 'msg msg-user' }, m.content) : el('div', { class: 'msg msg-ai' }, markdown(m.content))));
    mensajesBox.scrollTop = mensajesBox.scrollHeight;
  }
  const nota = t => { mensajesBox.append(el('p', { class: 'msg-note' }, t)); mensajesBox.scrollTop = mensajesBox.scrollHeight; };

  async function contextoPara(pregunta) {
    const partes = [];
    if (leccion) partes.push(`Lección actual: ${leccion.titulo}\n${extracto(leccion.texto, pregunta, 5000)}`);
    for (const l of await buscarEnCurso(pregunta, 2)) if (l.id !== leccion?.id) partes.push(`Apuntes de la lección «${l.titulo}»:\n${extracto(l.texto, pregunta, 1800)}`);
    return partes.join('\n\n---\n\n').slice(0, 9000);
  }

  async function sinServidor(pregunta, motivo) {
    nota(motivo);
    const rel = await buscarEnCurso(pregunta, 3);
    if (rel.length) mensajesBox.append(el('div', { class: 'msg msg-ai' }, el('p', {}, 'Mientras tanto, esto es lo que trata el curso sobre tu pregunta:'), el('ul', {}, rel.map(l => el('li', {}, el('a', { href: 'leccion.html?id=' + l.id }, l.titulo), ' — ', extracto(l.texto, pregunta, 180))))));
    mensajesBox.scrollTop = mensajesBox.scrollHeight;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pregunta = entrada.value.trim();
    if (!pregunta || controlador) return;
    if (!historial.length) mensajesBox.replaceChildren();
    mensajesBox.querySelector('.suggestions')?.remove();
    mensajesBox.append(el('div', { class: 'msg msg-user' }, pregunta));
    entrada.value = '';
    if (!cuentasActivas()) return sinServidor(pregunta, 'El tutor con IA se activa cuando el administrador conecta la web con Supabase.');
    if (!(await usuarioActual())) {
      mensajesBox.append(el('p', { class: 'msg-note' }, 'Inicia sesión para hablar con el tutor. ', el('a', { href: 'cuenta.html?siguiente=' + encodeURIComponent(location.pathname.split('/').pop() + location.search) }, 'Entrar o crear cuenta')));
      return;
    }
    historial.push({ role: 'user', content: pregunta });
    const burbuja = el('div', { class: 'msg msg-ai typing' });
    mensajesBox.append(burbuja);
    mensajesBox.scrollTop = mensajesBox.scrollHeight;
    enviar.textContent = 'Parar'; enviar.type = 'button';
    const parar = () => controlador?.abort();
    enviar.addEventListener('click', parar, { once: true });
    controlador = new AbortController();
    let texto = '', ultimoPintado = 0, error = null, restantes = null;
    try {
      for await (const { ev, data } of streamRespuesta(historial.slice(-16), await contextoPara(pregunta), controlador.signal)) {
        if (ev === 'texto') {
          texto += data.t;
          if (performance.now() - ultimoPintado > 60) { burbuja.replaceChildren(markdown(texto)); ultimoPintado = performance.now(); mensajesBox.scrollTop = mensajesBox.scrollHeight; }
        } else if (ev === 'error') error = data.mensaje;
        else if (ev === 'fin') restantes = data.restantes;
      }
    } catch (err) { if (err.name !== 'AbortError') error = err.message; }
    burbuja.classList.remove('typing');
    if (texto) { burbuja.replaceChildren(markdown(texto)); historial.push({ role: 'assistant', content: texto }); }
    else { burbuja.remove(); historial.pop(); }
    if (error) nota(error);
    if (restantes != null && restantes <= 5) nota(`Te ${restantes === 1 ? 'queda 1 mensaje' : `quedan ${restantes} mensajes`} del tutor hoy.`);
    historial = historial.slice(-20);
    local.set(clave, historial);
    controlador = null;
    enviar.removeEventListener('click', parar);
    enviar.type = 'submit'; enviar.textContent = 'Enviar';
    mensajesBox.scrollTop = mensajesBox.scrollHeight;
    entrada.focus();
  });
  entrada.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  borrar.addEventListener('click', () => { controlador?.abort(); historial = []; local.del(clave); bienvenida(); });

  function abrir() { panel.removeAttribute('data-closed'); entrada.focus({ preventScroll: true }); }
  function cerrarPanel() { panel.setAttribute('data-closed', ''); fab?.focus(); }
  cerrar.addEventListener('click', cerrarPanel);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape' && !paginaCompleta) cerrarPanel(); });
  let fab = null;
  if (!paginaCompleta) {
    fab = el('button', { type: 'button', class: 'btn btn-primary tutor-fab', 'aria-haspopup': 'dialog' }, '💬 Preguntar al tutor');
    fab.addEventListener('click', abrir);
    document.body.append(fab, panel);
  }
  pintarHistorial();
  return { panel, abrir, preguntar: q => { abrir(); entrada.value = q; form.requestSubmit(); } };
}
