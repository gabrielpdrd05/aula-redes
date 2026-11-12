// Página de lección: contenido, elementos interactivos, cuestionario, navegación y tutor con IA que conoce la lección.
import { iniciarPagina, el, $, toast } from '../core.js';
import { cargarCurso, buscarLeccion, numeroModulo } from '../curso.js';
import { renderBlocks } from '../render.js';
import { montarQuiz } from '../quiz.js';
import { crearTutor } from '../tutor.js';
import { cargar, alCambiar, completarLeccion, guardarQuiz, leccionHecha, notaQuiz, registrarRespuestas } from '../progreso.js';

iniciarPagina();
const box = $('#leccion');
const id = new URLSearchParams(location.search).get('id') || 'm0-curso';
const curso = await cargarCurso().catch(() => null);
const r = curso && buscarLeccion(curso, id);
await cargar();

// Texto plano de los bloques, para dar contexto al tutor.
function textoPlano(blocks) {
  const seg = c => (Array.isArray(c) ? c.map(s => s.v).join('') : '');
  return blocks.map(b => {
    if (b.t === 'p' || b.t === 'h') return seg(b.c);
    if (b.t === 'ul' || b.t === 'ol') return b.items.map(i => '- ' + seg(i)).join('\n');
    if (b.t === 'code') return b.v;
    if (b.t === 'table') return [b.head, ...b.rows].map(r => r.map(seg).join(' | ')).join('\n');
    if (b.t === 'callout') return textoPlano(b.c);
    return '';
  }).filter(Boolean).join('\n');
}

function nav() {
  const m = r.leccion.modulo;
  $('#nav').replaceChildren(
    el('p', { class: 'small' }, el('a', { href: 'curso.html' }, '‹ Todo el curso')),
    el('h2', {}, `Módulo ${numeroModulo(m)} · ${m.titulo}`),
    el('ul', { class: 'lesson-list' }, m.lecciones.map(l => el('li', {}, el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id, 'aria-current': l.id === id ? 'page' : null },
      el('span', { class: 'check' + (leccionHecha(l.id) ? ' on' : notaQuiz(l.id) ? ' half' : ''), 'aria-hidden': 'true' }, '✓'), el('span', {}, l.titulo))))));
}

if (!r) {
  box.replaceChildren(el('h1', {}, 'Lección no encontrada'), el('p', { class: 'muted' }, 'Puede que el enlace esté mal.'), el('a', { class: 'btn btn-primary', href: 'curso.html' }, 'Ir al curso'));
} else {
  const { leccion, anterior, siguiente } = r;
  document.title = `${leccion.titulo} · Aula de Redes`;
  nav();
  alCambiar(nav);
  const hecha = () => leccionHecha(leccion.id);
  const btnHecha = el('button', { type: 'button', class: 'btn btn-ghost' });
  const pintarBoton = () => { btnHecha.textContent = hecha() ? '✓ Lección completada' : 'Marcar como completada'; btnHecha.disabled = hecha(); };
  btnHecha.addEventListener('click', async () => { await completarLeccion(leccion.id); pintarBoton(); toast('Lección completada.'); });
  pintarBoton();

  const prose = el('div', { class: 'prose' });
  prose.append(renderBlocks(leccion.blocks, { leccion }));
  const quizBox = el('div');
  box.replaceChildren(
    el('header', { class: 'lesson-head' },
      el('div', { class: 'crumbs' }, `Módulo ${numeroModulo(leccion.modulo)} · ${leccion.modulo.titulo}`),
      el('h1', {}, leccion.titulo),
      el('div', { class: 'meta' }, el('span', { class: 'badge level-' + ['principiante', 'intermedio', 'avanzado'][leccion.nivel - 1] }, 'Nivel ' + leccion.nivel + ' · ' + ['Principiante', 'Intermedio', 'Avanzado'][leccion.nivel - 1]), el('span', { class: 'badge' }, leccion.minutos + ' min'), leccion.modulo.peso ? el('span', { class: 'badge badge-accent' }, 'CCNA ' + leccion.modulo.dominio.split(' ')[0]) : null, hecha() ? el('span', { class: 'badge badge-ok' }, 'Completada') : null)),
    prose, quizBox,
    el('nav', { class: 'lesson-actions', 'aria-label': 'Lecciones' },
      anterior ? el('a', { class: 'btn btn-quiet', href: 'leccion.html?id=' + anterior.id }, '‹ ' + anterior.titulo) : el('span'),
      btnHecha,
      siguiente ? el('a', { class: 'btn btn-primary', href: 'leccion.html?id=' + siguiente.id }, siguiente.titulo + ' ›') : el('a', { class: 'btn btn-primary', href: 'examen.html' }, 'Hacer un simulacro ›')));

  if (leccion.quiz?.length) {
    montarQuiz(quizBox, leccion.quiz.map((q, i) => ({ ...q, id: `${leccion.id}#${i}` })), {
      anterior: notaQuiz(leccion.id),
      alTerminar: async (aciertos, total, detalle) => {
        registrarRespuestas(detalle, 'leccion');
        const falladas = detalle.filter(d => !d.ok).length;
        if (falladas) quizBox.querySelector('.quiz-result')?.append(' ', el('a', { href: 'repaso.html?leccion=' + leccion.id }, `${falladas === 1 ? 'La que has fallado se ha añadido' : `Las ${falladas} que has fallado se han añadido`} a tu repaso →`));
        await guardarQuiz(leccion.id, aciertos, total);
        if (aciertos / total >= 0.7 && !hecha()) { await completarLeccion(leccion.id); pintarBoton(); toast('¡Aprobado! Lección completada.'); }
      },
    });
  }
  crearTutor({ leccion: { id: leccion.id, titulo: leccion.titulo, texto: textoPlano(leccion.blocks) } });
}
