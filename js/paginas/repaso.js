// Repaso de errores: resumen, temas a reforzar y sesiones de práctica con corrección inmediata y explicación.
import { iniciarPagina, el, $, $$, setMeter, plural, local } from '../core.js';
import { cargarCurso } from '../curso.js';
import { barajar, prepararPregunta } from '../quiz.js';
import { cargar, alCambiar, repaso, registrarRespuestas } from '../progreso.js';
import { temasAReforzar, resumenRepaso, labsDeLeccion } from '../recomendaciones.js';

iniciarPagina();
const raiz = $('#repaso');
const params = new URLSearchParams(location.search);
const NOMBRE_AREA = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI' };
const [banco, curso] = await Promise.all([fetch('data/examen.json').then(r => r.json()), cargarCurso(), cargar()]);
const porId = new Map(banco.map(q => [q.id, q]));
const leccionDe = id => curso.lecciones.find(l => l.id === id.split('#')[0]);
let area = local.get('aula:repaso:area', '');
let enSesion = false;

// ---------------------------------------------------------------- construir una sesión
// Primero las preguntas falladas (las que tocan hoy, o todas las del tema); después preguntas relacionadas
// de las mismas lecciones que aún no se han fallado, para reforzar el tema completo.
export function construirSesion({ soloLeccion = null, lecciones = null, modo = 'hoy', max = 10, ahora = Date.now() } = {}) {
  const enArea = id => !area || leccionDe(id)?.modulo.area === area;
  const rep = repaso(ahora).filter(r => porId.has(r.id) && enArea(r.id));
  let fallidas;
  if (soloLeccion) fallidas = rep.filter(r => r.leccion === soloLeccion && (!r.dominada || r.pendiente));
  else if (lecciones) fallidas = rep.filter(r => lecciones.includes(r.leccion) && !r.dominada);
  else fallidas = rep.filter(r => r.pendiente);
  const elegidas = fallidas.slice(0, max).map(r => ({ id: r.id, tipo: 'fallada', info: r }));
  if (modo === 'refuerzo' || soloLeccion || lecciones) {
    const temas = new Set(soloLeccion ? [soloLeccion] : lecciones || elegidas.map(e => e.info.leccion));
    const yaEnRepaso = new Set(repaso(ahora).map(r => r.id));
    const relacionadas = barajar(banco.filter(q => temas.has(q.id.split('#')[0]) && !yaEnRepaso.has(q.id)));
    for (const q of relacionadas) { if (elegidas.length >= max) break; elegidas.push({ id: q.id, tipo: 'relacionada' }); }
  }
  return barajar(elegidas).map(e => ({ ...e, pregunta: prepararPregunta(porId.get(e.id)) }));
}

