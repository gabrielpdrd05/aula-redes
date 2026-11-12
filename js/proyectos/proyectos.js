// Proyectos reales: varios equipos conectados entre sí, requisitos por fases y pruebas de extremo a extremo
// que recorren el camino del tráfico salto a salto y dicen dónde se corta y por qué.
// Este módulo no toca el DOM: se puede probar en Node.
import { nuevoEquipo, ejecutar, runningConfig, ipNum, ipStr, interfazUp, modoOperativo, vlanPasa, buscarRuta, evaluarAcl, concesiones } from '../labs/ios.js';

const puertosSwitch = () => [...Array.from({ length: 24 }, (_, i) => ({ nombre: 'FastEthernet0/' + (i + 1) })), { nombre: 'GigabitEthernet0/1' }, { nombre: 'GigabitEthernet0/2' }];
const red = (ip, mask) => (ipNum(ip) & ipNum(mask)) >>> 0;
const enRed = (ip, net, mask) => red(ip, mask) === ipNum(net);
const rango = (a, b, pref = 'FastEthernet0/') => Array.from({ length: b - a + 1 }, (_, i) => pref + (a + i));
const ifc = (s, n) => s.ifs[n] || {};

// ================================================================ proyecto: la oficina central
const PCS = [
  { id: 'ventas1', nombre: 'PC de Ventas 1', puerto: 'FastEthernet0/2', vlan: 10, mac: '0050.56a1.1002' },
  { id: 'ventas2', nombre: 'PC de Ventas 2', puerto: 'FastEthernet0/3', vlan: 10, mac: '0050.56a1.1003' },
  { id: 'soporte', nombre: 'PC de Soporte', puerto: 'FastEthernet0/10', vlan: 20, mac: '0050.56a1.2010' },
];
const PLAN = {
  10: { nombre: 'VENTAS', red: '192.168.10.0', mask: '255.255.255.0', gw: '192.168.10.1', puertos: [1, 8] },
  20: { nombre: 'SOPORTE', red: '192.168.20.0', mask: '255.255.255.0', gw: '192.168.20.1', puertos: [9, 16] },
  99: { nombre: 'GESTION', red: '192.168.99.0', mask: '255.255.255.0', gw: '192.168.99.1' },
};
const subifDe = (r, v) => Object.values(r.ifs).find(i => i.nombre.startsWith('GigabitEthernet0/0.') && i.encap === v);
const reglaNat = r => r.nat.listas.find(n => n.iface === 'GigabitEthernet0/1');

// Mantiene coherentes los dos equipos: el cable SW1 Gi0/1 ↔ R1 Gi0/0 (enlace, trunk y CDP) y quién responde a quién.
function sincronizarOficina({ SW1: sw, R1: r }) {
  const g00 = r.ifs['GigabitEthernet0/0'], gi01 = sw.ifs['GigabitEthernet0/1'];
  gi01.conectada = !g00.shutdown;
  g00.conectada = !gi01.shutdown;
  const subifs = Object.values(r.ifs).filter(i => i.nombre.startsWith('GigabitEthernet0/0.') && i.encap);
  sw.vecinoL2['GigabitEthernet0/1'] = { nombre: r.hostname, puerto: 'GigabitEthernet0/0', mode: 'trunk', nonegotiate: true, native: subifs.find(i => i.encapNativa)?.encap ?? 1, allowed: subifs.map(i => i.encap), vlans: subifs.map(i => i.encap) };
  const enlace = !g00.shutdown && !gi01.shutdown;
  sw.cdp = enlace ? [{ id: r.hostname, local: 'GigabitEthernet0/1', remoto: 'Gig 0/0', capacidad: 'R S I', plataforma: 'ISR4321' }] : [];
  r.cdp = enlace ? [{ id: sw.hostname, local: 'GigabitEthernet0/0', remoto: 'Gig 0/1', capacidad: 'S I', plataforma: 'WS-C2960' }] : [];
  // El switch "ve" las puertas de enlace del router que le llegan por el trunk.
  sw.hosts = [...PCS.map(p => ({ ip: '0.0.0.' + p.puerto.split('/')[1], puerto: p.puerto, mac: p.mac })),
    ...subifs.filter(i => i.ip && interfazUp(r, i.nombre) && vlanPasa(sw, 'GigabitEthernet0/1', i.encap)).map(i => ({ ip: i.ip }))];
  // El router recibe las peticiones DHCP de los PC cuyo camino de capa 2 funciona.
  r.hosts = [{ ip: '203.0.113.1' }, { ip: '8.8.8.8', remoto: true },
    ...PCS.filter(p => caminoL2(sw, p).ok).flatMap(p => { const si = subifDe(r, p.vlan); return si ? [{ ip: '0.0.0.' + p.puerto.split('/')[1], dhcp: si.nombre, mac: p.mac }] : []; })];
  // El router alcanza la IP de gestión del switch si los dos están en la red de la VLAN 99 y la VLAN cruza el trunk.
  const s99 = subifDe(r, 99), v99 = sw.ifs.Vlan99;
  if (s99?.ip && v99?.ip && interfazUp(r, s99.nombre) && interfazUp(sw, 'Vlan99') && vlanPasa(sw, 'GigabitEthernet0/1', 99) && enRed(v99.ip, ipStr(red(s99.ip, s99.mask)), s99.mask)) r.hosts.push({ ip: v99.ip });
}

