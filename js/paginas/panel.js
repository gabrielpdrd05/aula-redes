// Panel del curso: progreso global, "continuar donde lo dejaste" y el temario en dos vistas:
// ruta por niveles (principiante → intermedio → avanzado) o por módulos del CCNA.
import { iniciarPagina, el, $, $$, setMeter, plural, pct, local } from '../core.js';
import { cuentasActivas } from '../auth.js';
import { CONFIG } from '../config.js';
import { cargarCurso, numeroModulo } from '../curso.js';
import { CATALOGO } from '../labs/catalogo.js';
import { cargar, alCambiar, leccionHecha, notaQuiz, labHecho, examenes, racha } from '../progreso.js';

const usuario = await iniciarPagina();
const curso = await cargarCurso().catch(() => null);
const abiertos = new Set();
let vista = local.get('aula:panel:vista', 'niveles');

const NIVEL_INFO = [
  { n: 1, clave: 'principiante', titulo: 'Nivel 1 · Principiante', texto: 'Los cimientos: qué es una red, cómo viajan los datos (OSI, Ethernet, ARP), direcciones IP, tus primeros comandos en un Cisco y las VLAN.' },
  { n: 2, clave: 'intermedio', titulo: 'Nivel 2 · Intermedio', texto: 'Ya configuras redes: subnetting, trunks, enrutamiento entre VLAN, rutas estáticas, DHCP, NAT, SSH, ACL y resolución de averías.' },
  { n: 3, clave: 'avanzado', titulo: 'Nivel 3 · Avanzado', texto: 'Nivel de empleo y de examen: OSPF, EtherChannel, redundancia, seguridad de capa 2, IPv6, QoS, wireless y automatización.' },
];
// Orden de la ruta: primero todo el nivel 1, luego el 2 y luego el 3 (dentro de cada nivel, en el orden del temario).
const ruta = () => [...curso.lecciones].sort((a, b) => a.nivel - b.nivel);

function check(hecho, medio) { return el('span', { class: 'check' + (hecho ? ' on' : medio ? ' half' : ''), 'aria-hidden': 'true' }, '✓'); }
function filaLeccion(l, conModulo) {
  const q = notaQuiz(l.id);
  return el('li', {}, el('a', { class: 'lesson-link', href: 'leccion.html?id=' + l.id },
    check(leccionHecha(l.id), q),
    el('span', {}, l.titulo, conModulo ? el('span', { class: 'lesson-mod' }, ` · M${numeroModulo(l.modulo)}`) : null),
    el('span', { class: 'small muted' }, q ? `${q.puntos}/${q.total}` : l.minutos + ' min')));
}
function bloque(clave, cabecera, desc, lecciones, extra, abrirPorDefecto) {
  const n = lecciones.filter(l => leccionHecha(l.id)).length;
  const meter = el('div', { class: 'meter' }, el('span'));
  setMeter(meter, lecciones.length ? n / lecciones.length : 0);
  const det = el('details', { class: 'module' + (n === lecciones.length ? ' done' : ''), open: abiertos.has(clave) || (abrirPorDefecto && !abiertos.size) },
    el('summary', {}, el('span', { class: 'module-num' }, n === lecciones.length ? '✓' : String(cabecera.num)),
      el('div', {}, el('div', { class: 'module-title' }, cabecera.titulo), el('div', { class: 'module-meta' }, [...cabecera.meta, `${n}/${plural(lecciones.length, 'lección', 'lecciones')}`].join(' · '))),
      el('div', { class: 'module-progress' }, meter)),
    el('p', { class: 'small muted module-desc' }, desc),
    el('ul', { class: 'lesson-list' }, lecciones.map(l => filaLeccion(l, cabecera.conModulo))),
    extra);
  det.addEventListener('toggle', () => { if (det.open) abiertos.add(clave); else abiertos.delete(clave); });
  return det;
}

