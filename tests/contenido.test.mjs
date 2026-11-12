// Integridad del temario compilado y del banco de preguntas del simulacro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const curso = JSON.parse(await readFile(new URL('../data/curso.json', import.meta.url)));
const examen = JSON.parse(await readFile(new URL('../data/examen.json', import.meta.url)));
const lecciones = curso.modulos.flatMap(m => m.lecciones);

test('ids de lección únicos y con formato seguro', () => {
  const ids = lecciones.map(l => l.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach(id => assert.match(id, /^[mbps]\d+-[a-z0-9-]+$/));
});

test('los seis dominios del CCNA suman el 100 %', () => {
  assert.equal(curso.modulos.reduce((s, m) => s + m.peso, 0), 100);
  assert.equal(curso.modulos.filter(m => m.peso > 0).length, 6);
});

test('cada lección tiene contenido y cuestionario', () => {
  for (const l of lecciones) {
    assert.ok(l.blocks.length >= 3, l.id + ' casi vacía');
    assert.ok(l.quiz.length >= 2, l.id + ' sin cuestionario');
    assert.ok(l.minutos > 0 && l.minutos <= 60, l.id);
  }
});

test('preguntas bien formadas (respuesta correcta válida, sin opciones repetidas, con explicación)', () => {
  for (const q of [...lecciones.flatMap(l => l.quiz), ...examen]) {
    assert.ok(q.options.length >= 2, q.q);
    assert.ok(q.correct.length >= 1 && q.correct.every(i => i >= 0 && i < q.options.length), q.q);
    assert.equal(new Set(q.options).size, q.options.length, 'opciones repetidas: ' + q.q);
    assert.ok(q.explain && q.explain.length > 10, 'sin explicación: ' + q.q);
  }
});

test('el banco del simulacro cubre todos los dominios y enlaza a lecciones que existen', () => {
  const ids = new Set(lecciones.map(l => l.id));
  for (const m of curso.modulos.filter(m => m.peso > 0)) assert.ok(examen.filter(q => q.modulo === m.id).length >= 20, m.id);
  examen.forEach(q => assert.ok(ids.has(q.id.split('#')[0]), q.id));
});

test('los enlaces internos de las lecciones apuntan a lecciones existentes', () => {
  const ids = new Set(lecciones.map(l => l.id));
  const enlaces = JSON.stringify(curso).match(/leccion\.html\?id=[a-z0-9-]+/g) || [];
  enlaces.forEach(e => assert.ok(ids.has(e.split('=')[1]), e));
});

test('las tres áreas (Redes, Bases de datos y Programación) tienen contenido de los tres niveles', () => {
  for (const area of ['redes', 'bd', 'prog']) {
    const ls = curso.modulos.filter(m => m.area === area).flatMap(m => m.lecciones);
    assert.ok(ls.length >= 20, area + ': pocas lecciones');
    for (const n of [1, 2, 3]) assert.ok(ls.some(l => l.nivel === n), `${area} sin nivel ${n}`);
    assert.ok(examen.filter(q => q.area === area).length >= 60, area + ': pocas preguntas para el simulacro');
  }
  assert.ok(curso.modulos.every(m => ['redes', 'bd', 'prog', 'ti'].includes(m.area)));
});

test('el área Empleo TI tiene teoría, ejercicios guiados, retos con solución, evaluación práctica y proyecto', () => {
  const ls = curso.modulos.filter(m => m.area === 'ti').flatMap(m => m.lecciones);
  assert.ok(ls.length >= 10, 'pocas lecciones de Empleo TI');
  const texto = JSON.stringify(ls);
  for (const k of ['practica', 'reto', 'solucion', 'externo']) assert.match(texto, new RegExp(`"kind":"${k}"`), 'falta el aviso ' + k);
  const retos = (texto.match(/"kind":"reto"/g) || []).length, soluciones = (texto.match(/"kind":"solucion"/g) || []).length;
  assert.ok(soluciones >= retos, 'cada reto tiene su solución plegada');
  for (const id of ['login', 'impresora-etiquetas', 'sucursal', 'nuevo-empleado', 'lento']) assert.match(texto, new RegExp(`"kind":"caso","id":"${id}"`), 'caso sin lección: ' + id);
  assert.match(texto, /"kind":"turno","id":"soporte"/);
  assert.ok(examen.filter(q => q.area === 'ti').length >= 30, 'pocas preguntas de Empleo TI');
});

test('los enlaces en Markdown se convierten en enlaces (no quedan como texto)', () => {
  const textos = JSON.stringify(curso).match(/"t":"text","v":"[^"]*\]\([^"]*"/g) || [];
  assert.deepEqual(textos, []);
});

test('los laboratorios de código y SQL están enlazados desde alguna lección', async () => {
  const { EJERCICIOS: CODIGO } = await import('../js/codigo/ejercicios.js');
  const { EJERCICIOS: SQL } = await import('../js/labs/sql-ejercicios.js');
  const texto = JSON.stringify(curso);
  for (const id of Object.keys(CODIGO)) assert.match(texto, new RegExp(`"kind":"code","id":"${id}"`), 'sin lección: code:' + id);
  for (const id of Object.keys(SQL)) assert.match(texto, new RegExp(`"kind":"sql","id":"${id}"`), 'sin lección: sql:' + id);
});
