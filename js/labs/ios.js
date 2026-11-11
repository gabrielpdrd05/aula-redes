// Simulador de Cisco IOS para los laboratorios guiados. Motor puro (sin DOM): recibe líneas de comandos y devuelve
// la salida. Reproduce los modos de la CLI, las abreviaturas ("conf t", "sh ip int br"), los mensajes de error de IOS
// y un subconjunto realista de comandos de switch y router (VLAN, trunks, IP, rutas estáticas, OSPF, ACL, SSH,
// port security). No pretende ser un IOS completo: cubre lo que piden los laboratorios del CCNA.

// ---------------------------------------------------------------- utilidades IP
export const ipNum = s => { const p = String(s).split('.'); if (p.length !== 4 || !p.every(x => /^\d{1,3}$/.test(x) && +x < 256)) return null; return p.reduce((n, x) => n * 256 + +x, 0); };
export const ipStr = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join('.');
const esMascara = n => n != null && n >= 0 && n <= 2 ** 32 - 1 && Number.isInteger(Math.log2(2 ** 32 - n));
const prefijo = m => 32 - Math.log2(2 ** 32 - m);
const redDe = (ip, m) => ip - (ip % (2 ** 32 - m));
const enRed = (ip, net, m) => redDe(ip, m) === redDe(net, m);
const wcMatch = (ip, base, wc) => { for (let b = 31; b >= 0; b--) { const bit = 2 ** b; if (Math.floor(wc / bit) % 2 === 0 && Math.floor(ip / bit) % 2 !== Math.floor(base / bit) % 2) return false; } return true; };

// ---------------------------------------------------------------- nombres de interfaz
const TIPOS_IF = [['gigabitethernet', 'GigabitEthernet'], ['fastethernet', 'FastEthernet'], ['ethernet', 'Ethernet'], ['serial', 'Serial'], ['loopback', 'Loopback'], ['vlan', 'Vlan'], ['port-channel', 'Port-channel'], ['tengigabitethernet', 'TenGigabitEthernet']];
export function normalizarIf(txt) {
  const m = String(txt).toLowerCase().replace(/\s+/g, '').match(/^([a-z-]+)([\d/.]+)$/);
  if (!m) return null;
  const cand = TIPOS_IF.filter(([k]) => k.startsWith(m[1]));
  if (!cand.length) return null;
  const elegido = cand.length === 1 ? cand[0] : cand.find(([k]) => (m[1] === 'g' || m[1].startsWith('gi')) ? k === 'gigabitethernet' : (m[1] === 'f' || m[1].startsWith('fa')) ? k === 'fastethernet' : (m[1] === 'e' ? k === 'ethernet' : false));
  if (!elegido) return null;
  return elegido[1] + m[2];
}
const abreviar = n => n.replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa').replace('TenGigabitEthernet', 'Te').replace('Serial', 'Se').replace('Loopback', 'Lo').replace('Port-channel', 'Po');

// ---------------------------------------------------------------- gramática
// Patrones: palabras literales (admiten abreviatura), {a|b} alternativas, <nombre:tipo> parámetros y [..] opcionales.
const TIPOS = {
  word: t => t,
  num: t => (/^\d+$/.test(t) ? Number(t) : undefined),
  ip: t => (ipNum(t) != null ? t : undefined),
  rest: null, iface: null, ifrange: null,
};
function compilar(p) {
  const out = [];
  for (const raw of p.match(/\[[^\]]+\]|\{[^}]+\}|<[^>]+>|\S+/g)) {
    let opt = false, t = raw;
    if (t.startsWith('[')) { opt = true; t = t.slice(1, -1); }
    if (t.startsWith('{')) out.push({ k: 'alt', alts: t.slice(1, -1).split('|'), opt });
    else if (t.startsWith('<')) { const [name, type = 'word'] = t.slice(1, -1).split(':'); out.push({ k: 'param', name, type, opt }); }
    else out.push({ k: 'lit', v: t, opt });
  }
  return out;
}

function encajar(pat, toks) {
  const res = [];
  (function rec(pi, ti, args, exactos, lits) {
    if (pi === pat.length) { if (ti === toks.length) res.push({ args, exactos, lits }); else res.push({ sobra: ti }); return; }
    const p = pat[pi];
    if (p.opt) rec(pi + 1, ti, args, exactos, lits);
    if (ti >= toks.length) { if (!p.opt) res.push({ incompleto: true, ti }); return; }
    const t = toks[ti], tl = t.toLowerCase();
    if (p.k === 'lit') {
      if (p.v.startsWith(tl)) rec(pi + 1, ti + 1, args, exactos + (p.v === tl ? 1 : 0), [...lits, [ti, p.v]]);
      else res.push({ falla: ti });
    } else if (p.k === 'alt') {
      const m = p.alts.filter(a => a.startsWith(tl));
      if (!m.length) { res.push({ falla: ti }); return; }
      for (const a of m) rec(pi + 1, ti + 1, { ...args, [p.alts.join('|')]: a }, exactos + (a === tl ? 1 : 0), [...lits, [ti, a]]);
    } else if (p.type === 'rest') {
      rec(pi + 1, toks.length, { ...args, [p.name]: toks.slice(ti).join(' ') }, exactos, lits);
    } else if (p.type === 'iface') {
      for (const n of [2, 1]) {
        if (ti + n > toks.length) continue;
        const name = normalizarIf(toks.slice(ti, ti + n).join(''));
        if (name) rec(pi + 1, ti + n, { ...args, [p.name]: name }, exactos, lits);
      }
      if (!normalizarIf(t) && !(ti + 1 < toks.length && normalizarIf(t + toks[ti + 1]))) {
        if (/^[a-z-]+$/i.test(t) && ti + 1 >= toks.length) res.push({ incompleto: true, ti });
        else res.push({ falla: ti });
      }
    } else if (p.type === 'ifrange') {
      rec(pi + 1, toks.length, { ...args, [p.name]: toks.slice(ti).join(' ') }, exactos, lits);
    } else {
      const v = TIPOS[p.type](t);
      if (v === undefined) res.push({ falla: ti });
      else rec(pi + 1, ti + 1, { ...args, [p.name]: v }, exactos, lits);
    }
  })(0, 0, {}, 0, []);
  return res;
}

// ---------------------------------------------------------------- estado inicial
export function nuevoEquipo({ tipo = 'switch', hostname, interfaces, vecinos = [], hosts = [], estadoInicial } = {}) {
  const ifs = {};
  for (const i of interfaces) ifs[i.nombre] = { nombre: i.nombre, shutdown: i.shutdown ?? tipo === 'router', ip: i.ip || null, mask: i.mask || null, conectada: i.conectada ?? true, mode: tipo === 'switch' && !/^(Vlan|Loopback)/.test(i.nombre) ? 'dynamic auto' : null, accessVlan: 1, nativeVlan: 1, allowed: 'all', nonegotiate: false, description: '', ps: null, acl: {}, ospfArea: null, encap: null, portfast: false };
  const eq = {
    tipo, hostname: hostname || (tipo === 'switch' ? 'Switch' : 'Router'), modo: 'user', ctx: null,
    enableSecret: null, enablePassword: null, spe: false, banner: null, domain: null, domainLookup: true, rsa: 0, sshVersion: 1,
    users: {}, lines: { con: { password: null, login: false, local: false, timeout: null }, vty: { password: null, login: false, local: false, transport: 'all', timeout: null, accessClass: null } },
    vlans: tipo === 'switch' ? { 1: 'default' } : {}, ifs, rutas: [], ospf: null, acls: {}, ipRouting: tipo === 'router', ipv6Routing: false, defaultGateway: null,
    guardada: null, vecinos, hosts, historial: [], patrones: new Set(),
  };
  if (estadoInicial) estadoInicial(eq);
  eq.guardada = runningConfig(eq);
  return eq;
}

