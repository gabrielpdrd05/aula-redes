// Proyectos reales: la solución cumple todos los requisitos y pruebas; el estado inicial no; y las pruebas de
// extremo a extremo señalan el fallo concreto cuando falta una pieza.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROYECTOS, crearProyecto, ejecutarEn, restaurar, evaluar, informe } from '../js/proyectos/proyectos.js';

const resolver = (id, quitar = {}) => {
  const p = PROYECTOS[id];
  const hist = Object.fromEntries(Object.entries(p.solucion).map(([n, l]) => [n, l.filter(x => !(quitar[n] || []).includes(x))]));
  return restaurar(id, hist);
};
const fallo = t => t.pasos.find(x => !x.ok);

for (const id of Object.keys(PROYECTOS)) {
  test(`proyecto «${id}»: la solución lo completa y ningún comando da error`, () => {
    const p = PROYECTOS[id];
    const eqs = crearProyecto(id);
    for (const [n, lineas] of Object.entries(p.solucion)) for (const l of lineas) {
      const r = ejecutarEn(id, eqs, n, l);
      assert.doesNotMatch(r.salida, /^% (Invalid|Incomplete|Ambiguous)|Invalid input/m, `${n}: «${l}» → ${r.salida}`);
    }
    const ev = evaluar(id, eqs);
    ev.requisitos.forEach(r => assert.ok(r.ok, 'requisito sin cumplir: ' + r.texto));
    ev.pruebas.forEach(t => assert.ok(t.ok, `prueba «${t.texto}» falla en: ${fallo(t)?.texto} — ${fallo(t)?.detalle}`));
    assert.ok(ev.completo);
    assert.match(informe(id, eqs), /PROYECTO COMPLETADO/);
  });

  test(`proyecto «${id}»: al empezar no hay ningún requisito cumplido y las pruebas fallan`, () => {
    const ev = evaluar(id, crearProyecto(id));
    assert.equal(ev.cumplidos, 0, ev.requisitos.filter(r => r.ok).map(r => r.texto).join(' | '));
    assert.ok(ev.pruebas.every(t => !t.ok));
  });
}

test('oficina: el recorrido del PC señala exactamente la pieza que falta', () => {
  const casos = [
    [{ R1: ['ip nat outside'] }, 'ventas', /ip nat outside/],
    [{ R1: ['ip route 0.0.0.0 0.0.0.0 203.0.113.1'] }, 'ventas', /ip route 0\.0\.0\.0/],
    [{ R1: ['dns-server 8.8.8.8'] }, 'soporte', /DNS/],
    [{ R1: ['ip dhcp excluded-address 192.168.10.1 192.168.10.10'] }, 'ventas', /excluye/],
    [{ SW1: ['switchport trunk native vlan 99'] }, 'ssh', /nativa no coincide/],
    [{ SW1: ['switchport mode trunk'] }, 'ventas', /trunk/],
    [{ R1: ['access-list 1 permit 192.168.20.0 0.0.0.255'] }, 'soporte', /no permite la red 192\.168\.20\.0/],
    [{ SW1: ['transport input ssh'] }, 'ssh', /transport input ssh/],
  ];
  for (const [quitar, prueba, motivo] of casos) {
    const ev = evaluar('oficina', resolver('oficina', quitar));
    const t = ev.pruebas.find(x => x.id === prueba);
    assert.ok(!t.ok, `debería fallar ${prueba} sin ${JSON.stringify(quitar)}`);
    assert.match(fallo(t).detalle, motivo, `${JSON.stringify(quitar)} → ${fallo(t).detalle}`);
    assert.ok(!ev.completo);
  }
});

test('oficina: el PC de Ventas recibe la primera IP libre tras las excluidas y sale traducido', () => {
  const ev = evaluar('oficina', resolver('oficina'));
  const t = ev.pruebas.find(x => x.id === 'ventas');
  assert.ok(t.pasos.some(s => /192\.168\.10\.11 \(gateway 192\.168\.10\.1/.test(s.texto)));
  assert.ok(t.pasos.some(s => /192\.168\.10\.11 → 203\.0\.113\.2/.test(s.texto)));
});

test('oficina: el avance se puede reconstruir a partir del historial guardado', () => {
  const eqs = resolver('oficina');
  const hist = { SW1: eqs.SW1.historial, R1: eqs.R1.historial };
  const otra = restaurar('oficina', JSON.parse(JSON.stringify(hist)));
  assert.equal(evaluar('oficina', otra).cumplidos, evaluar('oficina', eqs).cumplidos);
});