function caminoL2(sw, pc) {
  const p = sw.ifs[pc.puerto];
  if (p.shutdown) return { ok: false, motivo: `El puerto ${pc.puerto} está apagado (shutdown).` };
  if (p.mode !== 'access') return { ok: false, motivo: `${pc.puerto} no es un puerto de acceso estático (switchport mode access).` };
  if (p.accessVlan !== pc.vlan) return { ok: false, motivo: `${pc.puerto} está en la VLAN ${p.accessVlan}; este PC es de la VLAN ${pc.vlan}.` };
  if (!sw.vlans[pc.vlan]) return { ok: false, motivo: `La VLAN ${pc.vlan} no existe en SW1.` };
  if (!vlanPasa(sw, 'GigabitEthernet0/1', pc.vlan)) return { ok: false, motivo: motivoTrunk(sw, pc.vlan) };
  return { ok: true };
}
function motivoTrunk(sw, v) {
  const i = sw.ifs['GigabitEthernet0/1'];
  const r = sw.vecinoL2['GigabitEthernet0/1'];
  if (!i.conectada) return 'El enlace con R1 está caído: Gi0/0 del router está apagada.';
  if (i.shutdown) return 'Gi0/1 de SW1 está apagada.';
  if (modoOperativo(sw, i) !== 'trunk') return 'Gi0/1 de SW1 no está funcionando como trunk (el router no negocia DTP: hace falta switchport mode trunk).';
  if (i.allowed !== 'all' && !i.allowed.has(v)) return `La VLAN ${v} no está en la lista de VLAN permitidas del trunk de SW1.`;
  if (!r?.allowed?.includes(v)) return `R1 no tiene ninguna subinterfaz con encapsulation dot1q ${v}.`;
  if ((v === i.nativeVlan) !== (v === (r.native ?? 1))) return `La VLAN nativa no coincide: SW1 usa la ${i.nativeVlan} y R1 la ${r.native ?? 1} (la subinterfaz nativa lleva "native").`;
  return `La VLAN ${v} no pasa por el trunk.`;
}

