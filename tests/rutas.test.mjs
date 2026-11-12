// Rutas de empleo: referencias válidas al temario y al catálogo, y cálculo del progreso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RUTAS, MODULOS_TI, progresoRuta } from '../js/rutas.js';
import { CATALOGO } from '../js/labs/catalogo.js';

const curso = JSON.parse(readFileSync(new URL('../data/curso.json', import.meta.url)));
const ids = new Set(curso.modulos.map(m => m.id));
const planificados = new Set(MODULOS_TI.map(m => m.id));

test('hay cinco rutas (soporte, mesa, redes, sistemas y datos) y la de datos es independiente', () => {
  assert.deepEqual(RUTAS.map(r => r.id), ['soporte', 'mesa', 'redes', 'sysadmin', 'datos']);
  assert.ok(RUTAS.find(r => r.id === 'datos').independiente);
  assert.equal(MODULOS_TI.length, 12);
});

test('cada ruta apunta a módulos publicados o planificados y a prácticas que existen', () => {
  for (const r of RUTAS) {
    for (const m of r.modulos) assert.ok(ids.has(m) || planificados.has(m), `${r.id}: módulo desconocido ${m}`);
    for (const c of r.practicas) assert.ok(CATALOGO.some(l => l.clave === c), `${r.id}: práctica desconocida ${c}`);
    if (r.proyecto) assert.ok(CATALOGO.some(l => l.clave === r.proyecto.clave), `${r.id}: proyecto desconocido`);
    assert.ok(r.requisitos.length >= 4 && r.puesto);
  }
});

test('las rutas de soporte y mesa de ayuda ya tienen su módulo principal y su proyecto', () => {
  for (const id of ['soporte', 'mesa']) {
    const pr = progresoRuta(RUTAS.find(r => r.id === id), curso, CATALOGO, { leccionHecha: () => false, labHecho: () => false });
    assert.ok(pr.modulos.find(x => x.id === 's1').modulo, 's1 publicado');
    assert.equal(pr.proyecto.clave, 'turno:soporte');
    assert.equal(pr.porcentaje, 0);
  }
});

test('el progreso cuenta lecciones, prácticas y proyecto', () => {
  const ruta = RUTAS.find(r => r.id === 'soporte');
  const todo = progresoRuta(ruta, curso, CATALOGO, { leccionHecha: () => true, labHecho: () => true });
  assert.equal(todo.porcentaje, 100);
  const s1 = new Set(curso.modulos.find(m => m.id === 's1').lecciones.map(l => l.id));
  const parcial = progresoRuta(ruta, curso, CATALOGO, { leccionHecha: id => s1.has(id), labHecho: () => false });
  assert.ok(parcial.porcentaje > 0 && parcial.porcentaje < 100);
  assert.equal(parcial.hechas, s1.size);
});
