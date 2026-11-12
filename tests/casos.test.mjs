// Casos de soporte: la resolución de referencia aprueba con 100; las malas prácticas se detectan y penalizan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASOS, TURNO, evaluarCaso, respuestaModelo, prioridad, informeTurno } from '../js/casos/casos.js';

test('matriz de prioridad impacto × urgencia', () => {
  assert.equal(prioridad('alto', 'alta'), 'P1');
  assert.equal(prioridad('medio', 'alta'), 'P2');
  assert.equal(prioridad('bajo', 'media'), 'P4');
  assert.equal(prioridad('x', 'alta'), null);
});

for (const [id, c] of Object.entries(CASOS)) {
  test(`caso «${id}»: datos coherentes y la resolución de referencia obtiene 100`, () => {
    assert.equal(c.id, id);
    assert.equal(c.causas.filter(x => x.ok).length, 1, 'una sola causa correcta');
    assert.ok(c.causas.filter(x => !x.ok).every(x => x.porque), 'cada causa incorrecta explica por qué');
    assert.ok(c.solucion.filter(x => !x.ok).every(x => x.porque), 'cada paso incorrecto explica por qué');
    assert.ok(c.acciones.some(a => a.tipo === 'clave') && c.acciones.some(a => a.tipo === 'riesgo' || a.tipo === 'inutil'));
    assert.equal(new Set(c.acciones.map(a => a.id)).size, c.acciones.length, 'ids de acción únicos');
    assert.equal(c.modelo.length, c.documentacion.length);
    c.comunicacion.forEach(m => { assert.equal(m.opciones.filter(o => o.ok).length, 1); assert.ok(m.opciones.filter(o => !o.ok).every(o => o.porque)); });
    const ev = evaluarCaso(c, respuestaModelo(c));
    assert.deepEqual(ev.dims, { diagnostico: 100, solucion: 100, documentacion: 100, comunicacion: 100 });
    assert.equal(ev.aprobado, true);
  });

  test(`caso «${id}»: una acción de riesgo, la causa equivocada y notas vacías suspenden con explicación`, () => {
    const r = respuestaModelo(c);
    const riesgo = c.acciones.find(a => a.tipo === 'riesgo') || c.acciones.find(a => a.tipo === 'inutil');
    r.acciones = [...r.acciones, riesgo.id];
    r.causa = c.causas.findIndex(x => !x.ok);
    r.notas = {};
    const ev = evaluarCaso(c, r);
    assert.equal(ev.aprobado, false);
    assert.ok(ev.dims.diagnostico < 70);
    assert.equal(ev.dims.documentacion, 0);
    assert.ok(ev.comentarios.some(x => !x.ok && x.texto.includes(c.causas.find(y => y.ok).texto)), 'indica la causa correcta');
  });
}

test('documentación: hace falta contenido y lo esencial, sin depender de tildes ni mayúsculas', () => {
  const c = CASOS.login;
  const r = respuestaModelo(c);
  r.notas['Causa'] = 'EL TELÉFONO tenía la contraseña antigua';
  assert.equal(evaluarCaso(c, r).dims.documentacion, 100);
  r.notas['Causa'] = 'no sé';
  assert.equal(evaluarCaso(c, r).dims.documentacion, 75);
});

test('el turno usa casos existentes y el informe es honesto sobre su carácter académico', () => {
  assert.ok(TURNO.casos.every(id => CASOS[id]));
  const resultados = Object.fromEntries(TURNO.casos.map(id => { const r = respuestaModelo(CASOS[id]); return [id, { respuestas: r, evaluacion: evaluarCaso(CASOS[id], r) }]; }));
  const txt = informeTurno(resultados, new Date('2026-11-12'));
  assert.match(txt, /proyecto académico simulado/);
  assert.match(txt, /no experiencia laboral/);
  assert.match(txt, /Puntuación media: 100\/100/);
  for (const id of TURNO.casos) assert.ok(txt.includes(CASOS[id].ticket.numero));
});

test('las claves cortas cuentan solo como palabra completa', () => {
  const c = CASOS['impresora-etiquetas'];
  const r = respuestaModelo(c);
  r.notas['Causa'] = 'había un problema con el equipo del muelle';
  assert.equal(evaluarCaso(c, r).dims.documentacion, 75);
  r.notas['Causa'] = 'la impresora cambió de IP tras el corte';
  assert.equal(evaluarCaso(c, r).dims.documentacion, 100);
});