// Recorre el camino de un PC hasta Internet. Devuelve los pasos con ok/detalle; se detiene en el primer fallo.
function trazarPC({ SW1: sw, R1: r }, pc) {
  const pasos = [];
  const paso = (texto, ok, detalle) => { pasos.push({ texto, ok, detalle }); return ok; };
  const P = PLAN[pc.vlan];
  const l2 = caminoL2(sw, pc);
  if (!paso(`${pc.nombre} conectado a ${pc.puerto.replace('FastEthernet', 'Fa')} en la VLAN ${pc.vlan} y su tráfico llega por el trunk a R1`, l2.ok, l2.motivo)) return pasos;
  const si = subifDe(r, pc.vlan);
  if (!paso(`R1 tiene una subinterfaz para la VLAN ${pc.vlan} con la puerta de enlace ${P.gw}`, !!si && si.ip === P.gw && si.mask === P.mask && interfazUp(r, si.nombre),
    !si ? `Falta una subinterfaz (p. ej. Gi0/0.${pc.vlan}) con encapsulation dot1q ${pc.vlan}.` : si.ip !== P.gw || si.mask !== P.mask ? `${si.nombre} tiene ${si.ip || 'sin IP'}${si.mask ? ' ' + si.mask : ''}; según el plan debe ser ${P.gw} ${P.mask}.` : 'La interfaz física Gi0/0 de R1 está apagada.')) return pasos;
  const lease = concesiones(r).find(c => c.host.mac === pc.mac);
  if (!paso(`${pc.nombre} obtiene IP por DHCP`, !!lease && lease.gw === P.gw, !lease ? `R1 no tiene un pool DHCP con network ${P.red} ${P.mask}.` : `El pool ${lease.pool} entrega como puerta de enlace ${lease.gw || '(ninguna)'}; debe ser ${P.gw} (default-router).`)) return pasos;
  pasos[pasos.length - 1].texto += `: ${lease.ip} (gateway ${lease.gw}${lease.dns?.length ? ', DNS ' + lease.dns.join(' ') : ''})`;
  if (!paso('El DHCP no reparte direcciones reservadas (.1 a .10)', ipNum(lease.ip) - ipNum(P.red) > 10, `Ha recibido ${lease.ip}: excluye de .1 a .10 con ip dhcp excluded-address.`)) return pasos;
  if (!paso('El PC tiene servidor DNS', lease.dns?.includes('8.8.8.8'), 'El pool no entrega el DNS 8.8.8.8 (dns-server): el PC no podría resolver nombres.')) return pasos;
  const ruta = buscarRuta(r, '8.8.8.8');
  if (!paso('R1 sabe salir a Internet (ruta por defecto hacia el ISP)', ruta?.cod === 'S*' && ruta.iface === 'GigabitEthernet0/1', !interfazUp(r, 'GigabitEthernet0/1') || ifc(r, 'GigabitEthernet0/1').ip !== '203.0.113.2' ? 'Gi0/1 de R1 no está activa con la IP 203.0.113.2/30.' : 'Falta ip route 0.0.0.0 0.0.0.0 203.0.113.1.')) return pasos;
  const n = reglaNat(r);
  const okNat = si.nat === 'inside' && ifc(r, 'GigabitEthernet0/1').nat === 'outside' && !!n && !!r.acls[n.lista] && evaluarAcl(r, n.lista, { src: lease.ip, dst: '8.8.8.8' }).accion === 'permit';
  if (!paso('R1 traduce la IP privada a la pública con PAT', okNat,
    si.nat !== 'inside' ? `${si.nombre} no está marcada como ip nat inside.` : ifc(r, 'GigabitEthernet0/1').nat !== 'outside' ? 'Gi0/1 no está marcada como ip nat outside.' : !n ? 'Falta ip nat inside source list <ACL> interface g0/1 overload.' : !r.acls[n.lista] ? `La ACL ${n.lista} usada por la NAT no existe.` : `La ACL ${n.lista} no permite la red ${P.red}.`)) return pasos;
  pasos[pasos.length - 1].texto += `: ${lease.ip} → 203.0.113.2`;
  paso('Internet (8.8.8.8) responde', true);
  return pasos;
}

