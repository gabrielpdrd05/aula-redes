// Entrenadores numéricos: subnetting, binario y VLSM. Ejercicios ilimitados con corrección y explicación.
import { el, toast } from '../core.js';
import { guardarLab } from '../progreso.js';
import { calcular, generarEjercicio, explicar, aEntero, aBinario, generarVlsm, resolverVlsm, validarVlsm } from './ipv4.js';

export function montarLab(holder, id) {
  if (id === 'subnetting') return subnetting(holder);
  if (id === 'binario') return binario(holder);
  if (id === 'vlsm') return vlsm(holder);
  throw new Error('Laboratorio desconocido: ' + id);
}

const normal = s => String(s || '').trim().replace(/\s+/g, '');

// ---------------------------------------------------------------- subnetting
function subnetting(holder) {
  let ej, inicio, aciertosSeguidos = 0, total = 0, buenos = 0, nivel = 'normal', guardado = false;
  const campos = [['red', 'Dirección de red'], ['broadcast', 'Broadcast'], ['primero', 'Primer host'], ['ultimo', 'Último host'], ['hosts', 'Hosts utilizables'], ['mascara', 'Máscara decimal']];
  const enunciado = el('p', { class: 'mono', style: undefined });
  const inputs = Object.fromEntries(campos.map(([k]) => [k, el('input', { type: 'text', inputmode: k === 'hosts' ? 'numeric' : 'decimal', autocomplete: 'off', spellcheck: 'false', id: 'sn-' + k })]));
  const feedback = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const explicacion = el('ol', { class: 'small', hidden: true });
  const marcador = el('span', { class: 'badge badge-accent' });
  const selNivel = el('select', { 'aria-label': 'Dificultad' }, el('option', { value: 'facil' }, 'Fácil (/24–/30)'), el('option', { value: 'normal', selected: true }, 'Normal (/20–/30)'), el('option', { value: 'dificil' }, 'Difícil (/12–/30)'));
  const btnComprobar = el('button', { type: 'submit', class: 'btn btn-primary' }, 'Comprobar');
  const btnOtro = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Otro ejercicio');
  const form = el('form', { class: 'lab', novalidate: true },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Entrenador de subnetting'), marcador),
    el('div', { class: 'field' }, el('label', { for: 'sn-nivel' }, 'Dificultad'), selNivel),
    el('p', {}, 'Calcula para esta dirección:'), enunciado,
    el('div', { class: 'answer-grid' }, campos.map(([k, l]) => el('div', { class: 'field' }, el('label', { for: 'sn-' + k }, l), inputs[k]))),
    el('div', { class: 'hero-cta' }, btnComprobar, btnOtro), feedback, explicacion);
  selNivel.id = 'sn-nivel';

  function nuevo() {
    ej = generarEjercicio(nivel);
    inicio = performance.now();
    enunciado.textContent = `${ej.ip}/${ej.prefijo}`;
    enunciado.style.fontSize = '1.5rem';
    enunciado.style.fontWeight = '800';
    Object.values(inputs).forEach(i => { i.value = ''; i.removeAttribute('aria-invalid'); });
    feedback.textContent = ''; feedback.className = 'feedback';
    explicacion.hidden = true;
    pintarMarcador();
    inputs.red.focus({ preventScroll: true });
  }
  function pintarMarcador() { marcador.textContent = `${buenos}/${total} · racha ${aciertosSeguidos}`; }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const esperado = { red: ej.red, broadcast: ej.broadcast, primero: ej.primero, ultimo: ej.ultimo, hosts: String(ej.hosts), mascara: ej.mascara };
    let ok = true;
    for (const [k] of campos) {
      const bien = normal(inputs[k].value) === normal(esperado[k]) || (k === 'mascara' && normal(inputs[k].value) === '/' + ej.prefijo);
      inputs[k].setAttribute('aria-invalid', String(!bien));
      if (!bien) ok = false;
    }
    total++;
    const segundos = Math.round((performance.now() - inicio) / 1000);
    if (ok) {
      buenos++; aciertosSeguidos++;
      feedback.className = 'feedback ok';
      feedback.textContent = `¡Correcto en ${segundos} s!` + (segundos <= 20 ? ' Ritmo de examen.' : '');
      if (aciertosSeguidos >= 10 && !guardado) { guardado = true; guardarLab('subnetting'); toast('10 aciertos seguidos: entrenador de subnetting completado.'); }
    } else {
      aciertosSeguidos = 0;
      feedback.className = 'feedback bad';
      feedback.textContent = 'Hay errores. Solución: red ' + ej.red + ', broadcast ' + ej.broadcast + ', hosts ' + ej.primero + ' – ' + ej.ultimo + ' (' + ej.hosts + '), máscara ' + ej.mascara + '.';
    }
    explicacion.replaceChildren(...explicar(ej).map(t => el('li', {}, t)));
    explicacion.hidden = false;
    pintarMarcador();
  });
  btnOtro.addEventListener('click', nuevo);
  selNivel.addEventListener('change', () => { nivel = selNivel.value; nuevo(); });
  holder.append(form);
  nuevo();

  // Calculadora libre, para comprobar tus propios ejercicios.
  const ipIn = el('input', { type: 'text', placeholder: '172.16.45.130/27', autocomplete: 'off', id: 'calc-ip', spellcheck: 'false' });
  const salida = el('div', { class: 'table-wrap', hidden: true });
  const calc = el('form', { class: 'lab', novalidate: true, style: undefined },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Calculadora de subredes')),
    el('div', { class: 'field' }, el('label', { for: 'calc-ip' }, 'Dirección con prefijo o máscara'), ipIn, el('span', { class: 'hint' }, 'Ejemplos: 10.1.1.100/28 o 10.1.1.100 255.255.255.240')),
    el('button', { type: 'submit', class: 'btn btn-ghost' }, 'Calcular'), salida);
  calc.style.marginTop = '16px';
  calc.addEventListener('submit', e => {
    e.preventDefault();
    const m = ipIn.value.trim().match(/^(\d+\.\d+\.\d+\.\d+)\s*(?:\/\s*(\d{1,2})|\s+(\d+\.\d+\.\d+\.\d+))$/);
    let c = null;
    if (m) {
      let p = m[2] != null ? Number(m[2]) : null;
      if (m[3]) { const mk = aEntero(m[3]); for (let k = 0; k <= 32; k++) if (k === 32 ? mk === 2 ** 32 - 1 : mk === 2 ** 32 - 2 ** (32 - k)) p = k; }
      if (p != null && p <= 32) c = calcular(m[1], p);
    }
    if (!c) { salida.hidden = false; salida.replaceChildren(el('p', { class: 'feedback bad' }, 'Formato no válido.')); return; }
    const filas = [['Red', c.red + '/' + c.prefijo], ['Máscara', c.mascara], ['Wildcard', c.wildcard], ['Broadcast', c.broadcast], ['Primer host', c.primero], ['Último host', c.ultimo], ['Hosts utilizables', String(c.hosts)], ['Bloque', `${c.bloque.salto} en el octeto ${c.bloque.octeto}`], ['IP en binario', c.ip.split('.').map(o => aBinario(Number(o))).join('.')]];
    salida.hidden = false;
    salida.replaceChildren(el('table', { class: 'result-table' }, el('tbody', {}, filas.map(([k, v]) => el('tr', {}, el('th', { scope: 'row' }, k), el('td', {}, v))))));
  });
  holder.append(calc);
}

