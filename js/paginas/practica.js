// Índice de laboratorios con su estado y filtro por nivel.
import { iniciarPagina, el, $, $$, local } from '../core.js';
import { CATALOGO, NIVELES } from '../labs/catalogo.js';
import { cargar, alCambiar, labHecho } from '../progreso.js';

iniciarPagina();
await cargar();
let nivel = local.get('aula:practica:nivel', '');
function pintar() {
  $$('#filtroNivel button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nivel === nivel)));
  for (const [grupo, sel] of [['cli', '#labsCli'], ['averias', '#labsAverias'], ['numeros', '#labsNumeros'], ['sql', '#labsSql']]) {
    const labs = CATALOGO.filter(l => l.grupo === grupo && (!nivel || l.nivel === nivel));
    $(sel).replaceChildren(...(labs.length ? labs.map(l => el('a', { class: 'card lab-card', href: 'laboratorio.html?l=' + l.clave },
      el('div', { class: 'lab-card-head' }, el('h3', {}, l.titulo), labHecho(l.progreso) ? el('span', { class: 'badge badge-ok' }, '✓ Hecho') : l.tareas ? el('span', { class: 'badge' }, l.tareas + ' tareas') : null),
      l.nivel ? el('span', { class: 'badge level-' + l.nivel }, NIVELES[l.nivel]) : null,
      el('p', { class: 'muted small' }, l.texto))) : [el('p', { class: 'muted small' }, 'No hay laboratorios de este nivel en esta sección.')]));
  }
}
$('#filtroNivel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  nivel = b.dataset.nivel;
  local.set('aula:practica:nivel', nivel);
  pintar();
});
pintar();
alCambiar(pintar);
