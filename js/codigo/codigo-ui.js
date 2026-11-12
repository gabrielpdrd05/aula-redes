// Laboratorio de programación: editor, ejecución aislada (Python con Pyodide o JavaScript) y comprobación automática.
import { el, toast, local } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { EJERCICIOS } from './ejercicios.js';
import { ejecutarCodigo } from './runner.js';

const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
const NOMBRE = { python: 'Python', javascript: 'JavaScript' };

// Editor sencillo sobre un textarea: Tab inserta espacios y Enter mantiene la sangría (y la aumenta tras ":" o "{").
function editor(lang) {
  const t = el('textarea', { class: 'code-editor', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Editor de código ' + NOMBRE[lang], rows: 12, wrap: 'off' });
  const tab = lang === 'python' ? '    ' : '  ';
  t.addEventListener('keydown', e => {
    const { selectionStart: a, selectionEnd: b, value: v } = t;
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        const ini = v.lastIndexOf('\n', a - 1) + 1;
        if (v.startsWith(tab, ini)) { t.value = v.slice(0, ini) + v.slice(ini + tab.length); t.selectionStart = t.selectionEnd = Math.max(ini, a - tab.length); }
        return;
      }
      t.setRangeText(tab, a, b, 'end');
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const ini = v.lastIndexOf('\n', a - 1) + 1;
      const linea = v.slice(ini, a);
      let sangria = linea.match(/^\s*/)[0];
      if (/[:{[(]\s*$/.test(linea)) sangria += tab;
      t.setRangeText('\n' + sangria, a, b, 'end');
    }
  });
  return t;
}

export async function montarCodigo(holder, id) {
  const set = EJERCICIOS[id];
  if (!set) throw new Error('Ejercicios de código desconocidos: ' + id);
  await cargar();
  const lista = set.libre ? [{ enunciado: 'Escribe lo que quieras y pulsa Ejecutar. Aquí no hay corrección: es para experimentar.', inicial: set.inicial, tests: [] }] : set.ejercicios;
  let n = 0, ejecutando = false;
  const borradorClave = i => `aula:codigo:${id}:${i}`;
  const hechos = new Set(local.get(`aula:codigo:${id}:hechos`, []));

  const titulo = el('h4', {});
  const enunciado = el('p', {});
  const ed = editor(set.lang);
  const salida = el('pre', { class: 'terminal code-output', role: 'log', 'aria-live': 'polite', tabindex: '0' });
  const pruebas = el('ul', { class: 'tasks code-tests' });
  const estado = el('span', { class: 'small muted', role: 'status' });
  const marcador = el('span', { class: 'badge badge-accent' });
  const btnRun = el('button', { type: 'button', class: 'btn btn-ghost' }, '▶ Ejecutar');
  const btnCheck = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar');
  const btnPrev = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, '‹ Anterior');
  const btnNext = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Siguiente ›');
  const btnPista = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Pista');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const btnReset = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Restaurar');
  const pista = el('p', { class: 'hint', hidden: true });

  const escribir = (texto, clase) => { salida.append(el('span', { class: clase || null }, texto)); salida.scrollTop = salida.scrollHeight; };
  function pintar() {
    const ej = lista[n];
    titulo.textContent = set.libre ? set.titulo : `Ejercicio ${n + 1} de ${lista.length}`;
    enunciado.textContent = ej.enunciado;
    ed.value = local.get(borradorClave(n), null) ?? ej.inicial;
    salida.replaceChildren(el('span', { class: 'muted' }, set.lang === 'python' ? 'Pulsa Ejecutar para ver la salida. La primera vez se descarga Python en tu navegador (unos segundos).' : 'Pulsa Ejecutar para ver la salida de console.log.'));
    pruebas.replaceChildren(...(ej.tests || []).map(t => el('li', {}, el('span', { class: 'check', 'aria-hidden': 'true' }, '✓'), el('span', {}, t.desc))));
    pista.hidden = true; pista.textContent = ej.pista ? 'Pista: ' + ej.pista : '';
    marcador.textContent = set.libre ? NOMBRE[set.lang] : `${[...hechos].filter(i => i < lista.length).length}/${lista.length} resueltos`;
    btnPrev.disabled = n === 0; btnNext.disabled = n === lista.length - 1;
    for (const b of [btnPrev, btnNext, btnCheck, btnPista, btnSol]) b.hidden = !!set.libre;
  }
  ed.addEventListener('input', () => local.set(borradorClave(n), ed.value));

  async function correr(conPruebas) {
    if (ejecutando) return;
    ejecutando = true; btnRun.disabled = btnCheck.disabled = true;
    const ej = lista[n];
    salida.replaceChildren();
    estado.textContent = 'Ejecutando…';
    const tests = conPruebas ? ej.tests : [];
    try {
      const r = await ejecutarCodigo({
        lang: set.lang, code: ed.value, tests, timeout: 5000,
        alSalir: (t, tipo) => escribir(t, tipo === 'stderr' ? 'err' : null),
        alEstado: s => { if (s === 'loading') estado.textContent = 'Descargando Python en tu navegador (solo la primera vez)…'; if (s === 'running') estado.textContent = 'Ejecutando…'; },
      });
      if (!r.ok) escribir((salida.textContent ? '\n' : '') + r.error + '\n', 'err');
      if (!salida.textContent.trim()) escribir('(El programa no ha mostrado nada. Usa ' + (set.lang === 'python' ? 'print()' : 'console.log()') + ' para ver resultados.)', 'muted');
      if (conPruebas) {
        const res = r.results || [];
        [...pruebas.children].forEach((li, i) => { li.firstChild.className = 'check' + (res[i] ? ' on' : ' bad'); li.firstChild.textContent = res[i] ? '✓' : '✗'; });
        const todo = r.ok && res.length === ej.tests.length && res.every(Boolean);
        estado.textContent = todo ? '¡Correcto! Todas las pruebas pasan.' : `${res.filter(Boolean).length} de ${ej.tests.length} pruebas superadas.`;
        if (todo) {
          hechos.add(n);
          local.set(`aula:codigo:${id}:hechos`, [...hechos]);
          marcador.textContent = `${[...hechos].filter(i => i < lista.length).length}/${lista.length} resueltos`;
          if (lista.every((_, i) => hechos.has(i)) && !labHecho('code-' + id)) { guardarLab('code-' + id); toast('Ejercicios completados: ' + set.titulo); }
        }
      } else estado.textContent = r.ok ? 'Ejecución terminada.' : 'El programa terminó con un error.';
    } catch (e) {
      estado.textContent = '';
      escribir(e.message, 'err');
    } finally { ejecutando = false; btnRun.disabled = btnCheck.disabled = false; }
  }
  btnRun.addEventListener('click', () => correr(false));
  btnCheck.addEventListener('click', () => correr(true));
  ed.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); correr(!set.libre); } });
  btnPrev.addEventListener('click', () => { n--; pintar(); });
  btnNext.addEventListener('click', () => { n++; pintar(); });
  btnPista.addEventListener('click', () => { pista.hidden = !pista.hidden; });
  btnSol.addEventListener('click', () => { if (confirm('¿Ver la solución? Intenta antes resolverlo tú: es como se aprende.')) { ed.value = lista[n].solucion; local.set(borradorClave(n), ed.value); } });
  btnReset.addEventListener('click', () => { ed.value = lista[n].inicial; local.del(borradorClave(n)); });

  holder.append(el('section', { class: 'lab code-lab', 'aria-label': set.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, set.titulo), marcador),
    el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + set.nivel }, NIVEL[set.nivel]), el('span', { class: 'badge lang-' + set.lang }, NOMBRE[set.lang])),
    titulo, enunciado,
    el('div', { class: 'code-layout' },
      el('div', {}, ed, el('p', { class: 'hint' }, 'Ctrl + Intro para ' + (set.libre ? 'ejecutar' : 'comprobar') + '. Tab sangra el código. Tu borrador se guarda en este navegador.'),
        el('div', { class: 'hero-cta' }, btnRun, btnCheck, estado)),
      el('div', {}, el('h5', { class: 'small muted' }, 'SALIDA'), salida, set.libre ? null : el('h5', { class: 'small muted' }, 'PRUEBAS'), pruebas)),
    pista,
    el('div', { class: 'hero-cta' }, btnPrev, btnNext, btnPista, btnSol, btnReset)));
  pintar();
}