// ---------------------------------------------------------------- comandos por modo
const PRIV_SHOW = [
  ['show running-config', s => runningConfig(s)],
  ['show startup-config', s => s.guardada || 'startup-config is not present'],
  ['show ip interface brief', s => showIpIntBrief(s)],
  ['show interfaces trunk', s => showTrunk(s)],
  ['show vlan brief', s => showVlan(s)],
  ['show vlan', s => showVlan(s)],
  ['show ip route', s => showIpRoute(s)],
  ['show ip ospf neighbor', s => showOspfNeighbor(s)],
  ['show ip protocols', s => showIpProtocols(s)],
  ['show access-lists', s => showAcl(s)],
  ['show ip access-lists', s => showAcl(s)],
  ['show port-security interface <i:iface>', (s, a) => showPortSecurity(s, a.i)],
  ['show port-security', s => Object.values(s.ifs).filter(i => i.ps).map(i => showPortSecurity(s, i.nombre)).join('\n\n') || 'No hay puertos con port security.'],
  ['show ip ssh', s => (s.rsa ? `SSH Enabled - version ${s.sshVersion === 2 ? '2.0' : '1.99'}\nAuthentication timeout: 120 secs; Authentication retries: 3` : '%SSH has not been enabled')],
  ['show history', s => s.historial.slice(-20).map(h => '  ' + h).join('\n')],
  ['show clock', () => '*' + new Date().toUTCString()],
  ['show version', s => `Cisco IOS Software (simulador de Aula de Redes), ${s.tipo === 'switch' ? 'C2960' : 'ISR4321'}\n${s.hostname} uptime is 12 minutes\nConfiguration register is 0x2102`],
];
const PRIV = [
  ...PRIV_SHOW,
  ['configure terminal', s => { s.modo = 'config'; return 'Enter configuration commands, one per line.  End with CNTL/Z.'; }],
  ['copy running-config startup-config', s => { s.guardada = runningConfig(s); return 'Destination filename [startup-config]? \nBuilding configuration...\n[OK]'; }],
  ['write [memory]', s => { s.guardada = runningConfig(s); return 'Building configuration...\n[OK]'; }],
  ['disable', s => { s.modo = 'user'; }],
  ['exit', s => { s.modo = 'user'; return '\n(sesión cerrada; pulsa Intro para volver a entrar)'; }],
  ['ping <ip:ip>', (s, a) => ping(s, a.ip)],
  ['traceroute <ip:ip>', (s, a) => ping(s, a.ip, true)],
  ['reload', () => '% El simulador no reinicia el equipo. Usa copy running-config startup-config para guardar.'],
  ['clear ip ospf process', () => 'Reset ALL OSPF processes? [no]: yes'],
];
const USER = [
  ['enable', s => { s.modo = 'priv'; }],
  ['exit', () => '\n(sesión cerrada; pulsa Intro para volver a entrar)'],
  ['ping <ip:ip>', (s, a) => ping(s, a.ip)],
  ['show ip interface brief', s => showIpIntBrief(s)],
  ['show version', s => `Cisco IOS Software (simulador de Aula de Redes)\n${s.hostname} uptime is 12 minutes`],
];

const salirA = modo => s => { s.modo = modo; s.ctx = null; };
const COMUNES_CONFIG = [['exit', null], ['end', s => { s.modo = 'priv'; s.ctx = null; }]];

const CONFIG = [
  ['hostname <n:word>', (s, a) => { s.hostname = a.n; }],
  ['enable secret <p:rest>', (s, a) => { s.enableSecret = a.p.replace(/^[0589]\s+/, ''); }],
  ['enable password <p:rest>', (s, a) => { s.enablePassword = a.p; }],
  ['no enable password', s => { s.enablePassword = null; }],
  ['service password-encryption', s => { s.spe = true; }],
  ['no service password-encryption', s => { s.spe = false; }],
  ['banner motd <t:rest>', (s, a) => { const d = a.t[0]; const fin = a.t.indexOf(d, 1); if (fin < 0) return '% El delimitador debe abrir y cerrar el texto en la misma línea, por ejemplo: banner motd # Solo personal autorizado #'; s.banner = a.t.slice(1, fin).trim(); }],
  ['ip domain-name <d:word>', (s, a) => { s.domain = a.d; }],
  ['ip domain name <d:word>', (s, a) => { s.domain = a.d; }],
  ['no ip domain-lookup', s => { s.domainLookup = false; }],
  ['no ip domain lookup', s => { s.domainLookup = false; }],
  ['crypto key generate rsa [general-keys] [modulus] [<m:num>]', (s, a) => {
    if (s.hostname === 'Switch' || s.hostname === 'Router') return '% Please define a hostname other than ' + s.hostname + '.';
    if (!s.domain) return '% Please define a domain-name first.';
    const bits = a.m || 512;
    if (bits < 360 || bits > 4096) return '% Modulus must be between 360 and 4096.';
    s.rsa = bits;
    return `The name for the keys will be: ${s.hostname}.${s.domain}\n\n% The key modulus size is ${bits} bits\n% Generating ${bits} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)` + (a.m ? '' : '\n(Sin "modulus" IOS preguntaría el tamaño; el simulador usa 512, que es insuficiente para SSHv2. Usa: crypto key generate rsa modulus 2048)');
  }],
  ['ip ssh version <v:num>', (s, a) => { if (s.rsa && s.rsa < 768 && a.v === 2) return '% Please create RSA keys (of atleast 768 bits size) to enable SSH v2.'; s.sshVersion = a.v; }],
  ['username <u:word> [privilege] [<pr:num>] [algorithm-type] [{scrypt|sha256|md5}] {secret|password} <p:rest>', (s, a) => { s.users[a.u] = { privilege: a.pr ?? 1, secret: a['secret|password'] === 'secret', pass: a.p.replace(/^[0589]\s+/, ''), alg: a['scrypt|sha256|md5'] || null }; }],
  ['line console <n:num>', s => { s.modo = 'line'; s.ctx = 'con'; }],
  ['line vty <a:num> <b:num>', s => { s.modo = 'line'; s.ctx = 'vty'; }],
  ['vlan <v:num>', (s, a) => { if (a.v < 1 || a.v > 4094) return '% Bad VLAN list'; if (!s.vlans[a.v]) s.vlans[a.v] = 'VLAN' + String(a.v).padStart(4, '0'); s.modo = 'vlan'; s.ctx = a.v; }],
  ['no vlan <v:num>', (s, a) => { if (a.v === 1) return '%Default VLAN 1 may not be deleted.'; delete s.vlans[a.v]; }],
  ['interface range <r:ifrange>', (s, a) => { const l = expandirRango(s, a.r); if (typeof l === 'string') return l; s.modo = 'if'; s.ctx = l; s.rango = true; }],
  ['interface <i:iface>', (s, a) => entrarInterfaz(s, a.i)],
  ['ip route <n:ip> <m:ip> <h:word> [<x:word>] [<ad:num>]', (s, a) => rutaEstatica(s, a)],
  ['no ip route <n:ip> <m:ip> <h:word> [<x:word>] [<ad:num>]', (s, a) => { s.rutas = s.rutas.filter(r => !(r.net === a.n && r.mask === a.m)); }],
  ['ip default-gateway <g:ip>', (s, a) => { s.defaultGateway = a.g; }],
  ['ip routing', s => { s.ipRouting = true; }],
  ['no ip routing', s => { s.ipRouting = false; }],
  ['ipv6 unicast-routing', s => { s.ipv6Routing = true; }],
  ['router ospf <p:num>', (s, a) => { if (!s.ospf) s.ospf = { pid: a.p, rid: null, redes: [], pasivas: new Set(), defaultOriginate: false }; else if (s.ospf.pid !== a.p) return '% Este simulador admite un único proceso OSPF (ya existe el ' + s.ospf.pid + ').'; s.modo = 'router'; }],
  ['no router ospf <p:num>', s => { s.ospf = null; }],
  ['access-list <n:num> {permit|deny|remark} <r:rest>', (s, a) => aclNumerada(s, a)],
  ['no access-list <n:num>', (s, a) => { delete s.acls[String(a.n)]; }],
  ['ip access-list {standard|extended} <n:word>', (s, a) => { const t = a['standard|extended']; if (!s.acls[a.n]) s.acls[a.n] = { tipo: t === 'standard' ? 'std' : 'ext', nombre: true, reglas: [] }; s.modo = t === 'standard' ? 'acl-std' : 'acl-ext'; s.ctx = a.n; }],
  ['spanning-tree mode {pvst|rapid-pvst|mst}', (s, a) => { s.stpMode = a['pvst|rapid-pvst|mst']; }],
  ['spanning-tree portfast default', s => { s.portfastDefault = true; }],
  ['cdp run', () => {}], ['no cdp run', () => {}], ['lldp run', () => {}],
  ['ntp server <ip:ip>', () => {}],
  ['logging host <ip:ip>', () => {}],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ...COMUNES_CONFIG.map(([p, f]) => [p, f || salirA('priv')]),
];

