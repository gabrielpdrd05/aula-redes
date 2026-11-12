// Interfaz de los casos de soporte: ticket y prioridad → diagnóstico → solución → documentación → comunicación → resultado.
// También monta el «turno de mesa de ayuda» (proyecto de portafolio): clasificar cinco tickets y resolverlos.
import { el, toast, local, setMeter } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { CASOS, TURNO, DIMENSIONES, IMPACTO, URGENCIA, SLA, prioridad, evaluarCaso, respuestaModelo, informeTurno, MIN_NOTA } from './casos.js';

const PASOS = ['Ticket', 'Diagnóstico', 'Solución', 'Documentación', 'Comunicación', 'Resultado'];
const NIVEL = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
const ICONO = { Tienda: '🏪', Almacén: '📦', Oficina: '🏢', Sucursal: '🏬' };

function fichaTicket(c) {
  const t = c.ticket;
  return el('div', { class: 'ticket-card' },
    el('div', { class: 'ticket-head' }, el('strong', {}, t.numero), el('span', { class: 'badge' }, `${ICONO[c.lugar] || ''} ${t.sede}`), el('span', { class: 'small muted' }, `${t.canal} · ${t.hora}`)),
    el('p', { class: 'ticket-from small muted' }, `De: ${t.de} (${t.puesto})`),
    el('blockquote', { class: 'ticket-text' }, t.texto));
}

function selectorPrioridad(valor, alCambiar, bloqueado) {
  const salida = el('p', { class: 'prio-out', 'aria-live': 'polite' });
  const pintar = () => { const p = prioridad(valor.impacto, valor.urgencia); salida.replaceChildren(p ? el('span', { class: 'badge prio prio-' + p.toLowerCase() }, p) : el('span', { class: 'muted small' }, 'Elige impacto y urgencia'), p ? el('span', { class: 'small muted' }, ' · ' + SLA[p]) : null); };
  const sufijo = Math.random().toString(36).slice(2, 8);
  const grupo = (nombre, titulo, opciones) => el('fieldset', { class: 'prio-group' }, el('legend', {}, titulo),
    Object.entries(opciones).map(([k, txt]) => {
      const i = el('input', { type: 'radio', name: `${nombre}-${sufijo}`, value: k, checked: valor[nombre] === k, disabled: bloqueado });
      i.addEventListener('change', () => { valor[nombre] = k; pintar(); alCambiar(); });
      return el('label', { class: 'option' }, i, el('span', {}, txt));
    }));
  pintar();
  return el('div', { class: 'prio-grid' }, grupo('impacto', 'Impacto', IMPACTO), grupo('urgencia', 'Urgencia', URGENCIA), salida);
}

