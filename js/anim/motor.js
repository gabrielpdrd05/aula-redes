// Motor de animaciones explicativas de protocolos de red.
// Cada escena es una topología (equipos y enlaces) y una lista de pasos. Cada paso tiene un texto y acciones:
//   {t:'paquete', ruta:['a','b','c'], etiqueta, capa, retardo}  un paquete que viaja por la ruta
//   {t:'tabla', id, titulo, x, y, ancho, filas:[[...]], resaltar}  una tabla (MAC, ARP, NAT, rutas...)
//   {t:'enlace', id, estado:'on'|'blocked'|null}                  estado de un enlace
//   {t:'nodo', id, estado:'hl'|null, sub}                          resaltar un equipo o cambiar su subtítulo
//   {t:'pdu', segs:[{txt, capa}]}                                  composición de la PDU (encapsulación)
// Tablas, enlaces, nodos y PDU son acumulativos: el estado del paso N es el resultado de aplicar los pasos 0..N.
// El movimiento es explicativo (no se repite cientos de veces al día): ease-in-out para lo que se desplaza por la
// pantalla y ease-out para lo que aparece. Con "reducir movimiento", los paquetes no se desplazan: aparecen en destino.
import { el, reducedMotion } from '../core.js';

const EASE_MOVE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const COLORS = { l7: 'var(--l7)', l4: 'var(--l4)', l3: 'var(--l3)', l2: 'var(--l2)', l1: 'var(--l1)', ok: 'var(--ok)', bad: 'var(--danger)' };

const ICONS = {
  pc: 'M-13 -10h26v15h-26z M-5 9h10 M0 5v4',
  server: 'M-10 -13h20v26h-20z M-10 -4h20 M-10 5h20 M-5 -9h3 M-5 0h3 M-5 9h3',
  switch: 'M-15 -7h30v14h-30z M-9 -2h8l-3 -3 M9 2h-8l3 3',
  router: 'M0 -12a12 12 0 1 0 0.01 0z M-7 -3l7 -6 7 6 M-7 3l7 6 7 -6',
  cloud: 'M-12 6a6 6 0 0 1 0 -12a8 8 0 0 1 15 -3a6 6 0 0 1 9 5a5 5 0 0 1 -2 10z',
  ap: 'M-6 6h12v5h-12z M0 6v-6 M-7 -4a10 10 0 0 1 14 0 M-11 -8a16 16 0 0 1 22 0',
  firewall: 'M-13 -11h26v22h-26z M-13 -4h26 M-13 3h26 M-4 -11v7 M5 -4v7 M-4 3v8',
};