const IF = [
  ['ip address <ip:ip> <m:ip>', (s, a) => paraCada(s, i => {
    if (i.nombre.startsWith('Vlan') || s.tipo === 'router' || i.routed) {
      if (!esMascara(ipNum(a.m))) return '% Bad mask ' + a.m;
      const ip = ipNum(a.ip), m = ipNum(a.m);
      if (prefijo(m) < 31 && (ip === redDe(ip, m) || ip === redDe(ip, m) + 2 ** (32 - prefijo(m)) - 1)) return '% Bad mask /' + prefijo(m) + ' for address ' + a.ip;
      for (const o of Object.values(s.ifs)) if (o !== i && o.ip && enRed(ip, ipNum(o.ip), Math.min(m, ipNum(o.mask)))) return `% ${a.ip} overlaps with ${abreviar(o.nombre)}`;
      i.ip = a.ip; i.mask = a.m;
    } else return '% Esta interfaz es de capa 2: en un switch, la IP de gestión se configura en una SVI (interface vlan X).';
  })],
  ['no ip address', s => paraCada(s, i => { i.ip = null; i.mask = null; })],
  ['shutdown', s => paraCada(s, i => { i.shutdown = true; return null; }) || logEstado(s, false)],
  ['no shutdown', s => { const r = paraCada(s, i => { i.shutdown = false; }); return r || logEstado(s, true); }],
  ['description <d:rest>', (s, a) => paraCada(s, i => { i.description = a.d; })],
  ['switchport mode {access|trunk}', (s, a) => paraCada(s, i => (l2(s, i) || (i.mode = a['access|trunk'], null)))],
  ['switchport mode dynamic {auto|desirable}', (s, a) => paraCada(s, i => (l2(s, i) || (i.mode = 'dynamic ' + a['auto|desirable'], null)))],
  ['switchport access vlan <v:num>', (s, a) => paraCada(s, i => { const e = l2(s, i); if (e) return e; i.accessVlan = a.v; if (!s.vlans[a.v]) { s.vlans[a.v] = 'VLAN' + String(a.v).padStart(4, '0'); return `% Access VLAN does not exist. Creating vlan ${a.v}`; } })],
  ['switchport voice vlan <v:num>', (s, a) => paraCada(s, i => { i.voiceVlan = a.v; })],
  ['switchport trunk native vlan <v:num>', (s, a) => paraCada(s, i => { i.nativeVlan = a.v; })],
  ['switchport trunk allowed vlan <l:rest>', (s, a) => paraCada(s, i => vlanPermitidas(i, a.l))],
  ['switchport trunk encapsulation {dot1q|isl|negotiate}', () => {}],
  ['switchport nonegotiate', s => paraCada(s, i => { if (i.mode && i.mode.startsWith('dynamic')) return '% Conflict between \'nonegotiate\' and \'dynamic\' status.'; i.nonegotiate = true; })],
  ['switchport port-security', s => paraCada(s, i => { if (i.mode !== 'access' && i.mode !== 'trunk') return 'Command rejected: ' + i.nombre + ' is a dynamic port.'; i.ps = i.ps || { max: 1, sticky: false, violation: 'shutdown', macs: [] }; })],
  ['switchport port-security maximum <n:num>', (s, a) => paraCada(s, i => { i.ps = i.ps || { max: 1, sticky: false, violation: 'shutdown', macs: [], off: true }; i.ps.max = a.n; })],
  ['switchport port-security mac-address sticky', s => paraCada(s, i => { i.ps = i.ps || { max: 1, sticky: false, violation: 'shutdown', macs: [], off: true }; i.ps.sticky = true; })],
  ['switchport port-security violation {shutdown|restrict|protect}', (s, a) => paraCada(s, i => { i.ps = i.ps || { max: 1, sticky: false, violation: 'shutdown', macs: [], off: true }; i.ps.violation = a['shutdown|restrict|protect']; })],
  ['no switchport', s => paraCada(s, i => { if (s.tipo !== 'switch') return; i.routed = true; i.mode = null; })],
  ['switchport', s => paraCada(s, i => { i.routed = false; i.mode = 'dynamic auto'; })],
  ['spanning-tree portfast', s => paraCada(s, i => { i.portfast = true; })],
  ['spanning-tree bpduguard enable', s => paraCada(s, i => { i.bpduguard = true; })],
  ['ip access-group <n:word> {in|out}', (s, a) => paraCada(s, i => { i.acl[a['in|out']] = a.n; })],
  ['no ip access-group <n:word> {in|out}', (s, a) => paraCada(s, i => { delete i.acl[a['in|out']]; })],
  ['encapsulation dot1q <v:num> [native]', (s, a) => paraCada(s, i => { if (!i.nombre.includes('.')) return '% Configuring IEEE 802.1Q encapsulation is not permitted on the main interface.'; i.encap = a.v; })],
  ['ip ospf <p:num> area <a:num>', (s, a) => paraCada(s, i => { i.ospfArea = a.a; if (!s.ospf) s.ospf = { pid: a.p, rid: null, redes: [], pasivas: new Set(), defaultOriginate: false }; })],
  ['ip ospf network point-to-point', s => paraCada(s, i => { i.p2p = true; })],
  ['ip ospf priority <n:num>', () => {}],
  ['interface <i:iface>', (s, a) => entrarInterfaz(s, a.i)],
  ['interface range <r:ifrange>', (s, a) => { const l = expandirRango(s, a.r); if (typeof l === 'string') return l; s.ctx = l; s.rango = true; }],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ['exit', salirA('config')],
  ['end', s => { s.modo = 'priv'; s.ctx = null; }],
];

