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
  ids.forEach(id => assert.match(id, /^m\d-[a-z0-9-]+$/));
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
