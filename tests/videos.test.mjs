// Videos explicativos: guiones coherentes (cada referencia apunta a un elemento que existe en esa escena),
// narración en todas las escenas y cada video insertado en su lección.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIDEOS, VIDEO_EN } from '../js/video/videos.js';

const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
const lecciones = curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, area: m.area })));
const TIPOS = new Set(['titulo', 'caja', 'linea', 'tabla', 'codigo', 'nota', 'burbuja', 'quitar', 'viaje', 'enfoque']);

for (const [id, v] of Object.entries(VIDEOS)) {
  test(`video «${id}»: guion válido`, () => {
    assert.equal(v.id, id);
    assert.ok(v.titulo && ['redes', 'bd', 'prog', 'ti'].includes(v.area));
    assert.ok(v.escenas.length >= 5 && v.escenas.length <= 10, 'entre 5 y 10 escenas');
    const vivos = new Map();
    v.escenas.forEach((e, n) => {
      assert.ok(e.voz && e.voz.length > 20 && e.voz.length < 260, `escena ${n + 1}: narración corta y presente`);
      for (const a of e.acciones || []) {
        assert.ok(TIPOS.has(a.t), `escena ${n + 1}: acción desconocida ${a.t}`);
        if (a.t === 'quitar') { a.ids.forEach(x => vivos.delete(x)); continue; }
        if (['caja', 'linea', 'tabla', 'codigo', 'nota', 'burbuja'].includes(a.t)) {
          const previo = vivos.get(a.id);
          if (!previo) {
            if (a.t === 'caja' || a.t === 'tabla' || a.t === 'codigo' || a.t === 'nota') assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y), `escena ${n + 1}: ${a.id} sin posición`);
            if (a.t === 'tabla') assert.ok(a.columnas && a.filas, `escena ${n + 1}: tabla ${a.id} incompleta`);
          }
          vivos.set(a.id, { ...(previo || {}), ...a });
        }
      }
      // Las referencias se resuelven con el estado completo de la escena (todas sus acciones aplicadas).
      for (const a of e.acciones || []) {
        if (a.t === 'linea' || a.t === 'viaje') for (const ref of [a.de, a.a, ...(a.por || [])].filter(Boolean)) assert.ok(vivos.get(ref)?.t === 'caja', `escena ${n + 1}: ${a.t} hacia «${ref}», que no es una caja visible`);
        if (a.t === 'burbuja') assert.ok(vivos.get(a.de)?.t === 'caja', `escena ${n + 1}: burbuja de «${a.de}» sin caja`);
        if (a.t === 'enfoque') a.ids.forEach(x => assert.ok(vivos.has(x), `escena ${n + 1}: enfoque en «${x}», que no existe`));
      }
      for (const [k, el] of vivos) if (el.x != null) assert.ok(el.x >= 0 && el.x < 960 && el.y >= 0 && el.y < 540, `escena ${n + 1}: ${k} fuera del escenario`);
    });
  });
}

test('cada video está insertado en su lección y pertenece a su área', () => {
  assert.deepEqual(Object.keys(VIDEO_EN).sort(), Object.keys(VIDEOS).sort());
  for (const [id, lec] of Object.entries(VIDEO_EN)) {
    const l = lecciones.find(x => x.id === lec);
    assert.ok(l, `lección ${lec} no existe`);
    assert.match(JSON.stringify(l.blocks), new RegExp(`"kind":"video","id":"${id}"`), `${id} no está en ${lec}`);
    assert.equal(l.area, VIDEOS[id].area, `${id}: área distinta a la de su lección`);
  }
});

test('hay al menos un video por cada módulo con contenido técnico', () => {
  const conVideo = new Set(Object.values(VIDEO_EN).map(lec => curso.modulos.find(m => m.lecciones.some(l => l.id === lec)).id));
  for (const m of ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'b1', 'b2', 'b3', 'p1', 'p2', 'p3', 'p4', 's1']) assert.ok(conVideo.has(m), `módulo ${m} sin video`);
});
