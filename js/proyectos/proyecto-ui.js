// Interfaz de un proyecto real: topología viva, una consola por equipo, requisitos por fases con pistas,
// pruebas de extremo a extremo con el recorrido del tráfico, guardado automático del avance e informe descargable.
import { el, toast, local } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { prompt, completar, interfazUp, vlanPasa, buscarRuta } from '../labs/ios.js';
import { PROYECTOS, crearProyecto, ejecutarEn, restaurar, evaluar, informe } from './proyectos.js';

const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };

// Esquema de la oficina: ISP — R1 — SW1 — PC. Cada enlace se pinta según funcione o no.
function topologia(eqs, pcs) {
  const sw = eqs.SW1, r = eqs.R1;
  const wan = interfazUp(r, 'GigabitEthernet0/1') && buscarRuta(r, '8.8.8.8')?.cod === 'S*';
  const trunk = [10, 20, 99].some(v => vlanPasa(sw, 'GigabitEthernet0/1', v));
  const linea = (x1, y1, x2, y2, ok, txt) => el('g', {}, el('line', { x1, y1, x2, y2, class: 'topo-link' + (ok ? ' ok' : '') }), txt ? el('text', { x: (x1 + x2) / 2 + 8, y: (y1 + y2) / 2 - 6, class: 'topo-label' }, txt) : null);
  const nodo = (x, y, txt, sub, ok) => el('g', {}, el('rect', { x: x - 46, y: y - 20, width: 92, height: 40, rx: 10, class: 'topo-node' + (ok ? ' ok' : '') }), el('text', { x, y: y - 1, class: 'topo-name' }, txt), el('text', { x, y: y + 13, class: 'topo-sub' }, sub));
  const xs = [90, 230, 370];
  return el('svg', { viewBox: '0 0 460 330', role: 'img', 'aria-label': 'Topología: Internet, R1, SW1 y tres PC. Los enlaces en verde funcionan.' },
    linea(230, 40, 230, 110, wan, 'Gi0/1 · 203.0.113.0/30'),
    linea(230, 150, 230, 200, trunk, 'trunk 802.1Q'),
    ...pcs.map((p, k) => { const port = sw.ifs[p.puerto]; const ok = !port.shutdown && port.mode === 'access' && port.accessVlan === p.vlan; return linea(230, 240, xs[k], 290, ok, null); }),
    nodo(230, 30, 'Internet', 'ISP .1', wan),
    nodo(230, 130, r.hostname, 'router', trunk || wan),
    nodo(230, 220, sw.hostname, 'switch', trunk),
    ...pcs.map((p, k) => nodo(xs[k], 300, p.nombre.replace('PC de ', ''), `${p.puerto.replace('FastEthernet', 'Fa')} · VLAN ${p.vlan}`, (() => { const port = sw.ifs[p.puerto]; return !port.shutdown && port.mode === 'access' && port.accessVlan === p.vlan && vlanPasa(sw, 'GigabitEthernet0/1', p.vlan); })())));
}