function trazarSSH({ SW1: sw, R1: r }) {
  const pasos = [];
  const paso = (texto, ok, detalle) => { pasos.push({ texto, ok, detalle }); return ok; };
  const v99 = sw.ifs.Vlan99;
  if (!paso('SW1 tiene la IP de gestión 192.168.99.2/24 en la VLAN 99 y está activa', !!v99 && v99.ip === '192.168.99.2' && v99.mask === '255.255.255.0' && interfazUp(sw, 'Vlan99'),
    !v99 || !v99.ip ? 'Falta interface vlan 99 con ip address 192.168.99.2 255.255.255.0.' : v99.ip !== '192.168.99.2' || v99.mask !== '255.255.255.0' ? `La SVI tiene ${v99.ip} ${v99.mask}.` : 'La SVI está apagada (no shutdown) o no hay ningún puerto activo en la VLAN 99 (el trunk).')) return pasos;
  if (!paso('La VLAN 99 llega al router por el trunk', vlanPasa(sw, 'GigabitEthernet0/1', 99), motivoTrunk(sw, 99))) return pasos;
  const s99 = subifDe(r, 99);
  if (!paso('R1 es la puerta de enlace de gestión (192.168.99.1)', !!s99 && s99.ip === '192.168.99.1' && interfazUp(r, s99.nombre), 'Falta la subinterfaz de la VLAN 99 con 192.168.99.1/24.')) return pasos;
  if (!paso('SW1 usa 192.168.99.1 como puerta de enlace (para responder a otras redes)', sw.defaultGateway === '192.168.99.1', `ip default-gateway es ${sw.defaultGateway || '(sin configurar)'}.`)) return pasos;
  if (!paso('SSH activado en SW1 (dominio, claves RSA de 2048 bits, versión 2)', !!sw.domain && sw.rsa >= 2048 && sw.sshVersion === 2, !sw.domain ? 'Falta ip domain-name.' : sw.rsa < 2048 ? 'Faltan las claves: crypto key generate rsa modulus 2048.' : 'Falta ip ssh version 2.')) return pasos;
  const admin = Object.entries(sw.users).find(([, u]) => u.secret && u.privilege === 15);
  if (!paso('Existe un usuario local con privilegio 15 y contraseña cifrada (secret)', !!admin, 'Crea el usuario: username admin privilege 15 secret ...')) return pasos;
  const vty = sw.lines.vty;
  if (!paso('Las líneas vty piden usuario local y solo aceptan SSH', vty.local && vty.transport === 'ssh', !vty.local ? 'En line vty 0 15 falta login local.' : 'En line vty 0 15 falta transport input ssh (Telnet no debe estar permitido).')) return pasos;
  paso(`El administrador entra por SSH a 192.168.99.2 como ${admin[0]}`, true);
  return pasos;
}

const tieneVlan = (sw, v, nombre) => (sw.vlans[v] || '').toUpperCase() === nombre;
const exclusionOk = (r, v) => r.dhcp.excluidas.some(([a, b]) => ipNum(a) <= ipNum(PLAN[v].red) + 1 && ipNum(b) >= ipNum(PLAN[v].red) + 10);
const poolOk = (r, v) => Object.values(r.dhcp.pools).some(p => p.net === PLAN[v].red && p.mask === PLAN[v].mask && p.gw === PLAN[v].gw && p.dns.includes('8.8.8.8'));
const accesoEn = (sw, puertos, v) => puertos.every(n => sw.ifs[n].mode === 'access' && sw.ifs[n].accessVlan === v);