// Monta un caso. opts: { prioridad: {impacto, urgencia} (ya decidida en el turno), alTerminar(resultado), compacto }
export async function montarCaso(holder, id, opts = {}) {
  const c = CASOS[id];
  if (!c) throw new Error('Caso desconocido: ' + id);
  await cargar();
  const clave = 'aula:caso:' + id;
  const r = { impacto: opts.prioridad?.impacto || '', urgencia: opts.prioridad?.urgencia || '', acciones: [], causa: -1, solucion: [], notas: {}, mensajes: c.comunicacion.map(() => -1) };
  let paso = 0;
  const pasos = el('ol', { class: 'case-steps', 'aria-label': 'Pasos del caso' });
  const cuerpo = el('div', { class: 'case-body' });
  const pintarPasos = () => pasos.replaceChildren(...PASOS.map((p, k) => el('li', { class: k < paso ? 'done' : k === paso ? 'now' : '', 'aria-current': k === paso ? 'step' : null }, el('span', {}, String(k + 1)), p)));
  const boton = (txt, fn, clase = 'btn btn-primary', deshabilitado = false) => { const b = el('button', { type: 'button', class: clase, disabled: deshabilitado }, txt); b.addEventListener('click', fn); return b; };
  const ir = n => { paso = n; pintar(); holder.querySelector('.case')?.scrollIntoView({ block: 'start', behavior: 'instant' }); };

  function pintar() {
    pintarPasos();
    cuerpo.replaceChildren(...[pasoTicket, pasoDiagnostico, pasoSolucion, pasoDocumentacion, pasoComunicacion, pasoResultado][paso]());
  }

  function pasoTicket() {
    const siguiente = boton('Empezar el diagnóstico →', () => ir(1), 'btn btn-primary', !prioridad(r.impacto, r.urgencia));
    return [fichaTicket(c), el('p', { class: 'small' }, el('strong', {}, 'Contexto: '), c.contexto),
      el('h4', {}, opts.prioridad ? 'Prioridad que asignaste en la clasificación' : '1. Clasifica el ticket'),
      el('p', { class: 'small muted' }, 'La prioridad sale de cruzar el impacto (a cuántos afecta) con la urgencia (qué tan rápido crece el daño). Define el plazo de atención (SLA).'),
      selectorPrioridad(r, () => { siguiente.disabled = !prioridad(r.impacto, r.urgencia); }, !!opts.prioridad),
      el('div', { class: 'case-nav' }, siguiente)];
  }

  function pasoDiagnostico() {
    const log = el('ol', { class: 'case-log', 'aria-live': 'polite' }, r.acciones.map(aid => { const a = c.acciones.find(x => x.id === aid); return el('li', {}, el('strong', {}, a.texto), el('span', {}, a.resultado)); }));
    const confirmar = boton('Confirmar diagnóstico →', () => ir(2), 'btn btn-primary', r.causa < 0 || !r.acciones.length);
    const acciones = el('div', { class: 'case-actions' }, c.acciones.map(a => {
      const b = boton((r.acciones.includes(a.id) ? '✓ ' : '') + a.texto, () => {
        if (r.acciones.includes(a.id)) return;
        r.acciones.push(a.id);
        b.disabled = true;
        b.textContent = '✓ ' + a.texto;
        log.append(el('li', { class: 'nuevo' }, el('strong', {}, a.texto), el('span', {}, a.resultado)));
        vacio.hidden = true;
        confirmar.disabled = r.causa < 0;
      }, 'btn btn-ghost case-action', r.acciones.includes(a.id));
      return b;
    }));
    const vacio = el('p', { class: 'small muted', hidden: r.acciones.length > 0 }, 'Todavía no has hecho ninguna comprobación. Elige con criterio: cada acción cuesta tiempo y algunas tienen riesgos.');
    const causas = el('fieldset', { class: 'case-q' }, el('legend', {}, c.preguntaCausa),
      c.causas.map((x, k) => { const i = el('input', { type: 'radio', name: 'causa-' + id, value: String(k), checked: r.causa === k }); i.addEventListener('change', () => { r.causa = k; confirmar.disabled = !r.acciones.length; }); return el('label', { class: 'option' }, i, el('span', {}, x.texto)); }));
    return [el('h4', {}, '2. Investiga'), el('p', { class: 'small muted' }, 'Elige qué comprobar. Verás el resultado de cada acción en el registro. Cuando tengas suficiente evidencia, decide la causa.'),
      el('div', { class: 'case-diag' }, acciones, el('div', {}, el('h5', {}, 'Registro de comprobaciones'), vacio, log)),
      causas, el('div', { class: 'case-nav' }, boton('← Ticket', () => ir(0), 'btn btn-quiet'), confirmar)];
  }

  function pasoSolucion() {
    const caja = el('fieldset', { class: 'case-q' }, el('legend', {}, 'Marca todo lo que harías (hay varias correctas y algunas trampas)'),
      c.solucion.map((s, k) => { const i = el('input', { type: 'checkbox', value: String(k), checked: r.solucion.includes(k) }); i.addEventListener('change', () => { r.solucion = i.checked ? [...r.solucion, k] : r.solucion.filter(x => x !== k); sig.disabled = !r.solucion.length; }); return el('label', { class: 'option' }, i, el('span', {}, s.texto)); }));
    const sig = boton('Documentar el ticket →', () => ir(3), 'btn btn-primary', !r.solucion.length);
    return [el('h4', {}, '3. Resuelve'), el('p', { class: 'small muted' }, 'Una buena solución restablece el servicio, ataca la causa, verifica con el usuario y evita que se repita, sin saltarse la seguridad.'), caja,
      el('div', { class: 'case-nav' }, boton('← Diagnóstico', () => ir(1), 'btn btn-quiet'), sig)];
  }

  function pasoDocumentacion() {
    const campos = c.documentacion.map(d => {
      const t = el('textarea', { rows: 2, placeholder: d.ayuda, 'aria-label': d.campo, spellcheck: 'true' });
      t.value = r.notas[d.campo] || '';
      const cuenta = el('span', { class: 'small muted' });
      const act = () => { r.notas[d.campo] = t.value; cuenta.textContent = t.value.trim().length < MIN_NOTA ? `mínimo ${MIN_NOTA} caracteres` : '✓'; };
      t.addEventListener('input', act); act();
      return el('label', { class: 'field' }, el('span', { class: 'field-label' }, d.campo, ' ', cuenta), t);
    });
    return [el('h4', {}, '4. Documenta el ticket'), el('p', { class: 'small muted' }, 'Escribe la nota como si otra persona fuera a leerla mañana: hechos concretos (equipos, horas, mensajes, referencias), sin suposiciones. Una buena nota ahorra horas en la próxima incidencia parecida.'),
      el('div', { class: 'case-doc' }, campos),
      el('div', { class: 'case-nav' }, boton('← Solución', () => ir(2), 'btn btn-quiet'), boton('Comunicar →', () => ir(4)))];
  }

  function pasoComunicacion() {
    const sig = boton('Cerrar y evaluar', () => terminar(), 'btn btn-primary', r.mensajes.some(m => m < 0));
    const grupos = c.comunicacion.map((m, k) => el('fieldset', { class: 'case-q' }, el('legend', {}, m.para),
      m.opciones.map((o, j) => { const i = el('input', { type: 'radio', name: `msg-${id}-${k}`, value: String(j), checked: r.mensajes[k] === j }); i.addEventListener('change', () => { r.mensajes[k] = j; sig.disabled = r.mensajes.some(x => x < 0); }); return el('label', { class: 'option' }, i, el('span', {}, o.texto)); })));
    return [el('h4', {}, '5. Comunica'), el('p', { class: 'small muted' }, 'Elige el mensaje más adecuado: claro para quien lo recibe, sin jerga, con la causa, lo que se hizo, el siguiente paso y, si sigue abierto, cuándo habrá novedades.'),
      ...grupos, el('div', { class: 'case-nav' }, boton('← Documentación', () => ir(3), 'btn btn-quiet'), sig)];
  }

  let ultimo = null;
  function terminar() {
    ultimo = evaluarCaso(c, r);
    const previo = local.get(clave, null);
    local.set(clave, { mejor: Math.max(previo?.mejor || 0, ultimo.total), ultima: ultimo.total, t: Date.now() });
    if (ultimo.aprobado && !labHecho('caso-' + id)) guardarLab('caso-' + id, 1, 1);
    if (!opts.alTerminar) toast(ultimo.aprobado ? `Caso resuelto: ${ultimo.total}/100` : `Resultado: ${ultimo.total}/100. Revisa los comentarios y vuelve a intentarlo.`);
    opts.alTerminar?.({ respuestas: JSON.parse(JSON.stringify(r)), evaluacion: ultimo });
    ir(5);
  }

  function pasoResultado() {
    const ev = ultimo;
    const filas = DIMENSIONES.map(([k, nombre]) => {
      const m = el('div', { class: 'meter' + (ev.dims[k] < 70 ? ' meter-warn' : '') }, el('span'));
      setMeter(m, ev.dims[k] / 100);
      return el('div', { class: 'rubric-row' }, el('span', {}, nombre), m, el('strong', {}, String(ev.dims[k])));
    });
    const bloques = DIMENSIONES.map(([k, nombre]) => {
      const cs = ev.comentarios.filter(x => x.dim === k);
      return el('details', { class: 'rubric-detail', open: cs.some(x => !x.ok) }, el('summary', {}, `${nombre} · ${ev.dims[k]}/100`),
        el('ul', { class: 'tasks' }, cs.map(x => el('li', {}, el('span', { class: 'check ' + (x.ok ? 'on' : 'bad'), 'aria-hidden': 'true' }, x.ok ? '✓' : '✗'), el('span', {}, x.texto)))));
    });
    const modelo = el('details', { class: 'rubric-detail' }, el('summary', {}, 'Nota de ticket de referencia'), el('div', { class: 'ticket-note' }, c.modelo.map(l => el('p', {}, l))));
    const otra = boton('Intentar de nuevo', () => { Object.assign(r, { impacto: opts.prioridad?.impacto || '', urgencia: opts.prioridad?.urgencia || '', acciones: [], causa: -1, solucion: [], notas: {}, mensajes: c.comunicacion.map(() => -1) }); ir(0); }, 'btn btn-ghost');
    return [el('div', { class: 'rubric' },
      el('div', { class: 'rubric-total' }, el('span', { class: 'rubric-score' }, String(ev.total)), el('span', { class: 'small muted' }, '/100'),
        el('span', { class: 'badge ' + (ev.aprobado ? 'badge-ok' : 'badge-warn') }, ev.aprobado ? '✓ Caso resuelto' : ev.riesgos ? 'Acción de riesgo: repítelo' : 'A mejorar (mínimo 70 y 50 en cada parte)')),
      el('div', { class: 'rubric-rows' }, filas)),
      el('p', { class: 'alert alert-info' }, el('span', {}, el('strong', {}, 'Lo que te llevas: '), c.aprendizaje)),
      ...bloques, modelo,
      opts.alTerminar ? null : el('div', { class: 'case-nav' }, otra, el('a', { class: 'btn btn-quiet', href: 'practica.html#area-ti' }, 'Más casos'))];
  }

  holder.replaceChildren(el('section', { class: 'lab case', 'aria-label': c.titulo },
    opts.compacto ? null : el('div', { class: 'lab-head' }, el('div', {}, el('h3', {}, c.titulo), el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + c.nivel }, NIVEL[c.nivel]), el('span', { class: 'badge' }, '🎫 Caso de soporte'), labHecho('caso-' + id) ? el('span', { class: 'badge badge-ok' }, '✓ Resuelto') : null)),
      local.get(clave, null)?.mejor ? el('span', { class: 'badge badge-accent' }, `Mejor: ${local.get(clave).mejor}/100`) : null),
    opts.compacto ? null : el('p', { class: 'small' }, c.resumen),
    pasos, cuerpo));
  pintar();
}

