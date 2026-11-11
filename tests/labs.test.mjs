// Pruebas de la lógica de los laboratorios: cálculo IPv4/VLSM, simulador de IOS y ejercicios SQL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as ip from '../js/labs/ipv4.js';
import { nuevoEquipo, ejecutar, runningConfig } from '../js/labs/ios.js';
import { LABS } from '../js/labs/ios-labs.js';
import { ESQUEMA, DATOS } from '../js/labs/sql-datos.js';
import { EJERCICIOS } from '../js/labs/sql-ejercicios.js';
import { repartir } from '../js/quiz.js';

test('subred de 192.168.10.77/27', () => {
  const c = ip.calcular('192.168.10.77', 27);
  assert.equal(c.red, '192.168.10.64');
  assert.equal(c.broadcast, '192.168.10.95');
  assert.equal(c.primero, '192.168.10.65');
  assert.equal(c.ultimo, '192.168.10.94');
  assert.equal(c.hosts, 30);
  assert.equal(ip.calcular('10.0.0.300', 8), null);
});

test('máscaras y comodines', () => {
  assert.equal(ip.aTexto(ip.mascara(20)), '255.255.240.0');
  assert.equal(ip.aTexto(ip.wildcard(22)), '0.0.3.255');
  assert.equal(ip.prefijoDeMascara(ip.aEntero('255.255.255.252')), 30);
  assert.equal(ip.prefijoParaHosts(50), 26);
  assert.equal(ip.hostsUtiles(31), 2); // RFC 3021: enlaces punto a punto
});

test('los ejercicios aleatorios de subnetting son coherentes', () => {
  const rnd = ip.aleatorio(42);
  for (let i = 0; i < 500; i++) {
    const c = ip.generarEjercicio(['facil', 'normal', 'dificil'][i % 3], rnd);
    const n = ip.aEntero(c.ip), r = ip.aEntero(c.red);
    assert.ok(r <= n && n < r + ip.tamano(c.prefijo), JSON.stringify(c));
    assert.equal(r % ip.tamano(c.prefijo), 0);
    assert.equal(ip.explicar(c).length, 4);
  }
});

test('VLSM: la solución de referencia es válida y la detección de errores funciona', () => {
  const rnd = ip.aleatorio(7);
  for (let i = 0; i < 200; i++) {
    const g = ip.generarVlsm(rnd);
    const sol = ip.resolverVlsm(g.base, g.prefijo, g.necesidades);
    const errores = ip.validarVlsm(g.base, g.prefijo, g.necesidades, sol.map(x => `${x.red}/${x.prefijo}`));
    assert.equal(errores.filter(Boolean).length, 0, JSON.stringify({ g, errores }));
  }
  const nec = [{ nombre: 'A', hosts: 50 }, { nombre: 'B', hosts: 20 }];
  const e = ip.validarVlsm('192.168.1.0', 24, nec, ['192.168.1.0/26', '192.168.1.32/27']);
  assert.match(e[1], /solapa/);
});

for (const [id, lab] of Object.entries(LABS)) {
  test(`laboratorio IOS «${id}»: la solución completa todas las tareas`, () => {
    const s = nuevoEquipo(lab.equipo);
    assert.ok(!lab.tareas.every(t => t.ok(s, runningConfig)), 'no debe empezar resuelto');
    for (const linea of lab.solucion) {
      const r = ejecutar(s, linea);
      assert.ok(!/^% (Invalid|Incomplete|Ambiguous)/m.test(r.salida), `«${linea}» → ${r.salida}`);
    }
    lab.tareas.forEach(t => assert.ok(t.ok(s, runningConfig), 'tarea sin completar: ' + t.texto));
  });
}

test('IOS: errores y abreviaturas', () => {
  const s = nuevoEquipo({ tipo: 'switch', interfaces: [{ nombre: 'FastEthernet0/1' }] });
  assert.match(ejecutar(s, 'confgure terminal').salida, /%/);
  ejecutar(s, 'en'); ejecutar(s, 'conf t');
  assert.match(ejecutar(s, 'int fa0/1').prompt, /config-if/);
});

test('SQL: todas las soluciones se ejecutan sobre los datos de ejemplo', async () => {
  const require = createRequire(import.meta.url);
  const initSqlJs = require('../vendor/sql-wasm.js');
  const SQL = await initSqlJs({ locateFile: f => new URL('../vendor/' + f, import.meta.url).pathname });
  for (const [grupo, lista] of Object.entries(EJERCICIOS)) {
    for (const ej of lista) {
      const db = new SQL.Database();
      db.run(ESQUEMA); db.run(DATOS);
      const r = db.exec(ej.solucion);
      if (ej.verificar) assert.ok(db.exec(ej.verificar).length, `${grupo}: verificar sin filas`);
      else assert.ok(r.length && r[r.length - 1].values.length, `${grupo}: «${ej.enunciado}» no devuelve filas`);
      db.close();
    }
  }
});

test('reparto del simulacro según el peso de cada dominio', () => {
  const pesos = { m1: 20, m2: 20, m3: 25, m4: 10, m5: 15, m6: 10 };
  const disp = { m1: 72, m2: 47, m3: 38, m4: 35, m5: 37, m6: 23 };
  assert.deepEqual(repartir(100, pesos, disp), { m1: 20, m2: 20, m3: 25, m4: 10, m5: 15, m6: 10 });
  const c = repartir(20, pesos, disp);
  assert.equal(Object.values(c).reduce((a, b) => a + b), 20);
  const poco = repartir(50, pesos, { ...disp, m6: 2 });
  assert.equal(poco.m6, 2);
  assert.equal(Object.values(poco).reduce((a, b) => a + b), 50);
});
