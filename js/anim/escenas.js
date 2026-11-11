// Escenas de las animaciones del curso. Cada una explica un protocolo paso a paso (ver motor.js).
import { crearAnimacion } from './motor.js';

const pk = (ruta, etiqueta, capa, extra = {}) => ({ t: 'paquete', ruta, etiqueta, capa, ...extra });
const tabla = (id, titulo, x, y, ancho, filas, resaltar) => ({ t: 'tabla', id, titulo, x, y, ancho, filas, resaltar });
const nodo = (id, extra) => ({ t: 'nodo', id, ...extra });
const enlace = (id, estado) => ({ t: 'enlace', id, estado });

export const ESCENAS = {
  encapsulacion: {
    titulo: 'Encapsulación y desencapsulación', alto: 340,
    nodos: [
      { id: 'a', tipo: 'pc', x: 110, y: 110, etiqueta: 'PC A', sub: '192.168.1.10' },
      { id: 'sw', tipo: 'switch', x: 360, y: 110, etiqueta: 'SW1' },
      { id: 'b', tipo: 'server', x: 610, y: 110, etiqueta: 'Servidor web', sub: '192.168.1.20' },
    ],
    enlaces: [{ a: 'a', b: 'sw' }, { a: 'sw', b: 'b' }],
    pasos: [
      { texto: 'El navegador de PC A genera los datos de la aplicación: una petición HTTP para el servidor web.', acciones: [{ t: 'pdu', segs: [{ txt: 'Datos HTTP', capa: 'l7' }] }, nodo('a', { estado: 'hl' })] },
      { texto: 'Capa de transporte: TCP añade su cabecera con el puerto de origen (49152) y el de destino (80). La PDU ahora es un segmento.', acciones: [{ t: 'pdu', segs: [{ txt: 'TCP 49152→80', capa: 'l4' }, { txt: 'Datos HTTP', capa: 'l7' }] }] },
      { texto: 'Capa de red: IP añade las direcciones IP de origen y destino. Ahora es un paquete.', acciones: [{ t: 'pdu', segs: [{ txt: 'IP .10→.20', capa: 'l3' }, { txt: 'TCP 49152→80', capa: 'l4' }, { txt: 'Datos HTTP', capa: 'l7' }] }] },
      { texto: 'Capa de enlace: Ethernet añade delante las MAC de destino y origen, y detrás el FCS para detectar errores. Ahora es una trama.', acciones: [{ t: 'pdu', segs: [{ txt: 'Eth MAC', capa: 'l2' }, { txt: 'IP .10→.20', capa: 'l3' }, { txt: 'TCP 49152→80', capa: 'l4' }, { txt: 'Datos HTTP', capa: 'l7' }, { txt: 'FCS', capa: 'l2' }] }] },
      { texto: 'Capa física: la trama se convierte en bits (señales eléctricas, luz u ondas) y viaja por el medio. El switch la reenvía mirando solo la MAC de destino.', acciones: [{ t: 'pdu', segs: [{ txt: '010110100101110010100101 · bits', capa: 'l1' }] }, pk(['a', 'sw', 'b'], '0101…', 'l1'), nodo('a', { estado: null })] },
      { texto: 'El servidor desencapsula: comprueba el FCS (si no coincide, descarta la trama) y quita la cabecera Ethernet.', acciones: [nodo('b', { estado: 'hl' }), { t: 'pdu', segs: [{ txt: 'IP .10→.20', capa: 'l3' }, { txt: 'TCP 49152→80', capa: 'l4' }, { txt: 'Datos HTTP', capa: 'l7' }] }] },
      { texto: 'Quita la cabecera IP (el paquete es para él) y la de TCP, que por el puerto 80 sabe que debe entregar los datos al servidor web.', acciones: [{ t: 'pdu', segs: [{ txt: 'Datos HTTP', capa: 'l7' }] }] },
    ],
  },

  switch: {
    titulo: 'Cómo aprende y reenvía un switch', alto: 340,
    nodos: [
      { id: 'a', tipo: 'pc', x: 120, y: 70, etiqueta: 'PC A', sub: 'MAC AAAA · Gi0/1' },
      { id: 'b', tipo: 'pc', x: 600, y: 70, etiqueta: 'PC B', sub: 'MAC BBBB · Gi0/2' },
      { id: 'c', tipo: 'pc', x: 360, y: 270, etiqueta: 'PC C', sub: 'MAC CCCC · Gi0/3' },
      { id: 'sw', tipo: 'switch', x: 360, y: 140, etiqueta: 'SW1', sub: '' },
    ],
    enlaces: [{ a: 'a', b: 'sw', id: 'a-sw' }, { a: 'b', b: 'sw', id: 'b-sw' }, { a: 'c', b: 'sw', id: 'c-sw' }],
    pasos: [
      { texto: 'SW1 acaba de encenderse: su tabla de direcciones MAC está vacía.', acciones: [tabla('mac', 'Tabla MAC de SW1', 470, 210, 210, [['MAC', 'Puerto']])] },
      { texto: 'PC A envía una trama a PC B. SW1 mira la MAC de ORIGEN y aprende que AAAA está en el puerto Gi0/1.', acciones: [pk(['a', 'sw'], 'A → B', 'l2'), tabla('mac', 'Tabla MAC de SW1', 470, 210, 210, [['MAC', 'Puerto'], ['AAAA', 'Gi0/1']], 1)] },
      { texto: 'La MAC de DESTINO (BBBB) no está en la tabla: es un unicast desconocido. SW1 inunda la trama por todos los puertos excepto por el que entró.', acciones: [pk(['sw', 'b'], 'A → B', 'l2'), pk(['sw', 'c'], 'A → B', 'l2'), enlace('b-sw', 'on'), enlace('c-sw', 'on')] },
      { texto: 'PC C descarta la trama porque no va dirigida a su MAC. PC B responde, y SW1 aprende que BBBB está en Gi0/2.', acciones: [nodo('c', { sub: 'Descarta: no es para mí' }), enlace('c-sw', null), enlace('b-sw', null), pk(['b', 'sw'], 'B → A', 'l2'), tabla('mac', 'Tabla MAC de SW1', 470, 210, 210, [['MAC', 'Puerto'], ['AAAA', 'Gi0/1'], ['BBBB', 'Gi0/2']], 2)] },
      { texto: 'Ahora el destino (AAAA) sí está en la tabla: SW1 reenvía la trama solo por Gi0/1. Esto se llama filtrar.', acciones: [nodo('c', { sub: 'MAC CCCC · Gi0/3' }), pk(['sw', 'a'], 'B → A', 'l2'), enlace('a-sw', 'on')] },
      { texto: 'A partir de aquí, el tráfico entre A y B ya no se inunda. Si una entrada no se usa en 300 segundos, caduca y se borra.', acciones: [enlace('a-sw', null), pk(['a', 'sw', 'b'], 'A → B', 'l2'), tabla('mac', 'Tabla MAC de SW1', 470, 210, 210, [['MAC', 'Puerto'], ['AAAA', 'Gi0/1'], ['BBBB', 'Gi0/2']])] },
    ],
  },

  arp: {
    titulo: 'ARP: averiguar la MAC a partir de la IP', alto: 340,
    nodos: [
      { id: 'a', tipo: 'pc', x: 120, y: 70, etiqueta: 'PC A', sub: '192.168.1.10 · AAAA' },
      { id: 'b', tipo: 'pc', x: 600, y: 70, etiqueta: 'PC B', sub: '192.168.1.20 · BBBB' },
      { id: 'c', tipo: 'pc', x: 360, y: 270, etiqueta: 'PC C', sub: '192.168.1.30 · CCCC' },
      { id: 'sw', tipo: 'switch', x: 360, y: 140, etiqueta: 'SW1' },
    ],
    enlaces: [{ a: 'a', b: 'sw' }, { a: 'b', b: 'sw' }, { a: 'c', b: 'sw' }],
    pasos: [
      { texto: 'PC A quiere hacer ping a 192.168.1.20, que está en su misma red. Para construir la trama necesita la MAC de destino, pero su caché ARP está vacía.', acciones: [tabla('arp', 'Caché ARP de PC A', 20, 200, 230, [['IP', 'MAC']]), nodo('a', { estado: 'hl' })] },
      { texto: 'Envía un ARP Request en BROADCAST (destino FFFF.FFFF.FFFF): «¿Quién tiene 192.168.1.20? Respóndele a 192.168.1.10».', acciones: [pk(['a', 'sw', 'b'], 'ARP ¿.20?', 'l2'), pk(['a', 'sw', 'c'], 'ARP ¿.20?', 'l2')] },
      { texto: 'PC C ve que no es su IP y lo ignora. PC B sí: anota la MAC de A (le servirá para responder) y contesta con un ARP Reply en UNICAST.', acciones: [nodo('c', { sub: 'Ignora: no es mi IP' }), pk(['b', 'sw', 'a'], 'ARP .20 = BBBB', 'l2')] },
      { texto: 'PC A guarda la respuesta en su caché ARP. Así no tendrá que preguntar otra vez durante un tiempo.', acciones: [nodo('c', { sub: '192.168.1.30 · CCCC' }), tabla('arp', 'Caché ARP de PC A', 20, 200, 230, [['IP', 'MAC'], ['192.168.1.20', 'BBBB']], 1)] },
      { texto: 'Ya puede enviar el ping (ICMP Echo Request) dentro de una trama dirigida a la MAC BBBB. Si el destino estuviera en otra red, habría preguntado por la MAC de su puerta de enlace.', acciones: [nodo('a', { estado: null }), pk(['a', 'sw', 'b'], 'ICMP ping', 'l3')] },
    ],
  },

  tcp: {
    titulo: 'TCP: three-way handshake, datos y cierre',
    nodos: [
      { id: 'c', tipo: 'pc', x: 110, y: 150, etiqueta: 'Cliente', sub: 'CLOSED' },
      { id: 'n', tipo: 'cloud', x: 360, y: 150, etiqueta: 'Internet' },
      { id: 's', tipo: 'server', x: 610, y: 150, etiqueta: 'Servidor :443', sub: 'LISTEN' },
    ],
    enlaces: [{ a: 'c', b: 'n' }, { a: 'n', b: 's' }],
    pasos: [
      { texto: 'El servidor está escuchando en el puerto 443 (estado LISTEN). El cliente quiere abrir una conexión.', acciones: [] },
      { texto: '1) SYN: el cliente propone conectar y anuncia su número de secuencia inicial (seq = 100).', acciones: [pk(['c', 'n', 's'], 'SYN seq=100', 'l4'), nodo('c', { sub: 'SYN-SENT' })] },
      { texto: '2) SYN-ACK: el servidor acepta, confirma el número del cliente (ack = 101) y envía su propio número inicial (seq = 300).', acciones: [pk(['s', 'n', 'c'], 'SYN-ACK seq=300 ack=101', 'l4'), nodo('s', { sub: 'SYN-RECEIVED' })] },
      { texto: '3) ACK: el cliente confirma (ack = 301). La conexión queda establecida en los dos extremos.', acciones: [pk(['c', 'n', 's'], 'ACK ack=301', 'l4'), nodo('c', { sub: 'ESTABLISHED' }), nodo('s', { sub: 'ESTABLISHED' })] },
      { texto: 'Datos: el cliente envía 500 bytes (seq = 101). El servidor confirma que los ha recibido todos pidiendo el siguiente: ack = 601. Lo no confirmado se retransmite.', acciones: [pk(['c', 'n', 's'], 'Datos seq=101 (500 B)', 'l7'), pk(['s', 'n', 'c'], 'ACK ack=601', 'l4', { retardo: 1900 })] },
      { texto: 'Cierre: cada extremo envía un FIN y el otro lo confirma con un ACK (cuatro mensajes en total).', acciones: [pk(['c', 'n', 's'], 'FIN', 'l4'), pk(['s', 'n', 'c'], 'ACK', 'l4', { retardo: 1700 }), pk(['s', 'n', 'c'], 'FIN', 'l4', { retardo: 2300, dy: -28 }), pk(['c', 'n', 's'], 'ACK', 'l4', { retardo: 4100 }), nodo('c', { sub: 'CLOSED' }), nodo('s', { sub: 'LISTEN' })] },
    ],
  },

  dhcp: {
    titulo: 'DHCP: Discover, Offer, Request, Acknowledge',
    nodos: [
      { id: 'pc', tipo: 'pc', x: 110, y: 120, etiqueta: 'PC nuevo', sub: 'Sin IP (0.0.0.0)' },
      { id: 'sw', tipo: 'switch', x: 360, y: 120, etiqueta: 'SW1' },
      { id: 'srv', tipo: 'server', x: 610, y: 120, etiqueta: 'Servidor DHCP', sub: '192.168.1.2' },
    ],
    enlaces: [{ a: 'pc', b: 'sw' }, { a: 'sw', b: 'srv' }],
    pasos: [
      { texto: 'Un PC se conecta a la red. No tiene dirección IP y no sabe dónde está el servidor DHCP.', acciones: [nodo('pc', { estado: 'hl' })] },
      { texto: 'DISCOVER: el PC pregunta en broadcast (origen 0.0.0.0, destino 255.255.255.255, UDP 68 → 67): «¿Hay algún servidor DHCP?».', acciones: [pk(['pc', 'sw', 'srv'], 'DISCOVER', 'l7')] },
      { texto: 'OFFER: el servidor ofrece una dirección libre de su pool: 192.168.1.50, con su máscara, puerta de enlace, DNS y tiempo de concesión.', acciones: [pk(['srv', 'sw', 'pc'], 'OFFER .50', 'l7')] },
      { texto: 'REQUEST: el PC acepta la oferta, también en broadcast, para que otros servidores DHCP sepan que no ha elegido la suya.', acciones: [pk(['pc', 'sw', 'srv'], 'REQUEST .50', 'l7')] },
      { texto: 'ACK: el servidor confirma la concesión. El PC ya puede usar su configuración.', acciones: [pk(['srv', 'sw', 'pc'], 'ACK', 'l7'), nodo('pc', { sub: '192.168.1.50/24', estado: null }), tabla('lease', 'Configuración recibida', 20, 215, 290, [['IP', '192.168.1.50/24'], ['Gateway', '192.168.1.1'], ['DNS', '8.8.8.8'], ['Concesión', '24 h (renueva al 50 %)']])] },
      { texto: 'Si el servidor estuviera en otra red, el router de la LAN tendría que reenviarle estos broadcasts en unicast con «ip helper-address» (DHCP relay).', acciones: [] },
    ],
  },

  dns: {
    titulo: 'DNS: cómo se resuelve www.cisco.com', alto: 340,
    nodos: [
      { id: 'pc', tipo: 'pc', x: 80, y: 170, etiqueta: 'Tu PC' },
      { id: 'res', tipo: 'server', x: 290, y: 170, etiqueta: 'Resolver DNS', sub: 'del proveedor' },
      { id: 'root', tipo: 'server', x: 560, y: 55, etiqueta: 'Servidor raíz', sub: '.' },
      { id: 'tld', tipo: 'server', x: 640, y: 170, etiqueta: 'Servidor .com', sub: 'TLD' },
      { id: 'auth', tipo: 'server', x: 560, y: 280, etiqueta: 'Autoritativo', sub: 'cisco.com' },
    ],
    enlaces: [{ a: 'pc', b: 'res' }, { a: 'res', b: 'root' }, { a: 'res', b: 'tld' }, { a: 'res', b: 'auth' }],
    pasos: [
      { texto: 'Escribes www.cisco.com. Tu PC hace una consulta RECURSIVA a su resolver: «dame la respuesta final».', acciones: [pk(['pc', 'res'], 'A www.cisco.com?', 'l7')] },
      { texto: 'El resolver no lo tiene en caché. Empieza las consultas ITERATIVAS por un servidor raíz, que no sabe la IP pero sí quién lleva .com.', acciones: [pk(['res', 'root'], '¿www.cisco.com?', 'l7'), pk(['root', 'res'], 'Pregunta a .com', 'l7', { retardo: 1100 })] },
      { texto: 'Pregunta al servidor de .com, que le remite a los servidores autoritativos de cisco.com.', acciones: [pk(['res', 'tld'], '¿www.cisco.com?', 'l7'), pk(['tld', 'res'], 'Pregunta a cisco.com', 'l7', { retardo: 1100 })] },
      { texto: 'El autoritativo de cisco.com conoce el registro: devuelve la dirección IP (un registro A).', acciones: [pk(['res', 'auth'], '¿www.cisco.com?', 'l7'), pk(['auth', 'res'], 'A 198.51.100.25', 'l7', { retardo: 1100 })] },
      { texto: 'El resolver responde a tu PC y guarda la respuesta en caché durante su TTL. La próxima consulta igual se responderá al instante.', acciones: [pk(['res', 'pc'], 'A 198.51.100.25', 'l7'), tabla('cache', 'Caché del resolver', 150, 255, 250, [['Nombre', 'IP · TTL'], ['www.cisco.com', '198.51.100.25 · 300 s']], 1)] },
    ],
  },

  vlan: {
    titulo: 'VLAN y trunk 802.1Q', alto: 330,
    nodos: [
      { id: 'a', tipo: 'pc', x: 90, y: 70, etiqueta: 'PC A', sub: 'VLAN 10' },
      { id: 'b', tipo: 'pc', x: 90, y: 250, etiqueta: 'PC B', sub: 'VLAN 20' },
      { id: 'sw1', tipo: 'switch', x: 250, y: 160, etiqueta: 'SW1' },
      { id: 'sw2', tipo: 'switch', x: 470, y: 160, etiqueta: 'SW2' },
      { id: 'c', tipo: 'pc', x: 630, y: 70, etiqueta: 'PC C', sub: 'VLAN 10' },
      { id: 'd', tipo: 'pc', x: 630, y: 250, etiqueta: 'PC D', sub: 'VLAN 20' },
    ],
    enlaces: [{ a: 'a', b: 'sw1' }, { a: 'b', b: 'sw1' }, { a: 'sw1', b: 'sw2', id: 'trunk', texto: 'Trunk 802.1Q (VLAN 10, 20)' }, { a: 'sw2', b: 'c' }, { a: 'sw2', b: 'd' }],
    pasos: [
      { texto: 'Dos switches con dos VLAN. Los PC se conectan a puertos de acceso; entre los switches hay un trunk que transporta las dos VLAN.', acciones: [enlace('trunk', 'on')] },
      { texto: 'PC A (VLAN 10) envía un broadcast. Su trama sale sin etiqueta: los equipos finales no saben nada de VLAN.', acciones: [pk(['a', 'sw1'], 'Broadcast', 'l2')] },
      { texto: 'SW1 no lo envía a PC B (VLAN 20). Por el trunk lo manda con una etiqueta 802.1Q de 4 bytes que dice «VLAN 10».', acciones: [pk(['sw1', 'sw2'], 'Etiqueta VLAN 10', 'l3')] },
      { texto: 'SW2 lee la etiqueta, la quita y entrega la trama solo en los puertos de la VLAN 10: le llega a PC C, pero no a PC D.', acciones: [pk(['sw2', 'c'], 'Broadcast', 'l2'), nodo('d', { sub: 'VLAN 20 · no la recibe' })] },
      { texto: 'Lo mismo con la VLAN 20: el tráfico de PC B solo llega a PC D. Cada VLAN es un dominio de broadcast separado.', acciones: [nodo('d', { sub: 'VLAN 20' }), pk(['b', 'sw1'], 'Broadcast', 'l2'), pk(['sw1', 'sw2'], 'Etiqueta VLAN 20', 'l3', { retardo: 900 }), pk(['sw2', 'd'], 'Broadcast', 'l2', { retardo: 1800 })] },
      { texto: 'Para que PC A hable con PC B (VLAN distintas) hace falta un router o un switch de capa 3 que enrute entre las VLAN.', acciones: [] },
    ],
  },

  stp: {
    titulo: 'Spanning Tree: elegir el raíz y bloquear el bucle', alto: 330,
    nodos: [
      { id: 's1', tipo: 'switch', x: 360, y: 60, etiqueta: 'SW1', sub: 'Prioridad 32769 · MAC …0001' },
      { id: 's2', tipo: 'switch', x: 170, y: 240, etiqueta: 'SW2', sub: 'Prioridad 32769 · MAC …0002' },
      { id: 's3', tipo: 'switch', x: 550, y: 240, etiqueta: 'SW3', sub: 'Prioridad 32769 · MAC …0003' },
    ],
    enlaces: [{ a: 's1', b: 's2', id: '12', texto: '1 Gbps · coste 4', dx: -60 }, { a: 's1', b: 's3', id: '13', texto: '1 Gbps · coste 4', dx: 60 }, { a: 's2', b: 's3', id: '23', texto: '1 Gbps · coste 4', dy: 18 }],
    pasos: [
      { texto: 'Tres switches en triángulo: hay redundancia, pero también un bucle. Sin STP, un broadcast daría vueltas para siempre.', acciones: [] },
      { texto: 'Los switches intercambian BPDU cada 2 segundos. Al principio, cada uno se considera raíz.', acciones: [pk(['s1', 's2'], 'BPDU', 'l2'), pk(['s2', 's3'], 'BPDU', 'l2'), pk(['s3', 's1'], 'BPDU', 'l2')] },
      { texto: 'Empatan en prioridad, así que decide la MAC más baja: SW1 es el puente raíz. Todos sus puertos son designados.', acciones: [nodo('s1', { estado: 'hl', sub: 'PUENTE RAÍZ' })] },
      { texto: 'SW2 y SW3 eligen su puerto raíz: el de menor coste hasta SW1 (el enlace directo, coste 4).', acciones: [enlace('12', 'on'), enlace('13', 'on')] },
      { texto: 'En el enlace SW2–SW3, ambos ofrecen coste 4 al raíz: desempata el Bridge ID más bajo. SW2 tiene el puerto designado y SW3 BLOQUEA su puerto. Bucle eliminado.', acciones: [enlace('23', 'blocked'), nodo('s3', { sub: 'Puerto hacia SW2: bloqueado' })] },
      { texto: 'Si falla el enlace SW1–SW3, SW3 deja de recibir BPDU por él y activa el puerto bloqueado: el tráfico vuelve a fluir por SW2 (con RSTP, en uno o dos segundos).', acciones: [enlace('13', 'blocked'), enlace('23', 'on'), nodo('s3', { sub: 'Nuevo puerto raíz: hacia SW2' })] },
    ],
  },

  enrutamiento: {
    titulo: 'Un paquete atraviesa dos routers', alto: 340,
    nodos: [
      { id: 'a', tipo: 'pc', x: 70, y: 110, etiqueta: 'PC1', sub: '10.1.1.10' },
      { id: 'r1', tipo: 'router', x: 270, y: 110, etiqueta: 'R1' },
      { id: 'r2', tipo: 'router', x: 470, y: 110, etiqueta: 'R2' },
      { id: 'b', tipo: 'server', x: 660, y: 110, etiqueta: 'Servidor', sub: '10.2.2.20' },
    ],
    enlaces: [{ a: 'a', b: 'r1', texto: '10.1.1.0/24' }, { a: 'r1', b: 'r2', texto: '10.0.12.0/30' }, { a: 'r2', b: 'b', texto: '10.2.2.0/24' }],
    pasos: [
      { texto: 'PC1 quiere enviar un paquete al servidor 10.2.2.20. Está en otra red, así que lo manda a su puerta de enlace, R1.', acciones: [pk(['a', 'r1'], 'Paquete', 'l3'), tabla('h', 'Cabeceras en el tramo PC1 → R1', 150, 200, 420, [['MAC origen: PC1', 'MAC destino: R1 (Gi0/0)'], ['IP origen: 10.1.1.10', 'IP destino: 10.2.2.20'], ['TTL: 64', '']])] },
      { texto: 'R1 consulta su tabla: la coincidencia más larga para 10.2.2.20 es 10.2.2.0/24, vía 10.0.12.2 (R2). Reduce el TTL a 63.', acciones: [nodo('r1', { estado: 'hl', sub: '10.2.2.0/24 → 10.0.12.2' })] },
      { texto: 'R1 construye una trama NUEVA: cambian las MAC (ahora de R1 a R2), pero las IP de origen y destino no cambian.', acciones: [nodo('r1', { estado: null }), pk(['r1', 'r2'], 'Paquete', 'l3'), tabla('h', 'Cabeceras en el tramo R1 → R2', 150, 200, 420, [['MAC origen: R1 (Gi0/1)', 'MAC destino: R2 (Gi0/0)'], ['IP origen: 10.1.1.10', 'IP destino: 10.2.2.20'], ['TTL: 63', '']], 0)] },
      { texto: 'R2 tiene la red 10.2.2.0/24 directamente conectada. Resuelve con ARP la MAC del servidor, reduce el TTL a 62 y le entrega el paquete.', acciones: [nodo('r2', { estado: 'hl', sub: 'C 10.2.2.0/24' }), pk(['r2', 'b'], 'Paquete', 'l3', { retardo: 600 }), tabla('h', 'Cabeceras en el tramo R2 → Servidor', 150, 200, 420, [['MAC origen: R2 (Gi0/1)', 'MAC destino: Servidor'], ['IP origen: 10.1.1.10', 'IP destino: 10.2.2.20'], ['TTL: 62', '']], 0)] },
      { texto: 'La respuesta hace el camino inverso. Para que llegue, R2 y R1 necesitan ruta hacia 10.1.1.0/24: el enrutamiento siempre tiene ida y vuelta.', acciones: [nodo('r2', { estado: null, sub: '' }), pk(['b', 'r2', 'r1', 'a'], 'Respuesta', 'l3')] },
    ],
  },

  nat: {
    titulo: 'PAT: muchos equipos, una sola IP pública', alto: 330,
    nodos: [
      { id: 'a', tipo: 'pc', x: 90, y: 70, etiqueta: 'PC1', sub: '192.168.1.10' },
      { id: 'b', tipo: 'pc', x: 90, y: 230, etiqueta: 'PC2', sub: '192.168.1.11' },
      { id: 'r', tipo: 'router', x: 330, y: 150, etiqueta: 'R1 (PAT)', sub: 'Pública 203.0.113.5' },
      { id: 'w', tipo: 'server', x: 630, y: 150, etiqueta: 'Servidor web', sub: '198.51.100.80' },
    ],
    enlaces: [{ a: 'a', b: 'r' }, { a: 'b', b: 'r' }, { a: 'r', b: 'w', texto: 'Internet' }],
    pasos: [
      { texto: 'Dos PC con direcciones privadas quieren navegar. Las IP privadas no se enrutan en internet: R1 hace PAT (NAT overload).', acciones: [tabla('nat', 'Tabla NAT de R1', 400, 225, 300, [['Inside local', 'Inside global']])] },
      { texto: 'PC1 envía desde 192.168.1.10:51000. R1 cambia el origen por su IP pública y un puerto propio: 203.0.113.5:1024, y lo anota.', acciones: [pk(['a', 'r'], '.10:51000', 'l3'), pk(['r', 'w'], '203.0.113.5:1024', 'l3', { retardo: 900 }), tabla('nat', 'Tabla NAT de R1', 400, 225, 300, [['Inside local', 'Inside global'], ['192.168.1.10:51000', '203.0.113.5:1024']], 1)] },
      { texto: 'PC2 sale a la vez, también desde el puerto 51000. R1 le asigna otro puerto público (1025): así distingue las dos conexiones.', acciones: [pk(['b', 'r'], '.11:51000', 'l3'), pk(['r', 'w'], '203.0.113.5:1025', 'l3', { retardo: 900 }), tabla('nat', 'Tabla NAT de R1', 400, 225, 300, [['Inside local', 'Inside global'], ['192.168.1.10:51000', '203.0.113.5:1024'], ['192.168.1.11:51000', '203.0.113.5:1025']], 2)] },
      { texto: 'El servidor responde a 203.0.113.5:1025. R1 busca ese puerto en su tabla y deshace la traducción: el paquete va a 192.168.1.11:51000 (PC2).', acciones: [pk(['w', 'r'], '→ 203.0.113.5:1025', 'l3'), pk(['r', 'b'], '→ .11:51000', 'l3', { retardo: 900 }), tabla('nat', 'Tabla NAT de R1', 400, 225, 300, [['Inside local', 'Inside global'], ['192.168.1.10:51000', '203.0.113.5:1024'], ['192.168.1.11:51000', '203.0.113.5:1025']], 2)] },
    ],
  },

  acl: {
    titulo: 'Una ACL extendida en acción', alto: 330,
    nodos: [
      { id: 'a', tipo: 'pc', x: 90, y: 70, etiqueta: 'Ventas', sub: '192.168.10.5' },
      { id: 'b', tipo: 'pc', x: 90, y: 230, etiqueta: 'Invitados', sub: '192.168.20.5' },
      { id: 'r', tipo: 'router', x: 330, y: 150, etiqueta: 'R1', sub: 'ACL de entrada' },
      { id: 's', tipo: 'server', x: 630, y: 150, etiqueta: 'Servidor', sub: '10.50.0.20' },
    ],
    enlaces: [{ a: 'a', b: 'r' }, { a: 'b', b: 'r' }, { a: 'r', b: 's' }],
    pasos: [
      { texto: 'R1 tiene una ACL que se evalúa de arriba abajo; la primera regla que coincide decide. Al final hay un deny any implícito.', acciones: [tabla('acl', 'ACL SERVIDOR', 400, 220, 310, [['10 permit tcp 192.168.10.0/24 → .20 eq 443'], ['20 deny ip 192.168.20.0/24 → .20'], ['30 permit ip any any'], ['(deny any implícito)']])] },
      { texto: 'Ventas accede por HTTPS (TCP 443). Coincide con la regla 10: permitido.', acciones: [pk(['a', 'r', 's'], 'TCP 443', 'ok'), tabla('acl', 'ACL SERVIDOR', 400, 220, 310, [['10 permit tcp 192.168.10.0/24 → .20 eq 443'], ['20 deny ip 192.168.20.0/24 → .20'], ['30 permit ip any any'], ['(deny any implícito)']], 0)] },
      { texto: 'Invitados intenta llegar al servidor. No coincide con la 10, sí con la 20: el paquete se descarta en R1.', acciones: [pk(['b', 'r'], 'Descartado', 'bad'), tabla('acl', 'ACL SERVIDOR', 400, 220, 310, [['10 permit tcp 192.168.10.0/24 → .20 eq 443'], ['20 deny ip 192.168.20.0/24 → .20'], ['30 permit ip any any'], ['(deny any implícito)']], 1)] },
      { texto: 'El resto del tráfico coincide con la regla 30 y pasa. Sin ella, el deny any implícito lo bloquearía todo.', acciones: [pk(['a', 'r', 's'], 'Otro tráfico', 'ok'), tabla('acl', 'ACL SERVIDOR', 400, 220, 310, [['10 permit tcp 192.168.10.0/24 → .20 eq 443'], ['20 deny ip 192.168.20.0/24 → .20'], ['30 permit ip any any'], ['(deny any implícito)']], 2)] },
    ],
  },

  ospf: {
    titulo: 'OSPF: de vecinos a tabla de enrutamiento', alto: 330,
    nodos: [
      { id: 'r1', tipo: 'router', x: 150, y: 90, etiqueta: 'R1', sub: 'RID 1.1.1.1' },
      { id: 'r2', tipo: 'router', x: 570, y: 90, etiqueta: 'R2', sub: 'RID 2.2.2.2' },
      { id: 'r3', tipo: 'router', x: 360, y: 230, etiqueta: 'R3', sub: 'RID 3.3.3.3 · LAN 10.3.3.0/24' },
    ],
    enlaces: [{ a: 'r1', b: 'r2', id: '12', texto: 'coste 10' }, { a: 'r1', b: 'r3', id: '13', texto: 'coste 1', dx: -40 }, { a: 'r3', b: 'r2', id: '32', texto: 'coste 1', dx: 40 }],
    pasos: [
      { texto: 'Tres routers en el área 0. Cada uno envía Hello cada 10 s a 224.0.0.5 para descubrir vecinos.', acciones: [pk(['r1', 'r2'], 'Hello', 'l3'), pk(['r2', 'r3'], 'Hello', 'l3'), pk(['r3', 'r1'], 'Hello', 'l3')] },
      { texto: 'Cuando cada uno ve su propio Router ID en el Hello del vecino, pasan a 2-Way. Coinciden área, subred, temporizadores y MTU, así que siguen.', acciones: [enlace('12', 'on'), enlace('13', 'on'), enlace('32', 'on')] },
      { texto: 'ExStart y Exchange: intercambian resúmenes de su base de datos (DBD). Loading: piden con LSR los LSA que les faltan y los reciben en LSU.', acciones: [pk(['r1', 'r3'], 'DBD', 'l3'), pk(['r3', 'r1'], 'LSR', 'l3', { retardo: 1000 }), pk(['r1', 'r3'], 'LSU', 'l3', { retardo: 2000 })] },
      { texto: 'Full: todos tienen la misma LSDB, el mapa completo del área con el coste de cada enlace.', acciones: [nodo('r1', { estado: 'hl' }), nodo('r2', { estado: 'hl' }), nodo('r3', { estado: 'hl' })] },
      { texto: 'R1 ejecuta SPF (Dijkstra) sumando los costes de salida: hasta la LAN de R2, por R3 cuesta 1 + 1 + 1 (la propia LAN) = 3, menos que por el enlace directo (10 + 1 = 11). Instala el camino por R3.', acciones: [nodo('r2', { estado: null }), nodo('r3', { estado: null }), enlace('12', null), tabla('rt', 'Tabla de R1 (OSPF)', 20, 230, 230, [['Destino', 'Vía · coste'], ['LAN de R2', 'R3 · 3'], ['10.3.3.0/24', 'R3 · 2']], 1), pk(['r1', 'r3', 'r2'], 'Datos', 'l7')] },
      { texto: 'Si cae el enlace R1–R3, se inunda un LSA con el cambio, todos recalculan SPF y R1 pasa a usar el enlace directo con R2.', acciones: [enlace('13', 'blocked'), enlace('12', 'on'), tabla('rt', 'Tabla de R1 (OSPF)', 20, 230, 230, [['Destino', 'Vía · coste'], ['LAN de R2', 'R2 · 11'], ['10.3.3.0/24', 'R2 · 12']], 1), pk(['r1', 'r2'], 'Datos', 'l7')] },
    ],
  },
};

export function montarAnimacion(holder, id) {
  const escena = ESCENAS[id];
  if (!escena) throw new Error('Animación desconocida: ' + id);
  return crearAnimacion(holder, escena);
}
