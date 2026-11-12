// Ejercicios de programación: la solución pasa todas las pruebas y el código inicial no las pasa todas.
// JavaScript se ejecuta directamente; Python, con el mismo Pyodide que usa la web (en Node).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { EJERCICIOS } from '../js/codigo/ejercicios.js';

const corrJs = (code, tests) => {
  const pruebas = tests.map((t, i) => `try { __r[${i}] = !!(${t.code}); } catch (e) { __r[${i}] = false; }`).join('\n');
  const consola = { log() {}, error() {}, warn() {}, info() {} };
  try { return new Function('console', '__r', '"use strict";\n' + code + '\n;' + pruebas + '\nreturn __r;')(consola, []); } catch { return tests.map(() => false); }
};

for (const [id, set] of Object.entries(EJERCICIOS).filter(([, s]) => s.lang === 'javascript' && !s.libre)) {
  test(`JavaScript «${id}»: soluciones correctas y enunciados no resueltos`, () => {
    for (const ej of set.ejercicios) {
      assert.ok(ej.tests.length && ej.pista && ej.enunciado, ej.enunciado);
      assert.ok(corrJs(ej.solucion, ej.tests).every(Boolean), 'la solución falla: ' + ej.enunciado);
      assert.ok(!corrJs(ej.inicial, ej.tests).every(Boolean), 'el código inicial ya pasa: ' + ej.enunciado);
    }
  });
}

test('Python: soluciones correctas y enunciados no resueltos (Pyodide)', async () => {
  const require = createRequire(import.meta.url);
  const { loadPyodide } = require('../vendor/pyodide/pyodide.js');
  const py = await loadPyodide({ indexURL: new URL('../vendor/pyodide/', import.meta.url).pathname, stdout: () => {} });
  const corr = (code, tests) => {
    const ns = py.globals.get('dict')();
    try { py.runPython(code, { globals: ns }); } catch { ns.destroy(); return tests.map(() => false); }
    const r = tests.map(t => { try { return !!py.runPython('bool(' + t.code + ')', { globals: ns }); } catch { return false; } });
    ns.destroy();
    return r;
  };
  for (const [id, set] of Object.entries(EJERCICIOS).filter(([, s]) => s.lang === 'python' && !s.libre)) {
    for (const ej of set.ejercicios) {
      assert.ok(corr(ej.solucion, ej.tests).every(Boolean), `${id}: la solución falla: ${ej.enunciado}`);
      assert.ok(!corr(ej.inicial, ej.tests).every(Boolean), `${id}: el código inicial ya pasa: ${ej.enunciado}`);
    }
  }
  // La zona libre de Python funciona tal cual.
  assert.doesNotThrow(() => py.runPython(EJERCICIOS['python-libre'].inicial));
});
