// Índice de laboratorios con su estado.
import { iniciarPagina, el, $ } from '../core.js';
import { CATALOGO } from '../labs/catalogo.js';
import { cargar, alCambiar, labHecho } from '../progreso.js';

iniciarPagina();
await cargar();
function pintar() {
  for (const [grupo, sel] of [['numeros', '#labsNumeros'], ['cli', '#labsCli'], ['sql', '#labsSql']]) {
    $(sel).replaceChildren(...CATALOGO.filter(l => l.grupo === grupo).map(l => el('a', { class: 'card lab-card', href: 'laboratorio.html?l=' + l.clave },
      el('div', { class: 'lab-card-head' }, el('h3', {}, l.titulo), labHecho(l.progreso) ? el('span', { class: 'badge badge-ok' }, '✓ Hecho') : l.tareas ? el('span', { class: 'badge' }, l.tareas + ' tareas') : null),
      el('p', { class: 'muted small' }, l.texto))));
  }
}
pintar();
alCambiar(pintar);
