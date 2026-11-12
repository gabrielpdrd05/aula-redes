// Videoteca: todos los videos explicativos, filtrables por área, con el reproductor arriba.
import { iniciarPagina, el, $, $$, revelar } from '../core.js';
import { cargarCurso } from '../curso.js';
import { VIDEOS, VIDEO_EN } from '../video/videos.js';
import { crearVideo } from '../video/reproductor.js';

iniciarPagina();
const curso = await cargarCurso().catch(() => null);
const ICONO = { redes: '🌐', bd: '🗄️', prog: '💻', ti: '🏢' };
let area = '';
const pedido = location.hash.slice(1);
let actual = VIDEOS[pedido] ? pedido : Object.keys(VIDEOS)[0];
let reproductor = null;

function cargar(id, foco) {
  reproductor?.pausar();
  actual = id;
  const v = VIDEOS[id];
  const l = curso?.lecciones.find(x => x.id === VIDEO_EN[id]);
  const caja = $('#reproductor');
  caja.replaceChildren();
  reproductor = crearVideo(caja, v);
  if (l) caja.append(el('p', { class: 'small muted mt' }, 'Este video forma parte de la lección ', el('a', { href: `leccion.html?id=${l.id}#video-${id}` }, l.titulo), '.'));
  history.replaceState(null, '', '#' + id);
  $$('#lista .video-card').forEach(c => c.setAttribute('aria-current', String(c.dataset.id === id)));
  if (foco) { caja.scrollIntoView({ block: 'start' }); caja.querySelector('.v-portada')?.focus(); }
}

function pintar() {
  $$('#filtroArea button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.area === area)));
  $('#lista').replaceChildren(...Object.values(VIDEOS).filter(v => !area || v.area === area).map(v => {
    const l = curso?.lecciones.find(x => x.id === VIDEO_EN[v.id]);
    const a = el('a', { class: 'card video-card', href: '#' + v.id, 'data-id': v.id, 'aria-current': String(v.id === actual) },
      el('div', { class: 'thumb', 'aria-hidden': 'true' }, ICONO[v.area]),
      el('h3', {}, v.titulo),
      el('p', { class: 'small muted' }, `${v.escenas.length} escenas`, l ? ` · ${l.modulo.titulo}` : ''));
    a.addEventListener('click', e => { e.preventDefault(); cargar(v.id, true); });
    return a;
  }));
}
$('#filtroArea').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; area = b.dataset.area; pintar(); });
pintar();
cargar(actual, false);
revelar('#lista .video-card');
