// Laboratorio SQL en el navegador con SQLite (sql.js, WebAssembly). Nada sale del equipo del alumno.
import { el, toast } from '../core.js';
import { guardarLab, labHecho, cargar } from '../progreso.js';
import { ESQUEMA, DATOS } from './sql-datos.js';
import { EJERCICIOS } from './sql-ejercicios.js';

let motor = null;
function cargarMotor() {
  return motor || (motor = new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve(window.initSqlJs);
    const s = document.createElement('script');
    s.src = new URL('../../vendor/sql-wasm.js', import.meta.url).href;
    s.onload = () => resolve(window.initSqlJs);
    s.onerror = () => reject(new Error('No se pudo cargar el motor SQL.'));
    document.head.append(s);
  }).then(init => init({ locateFile: f => new URL('../../vendor/' + f, import.meta.url).href })));
}

export async function nuevaBase() {
  const SQL = await cargarMotor();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.run(ESQUEMA);
  db.run(DATOS);
  return db;
}

// Ejecuta y devuelve el último conjunto de resultados (o null si la sentencia no devuelve filas).
export function ejecutarSql(db, sql) {
  const res = db.exec(sql);
  return res.length ? res[res.length - 1] : null;
}

const firma = (filas, ordenado) => { const f = filas.map(r => JSON.stringify(r.map(v => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)))); return ordenado ? f : f.sort(); };
export async function corregir(ej, sqlAlumno) {
  const [dbA, dbB] = await Promise.all([nuevaBase(), nuevaBase()]);
  try {
    let rA, rB;
    try { rA = ejecutarSql(dbA, sqlAlumno); } catch (e) { return { ok: false, error: 'Error de SQL: ' + e.message }; }
    rB = ejecutarSql(dbB, ej.solucion);
    if (ej.verificar) { rA = ejecutarSql(dbA, ej.verificar); rB = ejecutarSql(dbB, ej.verificar); }
    const fa = rA ? rA.values : [], fb = rB ? rB.values : [];
    if ((rA?.columns.length || 0) !== (rB?.columns.length || 0) && !ej.verificar) return { ok: false, resultado: rA, motivo: `Tu consulta devuelve ${rA?.columns.length || 0} columnas y se esperaban ${rB?.columns.length || 0}.` };
    const ok = JSON.stringify(firma(fa, ej.ordenado)) === JSON.stringify(firma(fb, ej.ordenado));
    let motivo = '';
    if (!ok) motivo = fa.length !== fb.length ? `Tu consulta devuelve ${fa.length} ${fa.length === 1 ? 'fila' : 'filas'} y se esperaban ${fb.length}.` : ej.ordenado ? 'Las filas no coinciden o no están en el orden pedido.' : 'Las filas no coinciden con las esperadas.';
    return { ok, resultado: ej.verificar ? null : rA, motivo };
  } finally { dbA.close(); dbB.close(); }
}

function tablaResultado(r) {
  if (!r) return el('p', { class: 'muted small' }, 'La sentencia se ejecutó y no devuelve filas.');
  return el('div', { class: 'result-wrap' }, el('table', { class: 'result-table' },
    el('thead', {}, el('tr', {}, r.columns.map(c => el('th', { scope: 'col' }, c)))),
    el('tbody', {}, r.values.slice(0, 200).map(f => el('tr', {}, f.map(v => el('td', {}, v === null ? 'NULL' : String(v))))))));
}

export async function montarSql(holder, id) {
  const lista = EJERCICIOS[id];
  if (!lista) throw new Error('Ejercicios SQL desconocidos: ' + id);
  await cargar();
  let n = 0;
  const hechos = new Set();
  const titulo = el('h3', {});
  const enunciado = el('p', {});
  const editor = el('textarea', { class: 'sql-editor', spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Escribe tu consulta SQL', rows: 5 });
  const salida = el('div', { 'aria-live': 'polite' });
  const feedback = el('div', { class: 'feedback', role: 'status' });
  const marcador = el('span', { class: 'badge badge-accent' });
  const btnRun = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Ejecutar');
  const btnCheck = el('button', { type: 'button', class: 'btn btn-primary' }, 'Comprobar');
  const btnPrev = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, '‹ Anterior');
  const btnNext = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Siguiente ›');
  const btnSol = el('button', { type: 'button', class: 'btn btn-quiet btn-sm' }, 'Ver solución');
  const esquema = el('details', {}, el('summary', { class: 'small' }, 'Ver las tablas de la base de datos'), el('pre', { class: 'code' }, ESQUEMA.trim()));

  function pintar() {
    const ej = lista[n];
    titulo.textContent = `Ejercicio ${n + 1} de ${lista.length}`;
    enunciado.textContent = ej.enunciado + (ej.pista ? ' Pista: ' + ej.pista : '');
    editor.value = '';
    salida.replaceChildren(); feedback.textContent = ''; feedback.className = 'feedback';
    marcador.textContent = `${hechos.size}/${lista.length} resueltos`;
    btnPrev.disabled = n === 0; btnNext.disabled = n === lista.length - 1;
  }
  btnRun.addEventListener('click', async () => {
    const db = await nuevaBase();
    try { salida.replaceChildren(tablaResultado(ejecutarSql(db, editor.value))); feedback.textContent = ''; }
    catch (e) { feedback.className = 'feedback bad'; feedback.textContent = 'Error de SQL: ' + e.message; }
    finally { db.close(); }
  });
  btnCheck.addEventListener('click', async () => {
    if (!editor.value.trim()) { feedback.className = 'feedback bad'; feedback.textContent = 'Escribe una consulta primero.'; return; }
    const r = await corregir(lista[n], editor.value);
    if (r.resultado !== undefined) salida.replaceChildren(tablaResultado(r.resultado));
    if (r.ok) {
      hechos.add(n);
      feedback.className = 'feedback ok'; feedback.textContent = '¡Correcto!' + (n < lista.length - 1 ? ' Pasa al siguiente ejercicio.' : '');
      marcador.textContent = `${hechos.size}/${lista.length} resueltos`;
      if (hechos.size === lista.length && !labHecho('sql-' + id)) { guardarLab('sql-' + id); toast('Laboratorio SQL completado.'); }
    } else { feedback.className = 'feedback bad'; feedback.textContent = r.error || r.motivo; }
  });
  editor.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); btnCheck.click(); } });
  btnPrev.addEventListener('click', () => { n--; pintar(); });
  btnNext.addEventListener('click', () => { n++; pintar(); });
  btnSol.addEventListener('click', () => { editor.value = lista[n].solucion; editor.focus(); });

  holder.append(el('section', { class: 'lab', 'aria-label': 'Laboratorio SQL' },
    el('div', { class: 'lab-head' }, el('h3', {}, 'Laboratorio SQL: inventario de red'), marcador),
    esquema, titulo, enunciado, editor, el('p', { class: 'hint' }, 'Ctrl + Intro para comprobar. La base de datos se reinicia en cada ejecución.'),
    el('div', { class: 'hero-cta' }, btnRun, btnCheck, btnPrev, btnNext, btnSol), feedback, salida));
  pintar();
  salida.replaceChildren(el('p', { class: 'muted small' }, 'Preparando SQLite en tu navegador…'));
  await cargarMotor();
  salida.replaceChildren();
}
