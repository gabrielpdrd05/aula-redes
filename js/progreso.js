// Progreso del alumno: lecciones completadas, cuestionarios, laboratorios, simulacros de examen y días de estudio.
// Siempre se guarda en el navegador (funciona sin conexión y sin cuenta). Con sesión iniciada, además se sincroniza
// con Supabase (tablas progreso y examenes, protegidas con seguridad a nivel de fila: cada alumno solo ve lo suyo).
// Al iniciar sesión por primera vez en un navegador, el progreso hecho como invitado se suma a la cuenta.
import { supabase, usuarioActual } from './auth.js';
import { local } from './core.js';

const VACIO = () => ({ v: 1, items: {}, examenes: [], dias: [] });
let estado = VACIO();
let uid = null;
let listo = null;
const oyentes = new Set();

const clave = id => 'aula:progreso:' + (id || 'invitado');
// Fecha local (no UTC): el día de estudio es el del reloj del alumno.
const fecha = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const hoy = () => fecha(new Date());
const notificar = () => oyentes.forEach(fn => { try { fn(estado); } catch (e) { console.error(e); } });
export const alCambiar = fn => { oyentes.add(fn); return () => oyentes.delete(fn); };

// El mejor de dos registros del mismo elemento: completado gana; después, la mejor nota; después, el más reciente.
function mejor(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (!!a.hecho !== !!b.hecho) return a.hecho ? a : b;
  const na = a.total ? a.puntos / a.total : 0, nb = b.total ? b.puntos / b.total : 0;
  if (na !== nb) return na > nb ? a : b;
  return (a.t || 0) >= (b.t || 0) ? a : b;
}
function fusionar(x, y) {
  const r = VACIO();
  for (const k of new Set([...Object.keys(x.items), ...Object.keys(y.items)])) r.items[k] = mejor(x.items[k], y.items[k]);
  const vistos = new Set();
  r.examenes = [...x.examenes, ...y.examenes].filter(e => { const k = e.t + ':' + e.puntos; if (vistos.has(k)) return false; vistos.add(k); return true; }).sort((a, b) => a.t - b.t).slice(-50);
  r.dias = [...new Set([...x.dias, ...y.dias])].sort().slice(-120);
  return r;
}

