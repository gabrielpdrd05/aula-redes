// Guía de comandos de Cisco IOS: buscador, filtro por nivel y un enlace al laboratorio donde practicar cada uno.
import { iniciarPagina, el, $, $$, local } from '../core.js';
import { codeBlock } from '../render.js';
import { COMANDOS, CATEGORIAS, MODOS } from '../comandos-datos.js';
import { LABS } from '../labs/ios-labs.js';

iniciarPagina();
const NIVEL = ['', 'Nivel 1 · Principiante', 'Nivel 2 · Intermedio', 'Nivel 3 · Avanzado'];
const CLASE = ['', 'principiante', 'intermedio', 'avanzado'];
const fold = t => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
let nivel = local.get('aula:comandos:nivel', 0);
const buscador = $('#buscarCmd');

function tarjeta(c) {
  const lab = c.lab && LABS[c.lab];
  return el('article', { class: 'card cmd-card' },
    el('div', { class: 'cmd-head' }, el('code', { class: 'cmd-name' }, c.cmd), el('span', { class: 'badge level-' + CLASE[c.nivel] }, NIVEL[c.nivel])),
    el('p', { class: 'small muted cmd-mode' }, 'Modo: ', el('code', {}, MODOS[c.modo])),
    el('p', {}, c.que),
    codeBlock(c.ej.join('\n'), 'ios'),
    lab ? el('p', { class: 'small' }, '▶ Practícalo: ', el('a', { href: 'laboratorio.html?l=cli:' + c.lab }, lab.titulo.replace(/^Avería:\s*/, (lab.tipo === 'averia' ? 'avería: ' : '')))) : null);
}

function pintar() {
  $$('#filtroNivel button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.nivel) === nivel)));
  const q = fold(buscador.value.trim());
  const visibles = COMANDOS.filter(c => (!nivel || c.nivel === nivel) && (!q || fold(c.cmd + ' ' + c.que + ' ' + c.ej.join(' ')).includes(q)));
  $('#contador').textContent = visibles.length === COMANDOS.length ? `${COMANDOS.length} comandos` : `${visibles.length} de ${COMANDOS.length} comandos`;
  const secciones = CATEGORIAS.map(cat => {
    const lista = visibles.filter(c => c.cat === cat.id);
    if (!lista.length) return null;
    return el('section', { class: 'cmd-section', id: 'cat-' + cat.id, 'aria-labelledby': 'h-' + cat.id },
      el('h2', { id: 'h-' + cat.id }, cat.titulo), el('p', { class: 'muted' }, cat.texto),
      el('div', { class: 'cmd-grid' }, lista.map(tarjeta)));
  }).filter(Boolean);
  $('#comandos').replaceChildren(...(secciones.length ? secciones : [el('p', { class: 'muted' }, 'Ningún comando coincide con tu búsqueda.')]));
  $('#indiceCat').replaceChildren(...CATEGORIAS.filter(cat => visibles.some(c => c.cat === cat.id)).map(cat => el('li', {}, el('a', { href: '#cat-' + cat.id }, cat.titulo))));
}

buscador.addEventListener('input', pintar);
$('#filtroNivel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  nivel = Number(b.dataset.nivel);
  local.set('aula:comandos:nivel', nivel);
  pintar();
});
const q = new URLSearchParams(location.search).get('q');
if (q) buscador.value = q.slice(0, 80);
pintar();
