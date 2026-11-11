// Laboratorios guiados del simulador de IOS. Cada tarea se comprueba sobre el estado del equipo, no sobre el texto
// escrito: da igual si el alumno abrevia ("sw mode acc") o lo hace en otro orden, mientras el resultado sea correcto.
import { interfazUp, buscarRuta, vecinosOspf, evaluarAcl } from './ios.js';

const puertosSwitch = () => [...Array.from({ length: 24 }, (_, i) => ({ nombre: 'FastEthernet0/' + (i + 1) })), { nombre: 'GigabitEthernet0/1' }, { nombre: 'GigabitEthernet0/2' }];
const ifc = (s, n) => s.ifs[n] || {};

export const LABS = {
  basico: {
    titulo: 'Configuración inicial segura de un switch',
    intro: 'Acabas de sacar de la caja un switch Cisco 2960. Déjalo con la configuración básica que exige cualquier empresa.',
    equipo: { tipo: 'switch', interfaces: puertosSwitch() },
    tareas: [
      { texto: 'Entra en el modo EXEC privilegiado y después en el modo de configuración global.', ok: s => s.patrones.has('configure terminal') },
      { texto: 'Cambia el nombre del equipo a SW-OFICINA.', ok: s => s.hostname === 'SW-OFICINA' },
      { texto: 'Protege el modo privilegiado con una contraseña cifrada con enable secret.', ok: s => !!s.enableSecret },
      { texto: 'Activa el cifrado de las contraseñas que se guardan en texto plano (service password-encryption).', ok: s => s.spe },
      { texto: 'Configura un banner MOTD que avise de que el acceso es solo para personal autorizado.', ok: s => !!s.banner && s.banner.length >= 5 },
      { texto: 'En la línea de consola, pon una contraseña y exige que se pida al entrar (login).', ok: s => !!s.lines.con.password && s.lines.con.login },
      { texto: 'Haz que la sesión de consola se cierre tras 5 minutos de inactividad (exec-timeout).', ok: s => s.lines.con.timeout?.[0] === 5 },
      { texto: 'Guarda la configuración para que sobreviva a un reinicio.', ok: (s, run) => s.guardada === run(s) },
    ],
    solucion: ['enable', 'configure terminal', 'hostname SW-OFICINA', 'enable secret Cl4ve-Priv!', 'service password-encryption', 'banner motd # Acceso solo para personal autorizado #', 'line console 0', 'password C0nsola!', 'login', 'exec-timeout 5 0', 'end', 'copy running-config startup-config'],
  },

  vlan: {
    titulo: 'Crear VLAN y asignar puertos',
    intro: 'La oficina tiene dos departamentos. Ventas usa los puertos Fa0/1 a Fa0/10 y Soporte los puertos Fa0/11 a Fa0/15.',
    equipo: { tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), estadoInicial: s => { s.modo = 'priv'; } },
    tareas: [
      { texto: 'Crea la VLAN 10 con el nombre VENTAS.', ok: s => s.vlans[10] === 'VENTAS' },
      { texto: 'Crea la VLAN 20 con el nombre SOPORTE.', ok: s => s.vlans[20] === 'SOPORTE' },
      { texto: 'Configura Fa0/1 a Fa0/10 como puertos de acceso en la VLAN 10 (usa interface range).', ok: s => Array.from({ length: 10 }, (_, i) => ifc(s, 'FastEthernet0/' + (i + 1))).every(i => i.mode === 'access' && i.accessVlan === 10) },
      { texto: 'Configura Fa0/11 a Fa0/15 como puertos de acceso en la VLAN 20.', ok: s => Array.from({ length: 5 }, (_, i) => ifc(s, 'FastEthernet0/' + (i + 11))).every(i => i.mode === 'access' && i.accessVlan === 20) },
      { texto: 'Apaga los puertos que no se usan (Fa0/16 a Fa0/24) por seguridad.', ok: s => Array.from({ length: 9 }, (_, i) => ifc(s, 'FastEthernet0/' + (i + 16))).every(i => i.shutdown) },
      { texto: 'Comprueba el resultado con show vlan brief.', ok: s => s.patrones.has('show vlan brief') },
    ],
    solucion: ['configure terminal', 'vlan 10', 'name VENTAS', 'vlan 20', 'name SOPORTE', 'exit', 'interface range fa0/1 - 10', 'switchport mode access', 'switchport access vlan 10', 'interface range fa0/11 - 15', 'switchport mode access', 'switchport access vlan 20', 'interface range fa0/16 - 24', 'shutdown', 'end', 'show vlan brief'],
  },

  trunk: {
    titulo: 'Configurar un trunk 802.1Q seguro',
    intro: 'SW1 ya tiene las VLAN 10 y 20. El puerto Gi0/1 conecta con SW2 y debe transportar las dos VLAN. Por seguridad, la VLAN nativa será la 99, que no usa nadie.',
    equipo: { tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), estadoInicial: s => { s.modo = 'priv'; s.vlans[10] = 'VENTAS'; s.vlans[20] = 'SOPORTE'; } },
    tareas: [
      { texto: 'Crea la VLAN 99 con el nombre NATIVA.', ok: s => s.vlans[99] === 'NATIVA' },
      { texto: 'Pon Gi0/1 en modo trunk de forma estática.', ok: s => ifc(s, 'GigabitEthernet0/1').mode === 'trunk' },
      { texto: 'Cambia la VLAN nativa del trunk a la 99.', ok: s => ifc(s, 'GigabitEthernet0/1').nativeVlan === 99 },
      { texto: 'Permite en el trunk solo las VLAN 10, 20 y 99.', ok: s => { const a = ifc(s, 'GigabitEthernet0/1').allowed; return a instanceof Set && a.size === 3 && [10, 20, 99].every(v => a.has(v)); } },
      { texto: 'Desactiva la negociación DTP en ese puerto.', ok: s => ifc(s, 'GigabitEthernet0/1').nonegotiate },
      { texto: 'Verifica con show interfaces trunk.', ok: s => s.patrones.has('show interfaces trunk') },
    ],
    solucion: ['configure terminal', 'vlan 99', 'name NATIVA', 'exit', 'interface g0/1', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99', 'switchport nonegotiate', 'end', 'show interfaces trunk'],
  },

  estatica: {
    titulo: 'Direccionamiento y rutas estáticas',
    intro: 'R1 conecta la LAN 192.168.1.0/24 (Gi0/0) con R2 por Gi0/1 (10.0.12.0/30, R2 es .2) y con R3 por Gi0/2 (10.0.13.0/30, R3 es .2). Detrás de R2 está la LAN 192.168.2.0/24. Las interfaces están apagadas y sin IP.',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0' }, { nombre: 'GigabitEthernet0/1' }, { nombre: 'GigabitEthernet0/2' }],
      hosts: [{ ip: '192.168.1.10' }, { ip: '10.0.12.2' }, { ip: '10.0.13.2' }, { ip: '192.168.2.10', remoto: true }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Gi0/0: dirección 192.168.1.1/24 y actívala.', ok: s => ifc(s, 'GigabitEthernet0/0').ip === '192.168.1.1' && ifc(s, 'GigabitEthernet0/0').mask === '255.255.255.0' && interfazUp(s, 'GigabitEthernet0/0') },
      { texto: 'Gi0/1: dirección 10.0.12.1/30 y actívala.', ok: s => ifc(s, 'GigabitEthernet0/1').ip === '10.0.12.1' && ifc(s, 'GigabitEthernet0/1').mask === '255.255.255.252' && interfazUp(s, 'GigabitEthernet0/1') },
      { texto: 'Gi0/2: dirección 10.0.13.1/30 y actívala.', ok: s => ifc(s, 'GigabitEthernet0/2').ip === '10.0.13.1' && ifc(s, 'GigabitEthernet0/2').mask === '255.255.255.252' && interfazUp(s, 'GigabitEthernet0/2') },
      { texto: 'Crea una ruta estática a 192.168.2.0/24 a través de R2 (10.0.12.2).', ok: s => s.rutas.some(r => r.net === '192.168.2.0' && r.mask === '255.255.255.0' && r.nh === '10.0.12.2' && r.ad === 1) },
      { texto: 'Añade una ruta flotante de respaldo a 192.168.2.0/24 por R3 (10.0.13.2) con distancia administrativa 5.', ok: s => s.rutas.some(r => r.net === '192.168.2.0' && r.mask === '255.255.255.0' && r.nh === '10.0.13.2' && r.ad === 5) },
      { texto: 'Comprueba en la tabla de rutas que se usa la ruta por R2 (show ip route).', ok: s => s.patrones.has('show ip route') && buscarRuta(s, '192.168.2.10')?.nh === '10.0.12.2' },
      { texto: 'Haz ping a 192.168.2.10 con éxito.', ok: s => s.patrones.has('ping <ip:ip>') && s.historial.some(h => /^ping\s+192\.168\.2\.10$/i.test(h)) && buscarRuta(s, '192.168.2.10')?.cod === 'S' },
    ],
    solucion: ['configure terminal', 'interface g0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'interface g0/1', 'ip address 10.0.12.1 255.255.255.252', 'no shutdown', 'interface g0/2', 'ip address 10.0.13.1 255.255.255.252', 'no shutdown', 'exit', 'ip route 192.168.2.0 255.255.255.0 10.0.12.2', 'ip route 192.168.2.0 255.255.255.0 10.0.13.2 5', 'end', 'show ip route', 'ping 192.168.2.10'],
  },

  ospf: {
    titulo: 'OSPF de área única',
    intro: 'R1 ya tiene las IP configuradas: Gi0/0 = 192.168.1.1/24 (LAN de usuarios), Gi0/1 = 10.0.12.1/30 hacia R2 y Loopback0 = 1.1.1.1/32. R2 (Router ID 2.2.2.2) ya ejecuta OSPF en el área 0 y anuncia la red 192.168.2.0/24.',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '10.0.12.1', mask: '255.255.255.252', shutdown: false }, { nombre: 'Loopback0', ip: '1.1.1.1', mask: '255.255.255.255', shutdown: false }],
      vecinos: [{ rid: '2.2.2.2', ip: '10.0.12.2', interfaz: 'GigabitEthernet0/1', area: 0, redes: [{ net: '192.168.2.0', mask: '255.255.255.0', coste: 2 }] }],
      hosts: [{ ip: '192.168.1.10' }, { ip: '10.0.12.2' }, { ip: '192.168.2.10', remoto: true }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Crea el proceso OSPF 1.', ok: s => s.ospf?.pid === 1 },
      { texto: 'Fija el Router ID 1.1.1.1 de forma explícita.', ok: s => s.ospf?.rid === '1.1.1.1' },
      { texto: 'Activa OSPF en el área 0 en el enlace hacia R2 (10.0.12.0/30).', ok: s => !!s.ospf && (s.ospf.redes.some(r => r.area === 0 && covers(r, '10.0.12.1')) || ifc(s, 'GigabitEthernet0/1').ospfArea === 0) },
      { texto: 'Anuncia también la LAN 192.168.1.0/24 en el área 0.', ok: s => !!s.ospf && (s.ospf.redes.some(r => r.area === 0 && covers(r, '192.168.1.1')) || ifc(s, 'GigabitEthernet0/0').ospfArea === 0) },
      { texto: 'Haz que Gi0/0 (la LAN de usuarios) sea interfaz pasiva.', ok: s => s.ospf?.pasivas.has('GigabitEthernet0/0') },
      { texto: 'Comprueba que la vecindad con R2 está en FULL (show ip ospf neighbor).', ok: s => s.patrones.has('show ip ospf neighbor') && vecinosOspf(s).length === 1 },
      { texto: 'Verifica que R1 ha aprendido 192.168.2.0/24 por OSPF (show ip route).', ok: s => s.patrones.has('show ip route') && buscarRuta(s, '192.168.2.10')?.cod === 'O' },
    ],
    solucion: ['configure terminal', 'router ospf 1', 'router-id 1.1.1.1', 'network 10.0.12.0 0.0.0.3 area 0', 'network 192.168.1.0 0.0.0.255 area 0', 'passive-interface g0/0', 'end', 'show ip ospf neighbor', 'show ip route'],
  },

  acl: {
    titulo: 'ACL estándar para proteger los servidores',
    intro: 'R1 tiene tres redes: Gi0/0 = Ventas (192.168.10.0/24), Gi0/1 = Invitados (192.168.20.0/24) y Gi0/2 = Servidores (10.50.0.0/24). Los invitados no deben llegar a los servidores; todo lo demás debe seguir funcionando.',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '192.168.20.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/2', ip: '10.50.0.1', mask: '255.255.255.0', shutdown: false }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Crea la ACL estándar 10 que deniegue la red 192.168.20.0/24 (wildcard 0.0.0.255).', ok: s => s.acls['10']?.tipo === 'std' && evaluarAcl(s, '10', { src: '192.168.20.77', dst: '10.50.0.20' }).accion === 'deny' },
      { texto: 'Añade una regla que permita el resto del tráfico (sin ella, el deny implícito lo bloquearía todo).', ok: s => s.acls['10'] && evaluarAcl(s, '10', { src: '192.168.10.5', dst: '10.50.0.20' }).accion === 'permit' && evaluarAcl(s, '10', { src: '172.16.0.9', dst: '10.50.0.20' }).accion === 'permit' },
      { texto: 'Aplica la ACL lo más cerca posible del destino: en Gi0/2, en sentido de salida.', ok: s => ifc(s, 'GigabitEthernet0/2').acl?.out === '10' },
      { texto: 'Comprueba las reglas con show access-lists.', ok: s => s.patrones.has('show access-lists') || s.patrones.has('show ip access-lists') },
    ],
    solucion: ['configure terminal', 'access-list 10 deny 192.168.20.0 0.0.0.255', 'access-list 10 permit any', 'interface g0/2', 'ip access-group 10 out', 'end', 'show access-lists'],
  },

  ssh: {
    titulo: 'Gestión remota por SSH',
    intro: 'Hay que poder administrar SW1 de forma segura desde la red de gestión (VLAN 99, 192.168.99.0/24, puerta de enlace 192.168.99.1). Telnet debe quedar prohibido.',
    equipo: { tipo: 'switch', hostname: 'Switch', interfaces: puertosSwitch(), hosts: [{ ip: '192.168.99.1' }], estadoInicial: s => { s.modo = 'priv'; s.vlans[99] = 'GESTION'; s.ifs['GigabitEthernet0/1'].mode = 'trunk'; } },
    tareas: [
      { texto: 'Cambia el hostname a SW1 y define el dominio empresa.local.', ok: s => s.hostname === 'SW1' && s.domain === 'empresa.local' },
      { texto: 'Genera las claves RSA de 2048 bits.', ok: s => s.rsa >= 2048 },
      { texto: 'Activa SSH versión 2.', ok: s => s.sshVersion === 2 },
      { texto: 'Crea el usuario admin con privilegio 15 y contraseña cifrada (secret).', ok: s => s.users.admin?.secret && s.users.admin.privilege === 15 },
      { texto: 'En las líneas VTY 0 15, usa los usuarios locales y permite solo SSH.', ok: s => s.lines.vty.local && s.lines.vty.transport === 'ssh' },
      { texto: 'Configura la SVI de la VLAN 99 con 192.168.99.10/24 y actívala.', ok: s => ifc(s, 'Vlan99').ip === '192.168.99.10' && ifc(s, 'Vlan99').mask === '255.255.255.0' && interfazUp(s, 'Vlan99') },
      { texto: 'Configura la puerta de enlace del switch: 192.168.99.1.', ok: s => s.defaultGateway === '192.168.99.1' },
    ],
    solucion: ['configure terminal', 'hostname SW1', 'ip domain-name empresa.local', 'crypto key generate rsa modulus 2048', 'ip ssh version 2', 'username admin privilege 15 secret Adm1n-Segur0', 'line vty 0 15', 'login local', 'transport input ssh', 'exit', 'interface vlan 99', 'ip address 192.168.99.10 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 192.168.99.1', 'end'],
  },

  portsecurity: {
    titulo: 'Port security en un puerto de acceso',
    intro: 'En el puerto Fa0/5 de recepción hay un teléfono IP con un PC detrás. Nadie debe poder conectar más equipos ahí.',
    equipo: { tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), estadoInicial: s => { s.modo = 'priv'; s.vlans[10] = 'DATOS'; } },
    tareas: [
      { texto: 'Pon Fa0/5 como puerto de acceso estático en la VLAN 10.', ok: s => ifc(s, 'FastEthernet0/5').mode === 'access' && ifc(s, 'FastEthernet0/5').accessVlan === 10 },
      { texto: 'Activa port security en Fa0/5.', ok: s => !!ifc(s, 'FastEthernet0/5').ps && !ifc(s, 'FastEthernet0/5').ps.off },
      { texto: 'Permite como máximo 2 direcciones MAC.', ok: s => ifc(s, 'FastEthernet0/5').ps?.max === 2 },
      { texto: 'Haz que aprenda las MAC de forma pegajosa (sticky).', ok: s => !!ifc(s, 'FastEthernet0/5').ps?.sticky },
      { texto: 'Ante una violación, descarta y registra pero sin apagar el puerto (restrict).', ok: s => ifc(s, 'FastEthernet0/5').ps?.violation === 'restrict' },
      { texto: 'Verifica con show port-security interface fa0/5.', ok: s => s.patrones.has('show port-security interface <i:iface>') },
    ],
    solucion: ['configure terminal', 'interface fa0/5', 'switchport mode access', 'switchport access vlan 10', 'switchport port-security', 'switchport port-security maximum 2', 'switchport port-security mac-address sticky', 'switchport port-security violation restrict', 'end', 'show port-security interface fa0/5'],
  },
};

function covers(red, ip) {
  const n = s => s.split('.').reduce((a, x) => a * 256 + +x, 0);
  const base = n(red.net), wc = n(red.wc), x = n(ip);
  for (let b = 31; b >= 0; b--) { const bit = 2 ** b; if (Math.floor(wc / bit) % 2 === 0 && Math.floor(x / bit) % 2 !== Math.floor(base / bit) % 2) return false; }
  return true;
}