// ---------------------------------------------------------------- vista general
function pintarResumen() {
  if (enSesion) return;
  $$('#filtroArea button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.area === area)));
  const r = resumenRepaso(curso, area || null);
  const temas = temasAReforzar(curso, area || null);
  const stat = (n, txt) => el('div', { class: 'stat' }, el('strong', {}, String(n)), el('span', {}, txt));

  if (!r.total && !temas.length) {
    raiz.replaceChildren(el('div', { class: 'card empty-state' },
      el('h2', {}, '¡Nada que repasar por ahora!'),
      el('p', { class: 'muted' }, 'Cuando falles una pregunta en el cuestionario de una lección o en un simulacro, aparecerá aquí con su explicación para que la repases hasta dominarla.'),
      el('div', { class: 'hero-cta' }, el('a', { class: 'btn btn-primary', href: 'curso.html' + (area ? '?area=' + area : '') }, 'Seguir con el curso'), el('a', { class: 'btn btn-ghost', href: 'examen.html' + (area ? '?area=' + area : '') }, 'Hacer un simulacro'))));
    return;
  }
  const btnHoy = el('button', { type: 'button', class: 'btn btn-primary btn-lg', disabled: !r.hoy }, r.hoy ? `Repasar hoy (${plural(Math.min(r.hoy, 10), 'pregunta', 'preguntas')})` : 'Hoy no te toca repasar nada');
  btnHoy.addEventListener('click', () => empezar(construirSesion({ modo: 'hoy' }), 'Repaso de hoy'));
  const top = temas.slice(0, 3).map(t => t.leccion.id);
  const btnRefuerzo = el('button', { type: 'button', class: 'btn btn-ghost btn-lg', disabled: !top.length }, 'Refuerzo de mis temas débiles');
  btnRefuerzo.addEventListener('click', () => empezar(construirSesion({ lecciones: top, modo: 'refuerzo', max: 12 }), 'Refuerzo: ' + temas.slice(0, 3).map(t => t.leccion.titulo).join(', ')));

  raiz.replaceChildren(
    el('div', { class: 'card mb' },
      el('div', { class: 'grid-4 review-stats' }, stat(r.hoy, 'para repasar hoy'), stat(r.enRepaso, 'en repaso'), stat(r.dominadas, 'dominadas'), stat(temas.length, plural(temas.length, 'tema a reforzar', 'temas a reforzar').replace(/^\d+ /, ''))),
      el('div', { class: 'hero-cta' }, btnHoy, btnRefuerzo),
      r.total && !r.hoy ? el('p', { class: 'small muted' }, 'Las preguntas vuelven cuando les toca según su caja. Mientras tanto, refuerza los temas débiles o sigue con el curso.') : null),
    el('h2', {}, 'Temas a reforzar'),
    temas.length ? el('div', { class: 'review-topics' }, temas.map(tarjetaTema)) : el('p', { class: 'muted' }, 'No tienes temas débiles en esta área. ¡Buen trabajo!'));
}

function tarjetaTema(t) {
  const l = t.leccion;
  const total = t.enRepaso + t.dominadas;
  const meter = el('div', { class: 'meter' }, el('span'));
  setMeter(meter, total ? t.dominadas / total : 0);
  const btn = el('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Repasar este tema');
  btn.addEventListener('click', () => empezar(construirSesion({ soloLeccion: l.id, max: 8 }), 'Tema: ' + l.titulo));
  const labs = labsDeLeccion(l);
  return el('article', { class: 'card review-topic' },
    el('div', { class: 'lab-card-head' }, el('h3', {}, l.titulo), el('span', { class: 'badge' }, NOMBRE_AREA[l.modulo.area])),
    el('p', { class: 'small muted' }, [
      t.pendientes ? `${t.pendientes} para hoy` : null,
      total ? `${t.dominadas}/${total} dominadas` : null,
      t.fallos ? plural(t.fallos, 'fallo', 'fallos') + ' en total' : null,
      t.suspendido ? `cuestionario: ${t.nota.puntos}/${t.nota.total}` : null,
    ].filter(Boolean).join(' · ')),
    total ? meter : null,
    el('div', { class: 'hero-cta' }, btn, el('a', { class: 'btn btn-ghost btn-sm', href: 'leccion.html?id=' + l.id }, 'Volver a la lección')),
    labs.length ? el('p', { class: 'small' }, 'Practica también: ', ...labs.flatMap((x, i) => [i ? ' · ' : '', el('a', { href: 'laboratorio.html?l=' + x.clave }, x.titulo)])) : null);
}

// ---------------------------------------------------------------- sesión de repaso
function empezar(sesion, titulo) {
  if (!sesion.length) { raiz.prepend(el('div', { class: 'alert alert-info mb' }, el('p', {}, 'No hay preguntas disponibles para esa selección.'))); return; }
  enSesion = true;
  const resultados = [];
  let i = 0;
  const contador = el('span', { class: 'small muted' });
  const meter = el('div', { class: 'meter' }, el('span'));
  const caja = el('div', { class: 'card' });
  const salir = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Salir');
  salir.addEventListener('click', terminar);
  raiz.replaceChildren(el('p', { class: 'small muted' }, titulo), el('div', { class: 'exam-bar' }, contador, meter, salir), caja);
  scrollTo({ top: 0 });

  function mostrar() {
    const { pregunta: q, tipo, info } = sesion[i];
    const l = leccionDe(q.id);
    contador.textContent = `Pregunta ${i + 1} de ${sesion.length}`;
    setMeter(meter, i / sesion.length);
    const comprobar = el('button', { type: 'submit', class: 'btn btn-primary', disabled: true }, 'Comprobar');
    const explicacion = el('div', { class: 'explain', hidden: true });
    const form = el('form', { class: 'question exam-q' },
      el('div', { class: 'lab-tags' },
        tipo === 'fallada' ? el('span', { class: 'badge badge-warn' }, `Fallada ${plural(info.fallos, 'vez', 'veces')} · caja ${info.caja}/5`) : el('span', { class: 'badge badge-accent' }, 'Refuerzo: pregunta relacionada'),
        l ? el('span', { class: 'badge' }, l.titulo) : null),
      el('fieldset', {}, el('legend', {}, q.q + (q.multiple ? ` (elige ${q.correct.length})` : '')),
        q.opciones.map((o, k) => el('label', { class: 'option' }, el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'r', value: String(k) }), el('span', {}, o.texto)))),
      explicacion,
      el('div', { class: 'quiz-head' }, el('span'), comprobar));
    form.addEventListener('change', () => { if (!form.dataset.hecho) comprobar.disabled = !form.querySelector('input:checked'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.dataset.hecho) { i++; if (i < sesion.length) mostrar(); else terminar(); return; }
      form.dataset.hecho = '1';
      const elegidas = new Set([...form.querySelectorAll('input:checked')].map(x => Number(x.value)));
      const ok = q.opciones.every((o, k) => o.correcta === elegidas.has(k));
      form.querySelectorAll('.option').forEach((lab, k) => {
        lab.querySelector('input').disabled = true;
        if (q.opciones[k].correcta) lab.classList.add('correct'); else if (elegidas.has(k)) lab.classList.add('wrong');
      });
      const antes = repaso().find(r => r.id === q.id);
      registrarRespuestas([{ id: q.id, ok }], 'repaso');
      const despues = repaso().find(r => r.id === q.id);
      resultados.push({ q, ok, l, dominadaAhora: !!despues?.dominada && !antes?.dominada, nueva: !antes && !ok });
      explicacion.hidden = false;
      explicacion.replaceChildren(el('strong', {}, ok ? '✓ Correcto. ' : '✗ Incorrecto. '), q.explain,
        despues ? el('span', { class: 'small muted' }, ok ? (despues.dominada ? ' · ¡Dominada! Volverá dentro de ' + plural(Math.round((despues.proxima - Date.now()) / 86400000), 'día', 'días') + '.' : ` · Sube a la caja ${despues.caja}.`) : ' · Vuelve a la caja 0: la repetirás pronto.') : null,
        l ? el('p', { class: 'small' }, el('a', { href: 'leccion.html?id=' + l.id }, 'Repasar la lección «' + l.titulo + '»')) : null);
      comprobar.textContent = i < sesion.length - 1 ? 'Siguiente' : 'Ver resultado';
      comprobar.disabled = false;
      comprobar.focus();
    });
    caja.replaceChildren(form);
  }

  function terminar() {
    enSesion = false;
    if (!resultados.length) { pintarResumen(); return; }
    const aciertos = resultados.filter(r => r.ok).length;
    const dominadas = resultados.filter(r => r.dominadaAhora).length;
    const flojas = [...new Map(resultados.filter(r => !r.ok && r.l).map(r => [r.l.id, r.l])).values()];
    const otra = el('button', { type: 'button', class: 'btn btn-primary' }, 'Volver al repaso');
    otra.addEventListener('click', pintarResumen);
    raiz.replaceChildren(el('div', { class: 'card' },
      el('span', { class: 'eyebrow' }, 'Resultado del repaso'),
      el('h2', {}, `${aciertos} de ${resultados.length} correctas`),
      el('p', {}, dominadas ? `${plural(dominadas, 'pregunta pasa', 'preguntas pasan')} a dominadas. ` : '', aciertos === resultados.length ? '¡Sesión perfecta!' : 'Las falladas volverán pronto para que las afiances.'),
      flojas.length ? el('div', {}, el('h3', {}, 'Para afianzar'), el('ul', { class: 'plain-list' }, flojas.map(l => el('li', {}, el('a', { href: 'leccion.html?id=' + l.id }, l.titulo), ...labsDeLeccion(l).slice(0, 2).flatMap(x => [' · ', el('a', { href: 'laboratorio.html?l=' + x.clave }, 'practicar: ' + x.titulo)]))))) : null,
      el('div', { class: 'hero-cta' }, otra, el('a', { class: 'btn btn-ghost', href: 'curso.html' }, 'Seguir con el curso'))));
    scrollTo({ top: 0 });
  }
  mostrar();
}

$('#filtroArea').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || enSesion) return;
  area = b.dataset.area;
  local.set('aula:repaso:area', area);
  pintarResumen();
});
alCambiar(() => { if (!enSesion) pintarResumen(); });

const pedida = params.get('leccion');
if (pedida && curso.lecciones.some(l => l.id === pedida)) {
  area = '';
  empezar(construirSesion({ soloLeccion: pedida, max: 8 }), 'Tema: ' + curso.lecciones.find(l => l.id === pedida).titulo);
} else pintarResumen();