export const PROYECTOS = {
  oficina: {
    id: 'oficina', area: 'redes', nivel: 'intermedio', progreso: 'proy-oficina',
    titulo: 'Proyecto: la red de la oficina central',
    resumen: 'Diseña y configura desde cero la red de una oficina con dos departamentos: VLAN, trunk, enrutamiento entre VLAN, DHCP, salida a Internet con NAT y gestión segura por SSH.',
    historia: 'La empresa Distribuciones Caribe abre su oficina central. Te han entregado un switch (SW1) y un router (R1) recién sacados de la caja y el plan de direccionamiento del arquitecto de red. Ventas y Soporte deben estar separados en VLAN distintas, recibir IP automáticamente y salir a Internet por la única IP pública del proveedor. El switch debe poder administrarse de forma segura desde la red de gestión.',
    objetivos: ['Separar los departamentos en VLAN y asignar los puertos.', 'Unir switch y router con un trunk 802.1Q y enrutar entre VLAN (router-on-a-stick).', 'Repartir IP por DHCP y salir a Internet con NAT/PAT.', 'Administrar SW1 por SSH desde la VLAN de gestión y dejarlo todo guardado.'],
    plan: [
      ['VLAN 10 · VENTAS', '192.168.10.0/24', 'Gateway 192.168.10.1 · Fa0/1–Fa0/8 · DHCP desde .11'],
      ['VLAN 20 · SOPORTE', '192.168.20.0/24', 'Gateway 192.168.20.1 · Fa0/9–Fa0/16 · DHCP desde .11'],
      ['VLAN 99 · GESTION (nativa)', '192.168.99.0/24', 'R1 .1 · SW1 .2 (SVI) · solo por el trunk'],
      ['Trunk', 'SW1 Gi0/1 ↔ R1 Gi0/0', 'VLAN permitidas 10, 20 y 99 · nativa 99 · sin DTP'],
      ['Internet', '203.0.113.0/30', 'R1 Gi0/1 = .2 · proveedor (ISP) = .1 · DNS 8.8.8.8'],
      ['Puertos libres', 'Fa0/17–Fa0/24 y Gi0/2', 'Apagados (shutdown)'],
    ],
    topologia: { pcs: PCS },
    equipos: {
      SW1: () => nuevoEquipo({ tipo: 'switch', hostname: 'Switch', interfaces: puertosSwitch(), hosts: PCS.map(p => ({ ip: '0.0.0.' + p.puerto.split('/')[1], puerto: p.puerto, mac: p.mac })), soloConectados: true,
        vecinoL2: { 'GigabitEthernet0/1': { mode: 'trunk', nonegotiate: true, native: 1, allowed: [] } } }),
      R1: () => nuevoEquipo({ tipo: 'router', hostname: 'Router', interfaces: [{ nombre: 'GigabitEthernet0/0' }, { nombre: 'GigabitEthernet0/1' }, { nombre: 'GigabitEthernet0/2', conectada: false }], hosts: [{ ip: '203.0.113.1' }, { ip: '8.8.8.8', remoto: true }] }),
    },
    sincronizar: sincronizarOficina,
    fases: [
      { titulo: 'Fase 1 · VLAN y puertos de acceso', equipo: 'SW1',
        explicacion: 'Empieza por el switch: nombres de los equipos, las tres VLAN del plan y los puertos de cada departamento. Apaga los que no se usan.',
        pistas: ['vlan 10 → name VENTAS (y lo mismo con 20 y 99).', 'interface range fa0/1 - 8 → switchport mode access → switchport access vlan 10.', 'interface range fa0/17 - 24 → shutdown; y también interface g0/2 → shutdown.'],
        requisitos: [
          { id: 'nombres', texto: 'Los equipos se llaman SW1 y R1.', ok: e => e.SW1.hostname === 'SW1' && e.R1.hostname === 'R1', ayuda: 'hostname SW1 en el switch y hostname R1 en el router.' },
          { id: 'vlans', texto: 'Existen las VLAN 10 VENTAS, 20 SOPORTE y 99 GESTION.', ok: e => tieneVlan(e.SW1, 10, 'VENTAS') && tieneVlan(e.SW1, 20, 'SOPORTE') && tieneVlan(e.SW1, 99, 'GESTION'), ayuda: 'Crea cada VLAN y ponle el nombre del plan.' },
          { id: 'acceso10', texto: 'Fa0/1–Fa0/8 son puertos de acceso de la VLAN 10.', ok: e => accesoEn(e.SW1, rango(1, 8), 10), ayuda: 'interface range fa0/1 - 8 con switchport mode access y switchport access vlan 10.' },
          { id: 'acceso20', texto: 'Fa0/9–Fa0/16 son puertos de acceso de la VLAN 20.', ok: e => accesoEn(e.SW1, rango(9, 16), 20), ayuda: 'interface range fa0/9 - 16 …' },
          { id: 'libres', texto: 'Los puertos sin uso (Fa0/17–Fa0/24 y Gi0/2) están apagados.', ok: e => [...rango(17, 24), 'GigabitEthernet0/2'].every(n => e.SW1.ifs[n].shutdown), ayuda: 'Un puerto libre encendido es una puerta abierta para cualquiera que se conecte.' },
        ] },
      { titulo: 'Fase 2 · Trunk y enrutamiento entre VLAN', equipo: 'R1',
        explicacion: 'Une SW1 y R1 con un trunk 802.1Q. En el router, una subinterfaz por VLAN hace de puerta de enlace (router-on-a-stick).',
        pistas: ['En SW1: interface g0/1 → switchport mode trunk → switchport trunk native vlan 99 → switchport trunk allowed vlan 10,20,99 → switchport nonegotiate.', 'En R1: interface g0/0 → no shutdown (sin IP).', 'interface g0/0.10 → encapsulation dot1q 10 → ip address 192.168.10.1 255.255.255.0. Para la 99: encapsulation dot1q 99 native.'],
        requisitos: [
          { id: 'trunk', texto: 'SW1 Gi0/1 es un trunk estático sin DTP, con nativa 99 y solo las VLAN 10, 20 y 99.', ok: e => { const i = e.SW1.ifs['GigabitEthernet0/1']; return i.mode === 'trunk' && i.nonegotiate && i.nativeVlan === 99 && i.allowed instanceof Set && i.allowed.size === 3 && [10, 20, 99].every(v => i.allowed.has(v)) && !i.shutdown; }, ayuda: 'Revisa show interfaces trunk y show interfaces g0/1 switchport.' },
          { id: 'g00', texto: 'R1 Gi0/0 está activa y sin dirección IP (las IP van en las subinterfaces).', ok: e => !e.R1.ifs['GigabitEthernet0/0'].shutdown && !e.R1.ifs['GigabitEthernet0/0'].ip, ayuda: 'interface g0/0 → no shutdown.' },
          { id: 'subifs', texto: 'Subinterfaces de R1: VLAN 10 → .10.1, VLAN 20 → .20.1 y VLAN 99 (nativa) → .99.1, todas /24.', ok: e => [10, 20, 99].every(v => { const s = subifDe(e.R1, v); return s && s.ip === PLAN[v].gw && s.mask === PLAN[v].mask; }) && subifDe(e.R1, 99)?.encapNativa, ayuda: 'Primero encapsulation dot1q, después la IP. La de la 99 lleva la palabra native.' },
          { id: 'trunkok', texto: 'Las VLAN 10, 20 y 99 pasan de verdad por el trunk hasta R1.', ok: e => [10, 20, 99].every(v => vlanPasa(e.SW1, 'GigabitEthernet0/1', v)), ayuda: 'Si falla, mira la nativa en los dos extremos y que cada VLAN tenga su subinterfaz.' },
        ] },
      { titulo: 'Fase 3 · DHCP y salida a Internet', equipo: 'R1',
        explicacion: 'R1 reparte las direcciones de Ventas y Soporte, sale al proveedor con una ruta por defecto y traduce las IP privadas con PAT.',
        pistas: ['interface g0/1 → ip address 203.0.113.2 255.255.255.252 → no shutdown; y ip route 0.0.0.0 0.0.0.0 203.0.113.1.', 'ip dhcp excluded-address 192.168.10.1 192.168.10.10 → ip dhcp pool VENTAS → network, default-router, dns-server.', 'access-list 1 permit 192.168.10.0 0.0.0.255 (y la 20) → ip nat inside source list 1 interface g0/1 overload → ip nat inside en las subinterfaces 10 y 20, ip nat outside en g0/1.'],
        requisitos: [
          { id: 'wan', texto: 'Gi0/1 de R1 tiene 203.0.113.2/30 y hay ruta por defecto hacia 203.0.113.1.', ok: e => ifc(e.R1, 'GigabitEthernet0/1').ip === '203.0.113.2' && ifc(e.R1, 'GigabitEthernet0/1').mask === '255.255.255.252' && buscarRuta(e.R1, '8.8.8.8')?.nh === '203.0.113.1', ayuda: 'Comprueba show ip route: debe aparecer "Gateway of last resort is 203.0.113.1".' },
          { id: 'excl', texto: 'Las direcciones .1 a .10 de las VLAN 10 y 20 están excluidas del DHCP.', ok: e => exclusionOk(e.R1, 10) && exclusionOk(e.R1, 20), ayuda: 'ip dhcp excluded-address en configuración global (no dentro del pool).' },
          { id: 'pools', texto: 'Hay pools DHCP para 192.168.10.0/24 y 192.168.20.0/24 con su puerta de enlace y el DNS 8.8.8.8.', ok: e => poolOk(e.R1, 10) && poolOk(e.R1, 20), ayuda: 'Dentro de cada pool: network, default-router y dns-server.' },
          { id: 'nat', texto: 'PAT: subinterfaces 10 y 20 inside, Gi0/1 outside y la ACL de NAT permite las dos redes.', ok: e => { const n = reglaNat(e.R1); return ['10', '20'].every(v => subifDe(e.R1, +v)?.nat === 'inside') && ifc(e.R1, 'GigabitEthernet0/1').nat === 'outside' && !!n && !!e.R1.acls[n.lista] && [10, 20].every(v => evaluarAcl(e.R1, n.lista, { src: PLAN[v].gw.replace(/\.1$/, '.50'), dst: '8.8.8.8' }).accion === 'permit'); }, ayuda: 'Verifica con show ip nat translations después de configurar.' },
        ] },
      { titulo: 'Fase 4 · Gestión segura y guardar', equipo: 'SW1',
        explicacion: 'El switch debe poder administrarse por SSH desde la VLAN de gestión. Protege el modo privilegiado de los dos equipos y guarda las configuraciones.',
        pistas: ['interface vlan 99 → ip address 192.168.99.2 255.255.255.0 → no shutdown; ip default-gateway 192.168.99.1.', 'ip domain-name oficina.local → crypto key generate rsa modulus 2048 → ip ssh version 2 → username admin privilege 15 secret …', 'line vty 0 15 → login local → transport input ssh. Al final: copy running-config startup-config en los dos.'],
        requisitos: [
          { id: 'gestion', texto: 'SW1 tiene la IP 192.168.99.2/24 en la VLAN 99 y la puerta de enlace 192.168.99.1.', ok: e => ifc(e.SW1, 'Vlan99').ip === '192.168.99.2' && ifc(e.SW1, 'Vlan99').mask === '255.255.255.0' && interfazUp(e.SW1, 'Vlan99') && e.SW1.defaultGateway === '192.168.99.1', ayuda: 'La SVI necesita no shutdown y la VLAN 99 activa en el trunk.' },
          { id: 'ssh', texto: 'SSH v2 con claves de 2048 bits, usuario local de privilegio 15 y vty solo por SSH.', ok: e => { const s = e.SW1; return !!s.domain && s.rsa >= 2048 && s.sshVersion === 2 && Object.values(s.users).some(u => u.secret && u.privilege === 15) && s.lines.vty.local && s.lines.vty.transport === 'ssh'; }, ayuda: 'Comprueba con show ip ssh y show running-config.' },
          { id: 'secret', texto: 'Los dos equipos protegen el modo privilegiado con enable secret.', ok: e => !!e.SW1.enableSecret && !!e.R1.enableSecret, ayuda: 'enable secret, nunca enable password.' },
          { id: 'guardado', texto: 'Las configuraciones de los dos equipos están guardadas.', ok: e => ['SW1', 'R1'].every(n => e[n].guardada === runningConfig(e[n]) && e[n].guardada !== e[n].fabrica), ayuda: 'copy running-config startup-config (después del último cambio) en cada equipo.' },
        ] },
    ],
    pruebas: [
      { id: 'ventas', texto: 'El PC de Ventas navega por Internet', run: e => trazarPC(e, PCS[0]) },
      { id: 'soporte', texto: 'El PC de Soporte navega por Internet', run: e => trazarPC(e, PCS[2]) },
      { id: 'ssh', texto: 'El administrador entra por SSH a SW1', run: e => trazarSSH(e) },
    ],
    solucion: {
      SW1: ['enable', 'configure terminal', 'hostname SW1', 'enable secret Cl4ve-SW1!', 'vlan 10', 'name VENTAS', 'vlan 20', 'name SOPORTE', 'vlan 99', 'name GESTION', 'exit',
        'interface range fa0/1 - 8', 'switchport mode access', 'switchport access vlan 10', 'interface range fa0/9 - 16', 'switchport mode access', 'switchport access vlan 20',
        'interface range fa0/17 - 24', 'shutdown', 'interface g0/2', 'shutdown',
        'interface g0/1', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99', 'switchport nonegotiate',
        'interface vlan 99', 'ip address 192.168.99.2 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 192.168.99.1',
        'ip domain-name oficina.local', 'crypto key generate rsa modulus 2048', 'ip ssh version 2', 'username admin privilege 15 secret Adm1n-Of1cina',
        'line vty 0 15', 'login local', 'transport input ssh', 'end', 'copy running-config startup-config'],
      R1: ['enable', 'configure terminal', 'hostname R1', 'enable secret Cl4ve-R1!', 'interface g0/0', 'no shutdown',
        'interface g0/0.10', 'encapsulation dot1q 10', 'ip address 192.168.10.1 255.255.255.0', 'ip nat inside',
        'interface g0/0.20', 'encapsulation dot1q 20', 'ip address 192.168.20.1 255.255.255.0', 'ip nat inside',
        'interface g0/0.99', 'encapsulation dot1q 99 native', 'ip address 192.168.99.1 255.255.255.0',
        'interface g0/1', 'ip address 203.0.113.2 255.255.255.252', 'ip nat outside', 'no shutdown', 'exit',
        'ip route 0.0.0.0 0.0.0.0 203.0.113.1',
        'ip dhcp excluded-address 192.168.10.1 192.168.10.10', 'ip dhcp excluded-address 192.168.20.1 192.168.20.10',
        'ip dhcp pool VENTAS', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1', 'dns-server 8.8.8.8', 'exit',
        'ip dhcp pool SOPORTE', 'network 192.168.20.0 255.255.255.0', 'default-router 192.168.20.1', 'dns-server 8.8.8.8', 'exit',
        'access-list 1 permit 192.168.10.0 0.0.0.255', 'access-list 1 permit 192.168.20.0 0.0.0.255', 'ip nat inside source list 1 interface g0/1 overload',
        'end', 'copy running-config startup-config'],
    },
  },
};