// ---------------------------------------------------------------- binario
function binario(holder) {
  let objetivo, modo = 'aBinario', seguidos = 0, guardado = false;
  const pesos = [128, 64, 32, 16, 8, 4, 2, 1];
  const bits = pesos.map((p, i) => el('button', { type: 'button', class: 'bit', 'aria-pressed': 'false', 'aria-label': `Bit de valor ${p}` }, '0'));
  const valor = el('strong', { class: 'mono' });
  const pregunta = el('p', { style: undefined });
  const feedback = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const respuesta = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', id: 'bin-resp', hidden: true });
  const btnModo = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Cambiar a binario → decimal');
  const comprobar = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar');
  const sumaBits = () => bits.reduce((s, b, i) => s + (b.getAttribute('aria-pressed') === 'true' ? pesos[i] : 0), 0);

  bits.forEach(b => b.addEventListener('click', () => {
    if (modo !== 'aBinario') return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); b.textContent = on ? '1' : '0';
    valor.textContent = 'Suma actual: ' + sumaBits();
  }));
  function nuevo() {
    const comunes = [128, 192, 224, 240, 248, 252, 254, 255];
    objetivo = Math.random() < 0.35 ? comunes[Math.floor(Math.random() * comunes.length)] : Math.floor(Math.random() * 256);
    feedback.textContent = ''; feedback.className = 'feedback';
    if (modo === 'aBinario') {
      pregunta.textContent = `Activa los bits para formar el número ${objetivo}.`;
      bits.forEach(b => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('on'); b.textContent = '0'; b.disabled = false; });
      valor.textContent = 'Suma actual: 0';
      respuesta.hidden = true;
    } else {
      pregunta.textContent = '¿Qué número decimal representan estos bits?';
      aBinario(objetivo).split('').forEach((c, i) => { const on = c === '1'; bits[i].classList.toggle('on', on); bits[i].textContent = c; bits[i].setAttribute('aria-pressed', String(on)); bits[i].disabled = true; });
      valor.textContent = aBinario(objetivo);
      respuesta.hidden = false; respuesta.value = ''; respuesta.focus({ preventScroll: true });
    }
  }
  comprobar.addEventListener('click', () => {
    const dado = modo === 'aBinario' ? sumaBits() : Number(respuesta.value.trim());
    if (dado === objetivo) {
      seguidos++;
      feedback.className = 'feedback ok';
      feedback.textContent = `¡Correcto! ${objetivo} = ${aBinario(objetivo)}. Racha: ${seguidos}.`;
      if (seguidos >= 8 && !guardado) { guardado = true; guardarLab('binario'); toast('8 seguidos: entrenador de binario completado.'); }
      setTimeout(nuevo, 1100);
    } else {
      seguidos = 0;
      feedback.className = 'feedback bad';
      feedback.textContent = `No. ${objetivo} en binario es ${aBinario(objetivo)} (${pesos.filter((p, i) => aBinario(objetivo)[i] === '1').join(' + ') || '0'}).`;
    }
  });
  respuesta.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); comprobar.click(); } });
  btnModo.addEventListener('click', () => {
    modo = modo === 'aBinario' ? 'aDecimal' : 'aBinario';
    btnModo.textContent = modo === 'aBinario' ? 'Cambiar a binario → decimal' : 'Cambiar a decimal → binario';
    nuevo();
  });
  holder.append(el('div', { class: 'lab' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Entrenador de binario'), btnModo),
    pregunta, el('div', { class: 'bit-weights', 'aria-hidden': 'true' }, pesos.map(p => el('span', {}, p))), el('div', { class: 'bits' }, bits),
    el('p', {}, valor), el('label', { class: 'sr-only', for: 'bin-resp' }, 'Número decimal'), respuesta,
    el('div', { class: 'hero-cta' }, comprobar), feedback));
  nuevo();
}