// Turno de mesa de ayuda: clasificar los tickets, resolverlos en orden de prioridad y descargar el informe.
export async function montarTurno(holder, id = 'soporte') {
  if (id !== TURNO.id) throw new Error('Turno desconocido: ' + id);
  await cargar();
  const clave = 'aula:turno:' + id;
  const estado = local.get(clave, null) || { clasificacion: {}, resultados: {} };
  const guardar = () => local.set(clave, estado);
  const raiz = el('div');
  holder.replaceChildren(el('section', { class: 'lab case turno', 'aria-label': TURNO.titulo },
    el('div', { class: 'lab-head' }, el('div', {}, el('h3', {}, TURNO.titulo.replace(/^Proyecto: (.)/, (_, x) => x.toUpperCase())), el('div', { class: 'lab-tags' }, el('span', { class: 'badge level-' + TURNO.nivel }, NIVEL[TURNO.nivel]), el('span', { class: 'badge' }, '🏗️ Proyecto de portafolio')))),
    el('p', { class: 'small' }, TURNO.resumen), raiz));

  const orden = () => [...TURNO.casos].sort((a, b) => {
    const pa = prioridad(estado.clasificacion[a]?.impacto, estado.clasificacion[a]?.urgencia) || 'P9';
    const pb = prioridad(estado.clasificacion[b]?.impacto, estado.clasificacion[b]?.urgencia) || 'P9';
    return pa.localeCompare(pb);
  });
  const clasificado = () => TURNO.casos.every(cid => prioridad(estado.clasificacion[cid]?.impacto, estado.clasificacion[cid]?.urgencia));
  const aciertosClasif = () => TURNO.casos.filter(cid => prioridad(estado.clasificacion[cid].impacto, estado.clasificacion[cid].urgencia) === prioridad(CASOS[cid].prioridad.impacto, CASOS[cid].prioridad.urgencia)).length;

  function pintar() {
    if (!estado.clasificado) return pintarClasificacion();
    const pendiente = orden().find(cid => !estado.resultados[cid]);
    if (estado.abierto && !estado.resultados[estado.abierto]) return pintarCaso(estado.abierto);
    pintarTablero(pendiente);
  }

  function pintarClasificacion() {
    const empezar = el('button', { type: 'button', class: 'btn btn-primary', disabled: !clasificado() }, 'Confirmar la clasificación');
    empezar.addEventListener('click', () => { estado.clasificado = true; guardar(); pintar(); });
    raiz.replaceChildren(el('h4', {}, 'Paso 1 · Clasifica los tickets de tu turno'),
      el('p', { class: 'small muted' }, 'Son las 15:15 y estos tickets están abiertos en la cola. Antes de tocar nada, asigna a cada uno su impacto y urgencia: decidirá el orden en que los atiendes.'),
      ...TURNO.casos.map(cid => {
        const v = estado.clasificacion[cid] || (estado.clasificacion[cid] = { impacto: '', urgencia: '' });
        return el('details', { class: 'module project-phase', open: true }, el('summary', {}, el('span', { class: 'module-num' }, ICONO[CASOS[cid].lugar] || '🎫'), el('div', {}, el('div', { class: 'module-title' }, CASOS[cid].ticket.numero + ' · ' + CASOS[cid].ticket.sede), el('div', { class: 'module-meta' }, CASOS[cid].ticket.de + ' · ' + CASOS[cid].ticket.hora))),
          el('div', { class: 'phase-body' }, el('blockquote', { class: 'ticket-text' }, CASOS[cid].ticket.texto), selectorPrioridad(v, () => { guardar(); empezar.disabled = !clasificado(); })));
      }),
      el('div', { class: 'case-nav' }, empezar));
  }

  function pintarTablero(pendiente) {
    const ok = aciertosClasif();
    const hechos = TURNO.casos.filter(cid => estado.resultados[cid]);
    const aprobados = hechos.filter(cid => estado.resultados[cid].evaluacion.aprobado);
    const fin = hechos.length === TURNO.casos.length;
    if (fin) {
      const completo = aprobados.length === TURNO.casos.length && ok >= 4;
      if (completo && !labHecho(TURNO.progreso)) { guardarLab(TURNO.progreso, 1, 1); toast('¡Turno completado! Descarga el informe para tu portafolio.'); }
    }
    const filas = orden().map((cid, k) => {
      const c = CASOS[cid];
      const res = estado.resultados[cid];
      const pAlumno = prioridad(estado.clasificacion[cid].impacto, estado.clasificacion[cid].urgencia);
      const pReal = prioridad(c.prioridad.impacto, c.prioridad.urgencia);
      const abrir = el('button', { type: 'button', class: 'btn btn-sm ' + (cid === pendiente ? 'btn-primary' : 'btn-ghost') }, res ? 'Repetir' : 'Atender');
      abrir.addEventListener('click', () => { delete estado.resultados[cid]; estado.abierto = cid; guardar(); pintar(); });
      return el('tr', {}, el('td', {}, String(k + 1)), el('td', {}, el('strong', {}, c.ticket.numero), el('br'), el('span', { class: 'small muted' }, c.titulo)),
        el('td', {}, el('span', { class: 'badge prio prio-' + pAlumno.toLowerCase() }, pAlumno), pAlumno !== pReal ? el('span', { class: 'small muted' }, ` (era ${pReal})`) : null),
        el('td', {}, res ? el('span', { class: 'badge ' + (res.evaluacion.aprobado ? 'badge-ok' : 'badge-warn') }, res.evaluacion.total + '/100') : el('span', { class: 'small muted' }, 'Pendiente')),
        el('td', {}, abrir));
    });
    const descargar = el('button', { type: 'button', class: 'btn btn-ghost', disabled: !hechos.length }, '⬇ Descargar informe del turno');
    descargar.addEventListener('click', () => {
      const blob = new Blob([informeTurno(estado.resultados)], { type: 'text/plain;charset=utf-8' });
      const a = el('a', { href: URL.createObjectURL(blob), download: 'informe-turno-mesa-de-ayuda.txt' });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const reiniciar = el('button', { type: 'button', class: 'btn btn-quiet' }, 'Empezar el turno de cero');
    reiniciar.addEventListener('click', () => { if (confirm('¿Borrar la clasificación y los tickets resueltos de este turno?')) { estado.clasificacion = {}; estado.resultados = {}; estado.clasificado = false; delete estado.abierto; guardar(); pintar(); } });
    raiz.replaceChildren(
      el('h4', {}, fin ? 'Turno terminado' : 'Paso 2 · Atiende la cola en orden de prioridad'),
      el('p', { class: 'small' }, `Clasificación: ${ok}/${TURNO.casos.length} prioridades correctas. Tickets resueltos: ${aprobados.length}/${TURNO.casos.length}.`, fin && !(aprobados.length === TURNO.casos.length && ok >= 4) ? ' Para completar el proyecto necesitas aprobar los 5 tickets y acertar al menos 4 prioridades.' : ''),
      el('div', { class: 'table-wrap' }, el('table', { class: 'queue' }, el('thead', {}, el('tr', {}, ['#', 'Ticket', 'Prioridad', 'Resultado', ''].map(h => el('th', {}, h)))), el('tbody', {}, filas))),
      el('div', { class: 'case-nav' }, descargar, reiniciar),
      fin ? el('p', { class: 'alert alert-info' }, el('span', {}, 'El informe recoge tus notas, decisiones y mensajes. Preséntalo como lo que es: un proyecto académico simulado. En la lección «Tu portafolio y tu currículum» tienes cómo describirlo.')) : null);
  }

  function pintarCaso(cid) {
    const caja = el('div');
    const volver = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, '← Volver a la cola');
    volver.addEventListener('click', () => { delete estado.abierto; guardar(); pintar(); });
    raiz.replaceChildren(el('div', { class: 'case-nav' }, volver, el('strong', {}, CASOS[cid].titulo)), caja);
    montarCaso(caja, cid, { prioridad: estado.clasificacion[cid], compacto: true, alTerminar: res => {
      estado.resultados[cid] = res; delete estado.abierto; guardar();
      const seguir = el('button', { type: 'button', class: 'btn btn-primary' }, 'Volver a la cola →');
      seguir.addEventListener('click', () => pintar());
      setTimeout(() => caja.querySelector('.case-body')?.append(el('div', { class: 'case-nav' }, seguir)), 0);
    } });
  }

  pintar();
}

export { respuestaModelo };
