// Panel del curso: progreso global, "continuar donde lo dejaste" y la lista de módulos con sus lecciones.
import { iniciarPagina, el, $, setMeter, plural, pct } from '../core.js';
import { cuentasActivas } from '../auth.js';
import { cargarCurso, numeroModulo } from '../curso.js';
import { cargar, alCambiar, leccionHecha, notaQuiz, labHecho, examenes, racha } from '../progreso.js';

const usuario = await iniciarPagina();
const curso = await cargarCurso().catch(() => null);
const abiertos = new Set();

function check(hecho, medio) { return el('span', { class: 'check' + (hecho ? ' on' : medio ? ' half' : ''), 'aria-hidden': 'true' }, '✓'); }

function pintar() {
  if (!curso) { $('#modulos').replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar el temario. Recarga la página.'))); return; }
  const todas = curso.lecciones;
  const hechas = todas.filter(l => leccionHecha(l.id)).length;
  $('#stLecciones').textContent = `${hechas}/${todas.length}`;
  $('#stRacha').textContent = racha();
  $('#stLabs').textContent = ['subnetting', 'binario', 'vlsm', 'cli-basico', 'cli-vlan', 'cli-trunk', 'cli-estatica', 'cli-ospf', 'cli-acl', 'cli-ssh', 'cli-portsecurity', 'sql-select', 'sql-join', 'sql-agregacion', 'sql-modificar', 'sql-inventario'].filter(labHecho).length;
  const ex = examenes();
  $('#stExamen').textContent = ex.length ? Math.max(...ex.map(e => pct(e.puntos, e.total))) + ' %' : '—';
  setMeter($('#meterTotal'), hechas / todas.length);
  $('#pctTotal').textContent = `Has completado el ${pct(hechas, todas.length)} % del curso.`;

  const siguiente = todas.find(l => !leccionHecha(l.id));
  const cont = $('#continuar');
  cont.hidden = false;
  cont.replaceChildren(...(siguiente
    ? [el('div', {}, el('span', { class: 'eyebrow' }, hechas ? 'Continúa donde lo dejaste' : 'Empieza por aquí'), el('h2', {}, siguiente.titulo), el('p', { class: 'muted small' }, `Módulo ${numeroModulo(siguiente.modulo)} · ${siguiente.modulo.titulo} · ${siguiente.minutos} min`)),
       el('a', { class: 'btn btn-primary btn-lg', href: 'leccion.html?id=' + siguiente.id }, hechas ? 'Continuar' : 'Empezar')]
    : [el('div', {}, el('span', { class: 'eyebrow' }, '¡Curso completado!'), el('h2', {}, 'Ahora, a por el examen'), el('p', { class: 'muted small' }, 'Haz simulacros de 100 preguntas hasta superar el 85 % de forma constante.')),
       el('a', { class: 'btn btn-primary btn-lg', href: 'examen.html' }, 'Simulacro')]));

  $('#modulos').replaceChildren(...curso.modulos.map(m => {
    const n = m.lecciones.filter(l => leccionHecha(l.id)).length;
    const meter = el('div', { class: 'meter' }, el('span'));
    setMeter(meter, n / m.lecciones.length);
    const det = el('details', { class: 'module' + (n === m.lecciones.length ? ' done' : ''), open: abiertos.has(m.id) || (siguiente?.modulo.id === m.id && !abiertos.size) },
      el('summary', {}, el('span', { class: 'module-num' }, n === m.lecciones.length ? '✓' : numeroModulo(m)),
        el('div', {}, el('div', { class: 'module-title' }, m.titulo), el('div', { class: 'module-meta' }, [m.dominio, m.peso ? m.peso + ' % del examen' : null, `${n}/${plural(m.lecciones.length, 'lección', 'lecciones')}`].filter(Boolean).join(' · '))),
        el('div', { class: 'module-progress' }, meter)),
      el('p', { class: 'small muted module-desc' }, m.descripcion),
      el('ul', { class: 'lesson-list' }, m.lecciones.map(l => {
        const q = notaQuiz(l.id);
        return el('li', {}, el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id },
          check(leccionHecha(l.id), q), el('span', {}, l.titulo),
          el('span', { class: 'small muted' }, q ? `${q.puntos}/${q.total}` : l.minutos + ' min')));
      })));
    det.addEventListener('toggle', () => { if (det.open) abiertos.add(m.id); else abiertos.delete(m.id); });
    return det;
  }));
}

if (usuario) {
  $('#saludo').textContent = `Hola, ${usuario.nombre || usuario.email.split('@')[0]}`;
} else if (cuentasActivas()) {
  $('#avisoCuenta').replaceChildren(el('div', { class: 'alert alert-info mb' }, el('p', {}, 'Estás como invitado: tu progreso se guarda solo en este navegador. Crea una cuenta gratuita para no perderlo y usar el tutor con IA.'), el('a', { class: 'btn btn-primary btn-sm', href: 'cuenta.html?siguiente=curso.html' }, 'Crear cuenta')));
}
await cargar();
pintar();
alCambiar(pintar);