function pintar() {
  if (!curso) { $('#modulos').replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar el temario. Recarga la página.'))); return; }
  const todas = curso.lecciones;
  const hechas = todas.filter(l => leccionHecha(l.id)).length;
  $('#stLecciones').textContent = `${hechas}/${todas.length}`;
  $('#stRacha').textContent = racha();
  $('#stLabs').textContent = `${CATALOGO.filter(l => labHecho(l.progreso)).length}/${CATALOGO.length}`;
  const ex = examenes();
  $('#stExamen').textContent = ex.length ? Math.max(...ex.map(e => pct(e.puntos, e.total))) + ' %' : '—';
  setMeter($('#meterTotal'), hechas / todas.length);
  $('#pctTotal').textContent = `Has completado el ${pct(hechas, todas.length)} % del curso.`;
  $$('#vistas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vista === vista)));

  const siguiente = (vista === 'niveles' ? ruta() : todas).find(l => !leccionHecha(l.id));
  const cont = $('#continuar');
  cont.hidden = false;
  cont.replaceChildren(...(siguiente
    ? [el('div', {}, el('span', { class: 'eyebrow' }, hechas ? 'Continúa donde lo dejaste' : 'Empieza por aquí'), el('h2', {}, siguiente.titulo),
        el('p', { class: 'muted small' }, `${NIVEL_INFO[siguiente.nivel - 1].titulo} · Módulo ${numeroModulo(siguiente.modulo)} · ${siguiente.minutos} min`)),
       el('a', { class: 'btn btn-primary btn-lg', href: 'leccion.html?id=' + siguiente.id }, hechas ? 'Continuar' : 'Empezar')]
    : [el('div', {}, el('span', { class: 'eyebrow' }, '¡Curso completado!'), el('h2', {}, 'Ahora, a por el examen'), el('p', { class: 'muted small' }, 'Haz simulacros de 100 preguntas hasta superar el 85 % de forma constante.')),
       el('a', { class: 'btn btn-primary btn-lg', href: 'examen.html' }, 'Simulacro')]));

  if (vista === 'niveles') {
    $('#modulos').replaceChildren(...NIVEL_INFO.map(nv => {
      const lecciones = todas.filter(l => l.nivel === nv.n);
      const labs = CATALOGO.filter(l => l.nivel === nv.clave);
      const extra = el('div', { class: 'level-labs' }, el('p', { class: 'small' }, el('strong', {}, `Prácticas de este nivel (${labs.filter(l => labHecho(l.progreso)).length}/${labs.length} hechas)`)),
        el('ul', { class: 'chips' }, labs.map(l => el('li', {}, el('a', { class: 'chip' + (labHecho(l.progreso) ? ' done' : ''), href: 'laboratorio.html?l=' + l.clave }, (l.grupo === 'averias' ? '🔧 ' : '') + l.titulo)))));
      return bloque('n' + nv.n, { num: nv.n, titulo: nv.titulo, meta: [plural(labs.length, 'práctica', 'prácticas')], conModulo: true }, nv.texto, lecciones, extra, siguiente?.nivel === nv.n);
    }));
  } else {
    $('#modulos').replaceChildren(...curso.modulos.map(m => bloque(m.id, { num: numeroModulo(m), titulo: m.titulo, meta: [m.dominio, m.peso ? m.peso + ' % del examen' : null].filter(Boolean) }, m.descripcion, m.lecciones.map(l => curso.lecciones.find(x => x.id === l.id)), null, siguiente?.modulo.id === m.id)));
  }
}

$('#vistas').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.vista === vista) return;
  vista = b.dataset.vista;
  local.set('aula:panel:vista', vista);
  abiertos.clear();
  pintar();
});

if (usuario) {
  $('#saludo').textContent = `Hola, ${usuario.nombre || usuario.email.split('@')[0]}`;
} else if (cuentasActivas()) {
  $('#avisoCuenta').replaceChildren(el('div', { class: 'alert alert-info mb' }, el('p', {}, 'Estás como invitado: tu progreso se guarda solo en este navegador. Crea una cuenta gratuita para no perderlo' + (CONFIG.tutorIA ? ' y usar el tutor con IA.' : ' y seguir en cualquier dispositivo.')), el('a', { class: 'btn btn-primary btn-sm', href: 'cuenta.html?siguiente=curso.html' }, 'Crear cuenta')));
}
await cargar();
pintar();
alCambiar(pintar);