// ---------------------------------------------------------------- VLSM
function vlsm(holder) {
  let caso;
  const cuerpo = el('div');
  const feedback = el('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const btnNuevo = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Otro escenario');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const form = el('form', { class: 'lab', novalidate: true }, el('div', { class: 'lab-head' }, el('h3', {}, 'Diseño VLSM'), btnNuevo), cuerpo,
    el('div', { class: 'hero-cta' }, el('button', { type: 'submit', class: 'btn btn-primary' }, 'Comprobar'), btnSol), feedback);

  function nuevo() {
    caso = generarVlsm();
    feedback.textContent = '';
    cuerpo.replaceChildren(
      el('p', {}, `Reparte ${caso.base}/${caso.prefijo} entre estas redes sin desperdiciar direcciones. Escribe cada subred como red/prefijo.`),
      ...caso.necesidades.map((n, i) => el('div', { class: 'field' }, el('label', { for: 'vlsm-' + i }, `${n.nombre}: ${n.hosts} hosts`), el('input', { type: 'text', id: 'vlsm-' + i, autocomplete: 'off', spellcheck: 'false', placeholder: 'ej. 192.168.10.0/26' }), el('span', { class: 'hint', id: 'vlsm-e' + i }))));
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const props = caso.necesidades.map((_, i) => form.querySelector('#vlsm-' + i).value);
    const errores = validarVlsm(caso.base, caso.prefijo, caso.necesidades, props);
    let fallos = 0;
    caso.necesidades.forEach((_, i) => {
      const hint = form.querySelector('#vlsm-e' + i);
      hint.textContent = errores[i] || '✓ Correcta';
      hint.style.color = errores[i] ? (/desperdicia/.test(errores[i]) ? 'var(--warn)' : 'var(--danger)') : 'var(--ok)';
      if (errores[i]) fallos++;
    });
    feedback.className = 'feedback ' + (fallos ? 'bad' : 'ok');
    feedback.textContent = fallos ? `Revisa ${fallos === 1 ? '1 subred' : fallos + ' subredes'}.` : '¡Diseño correcto! Sin solapes y sin desperdicio.';
    if (!fallos) guardarLab('vlsm');
  });
  btnSol.addEventListener('click', () => {
    const sol = resolverVlsm(caso.base, caso.prefijo, caso.necesidades);
    feedback.className = 'feedback';
    feedback.replaceChildren('Una solución (de mayor a menor): ', ...sol.map((s, i) => el('span', { class: 'mono' }, `${i ? ' · ' : ''}${s.nombre} ${s.red}/${s.prefijo}`)));
  });
  btnNuevo.addEventListener('click', nuevo);
  holder.append(form);
  nuevo();
}
