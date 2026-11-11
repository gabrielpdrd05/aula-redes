// Interfaz del laboratorio de consola: terminal (historial con flechas, Ctrl+Z, "?") y lista de tareas que se marcan
// solas al cumplirse. Al completar todas, el laboratorio queda guardado en el progreso del alumno.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { nuevoEquipo, ejecutar, prompt, runningConfig } from './ios.js';
import { LABS } from './ios-labs.js';

export async function montarCli(holder, id) {
  const lab = LABS[id];
  if (!lab) throw new Error('Laboratorio desconocido: ' + id);
  await cargar();
  let eq, hist = [], pos = 0, completado = labHecho('cli-' + id);

  const salida = el('div', { class: 'terminal', role: 'log', 'aria-live': 'polite', 'aria-label': 'Salida de la consola', tabindex: '0' });
  const promptTxt = el('span');
  const input = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Escribe un comando de IOS', enterkeyhint: 'send' });
  const lista = el('ul', { class: 'tasks' });
  const progreso = el('span', { class: 'badge badge-accent' });
  const btnReset = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Reiniciar');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const solucion = el('pre', { class: 'code', hidden: true });

  function escribir(texto, clase) {
    if (texto == null || texto === '') return;
    salida.append(el('div', { class: clase || null }, texto));
    salida.scrollTop = salida.scrollHeight;
  }
  function revisar() {
    const hechas = lab.tareas.map(t => { try { return !!t.ok(eq, runningConfig); } catch { return false; } });
    lista.replaceChildren(...lab.tareas.map((t, i) => el('li', {}, el('span', { class: 'check' + (hechas[i] ? ' on' : ''), 'aria-hidden': 'true' }, '✓'), el('span', { class: hechas[i] ? 'muted' : null }, (hechas[i] ? '(hecha) ' : '') + t.texto))));
    const n = hechas.filter(Boolean).length;
    progreso.textContent = `${n}/${lab.tareas.length} tareas`;
    if (n === lab.tareas.length && !completado) {
      completado = true;
      guardarLab('cli-' + id);
      escribir('\n*** ¡Laboratorio completado! Todas las tareas están hechas. ***', 'ok');
      toast('Laboratorio completado: ' + lab.titulo);
    }
  }
  function reiniciar() {
    eq = nuevoEquipo(lab.equipo);
    salida.replaceChildren();
    escribir(`Simulador de Cisco IOS · ${lab.titulo}\nEscribe "?" para ver los comandos disponibles en cada modo. Puedes abreviar (conf t, sh run, int g0/1).\n`);
    promptTxt.textContent = prompt(eq);
    hist = []; pos = 0;
    revisar();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const linea = input.value;
      input.value = '';
      escribir(prompt(eq) + linea, 'in');
      if (linea.trim()) { hist.push(linea); pos = hist.length; }
      const r = ejecutar(eq, linea);
      escribir(r.salida, /^\s*\^|^% /m.test(r.salida) ? 'err' : null);
      promptTxt.textContent = r.prompt;
      revisar();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pos > 0) { pos--; input.value = hist[pos]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pos < hist.length - 1) { pos++; input.value = hist[pos]; } else { pos = hist.length; input.value = ''; }
    } else if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || (e.ctrlKey && e.key === 'c')) {
      e.preventDefault();
      escribir(prompt(eq) + '^Z', 'in');
      const r = ejecutar(eq, eq.modo === 'user' || eq.modo === 'priv' ? '' : 'end');
      promptTxt.textContent = r.prompt;
      revisar();
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  });
  salida.addEventListener('click', () => input.focus());
  btnReset.addEventListener('click', reiniciar);
  btnSol.addEventListener('click', () => {
    solucion.hidden = !solucion.hidden;
    btnSol.textContent = solucion.hidden ? 'Ver solución' : 'Ocultar solución';
    solucion.textContent = lab.solucion.join('\n');
  });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Laboratorio: ' + lab.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Laboratorio: ' + lab.titulo), progreso),
    el('p', { class: 'muted' }, lab.intro),
    el('div', { class: 'cli-layout' },
      el('div', {}, salida, el('div', { class: 'term-input' }, promptTxt, input)),
      el('div', {}, el('h4', {}, 'Tareas'), lista, el('div', { class: 'hero-cta' }, btnReset, btnSol), solucion))));
  reiniciar();
}