async function descargar() {
  const sb = supabase();
  const [{ data: filas, error: e1 }, { data: exams, error: e2 }] = await Promise.all([
    sb.from('progreso').select('item_id, tipo, puntos, total, hecho, datos, actualizado').limit(2000),
    sb.from('examenes').select('id, puntos, total, dominios, segundos, creado').order('creado', { ascending: true }).limit(50),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const r = VACIO();
  for (const f of filas) {
    if (f.item_id === 'actividad') { r.dias = Array.isArray(f.datos?.dias) ? f.datos.dias : []; continue; }
    r.items[f.item_id] = { tipo: f.tipo, puntos: f.puntos, total: f.total, hecho: f.hecho, t: Date.parse(f.actualizado) || 0 };
  }
  r.examenes = exams.map(e => ({ t: Date.parse(e.creado), puntos: e.puntos, total: e.total, dominios: e.dominios || {}, segundos: e.segundos, remoto: true }));
  return r;
}

async function subirItem(id, it) {
  const sb = supabase();
  if (!sb || !uid) return;
  const { error } = await sb.from('progreso').upsert({ user_id: uid, item_id: id, tipo: it.tipo, puntos: it.puntos ?? null, total: it.total ?? null, hecho: !!it.hecho, datos: {}, actualizado: new Date(it.t || Date.now()).toISOString() }, { onConflict: 'user_id,item_id' });
  if (error) console.warn('No se pudo sincronizar el progreso:', error.message);
}
async function subirDias() {
  const sb = supabase();
  if (!sb || !uid) return;
  await sb.from('progreso').upsert({ user_id: uid, item_id: 'actividad', tipo: 'actividad', hecho: true, datos: { dias: estado.dias.slice(-120) }, actualizado: new Date().toISOString() }, { onConflict: 'user_id,item_id' });
}

export function cargar() {
  return listo || (listo = (async () => {
    const u = await usuarioActual();
    uid = u?.id || null;
    estado = fusionar(VACIO(), local.get(clave(uid), VACIO()));
    if (uid) {
      try {
        const remoto = await descargar();
        const invitado = local.get(clave(null), null);
        let combinado = fusionar(remoto, estado);
        if (invitado && (Object.keys(invitado.items || {}).length || (invitado.examenes || []).length)) {
          combinado = fusionar(combinado, fusionar(VACIO(), invitado));
          local.del(clave(null));
        }
        // Sube lo que hay en local y no en el servidor (o mejor que lo del servidor).
        const pendientes = Object.entries(combinado.items).filter(([k, v]) => mejor(remoto.items[k], v) !== remoto.items[k]);
        estado = combinado;
        local.set(clave(uid), estado);
        await Promise.all(pendientes.map(([k, v]) => subirItem(k, v)));
        for (const e of combinado.examenes.filter(e => !e.remoto)) await subirExamen(e);
        if (combinado.dias.length !== remoto.dias.length) await subirDias();
      } catch (err) { console.warn('Progreso sin sincronizar (se usa la copia local):', err.message || err); }
    }
    return estado;
  })());
}

function anotarDia() {
  if (estado.dias[estado.dias.length - 1] !== hoy()) { estado.dias.push(hoy()); subirDias(); }
}
function guardar(id, item) {
  const nuevo = { ...item, t: Date.now() };
  const elegido = mejor(estado.items[id], nuevo);
  estado.items[id] = elegido;
  anotarDia();
  local.set(clave(uid), estado);
  notificar();
  if (elegido === nuevo) return subirItem(id, nuevo);
}

export const completarLeccion = id => guardar('leccion:' + id, { tipo: 'leccion', hecho: true });
export const guardarQuiz = (id, puntos, total) => guardar('quiz:' + id, { tipo: 'quiz', puntos, total, hecho: puntos / total >= 0.7 });
export const guardarLab = (id, puntos = 1, total = 1) => guardar('lab:' + id, { tipo: 'lab', puntos, total, hecho: puntos >= total });

async function subirExamen(e) {
  const sb = supabase();
  if (!sb || !uid) return;
  const { error } = await sb.from('examenes').insert({ user_id: uid, puntos: e.puntos, total: e.total, dominios: e.dominios, segundos: e.segundos, creado: new Date(e.t).toISOString() });
  if (!error) e.remoto = true;
}
export async function guardarExamen({ puntos, total, dominios, segundos }) {
  const e = { t: Date.now(), puntos, total, dominios, segundos };
  estado.examenes = [...estado.examenes, e].slice(-50);
  anotarDia();
  local.set(clave(uid), estado);
  notificar();
  await subirExamen(e);
  local.set(clave(uid), estado);
}

export const leccionHecha = id => !!estado.items['leccion:' + id]?.hecho;
export const notaQuiz = id => estado.items['quiz:' + id] || null;
export const labHecho = id => !!estado.items['lab:' + id]?.hecho;
export const examenes = () => estado.examenes;

// Días seguidos de estudio hasta hoy (o hasta ayer, si hoy aún no ha estudiado).
export function racha() {
  const set = new Set(estado.dias);
  let n = 0;
  const d = new Date();
  if (!set.has(fecha(d))) d.setDate(d.getDate() - 1);
  while (set.has(fecha(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export async function borrarTodo() {
  estado = VACIO();
  local.del(clave(uid));
  notificar();
  const sb = supabase();
  if (sb && uid) {
    await sb.from('progreso').delete().eq('user_id', uid);
    await sb.from('examenes').delete().eq('user_id', uid);
  }
}

export const exportar = () => JSON.parse(JSON.stringify(estado));