export function crearAnimacion(contenedor, escena) {
  const W = escena.ancho || 720, H = escena.alto || 320;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': escena.titulo });
  const capaEnlaces = el('g'), capaNodos = el('g'), capaTablas = el('g'), capaPaquetes = el('g'), capaPdu = el('g');
  svg.append(capaEnlaces, capaTablas, capaNodos, capaPdu, capaPaquetes);
  const nodos = Object.fromEntries(escena.nodos.map(n => [n.id, n]));

  const enlacesDom = {};
  for (const e of escena.enlaces || []) {
    const a = nodos[e.a], b = nodos[e.b];
    const line = el('line', { class: 'link', x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    capaEnlaces.append(line);
    if (e.texto) capaEnlaces.append(el('text', { class: 'sub', x: (a.x + b.x) / 2 + (e.dx || 0), y: (a.y + b.y) / 2 + (e.dy ?? -8), 'text-anchor': 'middle' }, e.texto));
    enlacesDom[e.id || e.a + '-' + e.b] = line;
  }
  const nodosDom = {};
  for (const n of escena.nodos) {
    const g = el('g', { transform: `translate(${n.x} ${n.y})` });
    const box = el('rect', { class: 'node-box', x: -28, y: -24, width: 56, height: 48, rx: 12 });
    g.append(box, el('path', { d: ICONS[n.tipo] || ICONS.pc, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    const label = el('text', { class: 'label', y: 42, 'text-anchor': 'middle' }, n.etiqueta);
    const sub = el('text', { class: 'sub', y: 57, 'text-anchor': 'middle' }, n.sub || '');
    g.append(label, sub);
    capaNodos.append(g);
    nodosDom[n.id] = { g, box, sub, base: n.sub || '' };
  }

  // ---------------------------------------------------------------- estado acumulado
  function estadoHasta(i) {
    const st = { tablas: {}, enlaces: {}, nodos: {}, pdu: null, pduPrev: null };
    for (let k = 0; k <= i; k++) for (const a of escena.pasos[k].acciones || []) {
      if (a.t === 'tabla') st.tablas[a.id] = { ...(st.tablas[a.id] || {}), ...a, nuevo: k === i };
      else if (a.t === 'enlace') st.enlaces[a.id] = a.estado;
      else if (a.t === 'nodo') st.nodos[a.id] = { ...(st.nodos[a.id] || {}), ...a };
      else if (a.t === 'pdu') { if (k === i) st.pduPrev = st.pdu; st.pdu = a.segs; }
    }
    for (const t of Object.values(st.tablas)) if (!escena.pasos[i].acciones?.some(a => a.t === 'tabla' && a.id === t.id)) { t.nuevo = false; t.resaltar = undefined; }
    return st;
  }

  function pintarTabla(t) {
    const ancho = t.ancho || 200, fila = 17;
    const g = el('g', { transform: `translate(${t.x} ${t.y})` });
    g.append(el('rect', { class: 'table-box', width: ancho, height: 24 + t.filas.length * fila, rx: 8 }));
    g.append(el('text', { class: 'label', x: 10, y: 16 }, t.titulo));
    t.filas.forEach((f, r) => {
      const y = 24 + r * fila;
      if (r === t.resaltar) g.append(el('rect', { class: 'hl', x: 4, y: y + 2, width: ancho - 8, height: fila - 2, rx: 4 }));
      const cols = Array.isArray(f) ? f : [f];
      const colW = (ancho - 16) / cols.length;
      cols.forEach((c, j) => g.append(el('text', { class: 'table-text', x: 10 + j * colW, y: y + 13 }, String(c))));
    });
    return g;
  }

  function pintarPdu(segs, prev) {
    capaPdu.replaceChildren();
    if (!segs) return;
    const total = segs.reduce((s, x) => s + (x.w || x.txt.length * 7.5 + 22), 0);
    let x = (W - total) / 2;
    const y = H - 44;
    const nuevos = new Set(prev ? segs.filter(s => !prev.some(p => p.txt === s.txt)).map(s => s.txt) : segs.map(s => s.txt));
    for (const s of segs) {
      const w = s.w || s.txt.length * 7.5 + 22;
      const g = el('g', { transform: `translate(${x} ${y})` });
      g.append(el('rect', { width: w - 3, height: 30, rx: 6, fill: COLORS[s.capa] || 'var(--l1)' }), el('text', { x: (w - 3) / 2, y: 20, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: '#fff' }, s.txt));
      capaPdu.append(g);
      if (nuevos.has(s.txt) && !reducedMotion()) g.animate([{ opacity: 0, transform: `translate(${x}px, ${y + 8}px)` }, { opacity: 1, transform: `translate(${x}px, ${y}px)` }], { duration: 380, easing: EASE_OUT });
      x += w;
    }
  }

  function aplicarEstado(st) {
    for (const [id, line] of Object.entries(enlacesDom)) line.setAttribute('class', 'link' + (st.enlaces[id] ? ' ' + st.enlaces[id] : ''));
    for (const [id, d] of Object.entries(nodosDom)) {
      const s = st.nodos[id];
      d.box.setAttribute('class', 'node-box' + (s?.estado === 'hl' ? ' hl' : ''));
      d.sub.textContent = s?.sub ?? d.base;
    }
    capaTablas.replaceChildren(...Object.values(st.tablas).filter(t => t.filas?.length).map(t => {
      const g = pintarTabla(t);
      if (t.nuevo && !reducedMotion()) g.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 300, easing: EASE_OUT });
      return g;
    }));
    pintarPdu(st.pdu, st.pduPrev);
  }

  // ---------------------------------------------------------------- paquetes
  let animaciones = [];
  function paquete(a) {
    const color = COLORS[a.capa] || 'var(--accent)';
    const w = Math.max(54, a.etiqueta.length * 7 + 18);
    const g = el('g', { class: 'pkt' });
    g.append(el('rect', { x: -w / 2, y: -12, width: w, height: 24, fill: color }), el('text', { 'text-anchor': 'middle', y: 4 }, a.etiqueta));
    capaPaquetes.append(g);
    const puntos = a.ruta.map(id => ({ x: nodos[id].x + (a.dx || 0), y: nodos[id].y - 36 + (a.dy || 0) }));
    const pos = p => `translate(${p.x}px, ${p.y}px)`;
    if (reducedMotion()) {
      const fin = puntos[puntos.length - 1];
      g.style.transform = pos(fin);
      const anim = g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: a.retardo || 0, fill: 'both' });
      animaciones.push(anim);
      return anim.finished;
    }
    const tramo = a.duracion || 900;
    const frames = puntos.map((p, i) => ({ transform: pos(p), offset: puntos.length === 1 ? 0 : i / (puntos.length - 1), opacity: 1 }));
    frames[0] = { ...frames[0], opacity: 0 };
    if (frames.length > 1) frames.splice(1, 0, { transform: pos({ x: puntos[0].x + (puntos[1].x - puntos[0].x) * 0.04, y: puntos[0].y + (puntos[1].y - puntos[0].y) * 0.04 }), offset: Math.min(0.06, frames[1].offset / 2), opacity: 1 });
    const anim = g.animate(frames, { duration: tramo * Math.max(1, puntos.length - 1), delay: a.retardo || 0, easing: EASE_MOVE, fill: 'both' });
    animaciones.push(anim);
    return anim.finished;
  }

  // ---------------------------------------------------------------- controles
  let paso = 0, reproduciendo = false, temporizador = null;
  const caption = el('div', { class: 'anim-caption', 'aria-live': 'polite' });
  const btnPlay = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Reproducir');
  const btnPrev = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Paso anterior' }, '‹ Anterior');
  const btnNext = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-label': 'Paso siguiente' }, 'Siguiente ›');
  const btnReplay = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', 'aria-label': 'Repetir este paso' }, '↻');
  const dots = el('div', { class: 'dots' }, escena.pasos.map((_, i) => el('button', { type: 'button', class: 'dot', 'aria-label': `Ir al paso ${i + 1}`, onclick: () => { parar(); ir(i); } })));

  function limpiar() { animaciones.forEach(a => a.cancel()); animaciones = []; capaPaquetes.replaceChildren(); clearTimeout(temporizador); }

  async function ir(i) {
    limpiar();
    paso = Math.max(0, Math.min(escena.pasos.length - 1, i));
    const p = escena.pasos[paso];
    aplicarEstado(estadoHasta(paso));
    caption.replaceChildren(el('span', { class: 'step' }, `Paso ${paso + 1} de ${escena.pasos.length}`), p.texto);
    [...dots.children].forEach((d, k) => { if (k === paso) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    btnPrev.disabled = paso === 0;
    btnNext.disabled = paso === escena.pasos.length - 1;
    const yo = paso;
    const viajes = (p.acciones || []).filter(a => a.t === 'paquete').map(paquete);
    try { await Promise.all(viajes); } catch { return; }
    if (reproduciendo && yo === paso) {
      if (paso < escena.pasos.length - 1) temporizador = setTimeout(() => ir(paso + 1), 1500 + p.texto.length * 22);
      else parar();
    }
  }
  function reproducir() {
    reproduciendo = true; btnPlay.textContent = 'Pausa';
    ir(paso === escena.pasos.length - 1 ? 0 : paso);
  }
  function parar() { reproduciendo = false; btnPlay.textContent = 'Reproducir'; clearTimeout(temporizador); }

  btnPlay.addEventListener('click', () => (reproduciendo ? parar() : reproducir()));
  btnPrev.addEventListener('click', () => { parar(); ir(paso - 1); });
  btnNext.addEventListener('click', () => { parar(); ir(paso + 1); });
  btnReplay.addEventListener('click', () => ir(paso));

  const raiz = el('figure', { class: 'anim', role: 'group', 'aria-label': 'Animación: ' + escena.titulo },
    el('div', { class: 'anim-head' }, el('strong', {}, escena.titulo), el('span', { class: 'badge badge-violet' }, 'Animación')),
    el('div', { class: 'anim-stage' }, svg),
    caption,
    el('div', { class: 'anim-controls' }, btnPlay, btnPrev, btnNext, btnReplay, dots));
  raiz.style.margin = '0';
  contenedor.append(raiz);

  // Pausar si sale de la vista; no gastar CPU con animaciones invisibles.
  new IntersectionObserver(entries => entries.forEach(e => { if (!e.isIntersecting && reproduciendo) parar(); })).observe(raiz);
  ir(0);
  return { ir, reproducir, parar, get paso() { return paso; } };
}
