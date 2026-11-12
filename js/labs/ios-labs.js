// Laboratorios guiados del simulador de IOS. Cada tarea se comprueba sobre el estado del equipo, no sobre el texto
// escrito: da igual si el alumno abrevia ("sw mode acc") o lo hace en otro orden, mientras el resultado sea correcto.
import { interfazUp, buscarRuta, vecinosOspf, evaluarAcl, modoOperativo, vlanPasa, concesiones, traduccionesNat } from './ios.js';

const puertosSwitch = () => [...Array.from({ length: 24 }, (_, i) => ({ nombre: 'FastEthernet0/' + (i + 1) })), { nombre: 'GigabitEthernet0/1' }, { nombre: 'GigabitEthernet0/2' }];
const ifc = (s, n) => s.ifs[n] || {};

export const LABS = {
  basico: {
    nivel: 'principiante', tipo: 'guiado',
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
    nivel: 'principiante', tipo: 'guiado',
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
    nivel: 'intermedio', tipo: 'guiado',
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
    nivel: 'intermedio', tipo: 'guiado',
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
    nivel: 'avanzado', tipo: 'guiado',
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
    nivel: 'intermedio', tipo: 'guiado',
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
    nivel: 'intermedio', tipo: 'guiado',
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
    nivel: 'intermedio', tipo: 'guiado',
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

  // ================================================================ guiados nuevos
  router: {
    nivel: 'principiante', tipo: 'guiado',
    titulo: 'Tu primer router: LAN, salida a Internet y ruta por defecto',
    intro: 'R1 conecta la oficina (Gi0/0, red 192.168.1.0/24) con el proveedor de Internet (Gi0/1, enlace 203.0.113.0/30; el ISP es .1). Las interfaces de un router vienen apagadas y sin IP.',
    topologia: 'PC 192.168.1.10 ── Gi0/0 [R1] Gi0/1 ── 203.0.113.1 [ISP] ── Internet (8.8.8.8)',
    equipo: {
      tipo: 'router', hostname: 'Router',
      interfaces: [{ nombre: 'GigabitEthernet0/0' }, { nombre: 'GigabitEthernet0/1' }],
      hosts: [{ ip: '192.168.1.10' }, { ip: '203.0.113.1' }, { ip: '8.8.8.8', remoto: true }],
    },
    tareas: [
      { texto: 'Entra en el modo privilegiado y cambia el nombre del router a R1.', ok: s => s.hostname === 'R1' },
      { texto: 'Gi0/0: descripción «LAN oficina», IP 192.168.1.1/24 y actívala (no shutdown).', ok: s => /lan oficina/i.test(ifc(s, 'GigabitEthernet0/0').description || '') && ifc(s, 'GigabitEthernet0/0').ip === '192.168.1.1' && ifc(s, 'GigabitEthernet0/0').mask === '255.255.255.0' && interfazUp(s, 'GigabitEthernet0/0') },
      { texto: 'Gi0/1: IP 203.0.113.2/30 y actívala.', ok: s => ifc(s, 'GigabitEthernet0/1').ip === '203.0.113.2' && ifc(s, 'GigabitEthernet0/1').mask === '255.255.255.252' && interfazUp(s, 'GigabitEthernet0/1') },
      { texto: 'Comprueba el estado con show ip interface brief (las dos en up/up).', ok: s => s.patrones.has('show ip interface brief') && interfazUp(s, 'GigabitEthernet0/0') && interfazUp(s, 'GigabitEthernet0/1') },
      { texto: 'Crea la ruta por defecto hacia el ISP (0.0.0.0 0.0.0.0 203.0.113.1).', ok: s => buscarRuta(s, '8.8.8.8')?.cod === 'S*' },
      { texto: 'Haz ping a 8.8.8.8 y guarda la configuración.', ok: (s, run) => s.historial.some(h => /^ping\s+8\.8\.8\.8$/i.test(h)) && buscarRuta(s, '8.8.8.8')?.cod === 'S*' && s.guardada === run(s) },
    ],
    pistas: ['Las interfaces de router empiezan en «administratively down»: hace falta no shutdown.', 'Una /30 tiene máscara 255.255.255.252.', 'Ruta por defecto: ip route 0.0.0.0 0.0.0.0 <siguiente salto>.'],
    solucion: ['enable', 'configure terminal', 'hostname R1', 'interface g0/0', 'description LAN oficina', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'interface g0/1', 'ip address 203.0.113.2 255.255.255.252', 'no shutdown', 'exit', 'ip route 0.0.0.0 0.0.0.0 203.0.113.1', 'end', 'show ip interface brief', 'ping 8.8.8.8', 'copy running-config startup-config'],
  },

  intervlan: {
    nivel: 'intermedio', tipo: 'guiado',
    titulo: 'Router-on-a-stick: enrutar entre VLAN',
    intro: 'SW1 envía por un trunk 802.1Q (hacia Gi0/0 de R1) las VLAN 10 (Ventas, 192.168.10.0/24), 20 (Soporte, 192.168.20.0/24) y 99 (gestión, nativa, 192.168.99.0/24). R1 debe ser la puerta de enlace de las tres usando subinterfaces.',
    topologia: 'PC VLAN10 / PC VLAN20 ── [SW1] Gi0/1 ══trunk══ Gi0/0 [R1]',
    equipo: {
      tipo: 'router', hostname: 'R1', interfaces: [{ nombre: 'GigabitEthernet0/0' }, { nombre: 'GigabitEthernet0/1' }],
      hosts: [{ ip: '192.168.10.20' }, { ip: '192.168.20.20' }, { ip: '192.168.99.2' }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Activa la interfaz física Gi0/0 (sin IP: las IP van en las subinterfaces).', ok: s => !ifc(s, 'GigabitEthernet0/0').shutdown && !ifc(s, 'GigabitEthernet0/0').ip },
      { texto: 'Subinterfaz Gi0/0.10: encapsulation dot1q 10 e IP 192.168.10.1/24.', ok: s => ifc(s, 'GigabitEthernet0/0.10').encap === 10 && ifc(s, 'GigabitEthernet0/0.10').ip === '192.168.10.1' && ifc(s, 'GigabitEthernet0/0.10').mask === '255.255.255.0' },
      { texto: 'Subinterfaz Gi0/0.20: VLAN 20 e IP 192.168.20.1/24.', ok: s => ifc(s, 'GigabitEthernet0/0.20').encap === 20 && ifc(s, 'GigabitEthernet0/0.20').ip === '192.168.20.1' },
      { texto: 'Subinterfaz Gi0/0.99 para la VLAN nativa 99 (palabra native) con IP 192.168.99.1/24.', ok: s => ifc(s, 'GigabitEthernet0/0.99').encap === 99 && ifc(s, 'GigabitEthernet0/0.99').encapNativa && ifc(s, 'GigabitEthernet0/0.99').ip === '192.168.99.1' },
      { texto: 'Comprueba en show ip route que hay tres redes conectadas por las subinterfaces.', ok: s => s.patrones.has('show ip route') && ['192.168.10.20', '192.168.20.20', '192.168.99.2'].every(ip => buscarRuta(s, ip)?.cod === 'C') },
      { texto: 'Haz ping a un PC de la VLAN 20 (192.168.20.20).', ok: s => s.historial.some(h => /^ping\s+192\.168\.20\.20$/i.test(h)) && buscarRuta(s, '192.168.20.20')?.cod === 'C' },
    ],
    pistas: ['Las subinterfaces se crean con interface g0/0.10 (el número tras el punto suele coincidir con la VLAN).', 'Sin encapsulation dot1q el router no deja poner IP en la subinterfaz.', 'Si la física está apagada, todas sus subinterfaces lo están.'],
    solucion: ['configure terminal', 'interface g0/0', 'no shutdown', 'interface g0/0.10', 'encapsulation dot1q 10', 'ip address 192.168.10.1 255.255.255.0', 'interface g0/0.20', 'encapsulation dot1q 20', 'ip address 192.168.20.1 255.255.255.0', 'interface g0/0.99', 'encapsulation dot1q 99 native', 'ip address 192.168.99.1 255.255.255.0', 'end', 'show ip route', 'ping 192.168.20.20'],
  },

  dhcp: {
    nivel: 'intermedio', tipo: 'guiado',
    titulo: 'Servidor DHCP en el router y relay',
    intro: 'R1 tiene la LAN de Ventas en Gi0/0 (192.168.10.1/24) y la de Soporte en Gi0/1 (192.168.20.1/24). Los PC están configurados para pedir IP por DHCP. Las primeras 10 direcciones de cada red se reservan para impresoras y equipos fijos. La red de invitados (Gi0/2, 192.168.30.1/24) usa el servidor DHCP central 10.0.0.50.',
    topologia: 'PCs Ventas ── Gi0/0 [R1] Gi0/1 ── PCs Soporte\n                 Gi0/2 ── Invitados (DHCP central 10.0.0.50)',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '192.168.20.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/2', ip: '192.168.30.1', mask: '255.255.255.0', shutdown: false }],
      hosts: [{ ip: '0.0.0.1', dhcp: 'GigabitEthernet0/0', mac: '0050.56a1.0a01' }, { ip: '0.0.0.2', dhcp: 'GigabitEthernet0/0', mac: '0050.56a1.0a02' }, { ip: '0.0.0.3', dhcp: 'GigabitEthernet0/1', mac: '0050.56a1.1401' }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Excluye 192.168.10.1 a 192.168.10.10 y 192.168.20.1 a 192.168.20.10.', ok: s => [['192.168.10.1', '192.168.10.10'], ['192.168.20.1', '192.168.20.10']].every(([a, b]) => s.dhcp.excluidas.some(([x, y]) => x === a && y === b)) },
      { texto: 'Pool VENTAS: red 192.168.10.0/24, puerta de enlace 192.168.10.1 y DNS 8.8.8.8.', ok: s => { const p = s.dhcp.pools.VENTAS; return !!p && p.net === '192.168.10.0' && p.mask === '255.255.255.0' && p.gw === '192.168.10.1' && p.dns.includes('8.8.8.8'); } },
      { texto: 'Pool SOPORTE: red 192.168.20.0/24, puerta de enlace 192.168.20.1 y DNS 8.8.8.8.', ok: s => { const p = s.dhcp.pools.SOPORTE; return !!p && p.net === '192.168.20.0' && p.mask === '255.255.255.0' && p.gw === '192.168.20.1' && p.dns.includes('8.8.8.8'); } },
      { texto: 'Comprueba con show ip dhcp binding que los 3 PC tienen IP (la primera de Ventas debe ser la .11).', ok: s => s.patrones.has('show ip dhcp binding') && concesiones(s).length === 3 && concesiones(s)[0].ip === '192.168.10.11' },
      { texto: 'Haz que Gi0/2 reenvíe las peticiones DHCP de invitados al servidor 10.0.0.50 (relay).', ok: s => ifc(s, 'GigabitEthernet0/2').helper === '10.0.0.50' },
    ],
    pistas: ['ip dhcp excluded-address <primera> <última> va en configuración global, no dentro del pool.', 'Dentro del pool: network, default-router y dns-server.', 'El relay es ip helper-address en la interfaz donde están los clientes.'],
    solucion: ['configure terminal', 'ip dhcp excluded-address 192.168.10.1 192.168.10.10', 'ip dhcp excluded-address 192.168.20.1 192.168.20.10', 'ip dhcp pool VENTAS', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1', 'dns-server 8.8.8.8', 'exit', 'ip dhcp pool SOPORTE', 'network 192.168.20.0 255.255.255.0', 'default-router 192.168.20.1', 'dns-server 8.8.8.8', 'exit', 'interface g0/2', 'ip helper-address 10.0.0.50', 'end', 'show ip dhcp binding'],
  },

  nat: {
    nivel: 'avanzado', tipo: 'guiado',
    titulo: 'NAT con sobrecarga (PAT) y NAT estática',
    intro: 'La oficina usa 192.168.1.0/24 (Gi0/0) y sale a Internet por Gi0/1 (203.0.113.2/30, el ISP es 203.0.113.1). Todos los PC deben salir con la IP pública de Gi0/1. El servidor web 192.168.1.50 debe ser accesible desde Internet con la IP pública 203.0.113.10, que el ISP ya enruta hacia R1.',
    topologia: 'PCs 192.168.1.x + servidor .50 ── Gi0/0 (inside) [R1] Gi0/1 (outside) ── ISP ── Internet',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '203.0.113.2', mask: '255.255.255.252', shutdown: false }],
      hosts: [{ ip: '192.168.1.21', nat: true }, { ip: '192.168.1.22', nat: true }, { ip: '192.168.1.50', nat: true }, { ip: '203.0.113.1' }, { ip: '8.8.8.8', remoto: true }],
      estadoInicial: s => { s.modo = 'priv'; },
    },
    tareas: [
      { texto: 'Crea la ruta por defecto hacia el ISP.', ok: s => buscarRuta(s, '8.8.8.8')?.cod === 'S*' && buscarRuta(s, '8.8.8.8')?.nh === '203.0.113.1' },
      { texto: 'Marca Gi0/0 como ip nat inside y Gi0/1 como ip nat outside.', ok: s => ifc(s, 'GigabitEthernet0/0').nat === 'inside' && ifc(s, 'GigabitEthernet0/1').nat === 'outside' },
      { texto: 'Crea la ACL 1 que permita la red 192.168.1.0/24 (las direcciones que se traducen).', ok: s => !!s.acls['1'] && evaluarAcl(s, '1', { src: '192.168.1.21', dst: '8.8.8.8' }).accion === 'permit' && evaluarAcl(s, '1', { src: '10.9.9.9', dst: '8.8.8.8' }).accion === 'deny' },
      { texto: 'Configura PAT: ip nat inside source list 1 interface g0/1 overload.', ok: s => s.nat.listas.some(n => n.lista === '1' && n.iface === 'GigabitEthernet0/1') },
      { texto: 'NAT estática: el servidor 192.168.1.50 se publica como 203.0.113.10.', ok: s => s.nat.estaticas.some(n => n.local === '192.168.1.50' && n.global === '203.0.113.10') },
      { texto: 'Verifica con show ip nat translations (dos PC con PAT y el servidor estático).', ok: s => s.patrones.has('show ip nat translations') && traduccionesNat(s).filter(t => t.tipo === 'pat').length === 2 && traduccionesNat(s).some(t => t.tipo === 'static') },
    ],
    pistas: ['Sin ruta por defecto no hay por dónde salir, y no se crea ninguna traducción.', 'inside = donde están las IP privadas; outside = hacia Internet.', 'La ACL de NAT dice QUÉ se traduce; no filtra tráfico.'],
    solucion: ['configure terminal', 'ip route 0.0.0.0 0.0.0.0 203.0.113.1', 'interface g0/0', 'ip nat inside', 'interface g0/1', 'ip nat outside', 'exit', 'access-list 1 permit 192.168.1.0 0.0.0.255', 'ip nat inside source list 1 interface g0/1 overload', 'ip nat inside source static 192.168.1.50 203.0.113.10', 'end', 'show ip nat translations'],
  },

  // ================================================================ averías (empiezan rotos)
  'averia-puerto': {
    nivel: 'principiante', tipo: 'averia',
    titulo: 'Avería: «el PC de Ana no tiene red»',
    intro: 'Ana (puerto Fa0/7) es de Ventas y debería estar en la VLAN 10. Dice que no tiene red. Diagnostica con comandos show antes de tocar nada, encuentra las causas y arréglalas.',
    topologia: 'PC Ana 192.168.10.37 ── Fa0/7 [SW1] Gi0/1 ══trunk══ resto de la red (gestión SVI VLAN 10: 192.168.10.2)',
    equipo: {
      tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), soloConectados: true,
      hosts: [{ ip: '192.168.10.37', mac: '0050.56a1.b07a', puerto: 'FastEthernet0/7' }, { ip: '192.168.10.38', mac: '0050.56a1.b07b', puerto: 'FastEthernet0/8' }],
      estadoInicial: s => {
        s.modo = 'priv'; s.vlans[10] = 'VENTAS'; s.vlans[20] = 'SOPORTE';
        for (const n of ['FastEthernet0/7', 'FastEthernet0/8']) Object.assign(s.ifs[n], { mode: 'access', accessVlan: 10 });
        Object.assign(s.ifs['FastEthernet0/7'], { accessVlan: 20, shutdown: true, description: 'Ana - Ventas' });
        s.ifs['GigabitEthernet0/1'].mode = 'trunk';
        s.ifs.Vlan10 = { nombre: 'Vlan10', shutdown: false, ip: '192.168.10.2', mask: '255.255.255.0', conectada: true, mode: null, accessVlan: 1, nativeVlan: 1, allowed: 'all', acl: {}, description: '', ps: null, virtual: true };
      },
    },
    tareas: [
      { texto: 'Diagnostica: mira el estado de todos los puertos con show interfaces status.', ok: s => s.patrones.has('show interfaces status') },
      { texto: 'Diagnostica: comprueba en qué VLAN está cada puerto (show vlan brief).', ok: s => s.patrones.has('show vlan brief') || s.patrones.has('show vlan') },
      { texto: 'Arreglo 1: el puerto de Ana estaba apagado a mano. Actívalo.', ok: s => !ifc(s, 'FastEthernet0/7').shutdown },
      { texto: 'Arreglo 2: Fa0/7 estaba en la VLAN equivocada. Ponlo en la VLAN 10.', ok: s => ifc(s, 'FastEthernet0/7').accessVlan === 10 && ifc(s, 'FastEthernet0/7').mode === 'access' },
      { texto: 'Verifica: la MAC del PC de Ana aparece en la VLAN 10 (show mac address-table) y responde al ping 192.168.10.37.', ok: s => s.patrones.has('show mac address-table') && s.historial.some(h => /^ping\s+192\.168\.10\.37$/i.test(h)) && !ifc(s, 'FastEthernet0/7').shutdown && ifc(s, 'FastEthernet0/7').accessVlan === 10 },
    ],
    pistas: ['«disabled» en show interfaces status = alguien hizo shutdown en ese puerto.', 'Compara la VLAN de Fa0/7 con la de su compañero en Fa0/8.', 'Método: capa 1 (¿está activo?) → capa 2 (¿VLAN correcta?) → capa 3 (¿hay ping?).'],
    solucion: ['show interfaces status', 'show vlan brief', 'configure terminal', 'interface fa0/7', 'no shutdown', 'switchport access vlan 10', 'end', 'show mac address-table', 'ping 192.168.10.37'],
  },

  'averia-trunk': {
    nivel: 'intermedio', tipo: 'averia',
    titulo: 'Avería: la VLAN 20 no llega al otro switch',
    intro: 'SW1 y SW2 se unen por Gi0/1. En SW2 el puerto es trunk fijo (sin negociación DTP), con VLAN nativa 99 y VLAN permitidas 10, 20 y 99. Los usuarios de Soporte (VLAN 20) en SW2 no llegan a nada de SW1. Solo puedes tocar SW1.',
    topologia: '[SW1] Gi0/1 ══?══ Gi0/1 [SW2]  (SW2: trunk, nonegotiate, nativa 99, permitidas 10,20,99)',
    equipo: {
      tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), soloConectados: true,
      vecinoL2: { 'GigabitEthernet0/1': { nombre: 'SW2', puerto: 'GigabitEthernet0/1', mode: 'trunk', nonegotiate: true, native: 99, allowed: [10, 20, 99] } },
      cdp: [{ id: 'SW2', local: 'GigabitEthernet0/1', remoto: 'Gig 0/1', capacidad: 'S I', plataforma: 'WS-C2960' }],
      estadoInicial: s => {
        s.modo = 'priv'; s.vlans[10] = 'VENTAS'; s.vlans[20] = 'SOPORTE'; s.vlans[99] = 'NATIVA';
        Object.assign(s.ifs['GigabitEthernet0/1'], { mode: 'dynamic auto', allowed: new Set([10, 99]) });
      },
    },
    tareas: [
      { texto: 'Diagnostica: show interfaces trunk (¿hay trunk?) y show interfaces g0/1 switchport (¿qué modo opera?).', ok: s => s.patrones.has('show interfaces trunk') && s.patrones.has('show interfaces <i:iface> switchport') },
      { texto: 'Arreglo 1: el puerto está en dynamic auto y SW2 no negocia. Ponlo en trunk estático.', ok: s => ifc(s, 'GigabitEthernet0/1').mode === 'trunk' && modoOperativo(s, 'GigabitEthernet0/1') === 'trunk' },
      { texto: 'Arreglo 2: iguala la VLAN nativa con SW2.', ok: s => ifc(s, 'GigabitEthernet0/1').nativeVlan === 99 },
      { texto: 'Arreglo 3: la VLAN 20 no está permitida en el trunk. Añádela sin quitar las demás.', ok: s => vlanPasa(s, 'GigabitEthernet0/1', 20) && vlanPasa(s, 'GigabitEthernet0/1', 10) },
      { texto: 'Verifica de nuevo con show interfaces trunk que pasan 10, 20 y 99 y que no hay aviso de nativa distinta.', ok: s => s.patrones.has('show interfaces trunk') && [10, 20, 99].every(v => vlanPasa(s, 'GigabitEthernet0/1', v)) },
    ],
    pistas: ['dynamic auto + vecino que no negocia = el enlace se queda en acceso.', '«%CDP-4-NATIVE_VLAN_MISMATCH» avisa de nativas distintas.', 'switchport trunk allowed vlan add 20 añade sin borrar la lista.'],
    solucion: ['show interfaces trunk', 'show interfaces g0/1 switchport', 'configure terminal', 'interface g0/1', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan add 20', 'end', 'show interfaces trunk'],
  },

  'averia-gestion': {
    nivel: 'intermedio', tipo: 'averia',
    titulo: 'Avería: no puedo administrar el switch en remoto',
    intro: 'SW1 debería gestionarse desde la VLAN 99 (192.168.99.0/24) con la IP 192.168.99.10, y su puerta de enlace es 192.168.99.1. Desde la red de administración no responde. Encuentra los fallos.',
    topologia: 'Admin (otra red) ── R1 192.168.99.1 ══trunk══ Gi0/1 [SW1 SVI Vlan99]',
    equipo: {
      tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), soloConectados: true,
      hosts: [{ ip: '192.168.99.1' }, { ip: '10.10.10.5', remoto: true }],
      estadoInicial: s => {
        s.modo = 'priv'; s.vlans[99] = 'GESTION'; s.ifs['GigabitEthernet0/1'].mode = 'trunk';
        s.ifs.Vlan99 = { nombre: 'Vlan99', shutdown: true, ip: '192.168.9.10', mask: '255.255.255.0', conectada: true, mode: null, accessVlan: 1, nativeVlan: 1, allowed: 'all', acl: {}, description: '', ps: null, virtual: true };
        s.defaultGateway = '192.168.99.254';
      },
    },
    tareas: [
      { texto: 'Diagnostica con show ip interface brief y revisa la configuración (show running-config).', ok: s => s.patrones.has('show ip interface brief') && s.patrones.has('show running-config') },
      { texto: 'Arreglo 1: la SVI Vlan99 tiene una IP con una errata. Pon 192.168.99.10/24.', ok: s => ifc(s, 'Vlan99').ip === '192.168.99.10' && ifc(s, 'Vlan99').mask === '255.255.255.0' },
      { texto: 'Arreglo 2: la SVI está apagada. Actívala.', ok: s => interfazUp(s, 'Vlan99') },
      { texto: 'Arreglo 3: la puerta de enlace configurada no existe. Corrígela a 192.168.99.1.', ok: s => s.defaultGateway === '192.168.99.1' },
      { texto: 'Verifica: ping a la puerta de enlace 192.168.99.1 con éxito.', ok: s => s.historial.some(h => /^ping\s+192\.168\.99\.1$/i.test(h)) && interfazUp(s, 'Vlan99') && ifc(s, 'Vlan99').ip === '192.168.99.10' },
    ],
    pistas: ['Un switch de capa 2 solo tiene IP en su SVI (interface vlan X).', 'ip default-gateway es lo que usa para responder a redes remotas.', '192.168.9.10 ≠ 192.168.99.10.'],
    solucion: ['show ip interface brief', 'show running-config', 'configure terminal', 'interface vlan 99', 'ip address 192.168.99.10 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 192.168.99.1', 'end', 'ping 192.168.99.1'],
  },

  'averia-ruta': {
    nivel: 'intermedio', tipo: 'averia',
    titulo: 'Avería: la oficina no sale a Internet',
    intro: 'R1 une la LAN (Gi0/0, 192.168.1.1/24) con el router del proveedor por Gi0/1. El enlace es 10.0.12.0/30: R1 debe ser 10.0.12.1 y el proveedor es 10.0.12.2. Desde ayer nadie navega.',
    topologia: 'LAN 192.168.1.0/24 ── Gi0/0 [R1] Gi0/1 ── 10.0.12.2 [ISP] ── Internet (8.8.8.8)',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '10.0.21.1', mask: '255.255.255.252', shutdown: true }],
      hosts: [{ ip: '192.168.1.10' }, { ip: '10.0.12.2' }, { ip: '8.8.8.8', remoto: true }],
      estadoInicial: s => { s.modo = 'priv'; s.rutas.push({ net: '0.0.0.0', mask: '0.0.0.0', nh: '10.0.12.6', iface: null, ad: 1 }); },
    },
    tareas: [
      { texto: 'Diagnostica: show ip interface brief y show ip route (¿hay «Gateway of last resort»?).', ok: s => s.patrones.has('show ip interface brief') && s.patrones.has('show ip route') },
      { texto: 'Arreglo 1: Gi0/1 está apagada. Actívala.', ok: s => !ifc(s, 'GigabitEthernet0/1').shutdown },
      { texto: 'Arreglo 2: Gi0/1 tiene una IP de otra red (errata). Pon 10.0.12.1/30.', ok: s => ifc(s, 'GigabitEthernet0/1').ip === '10.0.12.1' && ifc(s, 'GigabitEthernet0/1').mask === '255.255.255.252' },
      { texto: 'Arreglo 3: la ruta por defecto apunta a un siguiente salto que no existe (10.0.12.6). Bórrala y crea la correcta.', ok: s => !s.rutas.some(r => r.nh === '10.0.12.6') && buscarRuta(s, '8.8.8.8')?.nh === '10.0.12.2' },
      { texto: 'Verifica: ping 10.0.12.2 y ping 8.8.8.8 con éxito.', ok: s => ['10.0.12.2', '8.8.8.8'].every(ip => s.historial.some(h => new RegExp('^ping\\s+' + ip.replace(/\./g, '\\.') + '$', 'i').test(h))) && buscarRuta(s, '8.8.8.8')?.nh === '10.0.12.2' && interfazUp(s, 'GigabitEthernet0/1') },
    ],
    pistas: ['Una ruta estática solo entra en la tabla si su siguiente salto es alcanzable por una red conectada.', 'Para borrar una ruta: no ip route <red> <máscara> <siguiente salto>.', 'Comprueba primero el vecino directo (10.0.12.2) y luego lo lejano (8.8.8.8).'],
    solucion: ['show ip interface brief', 'show ip route', 'configure terminal', 'interface g0/1', 'ip address 10.0.12.1 255.255.255.252', 'no shutdown', 'exit', 'no ip route 0.0.0.0 0.0.0.0 10.0.12.6', 'ip route 0.0.0.0 0.0.0.0 10.0.12.2', 'end', 'ping 10.0.12.2', 'ping 8.8.8.8'],
  },

  'averia-ospf': {
    nivel: 'avanzado', tipo: 'averia',
    titulo: 'Avería: OSPF no forma vecindad',
    intro: 'R1 y R2 deberían ser vecinos OSPF en el área 0 por Gi0/1 (10.0.12.0/30). R2 está bien configurado y anuncia 192.168.2.0/24. R1 no ve a R2 y no aprende esa red.',
    topologia: 'LAN1 ── Gi0/0 [R1] Gi0/1 ── 10.0.12.0/30 ── [R2 2.2.2.2] ── LAN2 192.168.2.0/24',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '10.0.12.1', mask: '255.255.255.252', shutdown: false }],
      vecinos: [{ rid: '2.2.2.2', ip: '10.0.12.2', interfaz: 'GigabitEthernet0/1', area: 0, redes: [{ net: '192.168.2.0', mask: '255.255.255.0', coste: 2 }] }],
      hosts: [{ ip: '10.0.12.2' }, { ip: '192.168.2.10', remoto: true }],
      estadoInicial: s => { s.modo = 'priv'; s.ospf = { pid: 1, rid: '1.1.1.1', redes: [{ net: '192.168.1.0', wc: '0.0.0.255', area: 0 }, { net: '10.0.12.0', wc: '0.0.0.3', area: 1 }], pasivas: new Set(), pasivasDefault: true, defaultOriginate: false }; },
    },
    tareas: [
      { texto: 'Diagnostica: show ip ospf neighbor y show ip protocols (redes, áreas e interfaces pasivas).', ok: s => s.patrones.has('show ip ospf neighbor') && s.patrones.has('show ip protocols') },
      { texto: 'Arreglo 1: el enlace con R2 está en el área equivocada. Debe ser el área 0.', ok: s => s.ospf && !s.ospf.redes.some(r => r.net === '10.0.12.0' && r.area !== 0) && s.ospf.redes.some(r => r.net === '10.0.12.0' && r.area === 0) },
      { texto: 'Arreglo 2: todas las interfaces son pasivas (passive-interface default). Deja Gi0/1 como no pasiva.', ok: s => s.ospf && (!s.ospf.pasivasDefault || s.ospf.noPasivas?.has('GigabitEthernet0/1')) && !s.ospf.pasivas.has('GigabitEthernet0/1') },
      { texto: 'Verifica: R2 aparece en FULL y 192.168.2.0/24 entra como ruta O.', ok: s => vecinosOspf(s).length === 1 && buscarRuta(s, '192.168.2.10')?.cod === 'O' && s.patrones.has('show ip route') },
    ],
    pistas: ['Para formar vecindad, los dos lados deben estar en la misma área y la misma subred.', 'Una interfaz pasiva no envía hellos: nunca tendrá vecinos.', 'Quita la red errónea con no network ... area 1 y vuelve a añadirla en el área 0.'],
    solucion: ['show ip ospf neighbor', 'show ip protocols', 'configure terminal', 'router ospf 1', 'no network 10.0.12.0 0.0.0.3 area 1', 'network 10.0.12.0 0.0.0.3 area 0', 'no passive-interface g0/1', 'end', 'show ip ospf neighbor', 'show ip route'],
  },

  'averia-ssh': {
    nivel: 'intermedio', tipo: 'averia',
    titulo: 'Avería: SSH rechaza la conexión',
    intro: 'El técnico anterior «configuró SSH» en SW1, pero las conexiones SSH son rechazadas y el equipo de auditoría ha visto que Telnet sigue abierto. Revisa y deja SSH v2 funcionando con el usuario local admin.',
    topologia: 'PC admin ── SSH ──▶ [SW1 192.168.99.10]',
    equipo: {
      tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), soloConectados: true,
      estadoInicial: s => {
        s.modo = 'priv'; s.users.admin = { privilege: 15, secret: true, pass: 'x', alg: null };
        Object.assign(s.lines.vty, { password: 'cisco', login: true, local: false, transport: 'telnet' });
      },
    },
    tareas: [
      { texto: 'Diagnostica: show ip ssh y revisa las líneas vty en show running-config.', ok: s => s.patrones.has('show ip ssh') && s.patrones.has('show running-config') },
      { texto: 'Arreglo 1: sin dominio no se pueden generar claves. Define el dominio empresa.local.', ok: s => s.domain === 'empresa.local' },
      { texto: 'Arreglo 2: genera claves RSA de 2048 bits y activa la versión 2.', ok: s => s.rsa >= 2048 && s.sshVersion === 2 },
      { texto: 'Arreglo 3: las vty usan una contraseña compartida. Haz que pidan usuario local.', ok: s => s.lines.vty.local },
      { texto: 'Arreglo 4: solo se permite Telnet. Permite únicamente SSH.', ok: s => s.lines.vty.transport === 'ssh' },
      { texto: 'Verifica de nuevo con show ip ssh.', ok: s => s.patrones.has('show ip ssh') && s.rsa >= 2048 && s.sshVersion === 2 && s.lines.vty.transport === 'ssh' && s.lines.vty.local },
    ],
    pistas: ['«%SSH has not been enabled» = no hay claves RSA.', 'crypto key generate rsa necesita hostname distinto de Switch y un ip domain-name.', 'login local + transport input ssh, en line vty 0 15.'],
    solucion: ['show ip ssh', 'show running-config', 'configure terminal', 'ip domain-name empresa.local', 'crypto key generate rsa modulus 2048', 'ip ssh version 2', 'line vty 0 15', 'login local', 'transport input ssh', 'end', 'show ip ssh'],
  },

  'averia-acl': {
    nivel: 'avanzado', tipo: 'averia',
    titulo: 'Avería: una ACL ha dejado a Ventas sin servidores',
    intro: 'Querían impedir que Invitados (Gi0/1, 192.168.20.0/24) llegase a los servidores (Gi0/2, 10.50.0.0/24). Tras aplicar la ACL 10, Ventas (Gi0/0, 192.168.10.0/24) tampoco llega a nada.',
    topologia: 'Ventas ── Gi0/0 [R1] Gi0/2 ── Servidores\n Invitados ── Gi0/1',
    equipo: {
      tipo: 'router', hostname: 'R1',
      interfaces: [{ nombre: 'GigabitEthernet0/0', ip: '192.168.10.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/1', ip: '192.168.20.1', mask: '255.255.255.0', shutdown: false }, { nombre: 'GigabitEthernet0/2', ip: '10.50.0.1', mask: '255.255.255.0', shutdown: false }],
      estadoInicial: s => {
        s.modo = 'priv';
        s.acls['10'] = { tipo: 'std', nombre: false, reglas: [{ accion: 'deny', src: { base: 0xC0A81400, wc: 255, txt: '192.168.20.0, wildcard bits 0.0.0.255' }, seq: 10, texto: '192.168.20.0 0.0.0.255' }] };
        s.ifs['GigabitEthernet0/0'].acl = { in: '10' };
      },
    },
    tareas: [
      { texto: 'Diagnostica: show access-lists y revisa dónde está aplicada (show running-config).', ok: s => (s.patrones.has('show access-lists') || s.patrones.has('show ip access-lists')) && s.patrones.has('show running-config') },
      { texto: 'Arreglo 1: la ACL no tiene ningún permit (el deny implícito lo bloquea todo). Añade permit any al final.', ok: s => evaluarAcl(s, '10', { src: '192.168.10.5', dst: '10.50.0.9' }).accion === 'permit' && evaluarAcl(s, '10', { src: '192.168.20.5', dst: '10.50.0.9' }).accion === 'deny' },
      { texto: 'Arreglo 2: está aplicada en la interfaz de Ventas. Quítala de Gi0/0.', ok: s => !ifc(s, 'GigabitEthernet0/0').acl?.in && !ifc(s, 'GigabitEthernet0/0').acl?.out },
      { texto: 'Arreglo 3: aplícala cerca del destino: Gi0/2 en salida.', ok: s => ifc(s, 'GigabitEthernet0/2').acl?.out === '10' },
    ],
    pistas: ['Toda ACL termina con un deny any implícito que no se ve.', 'ACL estándar = solo mira el origen → cerca del destino.', 'no ip access-group 10 in, dentro de la interfaz, la desaplica.'],
    solucion: ['show access-lists', 'show running-config', 'configure terminal', 'access-list 10 permit any', 'interface g0/0', 'no ip access-group 10 in', 'interface g0/2', 'ip access-group 10 out', 'end'],
  },

  'averia-duplex': {
    nivel: 'intermedio', tipo: 'averia',
    titulo: 'Avería: el servidor va lentísimo',
    intro: 'El servidor de ficheros está en Gi0/2 de SW1. Funciona, pero copiar un archivo tarda una eternidad. La tarjeta del servidor negocia automáticamente (full dúplex).',
    topologia: '[Servidor full-duplex] ── Gi0/2 [SW1]',
    equipo: {
      tipo: 'switch', hostname: 'SW1', interfaces: puertosSwitch(), soloConectados: true,
      vecinoL2: { 'GigabitEthernet0/2': { mode: 'access', duplex: 'full' } },
      estadoInicial: s => { s.modo = 'priv'; Object.assign(s.ifs['GigabitEthernet0/2'], { mode: 'access', duplex: 'half', speed: '100', description: 'Servidor ficheros' }); },
    },
    tareas: [
      { texto: 'Diagnostica: show interfaces status y show interfaces g0/2 (fíjate en los errores CRC y las colisiones tardías).', ok: s => s.patrones.has('show interfaces status') && s.patrones.has('show interfaces <i:iface>') },
      { texto: 'Arreglo: deja velocidad y dúplex en automático para que negocie con el servidor.', ok: s => ifc(s, 'GigabitEthernet0/2').duplex === 'auto' && ifc(s, 'GigabitEthernet0/2').speed === 'auto' },
      { texto: 'Verifica que ya no hay errores con show interfaces g0/2.', ok: s => s.historial.filter(h => /^(sh|sho|show)\s+int\S*\s+g\S*\s*0\/2$/i.test(h)).length >= 2 && ifc(s, 'GigabitEthernet0/2').duplex === 'auto' },
    ],
    pistas: ['Dúplex distinto en cada extremo = colisiones tardías y CRC: funciona, pero muy lento.', 'duplex auto y speed auto, dentro de la interfaz.'],
    solucion: ['show interfaces status', 'show interfaces g0/2', 'configure terminal', 'interface g0/2', 'duplex auto', 'speed auto', 'end', 'show interfaces g0/2'],
  },
};

function covers(red, ip) {
  const n = s => s.split('.').reduce((a, x) => a * 256 + +x, 0);
  const base = n(red.net), wc = n(red.wc), x = n(ip);
  for (let b = 31; b >= 0; b--) { const bit = 2 ** b; if (Math.floor(wc / bit) % 2 === 0 && Math.floor(x / bit) % 2 !== Math.floor(base / bit) % 2) return false; }
  return true;
}