// ================================================================ motor común
export function crearProyecto(id) {
  const p = PROYECTOS[id];
  const eqs = Object.fromEntries(Object.entries(p.equipos).map(([n, f]) => [n, f()]));
  for (const e of Object.values(eqs)) e.fabrica = e.guardada;      // configuración de fábrica (sin guardar nada aún)
  p.sincronizar(eqs);
  return eqs;
}
// Ejecuta una línea en un equipo y vuelve a sincronizar la topología.
export function ejecutarEn(id, eqs, nombre, linea) {
  const r = ejecutar(eqs[nombre], linea);
  PROYECTOS[id].sincronizar(eqs);
  return r;
}
// Reconstruye el estado repitiendo los comandos guardados (el simulador es determinista).
export function restaurar(id, historiales = {}) {
  const eqs = crearProyecto(id);
  for (const [nombre, lineas] of Object.entries(historiales)) for (const l of lineas || []) if (eqs[nombre]) ejecutarEn(id, eqs, nombre, l);
  return eqs;
}
export function evaluar(id, eqs) {
  const p = PROYECTOS[id];
  const fases = p.fases.map(f => ({ ...f, resultados: f.requisitos.map(r => { let ok = false; try { ok = !!r.ok(eqs); } catch { ok = false; } return { ...r, ok }; }) }));
  const requisitos = fases.flatMap(f => f.resultados);
  const pruebas = p.pruebas.map(t => { const pasos = t.run(eqs); return { ...t, pasos, ok: pasos.length > 0 && pasos.every(x => x.ok) }; });
  const cumplidos = requisitos.filter(r => r.ok).length;
  return { fases, requisitos, pruebas, cumplidos, total: requisitos.length, completo: cumplidos === requisitos.length && pruebas.every(t => t.ok) };
}

// Informe de texto para guardar o entregar (requisitos, pruebas y configuración de cada equipo).
export function informe(id, eqs, fecha = new Date()) {
  const p = PROYECTOS[id];
  const ev = evaluar(id, eqs);
  const L = [`${p.titulo}`, `Informe generado el ${fecha.toLocaleString('es')} en Loopback`, '', `Requisitos cumplidos: ${ev.cumplidos}/${ev.total}${ev.completo ? ' — PROYECTO COMPLETADO' : ''}`, ''];
  for (const f of ev.fases) { L.push(f.titulo); for (const r of f.resultados) L.push(`  [${r.ok ? 'x' : ' '}] ${r.texto}`); L.push(''); }
  L.push('Pruebas de extremo a extremo');
  for (const t of ev.pruebas) { L.push(`  ${t.ok ? 'OK ' : 'NO '} ${t.texto}`); for (const s of t.pasos) L.push(`      ${s.ok ? '✓' : '✗'} ${s.texto}${!s.ok && s.detalle ? ' — ' + s.detalle : ''}`); }
  for (const [n, s] of Object.entries(eqs)) L.push('', '='.repeat(60), `${n}: show running-config`, '='.repeat(60), runningConfig(s));
  return L.join('\n');
}
