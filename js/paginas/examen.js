// Simulacro de examen: preguntas al azar repartidas según el peso de cada dominio del CCNA, una a una y sin volver atrás,
// con cronómetro. Al final, nota global, nota por dominio y repaso de los fallos con enlace a la lección.
import { iniciarPagina, el, $, setMeter, pct, plural } from '../core.js';
import { cargarCurso } from '../curso.js';
import { barajar, prepararPregunta, repartir } from '../quiz.js';
import { cargar, guardarExamen, examenes, registrarRespuestas } from '../progreso.js';

iniciarPagina();
const raiz = $('#examen');
const OBJETIVO = 85;
const MINUTOS = { 20: 25, 50: 60, 100: 120 };
const [banco, curso] = await Promise.all([fetch('data/examen.json').then(r => r.json()), cargarCurso(), cargar()]);
const modulos = Object.fromEntries(curso.modulos.map(m => [m.id, m]));
const NOMBRE_AREA = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación' };
const pedida = new URLSearchParams(location.search).get('area');
if (pedida && NOMBRE_AREA[pedida]) $('#area').value = pedida;

function historial() {
  const ex = examenes().slice(-5).reverse();
  if (!ex.length) return el('p', { class: 'small muted' }, 'Aún no has hecho ningún simulacro.');
  return el('div', {}, el('h2', { class: 'small muted' }, 'TUS ÚLTIMOS SIMULACROS'),
    el('ul', { class: 'plain-list' }, ex.map(e => el('li', {}, el('strong', {}, pct(e.puntos, e.total) + ' %'), ` · ${NOMBRE_AREA[modulos[Object.keys(e.dominios || {})[0]]?.area] || ''} · ${e.puntos}/${e.total} · ${new Date(e.t).toLocaleDateString('es')}`))));
}
$('#historialExamenes').replaceChildren(historial());

