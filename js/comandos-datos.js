// Guía de comandos de Cisco IOS: qué hace cada uno, en qué modo se escribe, su nivel y un ejemplo.
// lab = laboratorio del simulador donde practicarlo (cli:<id>).
export const MODOS = {
  user: 'Router>  (usuario)',
  priv: 'Router#  (privilegiado)',
  config: '(config)#  (configuración global)',
  if: '(config-if)#  (interfaz)',
  line: '(config-line)#  (línea)',
  vlan: '(config-vlan)#',
  router: '(config-router)#  (OSPF)',
  dhcp: '(dhcp-config)#',
  acl: '(config-ext-nacl)#',
};

export const CATEGORIAS = [
  { id: 'modos', titulo: 'Moverse por el IOS', texto: 'Los modos del sistema, la ayuda y los atajos. Es lo primero que hay que dominar.' },
  { id: 'basico', titulo: 'Configuración básica y guardar', texto: 'Nombre, contraseñas, banner y guardar la configuración para que sobreviva a un reinicio.' },
  { id: 'interfaces', titulo: 'Interfaces', texto: 'Encender, dar IP, describir y revisar el estado de los puertos.' },
  { id: 'vlan', titulo: 'VLAN y trunks', texto: 'Separar la red en VLAN y llevarlas entre switches.' },
  { id: 'rutas', titulo: 'Enrutamiento', texto: 'Rutas estáticas, ruta por defecto, enrutamiento entre VLAN y pruebas de conectividad.' },
  { id: 'ospf', titulo: 'OSPF', texto: 'Enrutamiento dinámico de área única.' },
  { id: 'servicios', titulo: 'Servicios IP', texto: 'DHCP, NAT, NTP, Syslog y descubrimiento de vecinos.' },
  { id: 'seguridad', titulo: 'Seguridad', texto: 'SSH, usuarios, ACL y protección de los puertos.' },
  { id: 'diagnostico', titulo: 'Diagnóstico (troubleshooting)', texto: 'Los show que usarás cada día para encontrar averías, y qué buscar en cada uno.' },
];