const LINE = [
  ['password <p:rest>', (s, a) => { s.lines[s.ctx].password = a.p; }],
  ['login', s => { s.lines[s.ctx].login = true; s.lines[s.ctx].local = false; if (!s.lines[s.ctx].password) return '% Login disabled on line, until \'password\' is set'; }],
  ['login local', s => { s.lines[s.ctx].local = true; s.lines[s.ctx].login = false; }],
  ['no login', s => { s.lines[s.ctx].login = false; s.lines[s.ctx].local = false; }],
  ['transport input {ssh|telnet|all|none} [{ssh|telnet}]', (s, a) => { const v = [a['ssh|telnet|all|none'], a['ssh|telnet']].filter(Boolean); s.lines[s.ctx].transport = v.length === 2 ? 'telnet ssh' : v[0]; }],
  ['exec-timeout <m:num> [<sec:num>]', (s, a) => { s.lines[s.ctx].timeout = [a.m, a.sec || 0]; }],
  ['access-class <n:word> in', (s, a) => { s.lines[s.ctx].accessClass = a.n; }],
  ['logging synchronous', () => {}],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ['exit', salirA('config')], ['end', s => { s.modo = 'priv'; s.ctx = null; }],
];
const VLAN = [
  ['name <n:word>', (s, a) => { s.vlans[s.ctx] = a.n; }],
  ['vlan <v:num>', (s, a) => { if (!s.vlans[a.v]) s.vlans[a.v] = 'VLAN' + String(a.v).padStart(4, '0'); s.ctx = a.v; }],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ['exit', salirA('config')], ['end', s => { s.modo = 'priv'; s.ctx = null; }],
];
const ROUTER = [
  ['router-id <r:ip>', (s, a) => { s.ospf.rid = a.r; }],
  ['network <n:ip> <w:ip> area <a:num>', (s, a) => { s.ospf.redes.push({ net: a.n, wc: a.w, area: a.a }); }],
  ['no network <n:ip> <w:ip> area <a:num>', (s, a) => { s.ospf.redes = s.ospf.redes.filter(r => !(r.net === a.n && r.wc === a.w)); }],
  ['passive-interface <i:iface>', (s, a) => { if (!s.ifs[a.i]) return '% Interface ' + a.i + ' no existe en este equipo.'; s.ospf.pasivas.add(a.i); }],
  ['passive-interface default', s => { s.ospf.pasivasDefault = true; }],
  ['no passive-interface <i:iface>', (s, a) => { s.ospf.pasivas.delete(a.i); }],
  ['default-information originate', s => { s.ospf.defaultOriginate = true; }],
  ['auto-cost reference-bandwidth <b:num>', (s, a) => { s.ospf.refBw = a.b; }],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ['exit', salirA('config')], ['end', s => { s.modo = 'priv'; s.ctx = null; }],
];
const ACL_STD = [
  ['[<seq:num>] {permit|deny} <r:rest>', (s, a) => reglaAcl(s, s.ctx, a['permit|deny'], a.r, a.seq)],
  ['remark <r:rest>', () => {}],
  ['no <seq:num>', (s, a) => { s.acls[s.ctx].reglas = s.acls[s.ctx].reglas.filter(r => r.seq !== a.seq); }],
  ['do <c:rest>', (s, a) => ejecutarEnModo(s, 'priv', a.c)],
  ['exit', salirA('config')], ['end', s => { s.modo = 'priv'; s.ctx = null; }],
];

const MODOS = { user: USER, priv: PRIV, config: CONFIG, if: IF, line: LINE, vlan: VLAN, router: ROUTER, 'acl-std': ACL_STD, 'acl-ext': ACL_STD };
const COMPILADOS = Object.fromEntries(Object.entries(MODOS).map(([m, l]) => [m, l.map(([p, f]) => ({ p, pat: compilar(p), f }))]));

// ---------------------------------------------------------------- ayudantes de configuración
function entrarInterfaz(s, nombre) {
  if (!s.ifs[nombre]) {
    const base = nombre.split('.')[0];
    if (/^(Vlan|Loopback)\d+$/.test(nombre) || (nombre.includes('.') && s.ifs[base])) {
      s.ifs[nombre] = { nombre, shutdown: false, ip: null, mask: null, conectada: !nombre.includes('.') || !s.ifs[base].shutdown, mode: null, accessVlan: 1, nativeVlan: 1, allowed: 'all', acl: {}, description: '', ps: null, virtual: true };
    } else return `% Invalid input detected: ${nombre} no existe en este equipo. Interfaces disponibles: ${Object.keys(s.ifs).filter(n => !s.ifs[n].virtual).map(abreviar).join(', ')}`;
  }
  s.modo = 'if'; s.ctx = [nombre]; s.rango = nombre.includes('.');
}
function expandirRango(s, txt) {
  const out = [];
  for (const parte of txt.split(',')) {
    const m = parte.replace(/\s+/g, '').match(/^([a-z-]+)([\d/]*\/)(\d+)(?:-(\d+))?$/i);
    if (!m) return '% Rango de interfaces no válido. Ejemplo: interface range fa0/1 - 5';
    const base = normalizarIf(m[1] + m[2] + m[3]);
    if (!base) return '% Tipo de interfaz desconocido.';
    const prefijoNombre = base.slice(0, base.length - m[3].length);
    for (let n = +m[3]; n <= +(m[4] ?? m[3]); n++) {
      const nombre = prefijoNombre + n;
      if (!s.ifs[nombre]) return `% ${nombre} no existe en este equipo.`;
      out.push(nombre);
    }
  }
  return out;
}
function paraCada(s, fn) { const msgs = s.ctx.map(n => fn(s.ifs[n])).filter(Boolean); return msgs.length ? [...new Set(msgs)].join('\n') : undefined; }
function l2(s, i) { if (s.tipo !== 'switch' || i.virtual || i.routed) return '% Command rejected: ' + i.nombre + ' no es un puerto de capa 2 de switch.'; return null; }
function logEstado(s, up) {
  if (s.ctx.length !== 1 || !up) return;
  const i = s.ifs[s.ctx[0]];
  if (!i.conectada) return `%LINK-3-UPDOWN: Interface ${i.nombre}, changed state to down`;
  return `%LINK-3-UPDOWN: Interface ${i.nombre}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${i.nombre}, changed state to up`;
}
function vlanPermitidas(i, txt) {
  const t = txt.trim().toLowerCase();
  const parse = l => { const set = new Set(); for (const p of l.split(',')) { const [a, b] = p.split('-').map(Number); if (!a) return null; for (let v = a; v <= (b || a); v++) set.add(v); } return set; };
  if (t === 'all') { i.allowed = 'all'; return; }
  if (t === 'none') { i.allowed = new Set(); return; }
  const m = t.match(/^(add|remove|except)\s+(.+)$/);
  const lista = parse((m ? m[2] : t).replace(/\s+/g, ''));
  if (!lista) return '% Lista de VLAN no válida.';
  const actual = i.allowed === 'all' ? new Set(Array.from({ length: 4094 }, (_, k) => k + 1)) : new Set(i.allowed);
  if (!m) i.allowed = lista;
  else if (m[1] === 'add') { lista.forEach(v => actual.add(v)); i.allowed = actual; }
  else if (m[1] === 'remove') { lista.forEach(v => actual.delete(v)); i.allowed = actual; }
  else { const all = new Set(Array.from({ length: 4094 }, (_, k) => k + 1)); lista.forEach(v => all.delete(v)); i.allowed = all; }
}
function rutaEstatica(s, a) {
  const n = ipNum(a.n), m = ipNum(a.m);
  if (!esMascara(m) && m !== 0) return '% Inconsistent address and mask';
  if (redDe(n, m) !== n) return '%Inconsistent address and mask';
  let nh = null, iface = null, ad = a.ad || 1;
  if (ipNum(a.h) != null) { nh = a.h; if (a.x && /^\d+$/.test(a.x)) ad = +a.x; }
  else {
    iface = normalizarIf(a.h);
    if (!iface || !s.ifs[iface]) return '% Invalid input detected: interfaz o siguiente salto no válidos';
    if (a.x) { if (ipNum(a.x) != null) nh = a.x; else if (/^\d+$/.test(a.x)) ad = +a.x; }
  }
  s.rutas = s.rutas.filter(r => !(r.net === a.n && r.mask === a.m && r.nh === nh && r.iface === iface));
  s.rutas.push({ net: a.n, mask: a.m, nh, iface, ad });
}

