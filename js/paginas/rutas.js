// Rutas de empleo: progreso por ruta (lecciones de sus módulos, prácticas y proyecto final) y plan de módulos.
import { iniciarPagina, el, $, setMeter, plural, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { cargar, alCambiar, leccionHecha, labHecho } from '../progreso.js';
import { RUTAS, MODULOS_TI, progresoRuta } from '../rutas.js';

iniciarPagina();
const [curso] = await Promise.all([cargarCurso(), cargar()]);
let elegida = local.get('aula:ruta', '');

function estadoModulo(m) {
  if (!m) return { hechas: 0, total: 0 };
  return { hechas: m.lecciones.filter(l => leccionHecha(l.id)).length, total: m.lecciones.length };
}

function tarjeta(ruta) {
  const pr = progresoRuta(ruta, curso, CATALOGO, { leccionHecha, labHecho });
  const meter = el('div', { class: 'meter' }, el('span'));
  setMeter(meter, pr.porcentaje / 100);
  const siguiente = pr.modulos.flatMap(x => x.modulo?.lecciones || []).find(l => !leccionHecha(l.id));
  const elegir = el('button', { type: 'button', class: 'btn btn-sm ' + (elegida === ruta.id ? 'btn-ok' : 'btn-ghost'), 'aria-pressed': String(elegida === ruta.id) }, elegida === ruta.id ? '✓ Mi ruta' : 'Elegir esta ruta');
  elegir.addEventListener('click', () => { elegida = elegida === ruta.id ? '' : ruta.id; local.set('aula:ruta', elegida); pintar(); });
  const titulo = id => MODULOS_TI.find(m => m.id === id)?.titulo || curso.modulos.find(m => m.id === id)?.titulo || id;
  return el('article', { class: 'card route-card' + (ruta.prioridad ? ' priority' : ''), id: 'ruta-' + ruta.id },
    el('div', { class: 'route-head' }, el('span', { class: 'icon', 'aria-hidden': 'true' }, ruta.icono), el('div', {}, el('h3', {}, ruta.titulo),
      el('div', { class: 'lab-tags' }, ruta.prioridad ? el('span', { class: 'badge badge-accent' }, 'Disponible ya') : null, ruta.independiente ? el('span', { class: 'badge' }, 'Ruta independiente') : null,
        pr.enPreparacion ? el('span', { class: 'badge' }, `${pr.disponibles}/${pr.modulos.length} módulos publicados`) : null))),
    el('p', { class: 'small' }, ruta.puesto),
    el('details', {}, el('summary', { class: 'small' }, 'Requisitos del puesto que trabaja esta ruta'), el('ul', { class: 'small' }, ruta.requisitos.map(r => el('li', {}, r)))),
    el('div', {}, el('div', { class: 'small muted' }, `${pr.porcentaje} % · ${plural(pr.hechas, 'lección', 'lecciones')} de ${pr.lecciones} · ${pr.pracHechas}/${pr.practicas.length} prácticas`), meter),
    el('ol', { class: 'route-mods', 'aria-label': 'Módulos de la ruta' }, pr.modulos.map(({ id, modulo }) => {
      const e = estadoModulo(modulo);
      return el('li', { class: modulo ? '' : 'soon' }, el('span', { class: 'check' + (e.total && e.hechas === e.total ? ' on' : e.hechas ? ' half' : ''), 'aria-hidden': 'true' }, '✓'),
        modulo ? el('a', { href: 'leccion.html?id=' + modulo.lecciones[0].id }, titulo(id)) : el('span', {}, titulo(id)),
        el('span', { class: 'small muted' }, modulo ? `${e.hechas}/${e.total}` : 'en preparación'));
    })),
    pr.practicas.length ? el('div', {}, el('div', { class: 'small muted' }, 'Prácticas que cuentan'), el('ul', { class: 'chips' }, pr.practicas.map(p => el('li', {}, el('a', { class: 'chip' + (labHecho(p.progreso) ? ' done' : ''), href: 'laboratorio.html?l=' + p.clave }, p.titulo))))) : null,
    el('div', { class: 'small' }, el('strong', {}, 'Proyecto final: '), ruta.proyecto
      ? [el('a', { href: 'laboratorio.html?l=' + ruta.proyecto.clave }, ruta.proyecto.titulo), pr.proyHecho ? ' ✓' : '', el('br'), el('span', { class: 'muted' }, ruta.proyecto.texto)]
      : el('span', { class: 'muted' }, 'en preparación (llegará con los módulos de la ruta).')),
    el('div', { class: 'hero-cta' }, siguiente ? el('a', { class: 'btn btn-primary btn-sm', href: 'leccion.html?id=' + siguiente.id }, pr.hechas ? 'Continuar la ruta' : 'Empezar la ruta') : null, elegir));
}

function pintar() {
  const orden = [...RUTAS].sort((a, b) => (b.id === elegida) - (a.id === elegida));
  $('#rutas').replaceChildren(...orden.map(tarjeta));
  $('#plan').replaceChildren(...MODULOS_TI.map(m => {
    const mod = curso.modulos.find(x => x.id === m.id);
    return el('article', { class: 'card' }, el('div', { class: 'route-head' }, el('span', { class: 'icon', 'aria-hidden': 'true' }, m.icono), el('div', {}, el('h3', {}, `${m.n}. ${m.titulo}`), mod ? el('a', { class: 'badge badge-ok', href: 'leccion.html?id=' + mod.lecciones[0].id }, `Disponible · ${mod.lecciones.length} lecciones`) : el('span', { class: 'badge' }, 'En preparación'))),
      el('dl', {}, el('dt', {}, '🖥️ En el navegador'), el('dd', {}, m.navegador), el('dt', {}, '🧪 Laboratorio externo'), el('dd', {}, m.externo)));
  }));
}
pintar();
alCambiar(pintar);
