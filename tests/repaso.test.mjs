// Repaso de errores (repetición espaciada por cajas) y recomendaciones del panel «Continúa por aquí».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.window = { matchMedia: () => ({ matches: false }) };
const almacen = new Map();
globalThis.localStorage = { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) };

const P = await import('../js/progreso.js');
const R = await import('../js/recomendaciones.js');
const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
const mods = new Map(curso.modulos.map(m => [m.id, m]));
curso.lecciones = curso.modulos.flatMap(m => (m.lecciones || []).map(l => ({ ...l, modulo: mods.get(m.id) })));
const DIA = 86400000;
const T0 = Date.UTC(2026, 0, 10);

test('una pregunta acertada a la primera no entra en el repaso; una fallada entra en la caja 0', () => {
  assert.equal(P.registrarRespuestas([{ id: 'm1-osi#0', ok: true }], 'leccion', T0), 0);
  assert.equal(P.registrarRespuestas([{ id: 'm1-osi#1', ok: false }, { id: 'no válida', ok: false }], 'leccion', T0), 1);
  const [r] = P.repaso(T0);
  assert.equal(r.id, 'm1-osi#1');
  assert.equal(r.caja, 0);
  assert.equal(r.pendiente, true);
  assert.equal(r.origen, 'leccion');
});

test('cada acierto sube de caja y alarga el intervalo; un fallo la devuelve a la caja 0', () => {
  let t = T0;
  for (let caja = 1; caja <= 3; caja++) {
    P.registrarRespuestas([{ id: 'm1-osi#1', ok: true }], 'repaso', t);
    const r = P.repaso(t).find(x => x.id === 'm1-osi#1');
    assert.equal(r.caja, caja);
    assert.equal(r.proxima, t + P.DIAS_CAJA[caja] * DIA);
    assert.equal(r.pendiente, false, 'no vuelve a pedirse el mismo día');
    t = r.proxima;
  }
  assert.equal(P.repaso(t).find(x => x.id === 'm1-osi#1').dominada, true);
  P.registrarRespuestas([{ id: 'm1-osi#1', ok: false }], 'examen', t);
  const r = P.repaso(t).find(x => x.id === 'm1-osi#1');
  assert.equal(r.caja, 0);
  assert.equal(r.fallos, 2);
  assert.equal(r.aciertos, 3);
  assert.equal(r.dominada, false);
});

test('el panel recomienda reforzar las lecciones con fallos y cuenta el repaso de hoy por área', () => {
  P.registrarRespuestas([{ id: 'b1-modelo#0', ok: false }, { id: 'b1-modelo#1', ok: false }], 'leccion', T0);
  const temas = R.temasAReforzar(curso, null, T0);
  assert.ok(temas.length >= 1);
  assert.equal(temas[0].leccion.id, 'b1-modelo', 'la lección con más fallos pendientes va primero');
  assert.deepEqual(R.temasAReforzar(curso, 'prog', T0), []);
  const bd = R.resumenRepaso(curso, 'bd', T0);
  assert.equal(bd.hoy, 2);
  assert.equal(R.resumenRepaso(curso, 'redes', T0).enRepaso, 1);
});

test('la siguiente lección sigue la ruta por niveles y las prácticas pendientes salen de lecciones estudiadas', () => {
  const sig = R.siguienteLeccion(curso, 'redes');
  assert.equal(sig.nivel, Math.min(...curso.lecciones.filter(l => l.modulo.area === 'redes').map(l => l.nivel)));
  P.completarLeccion('m4-proyecto-oficina');
  const pend = R.practicasPendientes(curso, 'redes', 10);
  assert.ok(pend.some(p => p.clave === 'proyecto:oficina'), 'el proyecto aparece como práctica pendiente');
  P.guardarLab('proy-oficina', 21, 21);
  assert.ok(!R.practicasPendientes(curso, 'redes', 10).some(p => p.clave === 'proyecto:oficina'));
});