// ---------------------------------------------------------------- ACL
function parseDir(toks, i) {
  const t = toks[i];
  if (!t) return null;
  if (t === 'any') return { d: { base: 0, wc: 2 ** 32 - 1, txt: 'any' }, i: i + 1 };
  if (t === 'host') { const ip = ipNum(toks[i + 1]); return ip == null ? null : { d: { base: ip, wc: 0, txt: 'host ' + toks[i + 1] }, i: i + 2 }; }
  const ip = ipNum(t);
  if (ip == null) return null;
  const wc = ipNum(toks[i + 1]);
  if (wc == null) return { d: { base: ip, wc: 0, txt: t }, i: i + 1 };
  return { d: { base: ip, wc, txt: wc === 0 ? t : `${t}, wildcard bits ${toks[i + 1]}` }, i: i + 2 };
}
const PUERTOS = { www: 80, http: 80, https: 443, ftp: 21, ssh: 22, telnet: 23, smtp: 25, domain: 53, tftp: 69, ntp: 123, snmp: 161, bootps: 67, bootpc: 68 };
function parsePuerto(toks, i) {
  const op = toks[i];
  if (!['eq', 'neq', 'lt', 'gt', 'range'].includes(op)) return { p: null, i };
  const v = t => (/^\d+$/.test(t) ? +t : PUERTOS[t]);
  if (op === 'range') { const a = v(toks[i + 1]), b = v(toks[i + 2]); if (a == null || b == null) return null; return { p: { op, a, b, txt: `range ${toks[i + 1]} ${toks[i + 2]}` }, i: i + 3 }; }
  const a = v(toks[i + 1]);
  if (a == null) return null;
  return { p: { op, a, txt: `${op} ${toks[i + 1]}` }, i: i + 2 };
}
function reglaAcl(s, nombre, accion, texto, seq) {
  const acl = s.acls[nombre];
  const toks = texto.trim().split(/\s+/);
  let regla;
  if (acl.tipo === 'std') {
    const o = parseDir(toks, 0);
    if (!o) return '% Invalid input detected: se esperaba any, host X o red + wildcard';
    regla = { accion, src: o.d, log: toks[o.i] === 'log' };
    if (o.d.wc !== 2 ** 32 - 1 && (o.d.base & ~o.d.wc) >>> 0 !== o.d.base) regla.src.base = (o.d.base & ~o.d.wc) >>> 0;
  } else {
    const proto = toks[0];
    if (!['ip', 'tcp', 'udp', 'icmp', 'ospf'].includes(proto)) return '% Protocolo no válido: usa ip, tcp, udp, icmp u ospf';
    let o = parseDir(toks, 1); if (!o) return '% Origen no válido';
    const src = o.d; let i = o.i, sp = null, dp = null;
    if (proto === 'tcp' || proto === 'udp') { const p = parsePuerto(toks, i); if (!p) return '% Puerto no válido'; sp = p.p; i = p.i; }
    o = parseDir(toks, i); if (!o) return '% Destino no válido';
    const dst = o.d; i = o.i;
    if (proto === 'tcp' || proto === 'udp') { const p = parsePuerto(toks, i); if (!p) return '% Puerto no válido'; dp = p.p; i = p.i; }
    regla = { accion, proto, src, dst, sp, dp, est: toks.includes('established'), log: toks.includes('log') };
  }
  const usados = acl.reglas.map(r => r.seq);
  regla.seq = seq || (usados.length ? Math.max(...usados) + 10 : 10);
  if (usados.includes(regla.seq)) return '% Duplicate sequence number';
  regla.texto = texto.trim();
  acl.reglas.push(regla);
  acl.reglas.sort((x, y) => x.seq - y.seq);
}
function aclNumerada(s, a) {
  const n = a.n;
  if (a['permit|deny|remark'] === 'remark') return;
  const tipo = (n >= 1 && n <= 99) || (n >= 1300 && n <= 1999) ? 'std' : (n >= 100 && n <= 199) || (n >= 2000 && n <= 2699) ? 'ext' : null;
  if (!tipo) return '% Número de ACL no válido: estándar 1-99 / 1300-1999, extendida 100-199 / 2000-2699';
  if (!s.acls[String(n)]) s.acls[String(n)] = { tipo, nombre: false, reglas: [] };
  return reglaAcl(s, String(n), a['permit|deny|remark'], a.r);
}
const puertoOk = (p, v) => !p || (p.op === 'eq' ? v === p.a : p.op === 'neq' ? v !== p.a : p.op === 'lt' ? v < p.a : p.op === 'gt' ? v > p.a : v >= p.a && v <= p.b);
// Evalúa una ACL con un paquete {src, dst, proto, dport}. Devuelve { accion, seq } (seq null = deny implícito).
export function evaluarAcl(s, nombre, pkt) {
  const acl = s.acls[nombre];
  if (!acl) return { accion: 'permit', seq: null, inexistente: true };
  const src = ipNum(pkt.src), dst = ipNum(pkt.dst);
  for (const r of acl.reglas) {
    if (!wcMatch(src, r.src.base, r.src.wc)) continue;
    if (acl.tipo === 'ext') {
      if (!wcMatch(dst, r.dst.base, r.dst.wc)) continue;
      if (r.proto !== 'ip' && r.proto !== (pkt.proto || 'ip')) continue;
      if (!puertoOk(r.dp, pkt.dport)) continue;
    }
    return { accion: r.accion, seq: r.seq };
  }
  return { accion: 'deny', seq: null };
}

// ---------------------------------------------------------------- estado operativo
const ifUp = (s, i) => {
  if (i.shutdown || !i.conectada) return false;
  if (i.nombre.startsWith('Vlan')) { const v = +i.nombre.slice(4); return !!s.vlans[v] && Object.values(s.ifs).some(p => !p.virtual && !p.shutdown && p.conectada && ((p.mode === 'access' || p.mode?.startsWith('dynamic')) ? p.accessVlan === v : p.mode === 'trunk')); }
  if (i.nombre.includes('.')) { const base = s.ifs[i.nombre.split('.')[0]]; return !!base && !base.shutdown && base.conectada; }
  return true;
};
export const interfazUp = (s, nombre) => !!s.ifs[nombre] && ifUp(s, s.ifs[nombre]);