export async function montarProyecto(holder, id) {
  const p = PROYECTOS[id];
  if (!p) throw new Error('Proyecto desconocido: ' + id);
  await cargar();
  const claveLocal = 'aula:proyecto:' + id;
  const guardado = local.get(claveLocal, null);
  let eqs = guardado?.historiales ? restaurar(id, guardado.historiales) : crearProyecto(id);
  const nombres = Object.keys(eqs);
  let activo = nombres.includes(guardado?.activo) ? guardado.activo : nombres[0];
  let completado = labHecho(p.progreso);
  const hist = Object.fromEntries(nombres.map(n => [n, []]));
  let pos = 0;

  // ---------------------------------------------------------------- consola por equipo
  const salidas = Object.fromEntries(nombres.map(n => [n, el('div', { class: 'terminal', role: 'log', 'aria-live': 'polite', 'aria-label': 'Consola de ' + n, tabindex: '0', hidden: n !== activo })]));
  const promptTxt = el('span');
  const input = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Escribe un comando de IOS', enterkeyhint: 'send' });
  const pestanas = el('div', { class: 'tabs device-tabs', role: 'tablist', 'aria-label': 'Equipo' }, nombres.map(n => el('button', { type: 'button', role: 'tab', 'data-eq': n, 'aria-selected': String(n === activo) }, n === 'SW1' ? '🔀 SW1 · switch' : n === 'R1' ? '🛜 R1 · router' : n)));
  const escribir = (n, texto, clase) => { if (!texto) return; salidas[n].append(el('div', { class: clase || null }, texto)); salidas[n].scrollTop = salidas[n].scrollHeight; };
  for (const n of nombres) escribir(n, `Consola de ${n}${guardado?.historiales?.[n]?.length ? ` · se ha recuperado tu avance (${guardado.historiales[n].length} comandos)` : ''}.\nEscribe "?" para ver los comandos. Tab completa. Cambia de equipo con las pestañas.\n`);
  function cambiar(n) {
    activo = n;
    for (const x of nombres) salidas[x].hidden = x !== n;
    pestanas.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.eq === n)));
    promptTxt.textContent = prompt(eqs[n]);
    pos = hist[n].length;
    guardarLocal();
    input.focus({ preventScroll: true });
  }
  pestanas.addEventListener('click', e => { const b = e.target.closest('button'); if (b) cambiar(b.dataset.eq); });
  const guardarLocal = () => local.set(claveLocal, { activo, historiales: Object.fromEntries(nombres.map(n => [n, eqs[n].historial])) });

  function correr(linea) {
    escribir(activo, prompt(eqs[activo]) + linea, 'in');
    if (linea.trim()) { hist[activo].push(linea); pos = hist[activo].length; }
    const r = ejecutarEn(id, eqs, activo, linea);
    escribir(activo, r.salida, /^\s*\^|^% /m.test(r.salida) ? 'err' : null);
    promptTxt.textContent = r.prompt;
    guardarLocal();
    revisar();
  }
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); const l = input.value; input.value = ''; correr(l); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (pos > 0) input.value = hist[activo][--pos]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (pos < hist[activo].length - 1) input.value = hist[activo][++pos]; else { pos = hist[activo].length; input.value = ''; } }
    else if (e.key === 'Tab') { e.preventDefault(); const c = completar(eqs[activo], input.value); if (c) input.value = c; }
    else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (!['user', 'priv'].includes(eqs[activo].modo)) correr('end'); }
  });
  Object.values(salidas).forEach(s => s.addEventListener('click', () => input.focus()));

  // ---------------------------------------------------------------- requisitos, pistas y pruebas
  const topo = el('div', { class: 'project-topo' });
  const progreso = el('span', { class: 'badge badge-accent' });
  const fasesBox = el('div', { class: 'project-phases' });
  const abiertas = new Set([0]);
  const pistasVistas = p.fases.map(() => 0);
  const pruebasBox = el('div', { class: 'project-tests' });
  const resultadoPrueba = el('div', { class: 'project-trace', 'aria-live': 'polite' });

  function revisar() {
    const ev = evaluar(id, eqs);
    progreso.textContent = `${ev.cumplidos}/${ev.total} requisitos · ${ev.pruebas.filter(t => t.ok).length}/${ev.pruebas.length} pruebas`;
    topo.replaceChildren(topologia(eqs, p.topologia.pcs));
    fasesBox.replaceChildren(...ev.fases.map((f, k) => {
      const n = f.resultados.filter(r => r.ok).length;
      const pistas = el('ol', { class: 'hints' }, f.pistas.slice(0, pistasVistas[k]).map(t => el('li', {}, t)));
      const btn = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', disabled: pistasVistas[k] >= f.pistas.length }, pistasVistas[k] ? `Otra pista (${f.pistas.length - pistasVistas[k]})` : 'Dame una pista');
      btn.addEventListener('click', () => { pistasVistas[k]++; abiertas.add(k); revisar(); });
      const det = el('details', { class: 'module project-phase' + (n === f.resultados.length ? ' done' : ''), open: abiertas.has(k) },
        el('summary', {}, el('span', { class: 'module-num' }, n === f.resultados.length ? '✓' : String(k + 1)), el('div', {}, el('div', { class: 'module-title' }, f.titulo.replace(/^Fase \d+ · /, '')), el('div', { class: 'module-meta' }, `${n}/${f.resultados.length} · en ${f.equipo}`))),
        el('div', { class: 'phase-body' },
          el('p', { class: 'small muted' }, f.explicacion),
          el('ul', { class: 'tasks' }, f.resultados.map(r => el('li', {}, el('span', { class: 'check' + (r.ok ? ' on' : ''), 'aria-hidden': 'true' }, '✓'),
            el('span', {}, el('span', { class: r.ok ? 'muted' : null }, r.texto), !r.ok && r.ayuda ? el('small', { class: 'req-help' }, r.ayuda) : null)))),
          el('div', { class: 'hints-box' }, btn, pistas)));
      det.addEventListener('toggle', () => { if (det.open) abiertas.add(k); else abiertas.delete(k); });
      return det;
    }));
    pruebasBox.replaceChildren(...ev.pruebas.map(t => {
      const b = el('button', { type: 'button', class: 'btn btn-sm ' + (t.ok ? 'btn-ok' : 'btn-ghost') }, (t.ok ? '✓ ' : '▶ ') + t.texto);
      b.addEventListener('click', () => mostrarPrueba(t.id));
      return b;
    }));
    // Progreso: requisitos + pruebas superadas (se guarda la mejor marca).
    const puntos = ev.cumplidos + ev.pruebas.filter(t => t.ok).length, total = ev.total + ev.pruebas.length;
    if (puntos > 0) guardarLab(p.progreso, puntos, total);
    if (ev.completo && !completado) {
      completado = true;
      escribir(activo, '\n*** ¡Proyecto completado! Todos los requisitos y pruebas están en verde. Descarga el informe para tu portafolio. ***', 'ok');
      toast('¡Proyecto completado!');
    }
    return ev;
  }
  function mostrarPrueba(pid) {
    const t = evaluar(id, eqs).pruebas.find(x => x.id === pid);
    const pasos = PROYECTOS[id].pruebas.find(x => x.id === pid);
    const fallo = t.pasos.findIndex(x => !x.ok);
    resultadoPrueba.replaceChildren(el('h5', {}, (t.ok ? '✓ ' : '✗ ') + pasos.texto),
      el('ol', { class: 'trace' }, t.pasos.map((s, k) => el('li', { class: s.ok ? 'ok' : 'bad' }, el('span', { class: 'check' + (s.ok ? ' on' : ' bad'), 'aria-hidden': 'true' }, s.ok ? '✓' : '✗'),
        el('span', {}, s.texto, !s.ok && s.detalle ? el('small', { class: 'req-help' }, s.detalle) : null)))),
      fallo >= 0 ? el('p', { class: 'small muted' }, 'El recorrido se detiene en el primer fallo. Arréglalo y vuelve a probar.') : el('p', { class: 'small' }, '¡Funciona de extremo a extremo!'));
  }

  // ---------------------------------------------------------------- acciones
  const btnInforme = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '⬇ Descargar informe');
  btnInforme.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([informe(id, eqs)], { type: 'text/plain;charset=utf-8' }));
    el('a', { href: url, download: `proyecto-${id}.txt` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const solucion = el('pre', { class: 'code', hidden: true });
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución del equipo actual');
  btnSol.addEventListener('click', () => {
    if (solucion.hidden && !confirm(`¿Ver la solución de ${activo}? Intenta antes resolverlo con las pistas: así es como se aprende.`)) return;
    solucion.hidden = !solucion.hidden;
    solucion.textContent = `! Solución de ${activo}\n` + p.solucion[activo].join('\n');
  });
  const btnReset = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Empezar de cero');
  btnReset.addEventListener('click', () => {
    if (!confirm('¿Borrar toda la configuración de los equipos y empezar el proyecto de cero? (Tu progreso guardado se mantiene.)')) return;
    eqs = crearProyecto(id);
    for (const n of nombres) { salidas[n].replaceChildren(); hist[n] = []; escribir(n, `Consola de ${n} · equipo de fábrica.\n`); }
    local.del(claveLocal);
    resultadoPrueba.replaceChildren();
    cambiar(activo);
    revisar();
  });

  const plan = el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ['Elemento', 'Red', 'Detalles'].map(h => el('th', { scope: 'col' }, h)))), el('tbody', {}, p.plan.map(f => el('tr', {}, f.map(c => el('td', {}, c)))))));
  holder.append(el('section', { class: 'lab project', 'aria-label': p.titulo },
    el('div', { class: 'lab-head' }, el('h3', {}, p.titulo.replace(/^Proyecto: (.)/, (_, c) => c.toUpperCase())), progreso),
    el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + p.nivel }, NIVEL[p.nivel]), el('span', { class: 'badge badge-violet' }, '🏗️ Proyecto real')),
    el('p', {}, p.historia),
    el('div', { class: 'project-brief' },
      el('div', {}, el('h4', {}, 'Objetivos'), el('ol', { class: 'small' }, p.objetivos.map(o => el('li', {}, o))), el('h4', {}, 'Plan de direccionamiento'), plan),
      topo),
    el('div', { class: 'project-layout' },
      el('div', { class: 'project-console' }, pestanas, ...Object.values(salidas), el('div', { class: 'term-input' }, promptTxt, input)),
      el('div', {}, el('h4', {}, 'Requisitos por fases'), fasesBox)),
    el('h4', {}, 'Pruebas de extremo a extremo'),
    el('p', { class: 'small muted' }, 'Simulan el tráfico real y te dicen en qué salto se corta.'),
    pruebasBox, resultadoPrueba,
    el('div', { class: 'hero-cta' }, btnInforme, btnSol, btnReset), solucion));
  promptTxt.textContent = prompt(eqs[activo]);
  revisar();
}