export const COMANDOS = [
  // ---------------------------------------------------------------- modos
  { cat: 'modos', cmd: 'enable', modo: 'user', nivel: 1, que: 'Pasa del modo usuario (>) al privilegiado (#), donde se ven todas las configuraciones y se puede entrar a configurar.', ej: ['Switch> enable', 'Switch#'], lab: 'basico' },
  { cat: 'modos', cmd: 'configure terminal', modo: 'priv', nivel: 1, que: 'Entra en el modo de configuración global. Se abrevia «conf t».', ej: ['Switch# configure terminal', 'Switch(config)#'], lab: 'basico' },
  { cat: 'modos', cmd: 'exit', modo: 'config', nivel: 1, que: 'Sube un nivel: de interfaz a configuración global, o de global a privilegiado.', ej: ['Switch(config-if)# exit', 'Switch(config)#'] },
  { cat: 'modos', cmd: 'end  (o Ctrl+Z)', modo: 'config', nivel: 1, que: 'Vuelve directamente al modo privilegiado desde cualquier submodo de configuración.', ej: ['Switch(config-if)# end', 'Switch#'] },
  { cat: 'modos', cmd: '?', modo: 'user', nivel: 1, que: 'Ayuda contextual: lista los comandos disponibles en el modo actual. «show ?» lista lo que puede ir detrás de show.', ej: ['Switch# show ?'] },
  { cat: 'modos', cmd: 'Tab', modo: 'user', nivel: 1, que: 'Completa la palabra que estás escribiendo si no hay ambigüedad. También se puede abreviar: «sh ip int br» = «show ip interface brief».', ej: ['Switch# sh run    (equivale a show running-config)'] },
  { cat: 'modos', cmd: 'do <comando>', modo: 'config', nivel: 1, que: 'Ejecuta un comando de modo privilegiado (show, ping, copy) sin salir del modo de configuración.', ej: ['Switch(config-if)# do show vlan brief'] },
  { cat: 'modos', cmd: 'no <comando>', modo: 'config', nivel: 1, que: 'Deshace o borra lo que hace un comando. Es la forma de "borrar" en IOS.', ej: ['R1(config-if)# no shutdown', 'R1(config)# no ip route 0.0.0.0 0.0.0.0 10.0.12.6'] },
  { cat: 'modos', cmd: 'show history', modo: 'priv', nivel: 1, que: 'Muestra los últimos comandos escritos. Con las flechas ↑ y ↓ los recuperas.', ej: ['Switch# show history'] },

  // ---------------------------------------------------------------- básico
  { cat: 'basico', cmd: 'hostname <nombre>', modo: 'config', nivel: 1, que: 'Cambia el nombre del equipo (aparece en el prompt). Imprescindible para SSH y para saber dónde estás.', ej: ['Switch(config)# hostname SW-OFICINA', 'SW-OFICINA(config)#'], lab: 'basico' },
  { cat: 'basico', cmd: 'enable secret <contraseña>', modo: 'config', nivel: 1, que: 'Protege el modo privilegiado con una contraseña guardada con hash. Usa siempre secret, nunca enable password.', ej: ['SW1(config)# enable secret Cl4ve-Priv!'], lab: 'basico' },
  { cat: 'basico', cmd: 'service password-encryption', modo: 'config', nivel: 1, que: 'Oculta (cifrado débil tipo 7) las contraseñas que se guardan en texto plano, como las de las líneas. Evita que se lean de un vistazo.', ej: ['SW1(config)# service password-encryption'], lab: 'basico' },
  { cat: 'basico', cmd: 'banner motd #texto#', modo: 'config', nivel: 1, que: 'Mensaje que ve quien se conecta. Se usa para avisos legales de acceso restringido.', ej: ['SW1(config)# banner motd # Acceso solo para personal autorizado #'], lab: 'basico' },
  { cat: 'basico', cmd: 'line console 0 / password / login', modo: 'config', nivel: 1, que: 'Protege el puerto de consola (cable directo al equipo) con contraseña.', ej: ['SW1(config)# line console 0', 'SW1(config-line)# password C0nsola!', 'SW1(config-line)# login', 'SW1(config-line)# exec-timeout 5 0'], lab: 'basico' },
  { cat: 'basico', cmd: 'no ip domain-lookup', modo: 'config', nivel: 1, que: 'Evita que el equipo intente resolver por DNS cada palabra mal escrita (y se quede "colgado" unos segundos).', ej: ['SW1(config)# no ip domain-lookup'] },
  { cat: 'basico', cmd: 'copy running-config startup-config', modo: 'priv', nivel: 1, que: 'Guarda la configuración activa (RAM) en la de arranque (NVRAM). Lo que no guardas se pierde al reiniciar. Atajo: «wr».', ej: ['SW1# copy running-config startup-config', 'Destination filename [startup-config]?', '[OK]'], lab: 'basico' },
  { cat: 'basico', cmd: 'show running-config', modo: 'priv', nivel: 1, que: 'Muestra la configuración activa en este momento. «show run | include hostname» filtra líneas.', ej: ['SW1# show running-config'], lab: 'basico' },
  { cat: 'basico', cmd: 'show version', modo: 'priv', nivel: 1, que: 'Modelo, versión de IOS, tiempo encendido y registro de configuración.', ej: ['R1# show version'] },

  // ---------------------------------------------------------------- interfaces
  { cat: 'interfaces', cmd: 'interface <tipo número>', modo: 'config', nivel: 1, que: 'Entra a configurar una interfaz. Se puede abreviar: g0/1, fa0/5, vlan 10.', ej: ['R1(config)# interface g0/0', 'R1(config-if)#'], lab: 'router' },
  { cat: 'interfaces', cmd: 'ip address <ip> <máscara>', modo: 'if', nivel: 1, que: 'Asigna la dirección IP a una interfaz de router, a una SVI o a un puerto enrutado.', ej: ['R1(config-if)# ip address 192.168.1.1 255.255.255.0'], lab: 'router' },
  { cat: 'interfaces', cmd: 'no shutdown', modo: 'if', nivel: 1, que: 'Enciende la interfaz. Las de router vienen apagadas de fábrica; las de switch, encendidas.', ej: ['R1(config-if)# no shutdown', '%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up'], lab: 'router' },
  { cat: 'interfaces', cmd: 'description <texto>', modo: 'if', nivel: 1, que: 'Etiqueta la interfaz (a quién conecta). Aparece en show interfaces status. Te ahorra horas al diagnosticar.', ej: ['R1(config-if)# description Enlace al ISP'], lab: 'router' },
  { cat: 'interfaces', cmd: 'interface range <inicio - fin>', modo: 'config', nivel: 1, que: 'Configura varias interfaces a la vez.', ej: ['SW1(config)# interface range fa0/1 - 10', 'SW1(config-if-range)# switchport access vlan 10'], lab: 'vlan' },
  { cat: 'interfaces', cmd: 'duplex / speed', modo: 'if', nivel: 2, que: 'Fija dúplex y velocidad. Lo normal es auto en los dos extremos; si se fija, debe ser igual en ambos.', ej: ['SW1(config-if)# duplex auto', 'SW1(config-if)# speed auto'], lab: 'averia-duplex' },
  { cat: 'interfaces', cmd: 'show ip interface brief', modo: 'priv', nivel: 1, que: 'Resumen de todas las interfaces: IP, Status y Protocol. El comando más usado del mundo Cisco.', ej: ['R1# show ip interface brief'], lab: 'router' },

  // ---------------------------------------------------------------- VLAN
  { cat: 'vlan', cmd: 'vlan <id> / name <nombre>', modo: 'config', nivel: 1, que: 'Crea una VLAN y le pone nombre.', ej: ['SW1(config)# vlan 10', 'SW1(config-vlan)# name VENTAS'], lab: 'vlan' },
  { cat: 'vlan', cmd: 'switchport mode access', modo: 'if', nivel: 1, que: 'Convierte el puerto en puerto de acceso (para un PC, impresora, teléfono…). Desactiva la negociación de trunk.', ej: ['SW1(config-if)# switchport mode access'], lab: 'vlan' },
  { cat: 'vlan', cmd: 'switchport access vlan <id>', modo: 'if', nivel: 1, que: 'Asigna el puerto de acceso a una VLAN.', ej: ['SW1(config-if)# switchport access vlan 10'], lab: 'vlan' },
  { cat: 'vlan', cmd: 'switchport voice vlan <id>', modo: 'if', nivel: 2, que: 'VLAN de voz para un teléfono IP con un PC detrás en el mismo puerto.', ej: ['SW1(config-if)# switchport voice vlan 150'] },
  { cat: 'vlan', cmd: 'switchport mode trunk', modo: 'if', nivel: 2, que: 'Convierte el puerto en trunk 802.1Q: transporta varias VLAN etiquetadas entre switches o hacia un router.', ej: ['SW1(config-if)# switchport mode trunk'], lab: 'trunk' },
  { cat: 'vlan', cmd: 'switchport trunk native vlan <id>', modo: 'if', nivel: 2, que: 'VLAN que viaja sin etiqueta por el trunk. Debe ser igual en los dos extremos; por seguridad, una VLAN sin uso.', ej: ['SW1(config-if)# switchport trunk native vlan 99'], lab: 'trunk' },
  { cat: 'vlan', cmd: 'switchport trunk allowed vlan [add|remove] <lista>', modo: 'if', nivel: 2, que: 'Limita qué VLAN pasan por el trunk. ¡Sin add, la lista se sustituye entera!', ej: ['SW1(config-if)# switchport trunk allowed vlan 10,20,99', 'SW1(config-if)# switchport trunk allowed vlan add 30'], lab: 'averia-trunk' },
  { cat: 'vlan', cmd: 'switchport nonegotiate', modo: 'if', nivel: 2, que: 'Desactiva DTP (la negociación automática de trunks). Buena práctica de seguridad.', ej: ['SW1(config-if)# switchport nonegotiate'], lab: 'trunk' },
  { cat: 'vlan', cmd: 'show vlan brief', modo: 'priv', nivel: 1, que: 'Lista las VLAN y qué puertos de acceso tiene cada una (los trunks no aparecen aquí).', ej: ['SW1# show vlan brief'], lab: 'vlan' },
  { cat: 'vlan', cmd: 'show interfaces trunk', modo: 'priv', nivel: 2, que: 'Trunks activos, su VLAN nativa y las VLAN permitidas. Si un puerto no sale, no es trunk.', ej: ['SW1# show interfaces trunk'], lab: 'averia-trunk' },
  { cat: 'vlan', cmd: 'show interfaces <if> switchport', modo: 'priv', nivel: 2, que: 'Modo configurado (Administrative) frente al modo real (Operational), VLAN de acceso y nativa.', ej: ['SW1# show interfaces g0/1 switchport'], lab: 'averia-trunk' },

  // ---------------------------------------------------------------- rutas
  { cat: 'rutas', cmd: 'ip route <red> <máscara> <siguiente salto>', modo: 'config', nivel: 2, que: 'Ruta estática: «para llegar a esta red, envía a este router». Solo se instala si el siguiente salto es alcanzable.', ej: ['R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2'], lab: 'estatica' },
  { cat: 'rutas', cmd: 'ip route 0.0.0.0 0.0.0.0 <siguiente salto>', modo: 'config', nivel: 1, que: 'Ruta por defecto: lo que no conozcas, envíalo aquí (normalmente al proveedor de Internet).', ej: ['R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1'], lab: 'router' },
  { cat: 'rutas', cmd: 'ip route … <distancia>', modo: 'config', nivel: 2, que: 'Ruta flotante: con una distancia administrativa mayor, solo se usa si cae la principal.', ej: ['R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.13.2 5'], lab: 'estatica' },
  { cat: 'rutas', cmd: 'interface g0/0.10 / encapsulation dot1q 10', modo: 'if', nivel: 2, que: 'Router-on-a-stick: una subinterfaz por VLAN sobre un único enlace trunk. Primero encapsulation, después la IP.', ej: ['R1(config)# interface g0/0.10', 'R1(config-subif)# encapsulation dot1q 10', 'R1(config-subif)# ip address 192.168.10.1 255.255.255.0'], lab: 'intervlan' },
  { cat: 'rutas', cmd: 'ip default-gateway <ip>', modo: 'config', nivel: 1, que: 'Puerta de enlace de un switch de capa 2, para que se pueda administrar desde otras redes.', ej: ['SW1(config)# ip default-gateway 192.168.99.1'], lab: 'averia-gestion' },
  { cat: 'rutas', cmd: 'ip routing', modo: 'config', nivel: 2, que: 'Activa el enrutamiento en un switch de capa 3 (para enrutar entre VLAN con SVI).', ej: ['SW-CORE(config)# ip routing'] },
  { cat: 'rutas', cmd: 'show ip route', modo: 'priv', nivel: 2, que: 'La tabla de rutas: C conectada, L local, S estática, O OSPF, S* ruta por defecto. Mira también «Gateway of last resort».', ej: ['R1# show ip route'], lab: 'estatica' },
  { cat: 'rutas', cmd: 'ping <ip>', modo: 'priv', nivel: 1, que: '¿Llega y vuelve? ! = sí, . = sin respuesta, U = inalcanzable (a menudo una ACL).', ej: ['R1# ping 8.8.8.8', '!!!!!'], lab: 'router' },
  { cat: 'rutas', cmd: 'traceroute <ip>', modo: 'priv', nivel: 2, que: 'Muestra por qué routers pasa el paquete y dónde se corta.', ej: ['R1# traceroute 8.8.8.8'] },

  // ---------------------------------------------------------------- OSPF
  { cat: 'ospf', cmd: 'router ospf <proceso>', modo: 'config', nivel: 3, que: 'Crea el proceso OSPF (el número es local, no tiene que coincidir con el vecino).', ej: ['R1(config)# router ospf 1'], lab: 'ospf' },
  { cat: 'ospf', cmd: 'router-id <a.b.c.d>', modo: 'router', nivel: 3, que: 'Fija el identificador del router. Si no, se elige la loopback más alta o la IP más alta.', ej: ['R1(config-router)# router-id 1.1.1.1'], lab: 'ospf' },
  { cat: 'ospf', cmd: 'network <red> <wildcard> area <n>', modo: 'router', nivel: 3, que: 'Activa OSPF en las interfaces cuya IP encaja con la red y la wildcard, y las mete en esa área.', ej: ['R1(config-router)# network 10.0.12.0 0.0.0.3 area 0'], lab: 'ospf' },
  { cat: 'ospf', cmd: 'ip ospf <proceso> area <n>', modo: 'if', nivel: 3, que: 'Alternativa a network: activa OSPF directamente en la interfaz.', ej: ['R1(config-if)# ip ospf 1 area 0'] },
  { cat: 'ospf', cmd: 'passive-interface <if>', modo: 'router', nivel: 3, que: 'No envía hellos por esa interfaz (LAN de usuarios), pero sigue anunciando su red. Una interfaz pasiva nunca tendrá vecinos.', ej: ['R1(config-router)# passive-interface g0/0'], lab: 'averia-ospf' },
  { cat: 'ospf', cmd: 'default-information originate', modo: 'router', nivel: 3, que: 'Anuncia la ruta por defecto a los demás routers OSPF.', ej: ['R1(config-router)# default-information originate'] },
  { cat: 'ospf', cmd: 'show ip ospf neighbor', modo: 'priv', nivel: 3, que: 'Vecinos OSPF y su estado. FULL = adyacencia completa.', ej: ['R1# show ip ospf neighbor'], lab: 'ospf' },
  { cat: 'ospf', cmd: 'show ip protocols', modo: 'priv', nivel: 3, que: 'Router ID, redes anunciadas, áreas e interfaces pasivas.', ej: ['R1# show ip protocols'], lab: 'averia-ospf' },

  // ---------------------------------------------------------------- servicios
  { cat: 'servicios', cmd: 'ip dhcp excluded-address <inicio> [fin]', modo: 'config', nivel: 2, que: 'Reserva direcciones que el DHCP no debe repartir (router, impresoras, servidores).', ej: ['R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.10'], lab: 'dhcp' },
  { cat: 'servicios', cmd: 'ip dhcp pool <nombre>', modo: 'config', nivel: 2, que: 'Crea un ámbito DHCP: red, puerta de enlace y DNS que se entregan a los clientes.', ej: ['R1(config)# ip dhcp pool VENTAS', 'R1(dhcp-config)# network 192.168.10.0 255.255.255.0', 'R1(dhcp-config)# default-router 192.168.10.1', 'R1(dhcp-config)# dns-server 8.8.8.8'], lab: 'dhcp' },
  { cat: 'servicios', cmd: 'ip helper-address <servidor>', modo: 'if', nivel: 2, que: 'Relay DHCP: reenvía los broadcasts DHCP de esa red a un servidor DHCP de otra red.', ej: ['R1(config-if)# ip helper-address 10.0.0.50'], lab: 'dhcp' },
  { cat: 'servicios', cmd: 'show ip dhcp binding', modo: 'priv', nivel: 2, que: 'Qué IP ha entregado el DHCP y a qué MAC.', ej: ['R1# show ip dhcp binding'], lab: 'dhcp' },
  { cat: 'servicios', cmd: 'ip nat inside / ip nat outside', modo: 'if', nivel: 2, que: 'Marca qué interfaz da a la red privada (inside) y cuál a Internet (outside).', ej: ['R1(config)# interface g0/0', 'R1(config-if)# ip nat inside', 'R1(config)# interface g0/1', 'R1(config-if)# ip nat outside'], lab: 'nat' },
  { cat: 'servicios', cmd: 'ip nat inside source list <acl> interface <if> overload', modo: 'config', nivel: 2, que: 'PAT: toda la red privada sale con la IP pública de la interfaz, distinguida por puerto.', ej: ['R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255', 'R1(config)# ip nat inside source list 1 interface g0/1 overload'], lab: 'nat' },
  { cat: 'servicios', cmd: 'ip nat inside source static <privada> <pública>', modo: 'config', nivel: 3, que: 'NAT estática 1:1, para publicar un servidor interno en Internet.', ej: ['R1(config)# ip nat inside source static 192.168.1.50 203.0.113.10'], lab: 'nat' },
  { cat: 'servicios', cmd: 'show ip nat translations', modo: 'priv', nivel: 2, que: 'Las traducciones activas: Inside local (privada) → Inside global (pública).', ej: ['R1# show ip nat translations'], lab: 'nat' },
  { cat: 'servicios', cmd: 'ntp server <ip>', modo: 'config', nivel: 2, que: 'Sincroniza la hora. Imprescindible para que los registros (logs) tengan sentido.', ej: ['R1(config)# ntp server 10.0.0.1'] },
  { cat: 'servicios', cmd: 'logging host <ip>', modo: 'config', nivel: 2, que: 'Envía los mensajes del sistema a un servidor Syslog central.', ej: ['R1(config)# logging host 10.0.0.20'] },
  { cat: 'servicios', cmd: 'show cdp neighbors', modo: 'priv', nivel: 2, que: 'Qué equipos Cisco hay conectados a cada puerto (nombre, modelo, puerto remoto).', ej: ['SW1# show cdp neighbors'], lab: 'averia-trunk' },

  // ---------------------------------------------------------------- seguridad
  { cat: 'seguridad', cmd: 'ip domain-name <dominio>', modo: 'config', nivel: 2, que: 'Dominio del equipo. Junto con el hostname, se necesita para generar las claves de SSH.', ej: ['SW1(config)# ip domain-name empresa.local'], lab: 'ssh' },
  { cat: 'seguridad', cmd: 'crypto key generate rsa modulus 2048', modo: 'config', nivel: 2, que: 'Genera las claves RSA y activa SSH. Para SSHv2 hacen falta al menos 768 bits; usa 2048.', ej: ['SW1(config)# crypto key generate rsa modulus 2048'], lab: 'ssh' },
  { cat: 'seguridad', cmd: 'ip ssh version 2', modo: 'config', nivel: 2, que: 'Obliga a usar SSH versión 2 (la 1 tiene fallos de seguridad).', ej: ['SW1(config)# ip ssh version 2'], lab: 'ssh' },
  { cat: 'seguridad', cmd: 'username <usuario> privilege 15 secret <clave>', modo: 'config', nivel: 2, que: 'Crea un usuario local con la contraseña guardada con hash.', ej: ['SW1(config)# username admin privilege 15 secret Adm1n-Segur0'], lab: 'ssh' },
  { cat: 'seguridad', cmd: 'line vty 0 15 / login local / transport input ssh', modo: 'line', nivel: 2, que: 'Acceso remoto: pide usuario local y acepta solo SSH (nada de Telnet, que va en claro).', ej: ['SW1(config)# line vty 0 15', 'SW1(config-line)# login local', 'SW1(config-line)# transport input ssh'], lab: 'averia-ssh' },
  { cat: 'seguridad', cmd: 'access-list <1-99> {permit|deny} <origen> <wildcard>', modo: 'config', nivel: 2, que: 'ACL estándar: filtra solo por origen. Se coloca cerca del destino. Acaba en un deny any implícito.', ej: ['R1(config)# access-list 10 deny 192.168.20.0 0.0.0.255', 'R1(config)# access-list 10 permit any'], lab: 'acl' },
  { cat: 'seguridad', cmd: 'ip access-list extended <nombre>', modo: 'config', nivel: 3, que: 'ACL extendida con nombre: filtra por protocolo, origen, destino y puerto. Se coloca cerca del origen.', ej: ['R1(config)# ip access-list extended WEB', 'R1(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 host 10.50.0.20 eq 443', 'R1(config-ext-nacl)# deny ip any any log'] },
  { cat: 'seguridad', cmd: 'ip access-group <acl> {in|out}', modo: 'if', nivel: 2, que: 'Aplica una ACL a una interfaz en un sentido. Una ACL sin aplicar no hace nada.', ej: ['R1(config-if)# ip access-group 10 out'], lab: 'averia-acl' },
  { cat: 'seguridad', cmd: 'switchport port-security …', modo: 'if', nivel: 2, que: 'Limita cuántas MAC puede haber en un puerto y qué hacer si se supera (shutdown, restrict, protect).', ej: ['SW1(config-if)# switchport port-security', 'SW1(config-if)# switchport port-security maximum 2', 'SW1(config-if)# switchport port-security mac-address sticky', 'SW1(config-if)# switchport port-security violation restrict'], lab: 'portsecurity' },
  { cat: 'seguridad', cmd: 'spanning-tree portfast / bpduguard enable', modo: 'if', nivel: 3, que: 'PortFast: el puerto de un PC pasa a reenviar al instante. BPDU Guard: lo apaga si alguien conecta un switch ahí.', ej: ['SW1(config-if)# spanning-tree portfast', 'SW1(config-if)# spanning-tree bpduguard enable'] },
  { cat: 'seguridad', cmd: 'show access-lists', modo: 'priv', nivel: 2, que: 'Las reglas de cada ACL con sus contadores de coincidencias (matches).', ej: ['R1# show access-lists'], lab: 'averia-acl' },
  { cat: 'seguridad', cmd: 'show ip ssh', modo: 'priv', nivel: 2, que: 'Si SSH está activo y en qué versión.', ej: ['SW1# show ip ssh'], lab: 'averia-ssh' },

  // ---------------------------------------------------------------- diagnóstico
  { cat: 'diagnostico', cmd: 'show interfaces status', modo: 'priv', nivel: 1, que: 'Capa 1 de un vistazo: connected, notconnect (sin cable), disabled (shutdown), err-disabled (protección). Y la VLAN de cada puerto.', ej: ['SW1# show interfaces status'], lab: 'averia-puerto' },
  { cat: 'diagnostico', cmd: 'show interfaces <if>', modo: 'priv', nivel: 2, que: 'Estado detallado y contadores. Busca input errors, CRC y late collisions (cable dañado o dúplex distinto).', ej: ['SW1# show interfaces g0/2'], lab: 'averia-duplex' },
  { cat: 'diagnostico', cmd: 'show mac address-table', modo: 'priv', nivel: 2, que: 'Qué MAC ha aprendido el switch, en qué puerto y VLAN. Si la del PC no está, el problema está en el puerto o la VLAN.', ej: ['SW1# show mac address-table'], lab: 'averia-puerto' },
  { cat: 'diagnostico', cmd: 'show arp', modo: 'priv', nivel: 2, que: 'Correspondencia IP ↔ MAC que conoce el router o switch.', ej: ['R1# show arp'] },
  { cat: 'diagnostico', cmd: 'show running-config interface <if>', modo: 'priv', nivel: 2, que: 'Solo la configuración de una interfaz: más rápido que buscar en todo el show run.', ej: ['SW1# show running-config interface g0/1'] },
  { cat: 'diagnostico', cmd: 'show ip interface brief → show ip route → ping', modo: 'priv', nivel: 2, que: 'El trío de capa 3: ¿interfaces up/up con la IP correcta? ¿Hay ruta al destino? ¿Llega el ping, primero al vecino y luego al destino?', ej: ['R1# show ip interface brief', 'R1# show ip route', 'R1# ping 10.0.12.2', 'R1# ping 8.8.8.8'], lab: 'averia-ruta' },
];