function empezar() {
  const n = Number($('#nPreguntas').value);
  const area = $('#area').value;
  // Redes: el peso de cada dominio del CCNA. Otras áreas: todos los módulos por igual.
  const pesos = Object.fromEntries(curso.modulos.filter(m => m.area === area && (area !== 'redes' || m.peso > 0)).map(m => [m.id, area === 'redes' ? m.peso : 1]));
  const porModulo = {};
  for (const q of banco) (porModulo[q.modulo] ||= []).push(q);
  const cupo = repartir(n, pesos, Object.fromEntries(Object.entries(porModulo).map(([k, v]) => [k, v.length])));
  const preguntas = barajar(Object.entries(cupo).flatMap(([id, k]) => barajar(porModulo[id]).slice(0, k))).map(prepararPregunta);
  const limite = MINUTOS[n] * 60;
  const inicio = Date.now();
  const respuestas = [];
  let i = 0, terminado = false;

  const timer = el('span', { class: 'timer', 'aria-label': 'Tiempo restante' });
  const meter = el('div', { class: 'meter' }, el('span'));
  const contador = el('span', { class: 'small muted' });
  const caja = el('div', { class: 'card' });
  const salirAviso = e => { e.preventDefault(); e.returnValue = ''; };
  addEventListener('beforeunload', salirAviso);
  raiz.replaceChildren(el('div', { class: 'exam-bar' }, contador, meter, timer), caja);

  const reloj = setInterval(tic, 1000);
  function tic() {
    const quedan = Math.max(0, limite - Math.floor((Date.now() - inicio) / 1000));
    timer.textContent = `${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`;
    timer.classList.toggle('low', quedan < 300);
    if (!quedan) terminar();
  }
  tic();

  function pregunta() {
    const q = preguntas[i];
    contador.textContent = `Pregunta ${i + 1} de ${preguntas.length}`;
    setMeter(meter, i / preguntas.length);
    const siguiente = el('button', { type: 'submit', class: 'btn btn-primary', disabled: true }, i === preguntas.length - 1 ? 'Terminar' : 'Siguiente');
    const form = el('form', { class: 'question exam-q' }, el('fieldset', {},
      el('legend', {}, q.q + (q.multiple ? ` (elige ${q.correct.length})` : '')),
      q.opciones.map((o, k) => el('label', { class: 'option' }, el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'r', value: String(k) }), el('span', {}, o.texto)))),
      el('div', { class: 'quiz-head' }, el('span', { class: 'small muted' }, modulos[q.modulo]?.titulo || ''), siguiente));
    form.addEventListener('change', () => { siguiente.disabled = !form.querySelector('input:checked'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const elegidas = new Set([...form.querySelectorAll('input:checked')].map(x => Number(x.value)));
      respuestas[i] = q.opciones.every((o, k) => o.correcta === elegidas.has(k));
      i++;
      if (i < preguntas.length) pregunta(); else terminar();
    });
    caja.replaceChildren(form);
    form.querySelector('input').focus({ preventScroll: true });
  }

  async function terminar() {
    if (terminado) return;
    terminado = true;
    clearInterval(reloj);
    removeEventListener('beforeunload', salirAviso);
    const segundos = Math.round((Date.now() - inicio) / 1000);
    const dominios = {};
    preguntas.forEach((q, k) => { const d = (dominios[q.modulo] ||= { p: 0, t: 0 }); d.t++; if (respuestas[k]) d.p++; });
    const puntos = respuestas.filter(Boolean).length;
    const nota = pct(puntos, preguntas.length);
    await guardarExamen({ puntos, total: preguntas.length, dominios, segundos });
    // Las preguntas falladas pasan al repaso (las que no dio tiempo a contestar no cuentan).
    registrarRespuestas(preguntas.map((q, k) => ({ id: q.id, ok: respuestas[k] })).filter((r, k) => k < respuestas.length), 'examen');
    const fallos = preguntas.map((q, k) => ({ q, ok: respuestas[k] })).filter(x => !x.ok);
    const barras = Object.entries(dominios).map(([id, d]) => {
      const m = el('div', { class: 'meter' + (pct(d.p, d.t) < OBJETIVO ? ' meter-warn' : '') }, el('span'));
      requestAnimationFrame(() => setMeter(m, d.p / d.t));
      return el('div', { class: 'domain-bar' }, el('div', {}, el('div', {}, modulos[id]?.titulo || id), m), el('strong', {}, pct(d.p, d.t) + ' %'));
    });
    raiz.replaceChildren(
      el('div', { class: 'page-head' }, el('span', { class: 'eyebrow' }, 'Resultado del simulacro'), el('h1', {}, `${nota} %`),
        el('p', {}, `${puntos} de ${preguntas.length} correctas en ${plural(Math.max(1, Math.round(segundos / 60)), 'minuto', 'minutos')}. ` +
          (nota >= OBJETIVO ? '¡Muy bien! Dominas el temario. Repite con otras preguntas para confirmarlo.' : `Objetivo: ${OBJETIVO} % de forma constante. Repasa los módulos en naranja.`))),
      el('div', { class: 'card' }, el('h2', {}, 'Por módulo'), el('div', { class: 'domain-bars' }, barras)),
      fallos.length ? el('div', { class: 'card mt' }, el('h2', {}, 'Repasa tus fallos'), fallos.map(({ q }) => el('div', { class: 'question' },
        el('p', {}, el('strong', {}, q.q)),
        el('p', { class: 'small' }, 'Correcta: ', q.opciones.filter(o => o.correcta).map(o => o.texto).join(' · ')),
        el('p', { class: 'small muted' }, q.explain, ' ', el('a', { href: 'leccion.html?id=' + q.id.split('#')[0] }, 'Ver la lección'))))) : null,
      el('div', { class: 'hero-cta' }, fallos.length ? el('a', { class: 'btn btn-primary', href: 'repaso.html' }, `Repasar mis ${fallos.length} fallos`) : null, el('a', { class: 'btn ' + (fallos.length ? 'btn-ghost' : 'btn-primary'), href: 'examen.html' }, 'Otro simulacro'), el('a', { class: 'btn btn-ghost', href: 'curso.html' }, 'Volver al curso')));
    scrollTo({ top: 0 });
  }
  pregunta();
}
$('#empezar').addEventListener('click', empezar);
