// Cuestionario de una lección (o de cualquier lista de preguntas). Corrige, explica cada respuesta y devuelve la nota.
import { el } from './core.js';

export function barajar(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Prepara una pregunta con las opciones barajadas, conservando qué opciones son correctas.
export function prepararPregunta(q) {
  const opciones = barajar(q.options.map((texto, i) => ({ texto, correcta: q.correct.includes(i) })));
  return { ...q, opciones, multiple: q.correct.length > 1 };
}

export function montarQuiz(contenedor, preguntas, { titulo = 'Comprueba lo que has aprendido', anterior = null, alTerminar } = {}) {
  let ps = preguntas.map(prepararPregunta);
  const form = el('form', { class: 'quiz', novalidate: true, 'aria-labelledby': 'quizTitle' });

  function pintar() {
    const resultado = el('p', { class: 'quiz-result', role: 'status', 'aria-live': 'polite' }, anterior ? `Tu mejor resultado: ${anterior.puntos} de ${anterior.total}.` : '');
    const corregir = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Corregir');
    form.replaceChildren(
      el('div', { class: 'quiz-head' }, el('h2', { id: 'quizTitle' }, titulo), el('span', { class: 'badge badge-accent' }, ps.length + ' preguntas')),
      ...ps.map((q, n) => el('div', { class: 'question' }, el('fieldset', {},
        el('legend', {}, `${n + 1}. ${q.q}${q.multiple ? ' (elige todas las correctas)' : ''}`),
        q.opciones.map((o, k) => el('label', { class: 'option' }, el('input', { type: q.multiple ? 'checkbox' : 'radio', name: 'q' + n, value: String(k) }), el('span', {}, o.texto))),
        el('div', { class: 'explain', hidden: true }, q.explain)))),
      el('div', { class: 'quiz-head' }, resultado, corregir));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (form.dataset.corregido) { delete form.dataset.corregido; ps = barajar(preguntas).map(prepararPregunta); pintar(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const preguntasDom = [...form.querySelectorAll('.question')];
    const sinResponder = preguntasDom.filter(div => !div.querySelector('input:checked')).length;
    if (sinResponder) { form.querySelector('.quiz-result').textContent = sinResponder === 1 ? 'Te falta 1 pregunta por responder.' : `Te faltan ${sinResponder} preguntas por responder.`; return; }
    let aciertos = 0;
    const detalle = [];
    preguntasDom.forEach((div, n) => {
      const q = ps[n];
      const elegidas = new Set([...div.querySelectorAll('input:checked')].map(i => Number(i.value)));
      const ok = q.opciones.every((o, k) => o.correcta === elegidas.has(k));
      if (ok) aciertos++;
      if (q.id) detalle.push({ id: q.id, ok });
      div.querySelectorAll('.option').forEach((lab, k) => {
        lab.querySelector('input').disabled = true;
        if (q.opciones[k].correcta) lab.classList.add('correct');
        else if (elegidas.has(k)) lab.classList.add('wrong');
      });
      const ex = div.querySelector('.explain');
      ex.hidden = false;
      ex.prepend(el('strong', {}, ok ? '✓ Correcto. ' : '✗ Incorrecto. '));
    });
    const total = ps.length;
    const aprobado = aciertos / total >= 0.7;
    form.querySelector('.quiz-result').textContent = `Has acertado ${aciertos} de ${total}. ${aprobado ? '¡Aprobado!' : 'Repasa la lección y vuelve a intentarlo (necesitas un 70 %).'}`;
    form.querySelector('button[type=submit]').textContent = 'Repetir con otro orden';
    form.dataset.corregido = '1';
    alTerminar?.(aciertos, total, detalle);
  });

  pintar();
  contenedor.append(form);
  return form;
}

// Reparte n preguntas entre los módulos según su peso (método del mayor resto), sin pasar de las disponibles.
export function repartir(n, pesos, disponibles) {
  const ids = Object.keys(pesos).filter(id => disponibles[id] > 0);
  const total = ids.reduce((s, id) => s + pesos[id], 0);
  const cupo = Object.fromEntries(ids.map(id => [id, Math.min(disponibles[id], Math.floor(n * pesos[id] / total))]));
  let faltan = n - Object.values(cupo).reduce((a, b) => a + b, 0);
  const orden = [...ids].sort((a, b) => (n * pesos[b] / total % 1) - (n * pesos[a] / total % 1));
  for (let vuelta = 0; faltan > 0 && vuelta < n; vuelta++) for (const id of orden) if (faltan > 0 && cupo[id] < disponibles[id]) { cupo[id]++; faltan--; }
  return cupo;
}
