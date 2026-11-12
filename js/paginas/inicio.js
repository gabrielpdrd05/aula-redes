// Portada: ilustración animada de una red (un paquete viaja de un PC a un servidor) y los dominios del CCNA.
import { iniciarPagina, el, $, reducedMotion, revelar } from '../core.js';
import { cargarCurso } from '../curso.js';

iniciarPagina();

function heroArt() {
  const holder = $('#heroArt');
  const nodos = [
    { id: 'pc', x: 70, y: 250, label: 'PC', color: 'var(--accent)' },
    { id: 'sw', x: 200, y: 250, label: 'Switch', color: 'var(--ok)' },
    { id: 'r1', x: 330, y: 150, label: 'R1', color: 'var(--violet)' },
    { id: 'r2', x: 330, y: 350, label: 'R2', color: 'var(--violet)' },
    { id: 'srv', x: 460, y: 250, label: 'Servidor', color: 'var(--warn)' },
  ];
  const pos = Object.fromEntries(nodos.map(n => [n.id, n]));
  const enlaces = [['pc', 'sw'], ['sw', 'r1'], ['sw', 'r2'], ['r1', 'srv'], ['r2', 'srv'], ['r1', 'r2']];
  const svg = el('svg', { viewBox: '0 0 530 500', role: 'img', 'aria-label': 'Un paquete viaja por una red de un PC a un servidor' },
    enlaces.map(([a, b]) => el('line', { x1: pos[a].x, y1: pos[a].y, x2: pos[b].x, y2: pos[b].y, stroke: 'var(--line-2)', 'stroke-width': 3, 'stroke-linecap': 'round' })),
    nodos.map(n => el('g', {}, el('circle', { cx: n.x, cy: n.y, r: 26, fill: 'var(--surface)', stroke: n.color, 'stroke-width': 3 }),
      el('text', { x: n.x, y: n.y + 50, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: 'var(--ink-2)' }, n.label))));
  const paquete = el('g', {}, el('rect', { x: -15, y: -10, width: 30, height: 20, rx: 5, fill: 'var(--accent)' }), el('text', { y: 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: 'var(--accent-ink)' }, 'IP'));
  svg.append(paquete);
  holder.replaceChildren(svg);
  const ruta = ['pc', 'sw', 'r1', 'srv'].map(id => pos[id]);
  const tf = p => `translate(${p.x}px, ${p.y - 40}px)`;
  if (reducedMotion()) { paquete.style.transform = tf(ruta[3]); return; }
  // Movimiento en pantalla: ease-in-out por tramo; el recorrido es explicativo (portada), por eso dura más.
  const frames = ruta.map((p, i) => ({ transform: tf(p), offset: i / (ruta.length - 1) }));
  paquete.animate([{ ...frames[0], opacity: 0 }, { ...frames[0], opacity: 1, offset: 0.05 }, ...frames.slice(1, -1), { ...frames[3], opacity: 1, offset: 0.92 }, { ...frames[3], opacity: 0 }],
    { duration: 4200, iterations: Infinity, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
}

async function dominios() {
  const box = $('#dominios');
  try {
    const curso = await cargarCurso();
    box.replaceChildren(...curso.modulos.filter(m => m.peso > 0).map(m => el('div', { class: 'domain-row' },
      el('span', { class: 'domain-num' }, m.id.slice(1)),
      el('div', {}, el('strong', {}, m.titulo), el('div', { class: 'small muted' }, `${m.lecciones.length} lecciones`)),
      el('span', { class: 'badge badge-accent' }, m.peso + ' %'))));
  } catch { box.replaceChildren(el('p', { class: 'muted' }, 'No se pudo cargar el temario.')); }
}

heroArt();
dominios();
revelar('.section .section-head, .section .card, .section .route-banner');