function conectadas(s) {
  return Object.values(s.ifs).filter(i => i.ip && ifUp(s, i)).map(i => ({ i, net: redDe(ipNum(i.ip), ipNum(i.mask)), mask: ipNum(i.mask) }));
}
// Vecinos OSPF (simulados por el laboratorio) que han formado adyacencia.
export function vecinosOspf(s) {
  if (!s.ospf) return [];
  return s.vecinos.filter(v => {
    const i = s.ifs[v.interfaz];
    if (!i || !i.ip || !ifUp(s, i)) return false;
    if (!enRed(ipNum(v.ip), ipNum(i.ip), ipNum(i.mask))) return false;
    if (s.ospf.pasivas.has(i.nombre) || s.ospf.pasivasDefault) return false;
    const area = i.ospfArea ?? s.ospf.redes.find(r => wcMatch(ipNum(i.ip), ipNum(r.net), ipNum(r.wc)))?.area;
    return area != null && area === (v.area ?? 0);
  });
}
export function rutas(s) {
  const out = [];
  for (const c of conectadas(s)) {
    out.push({ cod: 'C', net: c.net, mask: c.mask, iface: c.i.nombre, ad: 0 });
    if (prefijo(c.mask) < 32) out.push({ cod: 'L', net: ipNum(c.i.ip), mask: 2 ** 32 - 1, iface: c.i.nombre, ad: 0 });
  }
  const resolver = (nh) => conectadas(s).find(c => enRed(ipNum(nh), c.net, c.mask));
  const candidatas = [];
  for (const r of s.rutas) {
    const via = r.nh ? resolver(r.nh) : null;
    const salida = r.iface ? s.ifs[r.iface] : via?.i;
    if (!salida || !ifUp(s, salida)) continue;
    if (r.nh && !via && !r.iface) continue;
    candidatas.push({ cod: r.net === '0.0.0.0' ? 'S*' : 'S', net: ipNum(r.net), mask: ipNum(r.mask), nh: r.nh, iface: salida.nombre, ad: r.ad, metric: 0 });
  }
  for (const v of vecinosOspf(s)) for (const n of v.redes || []) candidatas.push({ cod: 'O', net: ipNum(n.net), mask: ipNum(n.mask), nh: v.ip, iface: v.interfaz, ad: 110, metric: n.coste || 2 });
  // Por cada prefijo, gana la menor distancia administrativa.
  const porPrefijo = new Map();
  for (const c of candidatas) {
    const k = c.net + '/' + c.mask;
    if (out.some(o => o.net === c.net && o.mask === c.mask)) continue;
    const prev = porPrefijo.get(k);
    if (!prev || c.ad < prev.ad) porPrefijo.set(k, c);
  }
  return [...out, ...porPrefijo.values()];
}
export function buscarRuta(s, destino) {
  const d = ipNum(destino);
  let mejor = null;
  for (const r of rutas(s)) if (enRed(d, r.net, r.mask) && (!mejor || r.mask > mejor.mask)) mejor = r;
  return mejor;
}

function ping(s, destino, traza = false) {
  const d = ipNum(destino);
  const propias = Object.values(s.ifs).filter(i => i.ip && ifUp(s, i)).map(i => i.ip);
  let ok = propias.includes(destino);
  let motivo = '';
  if (!ok) {
    if (s.tipo === 'switch' && !s.ipRouting) {
      const svi = conectadas(s).find(c => enRed(d, c.net, c.mask));
      const gw = s.defaultGateway && conectadas(s).find(c => enRed(ipNum(s.defaultGateway), c.net, c.mask));
      ok = !!(svi && s.hosts.some(h => h.ip === destino)) || !!(gw && s.hosts.some(h => h.ip === destino && h.remoto));
    } else {
      const r = buscarRuta(s, destino);
      if (!r) motivo = 'sin ruta';
      else {
        const host = s.hosts.find(h => h.ip === destino);
        if (r.cod === 'C') ok = !!host && !host.remoto;
        else ok = !!host && host.remoto && (!host.via || host.via === (r.nh || ''));
        // Una ACL de salida en la interfaz puede bloquear el ping.
        const acl = s.ifs[r.iface]?.acl?.out;
        if (ok && acl && evaluarAcl(s, acl, { src: propias.find(ip => enRed(ipNum(ip), r.net, r.mask)) || propias[0], dst: destino, proto: 'icmp' }).accion === 'deny') { ok = false; motivo = 'acl'; }
      }
    }
  }
  if (traza) return `Type escape sequence to abort.\nTracing the route to ${destino}\n` + (ok ? `  1 ${destino} 1 msec 1 msec 1 msec` : '  1  *  *  *\n  2  *  *  *');
  const sym = ok ? '!!!!!' : motivo === 'sin ruta' ? '.....' : motivo === 'acl' ? 'U.U.U' : '.....';
  return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${destino}, timeout is 2 seconds:\n${sym}\nSuccess rate is ${ok ? 100 : 0} percent (${ok ? 5 : 0}/5)${ok ? ', round-trip min/avg/max = 1/1/2 ms' : ''}`;
}

// ---------------------------------------------------------------- salidas show
const pad = (t, n) => String(t).padEnd(n);
function showIpIntBrief(s) {
  const filas = Object.values(s.ifs).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en', { numeric: true })).map(i => {
    const up = ifUp(s, i);
    const status = i.shutdown ? 'administratively down' : up ? 'up' : 'down';
    return pad(i.nombre, 27) + pad(i.ip || 'unassigned', 16) + pad('YES', 4) + pad(i.ip ? 'manual' : 'unset', 7) + pad(status, 22) + (up ? 'up' : 'down');
  });
  return [pad('Interface', 27) + pad('IP-Address', 16) + 'OK? Method Status                Protocol', ...filas].join('\n');
}
function puertosVlan(s, v) { return Object.values(s.ifs).filter(i => !i.virtual && !i.routed && i.mode !== 'trunk' && i.accessVlan === v).map(i => abreviar(i.nombre)); }
function showVlan(s) {
  if (s.tipo !== 'switch') return '% Ambiguous command:  "show vlan"';
  const lines = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
  for (const v of Object.keys(s.vlans).map(Number).sort((a, b) => a - b)) {
    const ports = puertosVlan(s, v);
    const chunks = []; for (let k = 0; k < ports.length; k += 4) chunks.push(ports.slice(k, k + 4).join(', '));
    lines.push(pad(v, 5) + pad(s.vlans[v], 33) + pad('active', 10) + (chunks[0] || ''));
    chunks.slice(1).forEach(c => lines.push(' '.repeat(48) + c));
  }
  return lines.join('\n');
}
const listaVlans = set => { if (set === 'all') return '1-4094'; const a = [...set].sort((x, y) => x - y); const r = []; for (let k = 0; k < a.length; k++) { let j = k; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; r.push(j > k ? `${a[k]}-${a[j]}` : `${a[k]}`); k = j; } return r.join(',') || 'none'; };
function showTrunk(s) {
  const t = Object.values(s.ifs).filter(i => i.mode === 'trunk' && ifUp(s, i));
  if (!t.length) return '';
  return ['Port        Mode             Encapsulation  Status        Native vlan', ...t.map(i => pad(abreviar(i.nombre), 12) + pad('on', 17) + pad('802.1q', 15) + pad('trunking', 14) + i.nativeVlan), '',
    'Port        Vlans allowed on trunk', ...t.map(i => pad(abreviar(i.nombre), 12) + listaVlans(i.allowed)), '',
    'Port        Vlans allowed and active in management domain', ...t.map(i => pad(abreviar(i.nombre), 12) + listaVlans(new Set([...(i.allowed === 'all' ? Object.keys(s.vlans).map(Number) : i.allowed)].filter(v => s.vlans[v]))))].join('\n');
}
function showIpRoute(s) {
  const rs = rutas(s).sort((a, b) => a.net - b.net || a.mask - b.mask);
  const def = rs.find(r => r.cod === 'S*');
  const head = 'Codes: L - local, C - connected, S - static, O - OSPF, * - candidate default\n\nGateway of last resort is ' + (def ? `${def.nh || 'directly connected'} to network 0.0.0.0` : 'not set') + '\n';
  return head + '\n' + rs.map(r => {
    const p = ipStr(r.net) + '/' + prefijo(r.mask);
    if (r.cod === 'C' || r.cod === 'L') return `${pad(r.cod, 6)}${p} is directly connected, ${r.iface}`;
    return `${pad(r.cod, 6)}${p} [${r.ad}/${r.metric || 0}] via ${r.nh || r.iface}${r.cod === 'O' ? ', 00:00:12, ' + r.iface : ''}`;
  }).join('\n');
}
function rid(s) {
  if (s.ospf?.rid) return s.ospf.rid;
  const lo = Object.values(s.ifs).filter(i => i.nombre.startsWith('Loopback') && i.ip && !i.shutdown).map(i => ipNum(i.ip));
  const todas = lo.length ? lo : Object.values(s.ifs).filter(i => i.ip && ifUp(s, i)).map(i => ipNum(i.ip));
  return todas.length ? ipStr(Math.max(...todas)) : '0.0.0.0';
}
function showOspfNeighbor(s) {
  if (!s.ospf) return '';
  const v = vecinosOspf(s);
  return ['Neighbor ID     Pri   State           Dead Time   Address         Interface', ...v.map(n => pad(n.rid, 16) + pad(1, 6) + pad('FULL/' + (s.ifs[n.interfaz].p2p ? ' -' : 'DR'), 16) + pad('00:00:35', 12) + pad(n.ip, 16) + n.interfaz)].join('\n');
}
function showIpProtocols(s) {
  if (!s.ospf) return '*** IP Routing is NSF aware ***';
  return `Routing Protocol is "ospf ${s.ospf.pid}"\n  Router ID ${rid(s)}\n  Routing for Networks:\n${s.ospf.redes.map(r => `    ${r.net} ${r.wc} area ${r.area}`).join('\n')}\n  Passive Interface(s):\n${[...s.ospf.pasivas].map(p => '    ' + p).join('\n')}\n  Distance: (default is 110)`;
}
function showAcl(s) {
  return Object.entries(s.acls).map(([n, a]) => `${a.tipo === 'std' ? 'Standard' : 'Extended'} IP access list ${n}\n` + a.reglas.map(r => `    ${r.seq} ${r.accion} ${r.texto.replace(/^(\S+)\s+0\.0\.0\.0$/, 'host $1')}`).join('\n')).join('\n') || '';
}
function showPortSecurity(s, nombre) {
  const i = s.ifs[nombre];
  if (!i) return '% Interfaz no válida';
  if (!i.ps || i.ps.off) return `Port Security              : Disabled`;
  return `Port Security              : Enabled\nPort Status                : Secure-up\nViolation Mode             : ${i.ps.violation[0].toUpperCase() + i.ps.violation.slice(1)}\nAging Time                 : 0 mins\nMaximum MAC Addresses      : ${i.ps.max}\nTotal MAC Addresses        : ${i.ps.sticky ? 1 : 0}\nSticky MAC Addresses       : ${i.ps.sticky ? 1 : 0}\nSecurity Violation Count   : 0`;
}

export function runningConfig(s) {
  const L = ['Building configuration...', '', 'Current configuration:', '!', 'version 15.2', s.spe ? 'service password-encryption' : 'no service password-encryption', '!', `hostname ${s.hostname}`, '!'];
  if (s.enableSecret) L.push('enable secret 9 $9$' + hashFalso(s.enableSecret));
  if (s.enablePassword) L.push('enable password ' + (s.spe ? '7 ' + tipo7(s.enablePassword) : s.enablePassword));
  for (const [u, d] of Object.entries(s.users)) L.push(`username ${u}${d.privilege !== 1 ? ' privilege ' + d.privilege : ''} ${d.secret ? 'secret 9 $9$' + hashFalso(d.pass) : 'password ' + (s.spe ? '7 ' + tipo7(d.pass) : d.pass)}`);
  L.push('!');
  if (s.ipRouting && s.tipo === 'switch') L.push('ip routing');
  if (!s.domainLookup) L.push('no ip domain-lookup');
  if (s.domain) L.push('ip domain-name ' + s.domain);
  if (s.sshVersion === 2) L.push('ip ssh version 2');
  if (s.ipv6Routing) L.push('ipv6 unicast-routing');
  if (s.stpMode) L.push('spanning-tree mode ' + s.stpMode);
  L.push('!');
  for (const v of Object.keys(s.vlans).map(Number).filter(v => v !== 1).sort((a, b) => a - b)) L.push(`vlan ${v}`, ` name ${s.vlans[v]}`, '!');
  for (const i of Object.values(s.ifs).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en', { numeric: true }))) {
    L.push('interface ' + i.nombre);
    if (i.description) L.push(' description ' + i.description);
    if (i.encap) L.push(' encapsulation dot1Q ' + i.encap);
    if (i.routed) L.push(' no switchport');
    if (i.mode === 'access') { if (i.accessVlan !== 1) L.push(' switchport access vlan ' + i.accessVlan); L.push(' switchport mode access'); }
    if (i.voiceVlan) L.push(' switchport voice vlan ' + i.voiceVlan);
    if (i.mode === 'trunk') { if (i.nativeVlan !== 1) L.push(' switchport trunk native vlan ' + i.nativeVlan); if (i.allowed !== 'all') L.push(' switchport trunk allowed vlan ' + listaVlans(i.allowed)); L.push(' switchport mode trunk'); }
    if (i.mode === 'dynamic desirable') L.push(' switchport mode dynamic desirable');
    if (i.nonegotiate) L.push(' switchport nonegotiate');
    if (i.ps && !i.ps.off) { L.push(' switchport port-security'); if (i.ps.max !== 1) L.push(' switchport port-security maximum ' + i.ps.max); if (i.ps.violation !== 'shutdown') L.push(' switchport port-security violation ' + i.ps.violation); if (i.ps.sticky) L.push(' switchport port-security mac-address sticky'); }
    else if (i.ps) { if (i.ps.max !== 1) L.push(' switchport port-security maximum ' + i.ps.max); if (i.ps.sticky) L.push(' switchport port-security mac-address sticky'); if (i.ps.violation !== 'shutdown') L.push(' switchport port-security violation ' + i.ps.violation); }
    if (i.portfast) L.push(' spanning-tree portfast');
    if (i.bpduguard) L.push(' spanning-tree bpduguard enable');
    if (i.ip) L.push(` ip address ${i.ip} ${i.mask}`); else if (s.tipo === 'router' || i.virtual || i.routed) L.push(' no ip address');
    for (const d of ['in', 'out']) if (i.acl?.[d]) L.push(` ip access-group ${i.acl[d]} ${d}`);
    if (i.ospfArea != null) L.push(` ip ospf ${s.ospf?.pid || 1} area ${i.ospfArea}`);
    if (i.p2p) L.push(' ip ospf network point-to-point');
    if (i.shutdown) L.push(' shutdown');
    L.push('!');
  }
  if (s.ospf) {
    L.push('router ospf ' + s.ospf.pid);
    if (s.ospf.rid) L.push(' router-id ' + s.ospf.rid);
    if (s.ospf.refBw) L.push(' auto-cost reference-bandwidth ' + s.ospf.refBw);
    if (s.ospf.pasivasDefault) L.push(' passive-interface default');
    for (const p of s.ospf.pasivas) L.push(' passive-interface ' + p);
    for (const r of s.ospf.redes) L.push(` network ${r.net} ${r.wc} area ${r.area}`);
    if (s.ospf.defaultOriginate) L.push(' default-information originate');
    L.push('!');
  }
  if (s.defaultGateway) L.push('ip default-gateway ' + s.defaultGateway);
  for (const r of s.rutas) L.push(`ip route ${r.net} ${r.mask} ${[r.iface, r.nh].filter(Boolean).join(' ')}${r.ad !== 1 ? ' ' + r.ad : ''}`);
  for (const [n, a] of Object.entries(s.acls)) {
    if (a.nombre) { L.push(`ip access-list ${a.tipo === 'std' ? 'standard' : 'extended'} ${n}`); a.reglas.forEach(r => L.push(` ${r.seq} ${r.accion} ${r.texto}`)); }
    else a.reglas.forEach(r => L.push(`access-list ${n} ${r.accion} ${r.texto}`));
  }
  L.push('!');
  if (s.banner) L.push(`banner motd ^C${s.banner}^C`, '!');
  for (const [k, nombre] of [['con', 'line con 0'], ['vty', 'line vty 0 15']]) {
    const l = s.lines[k];
    L.push(nombre);
    if (l.accessClass) L.push(` access-class ${l.accessClass} in`);
    if (l.timeout) L.push(` exec-timeout ${l.timeout[0]} ${l.timeout[1]}`);
    if (l.password) L.push(' password ' + (s.spe ? '7 ' + tipo7(l.password) : l.password));
    if (l.local) L.push(' login local'); else if (l.login) L.push(' login');
    if (k === 'vty' && l.transport !== 'all') L.push(' transport input ' + l.transport);
  }
  L.push('!', 'end');
  return L.join('\n');
}
function hashFalso(t) { let h = 2166136261; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return 'mAp' + h.toString(36) + 'Fz/' + (h * 7).toString(36).slice(0, 8); }
function tipo7(t) { return [...t].map((c, k) => ((c.charCodeAt(0) ^ (k * 7 + 3)) & 255).toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 22); }

// ---------------------------------------------------------------- intérprete
export function prompt(s) {
  const suf = { user: '>', priv: '#', config: '(config)#', if: s.rango && s.ctx?.length > 1 ? '(config-if-range)#' : s.ctx?.[0]?.includes('.') ? '(config-subif)#' : '(config-if)#', line: '(config-line)#', vlan: '(config-vlan)#', router: '(config-router)#', 'acl-std': '(config-std-nacl)#', 'acl-ext': '(config-ext-nacl)#' }[s.modo];
  return s.hostname + suf;
}

function ejecutarEnModo(s, modo, linea) {
  const real = s.modo, ctx = s.ctx;
  s.modo = modo;
  const r = interpretar(s, linea, true);
  if (s.modo === modo) { s.modo = real; s.ctx = ctx; }
  return r;
}

function interpretar(s, linea, anidado = false) {
  const toks = linea.trim().split(/\s+/).filter(Boolean);
  const lista = COMPILADOS[s.modo];
  const ok = [], fallos = [];
  let incompleto = false;
  for (const c of lista) for (const r of encajar(c.pat, toks)) {
    if (r.args) ok.push({ c, ...r });
    else if (r.incompleto) incompleto = true;
    else fallos.push(r.falla ?? r.sobra ?? 0);
  }
  if (!ok.length) {
    if (incompleto && toks.length === 1) {
      const t = toks[0].toLowerCase();
      const primeras = new Set(lista.map(c => c.pat[0]).filter(p => p.k === 'lit' && p.v.startsWith(t)).map(p => p.v));
      if (primeras.size > 1) return `% Ambiguous command:  "${toks[0]}"`;
    }
    if (incompleto) return '% Incomplete command.';
    const pos = Math.max(0, ...fallos);
    const col = toks.slice(0, pos).join(' ').length + (pos ? 1 : 0);
    const enOtroModo = !anidado && s.modo !== 'priv' && s.modo !== 'user' && /^(show|sh|ping|copy|write|wr)\b/i.test(linea.trim());
    return ' '.repeat(prompt(s).length + col) + '^\n% Invalid input detected at \'^\' marker.' + (enOtroModo ? '\n(Pista: en modo configuración, antepón "do": do ' + linea.trim() + ')' : '');
  }
  // Elegir la interpretación: si varias, la que tenga más palabras exactas; si empatan con literales distintos, ambiguo.
  const max = Math.max(...ok.map(o => o.exactos));
  const mejores = ok.filter(o => o.exactos === max);
  const firmas = new Set(mejores.map(o => o.c.p + '|' + o.lits.map(l => l[1]).join(' ')));
  if (firmas.size > 1) {
    const distintos = new Set(mejores.map(o => o.c.p));
    if (distintos.size > 1 && !mejores.every(o => o.c === mejores[0].c)) {
      const primerToken = toks[mejores[0].lits.find(([ti]) => new Set(mejores.map(o => o.lits.find(l => l[0] === ti)?.[1])).size > 1)?.[0] ?? 0];
      return `% Ambiguous command:  "${primerToken || linea.trim()}"`;
    }
  }
  const elegido = mejores[0];
  s.patrones.add(elegido.c.p);
  return elegido.c.f(s, elegido.args) ?? '';
}

// Ejecuta una línea escrita por el alumno. Devuelve { salida, prompt }.
export function ejecutar(s, linea) {
  const limpia = linea.replace(/\t/g, ' ');
  if (!limpia.trim()) return { salida: '', prompt: prompt(s) };
  if (limpia.trim() === '?') return { salida: ayuda(s), prompt: prompt(s) };
  s.historial.push(limpia.trim());
  const salida = interpretar(s, limpia);
  return { salida, prompt: prompt(s) };
}

export function ayuda(s) {
  const vistos = new Map();
  for (const c of COMPILADOS[s.modo]) {
    const w = c.pat[0].k === 'lit' ? c.pat[0].v : c.pat[0].k === 'alt' ? c.pat[0].alts.join('/') : c.p.split(' ')[0];
    if (!vistos.has(w)) vistos.set(w, c.p);
  }
  return [...vistos.values()].map(p => '  ' + p.replace(/<(\w+):?(\w*)>/g, (m, n, t) => `<${t || 'texto'}>`)).join('\n');
}
