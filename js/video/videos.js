// Guiones de los videos explicativos (uno por módulo). Escenario de 960×540; ver el formato en reproductor.js.
// La narración («voz») también es el subtítulo y la transcripción: frases cortas, en lenguaje claro.

export const VIDEOS = {
  // ------------------------------------------------------------------ Redes
  'viaje-mensaje': {
    id: 'viaje-mensaje', area: 'redes', titulo: 'Qué pasa cuando envías un mensaje',
    escenas: [
      { voz: 'Vamos a seguir un mensaje desde tu teléfono hasta el servidor que lo recibe, y de vuelta.', acciones: [{ t: 'titulo', texto: 'Qué pasa cuando envías un mensaje', sub: 'Un recorrido por la red, paso a paso' }] },
      { voz: 'Estos son los protagonistas: tu teléfono, el router Wi-Fi de casa, Internet, que es una red de redes, y el servidor de la aplicación.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'tel', x: 40, y: 220, icono: '📱', texto: 'Tu teléfono', sub: '192.168.1.20' },
        { t: 'caja', id: 'rt', x: 270, y: 220, icono: '📶', texto: 'Router Wi-Fi', sub: 'puerta de enlace' },
        { t: 'caja', id: 'net', x: 500, y: 220, icono: '☁️', texto: 'Internet', sub: 'muchos routers', tono: 'violet' },
        { t: 'caja', id: 'srv', x: 750, y: 220, icono: '🖥️', texto: 'Servidor', sub: '203.0.113.80', tono: 'ok' },
        { t: 'linea', id: 'l1', de: 'tel', a: 'rt', texto: 'Wi-Fi', discontinua: true }, { t: 'linea', id: 'l2', de: 'rt', a: 'net', texto: 'fibra' }, { t: 'linea', id: 'l3', de: 'net', a: 'srv' }] },
      { voz: 'Tu mensaje no viaja entero: se divide en paquetes. Cada paquete lleva la dirección IP de origen y la de destino, como un sobre.', acciones: [
        { t: 'nota', id: 'n1', x: 40, y: 50, w: 420, texto: 'Paquete = datos + cabeceras. IP origen 192.168.1.20 → IP destino 203.0.113.80' },
        { t: 'burbuja', id: 'b1', de: 'tel', texto: '¡Hola! ¿Nos vemos a las 5?' }] },
      { voz: 'El teléfono ve que el destino no está en su red local, así que entrega el paquete a su puerta de enlace: el router.', acciones: [{ t: 'quitar', ids: ['b1'] }, { t: 'viaje', de: 'tel', a: 'rt', texto: 'paquete 1' }, { t: 'enfoque', ids: ['rt'] }] },
      { voz: 'El router cambia la IP privada por la pública de tu casa, gracias a NAT, y lo envía a Internet. Allí, cada router decide el siguiente salto mirando su tabla de rutas.', acciones: [{ t: 'viaje', de: 'rt', a: 'net', texto: 'paquete 1' }, { t: 'viaje', de: 'rt', a: 'net', texto: 'paquete 2', retardo: 400 },
        { t: 'nota', id: 'n1', x: 40, y: 50, w: 520, texto: 'NAT: 192.168.1.20 → 198.51.100.7 (IP pública de tu casa). Cada router: «¿cuál es el mejor camino hacia 203.0.113.80?»', tono: 'violet' }] },
      { voz: 'Los paquetes llegan al servidor, quizá en distinto orden. TCP los ordena, comprueba que no falte ninguno y confirma la recepción.', acciones: [{ t: 'viaje', de: 'net', a: 'srv', texto: 'paquete 2' }, { t: 'viaje', de: 'net', a: 'srv', texto: 'paquete 1', retardo: 500 }, { t: 'caja', id: 'srv', marca: 'ok' }] },
      { voz: 'La respuesta hace el camino inverso. Todo esto ocurre en milisegundos, y es lo que estudiarás en este módulo: direcciones, capas, Ethernet y TCP.', acciones: [{ t: 'viaje', de: 'srv', a: 'tel', por: ['net', 'rt'], texto: 'respuesta', tono: 'ok' }, { t: 'nota', id: 'n1', x: 40, y: 50, w: 520, texto: 'Ida y vuelta típica: 20 a 80 milisegundos.', tono: 'ok' }] },
    ],
  },

  'vlan-switch': {
    id: 'vlan-switch', area: 'redes', titulo: 'Cómo un switch separa departamentos con VLAN',
    escenas: [
      { voz: 'En una oficina, Ventas y Soporte comparten el mismo switch. Veamos cómo las VLAN los separan como si fueran redes distintas.', acciones: [{ t: 'titulo', texto: 'VLAN: redes virtuales en un mismo switch', sub: 'Ventas y Soporte, separados' }] },
      { voz: 'Tenemos un switch y cuatro computadoras: dos de Ventas y dos de Soporte.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'sw', x: 395, y: 225, icono: '🔀', texto: 'Switch', sub: 'SW1' },
        { t: 'caja', id: 'v1', x: 60, y: 70, icono: '💻', texto: 'Ventas 1', sub: 'Fa0/2' }, { t: 'caja', id: 'v2', x: 60, y: 380, icono: '💻', texto: 'Ventas 2', sub: 'Fa0/3' },
        { t: 'caja', id: 's1', x: 730, y: 70, icono: '💻', texto: 'Soporte 1', sub: 'Fa0/10' }, { t: 'caja', id: 's2', x: 730, y: 380, icono: '💻', texto: 'Soporte 2', sub: 'Fa0/11' },
        { t: 'linea', id: 'a', de: 'v1', a: 'sw' }, { t: 'linea', id: 'b', de: 'v2', a: 'sw' }, { t: 'linea', id: 'c', de: 's1', a: 'sw' }, { t: 'linea', id: 'd', de: 's2', a: 'sw' }] },
      { voz: 'Sin VLAN, todo es una sola red. Si Ventas 1 envía un broadcast, por ejemplo una pregunta ARP, llega a todos, también a Soporte.', acciones: [{ t: 'viaje', de: 'v1', a: 'sw', texto: 'broadcast', tono: 'warn' }, { t: 'viaje', de: 'sw', a: 'v2', texto: 'broadcast', tono: 'warn', retardo: 1100 }, { t: 'viaje', de: 'sw', a: 's1', texto: 'broadcast', tono: 'warn', retardo: 1100 }, { t: 'viaje', de: 'sw', a: 's2', texto: 'broadcast', tono: 'warn', retardo: 1100 }] },
      { voz: 'Creamos dos VLAN: la 10 para Ventas y la 20 para Soporte, y asignamos cada puerto a su VLAN como puerto de acceso.', acciones: [
        { t: 'caja', id: 'v1', tono: 'ok', sub: 'Fa0/2 · VLAN 10' }, { t: 'caja', id: 'v2', tono: 'ok', sub: 'Fa0/3 · VLAN 10' },
        { t: 'caja', id: 's1', tono: 'violet', sub: 'Fa0/10 · VLAN 20' }, { t: 'caja', id: 's2', tono: 'violet', sub: 'Fa0/11 · VLAN 20' },
        { t: 'linea', id: 'a', tono: 'ok' }, { t: 'linea', id: 'b', tono: 'ok' }, { t: 'linea', id: 'c', tono: 'violet' }, { t: 'linea', id: 'd', tono: 'violet' },
        { t: 'codigo', id: 'cfg', x: 300, y: 380, w: 360, titulo: 'SW1(config)#', lineas: ['interface fa0/2', ' switchport mode access', ' switchport access vlan 10'] }] },
      { voz: 'Ahora el mismo broadcast solo llega a los puertos de la VLAN 10. Soporte ni se entera: menos tráfico y más seguridad.', acciones: [{ t: 'quitar', ids: ['cfg'] }, { t: 'viaje', de: 'v1', a: 'sw', texto: 'broadcast', tono: 'ok' }, { t: 'viaje', de: 'sw', a: 'v2', texto: 'broadcast', tono: 'ok', retardo: 1100 }, { t: 'caja', id: 's1', marca: 'bad' }, { t: 'caja', id: 's2', marca: 'bad' }] },
      { voz: 'Para que Ventas y Soporte hablen entre sí hace falta un router o un switch de capa tres. Lo verás en enrutamiento entre VLAN.', acciones: [{ t: 'caja', id: 's1', marca: null }, { t: 'caja', id: 's2', marca: null }, { t: 'nota', id: 'n', x: 300, y: 395, w: 360, texto: 'Entre VLAN distintas: siempre a través de un router (capa 3).', tono: 'violet' }] },
    ],
  },

  'router-decide': {
    id: 'router-decide', area: 'redes', titulo: 'Cómo decide un router por dónde enviar un paquete',
    escenas: [
      { voz: 'Un router recibe un paquete y tiene que decidir por qué interfaz enviarlo. Para eso usa su tabla de rutas.', acciones: [{ t: 'titulo', texto: '¿Por dónde lo envío?', sub: 'La tabla de rutas y la coincidencia más larga' }] },
      { voz: 'Este router conecta la oficina central con una sucursal y con Internet. Llega un paquete con destino 10.2.0.25.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'r1', x: 395, y: 210, icono: '🛜', texto: 'R1', sub: 'oficina central' },
        { t: 'caja', id: 'suc', x: 720, y: 60, icono: '🏬', texto: 'Sucursal', sub: '10.2.0.0/16', tono: 'ok' },
        { t: 'caja', id: 'web', x: 720, y: 380, icono: '☁️', texto: 'Internet', sub: '0.0.0.0/0', tono: 'violet' },
        { t: 'caja', id: 'pc', x: 40, y: 210, icono: '💻', texto: 'PC', sub: '10.1.0.50' },
        { t: 'linea', id: 'l1', de: 'pc', a: 'r1' }, { t: 'linea', id: 'l2', de: 'r1', a: 'suc', texto: 'G0/1' }, { t: 'linea', id: 'l3', de: 'r1', a: 'web', texto: 'G0/2' },
        { t: 'viaje', de: 'pc', a: 'r1', texto: '→ 10.2.0.25' }] },
      { voz: 'El router busca en su tabla todas las rutas que contienen ese destino.', acciones: [{ t: 'tabla', id: 'tr', x: 30, y: 322, w: 460, titulo: 'Tabla de rutas de R1', columnas: ['Red', 'Salida', 'Origen'], filas: [['10.1.0.0/16', 'G0/0', 'conectada'], ['10.2.0.0/16', 'G0/1', 'estática'], ['10.2.0.0/24', 'G0/1', 'OSPF'], ['0.0.0.0/0', 'G0/2', 'por defecto']] }] },
      { voz: 'Coinciden tres: la de 10.2.0.0 barra 16, la de 10.2.0.0 barra 24 y la ruta por defecto, que coincide con todo.', acciones: [{ t: 'tabla', id: 'tr', resaltar: [1, 2, 3], tachar: [0] }] },
      { voz: 'Gana la coincidencia más larga, es decir, la máscara más específica: la barra 24. Es la regla de oro del enrutamiento.', acciones: [{ t: 'tabla', id: 'tr', resaltar: [2], tachar: [0, 1, 3] }, { t: 'nota', id: 'n', x: 30, y: 40, w: 340, texto: '/24 es más específica que /16 y que /0 → gana', tono: 'ok' }] },
      { voz: 'El paquete sale por G0/1 hacia la sucursal. Si el destino no estuviera en ninguna ruta, usaría la ruta por defecto hacia Internet.', acciones: [{ t: 'quitar', ids: ['n'] }, { t: 'viaje', de: 'r1', a: 'suc', texto: '→ 10.2.0.25', tono: 'ok' }, { t: 'linea', id: 'l2', tono: 'ok' }, { t: 'caja', id: 'suc', marca: 'ok' }] },
    ],
  },

  'dhcp-nat': {
    id: 'dhcp-nat', area: 'redes', titulo: 'De encender la PC a navegar: DHCP y NAT',
    escenas: [
      { voz: 'Una PC recién encendida no tiene dirección IP. Veamos cómo la consigue y cómo sale a Internet con una sola IP pública.', acciones: [{ t: 'titulo', texto: 'DHCP y NAT en acción', sub: 'De encender la PC a navegar' }] },
      { voz: 'La PC grita a toda la red: ¿hay algún servidor DHCP? Es el mensaje Discover, un broadcast.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'pc', x: 40, y: 220, icono: '💻', texto: 'PC Ventas', sub: 'sin IP' },
        { t: 'caja', id: 'r1', x: 395, y: 220, icono: '🛜', texto: 'R1', sub: 'servidor DHCP · NAT' },
        { t: 'caja', id: 'web', x: 750, y: 220, icono: '🌍', texto: 'Internet', sub: 'web 93.184.216.34', tono: 'violet' },
        { t: 'linea', id: 'l1', de: 'pc', a: 'r1', texto: '192.168.10.0/24' }, { t: 'linea', id: 'l2', de: 'r1', a: 'web', texto: '203.0.113.2' },
        { t: 'viaje', de: 'pc', a: 'r1', texto: 'DISCOVER', tono: 'warn' }] },
      { voz: 'El router ofrece una dirección libre. La PC la pide formalmente y el router confirma: Discover, Offer, Request y Acknowledge. D, O, R, A.', acciones: [{ t: 'viaje', de: 'r1', a: 'pc', texto: 'OFFER .11' }, { t: 'viaje', de: 'pc', a: 'r1', texto: 'REQUEST', retardo: 1300 }, { t: 'viaje', de: 'r1', a: 'pc', texto: 'ACK', tono: 'ok', retardo: 2600 }] },
      { voz: 'Ahora la PC tiene IP, máscara, puerta de enlace y DNS. Ya puede comunicarse.', acciones: [{ t: 'caja', id: 'pc', sub: '192.168.10.11', marca: 'ok' }, { t: 'nota', id: 'n', x: 40, y: 50, w: 420, texto: 'IP 192.168.10.11 · máscara /24 · puerta 192.168.10.1 · DNS 8.8.8.8', tono: 'ok' }] },
      { voz: 'La PC abre una web. Pero 192.168.10.11 es privada: Internet no sabría devolver la respuesta. Aquí entra NAT.', acciones: [{ t: 'caja', id: 'pc', marca: null }, { t: 'viaje', de: 'pc', a: 'r1', texto: '192.168.10.11:51000' }] },
      { voz: 'El router cambia el origen por su IP pública y un puerto, y lo anota en su tabla de traducciones.', acciones: [{ t: 'tabla', id: 'nat', x: 250, y: 380, w: 460, titulo: 'Traducciones NAT de R1', columnas: ['Interior', 'Público'], filas: [['192.168.10.11:51000', '203.0.113.2:1024']], resaltar: [0] }, { t: 'viaje', de: 'r1', a: 'web', texto: '203.0.113.2:1024', tono: 'violet' }] },
      { voz: 'La respuesta vuelve a la IP pública, el router consulta la tabla y se la entrega a la PC correcta. Así toda la oficina navega con una sola IP pública.', acciones: [{ t: 'tabla', id: 'nat', resaltar: [] }, { t: 'viaje', de: 'web', a: 'pc', por: ['r1'], texto: 'respuesta', tono: 'ok' }] },
    ],
  },

  phishing: {
    id: 'phishing', area: 'redes', titulo: 'Anatomía de un ataque de phishing',
    escenas: [
      { voz: 'La mayoría de los incidentes de seguridad empiezan con un correo. Veamos cómo funciona un phishing y qué defensas lo frenan.', acciones: [{ t: 'titulo', texto: 'Anatomía de un phishing', sub: 'y las capas de defensa' }] },
      { voz: 'Un atacante envía un correo que parece del banco o de Recursos Humanos a un empleado de la tienda.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'atk', x: 40, y: 200, icono: '🕵️', texto: 'Atacante', tono: 'bad' },
        { t: 'caja', id: 'emp', x: 395, y: 200, icono: '🧑‍💼', texto: 'Empleado', sub: 'cajera de tienda' },
        { t: 'caja', id: 'falsa', x: 750, y: 200, icono: '🎣', texto: 'Web falsa', sub: 'rrhh-ceiba-pagos.com', tono: 'bad' },
        { t: 'viaje', de: 'atk', a: 'emp', texto: '✉️ Urgente: nómina', tono: 'bad' }] },
      { voz: 'Señales de alarma: el remitente no es de la empresa, el mensaje mete prisa y el enlace lleva a un dominio extraño.', acciones: [{ t: 'nota', id: 'n', x: 250, y: 40, w: 460, tono: 'warn', texto: 'De: rrhh@ceiba-pagos.co · «Tu nómina se bloqueará en 1 hora» · Enlace a un dominio que no es el de la empresa' }] },
      { voz: 'Si el empleado hace clic y escribe su contraseña en la web falsa, el atacante la obtiene.', acciones: [{ t: 'viaje', de: 'emp', a: 'falsa', texto: 'usuario + contraseña', tono: 'warn' }, { t: 'linea', id: 'l', de: 'emp', a: 'falsa', tono: 'bad', discontinua: true }] },
      { voz: 'Pero la verificación en dos pasos lo detiene: sin el código del teléfono del empleado, la contraseña robada no basta.', acciones: [{ t: 'caja', id: 'mfa', x: 395, y: 400, icono: '📲', texto: 'MFA', sub: 'código en el teléfono', tono: 'ok' }, { t: 'viaje', de: 'falsa', a: 'mfa', texto: 'intento de acceso', tono: 'bad' }, { t: 'caja', id: 'mfa', marca: 'ok' }] },
      { voz: 'Lo correcto: no hacer clic, usar el botón de reportar phishing y, si ya escribiste la contraseña, avisar enseguida a soporte para cambiarla.', acciones: [{ t: 'quitar', ids: ['l'] }, { t: 'caja', id: 'sec', x: 750, y: 400, icono: '🛡️', texto: 'Seguridad', sub: 'recibe el reporte', tono: 'ok' }, { t: 'viaje', de: 'emp', a: 'sec', texto: 'Reportar phishing', tono: 'ok' }, { t: 'nota', id: 'n', x: 250, y: 40, w: 460, tono: 'ok', texto: 'Capas de defensa: filtro de correo, formación, MFA, reporte rápido y mínimo privilegio.' }] },
    ],
  },

  automatizar: {
    id: 'automatizar', area: 'redes', titulo: 'Configurar 50 switches en un minuto',
    escenas: [
      { voz: 'Cambiar el servidor de hora en cincuenta switches a mano lleva horas y es fácil equivocarse. Con un script se hace en un minuto.', acciones: [{ t: 'titulo', texto: 'Automatizar la red', sub: 'Un script, 50 switches, cero errores de tecleo' }] },
      { voz: 'Partimos de un inventario: la lista de switches con su dirección IP.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'tabla', id: 'inv', x: 40, y: 60, w: 360, titulo: 'inventario.csv', columnas: ['nombre', 'ip'], filas: [['SW-TDA-01', '10.10.1.2'], ['SW-TDA-02', '10.10.2.2'], ['SW-ALM-01', '10.20.1.2'], ['…', '… (50)']] }] },
      { voz: 'El script recorre la lista. Para cada switch se conecta por SSH, envía los comandos y guarda el resultado.', acciones: [{ t: 'codigo', id: 'py', x: 440, y: 60, w: 480, titulo: 'ntp.py', lineas: ['for sw in leer_csv("inventario.csv"):', '    con = conectar_ssh(sw["ip"])', '    con.enviar(["ntp server 10.0.0.1"])', '    con.guardar()', '    print(sw["nombre"], "OK")'], activa: 0 }] },
      { voz: 'Primero el switch de la tienda uno: conexión, comando y guardado.', acciones: [{ t: 'tabla', id: 'inv', resaltar: [0] }, { t: 'codigo', id: 'py', activa: 2 }, { t: 'caja', id: 'sw1', x: 120, y: 340, icono: '🔀', texto: 'SW-TDA-01' }, { t: 'caja', id: 'pyc', x: 600, y: 340, icono: '🐍', texto: 'Script', tono: 'violet' }, { t: 'viaje', de: 'pyc', a: 'sw1', texto: 'ntp server 10.0.0.1' }] },
      { voz: 'Y así con todos. Si un switch no responde, el script lo anota y sigue con el siguiente, en vez de detenerse.', acciones: [{ t: 'codigo', id: 'py', activa: 4 }, { t: 'caja', id: 'sw1', marca: 'ok' }, { t: 'tabla', id: 'res', x: 40, y: 290, w: 360, titulo: 'Resultado', columnas: ['switch', 'estado'], filas: [['SW-TDA-01', '✓ OK'], ['SW-TDA-02', '✓ OK'], ['SW-ALM-01', '✗ sin respuesta'], ['…', '49 de 50 OK']], resaltar: [2] }, { t: 'quitar', ids: ['sw1', 'pyc'] }] },
      { voz: 'Resultado: un minuto, la misma configuración en todos y un informe de lo que falló. Ese es el valor de la automatización.', acciones: [{ t: 'nota', id: 'n', x: 440, y: 290, w: 480, tono: 'ok', texto: 'Ventajas: rapidez, consistencia, registro de cambios y menos errores humanos. Herramientas: Python (Netmiko), Ansible, APIs REST.' }] },
    ],
  },

  // ------------------------------------------------------------------ Bases de datos
  'tablas-claves': {
    id: 'tablas-claves', area: 'bd', titulo: 'Tablas, claves primarias y foráneas',
    escenas: [
      { voz: 'Una base de datos relacional guarda la información en tablas que se relacionan entre sí mediante claves.', acciones: [{ t: 'titulo', texto: 'Tablas y claves', sub: 'Cómo se relacionan los datos' }] },
      { voz: 'Esta es la tabla de tiendas. Cada fila es una tienda y cada columna un dato. La columna id es la clave primaria: identifica cada fila sin repetirse.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'tabla', id: 'tie', x: 40, y: 60, w: 380, titulo: 'tiendas', columnas: ['id (PK)', 'nombre', 'ciudad'], filas: [['1', 'Los Prados', 'Santo Domingo'], ['2', 'Las Palmas', 'Santiago'], ['3', 'El Centro', 'La Vega']] }] },
      { voz: 'Esta es la tabla de ventas. La columna tienda_id es una clave foránea: apunta a la clave primaria de la tabla de tiendas.', acciones: [{ t: 'tabla', id: 'ven', x: 520, y: 60, w: 400, titulo: 'ventas', columnas: ['id', 'tienda_id (FK)', 'total'], filas: [['101', '2', '1 250'], ['102', '1', '830'], ['103', '2', '2 400'], ['104', '3', '515']] }] },
      { voz: 'La venta 101 tiene tienda_id igual a 2. Para saber dónde se hizo, buscamos la tienda con id 2: Las Palmas.', acciones: [{ t: 'tabla', id: 'ven', resaltar: [0] }, { t: 'tabla', id: 'tie', resaltar: [1] }, { t: 'nota', id: 'n', x: 300, y: 330, w: 360, texto: 'ventas.tienda_id = 2 → tiendas.id = 2 → Las Palmas', tono: 'ok' }] },
      { voz: 'Así no repetimos el nombre y la ciudad de la tienda en cada venta. Si la tienda cambia de nombre, se cambia en un solo lugar.', acciones: [{ t: 'tabla', id: 'ven', resaltar: [0, 2] }, { t: 'nota', id: 'n', x: 300, y: 330, w: 360, texto: 'Sin repetir datos: menos errores y menos espacio. Es la idea de la normalización.', tono: 'accent' }] },
      { voz: 'Y la base de datos protege la relación: no te dejará guardar una venta con tienda_id 9 si esa tienda no existe. Eso es la integridad referencial.', acciones: [{ t: 'tabla', id: 'tie', resaltar: [] }, { t: 'tabla', id: 'ven', resaltar: [] }, { t: 'nota', id: 'n', x: 300, y: 330, w: 360, texto: 'INSERT venta con tienda_id = 9 → ✗ error: la tienda 9 no existe', tono: 'bad' }] },
    ],
  },

  join: {
    id: 'join', area: 'bd', titulo: 'Cómo funciona un JOIN, fila a fila',
    escenas: [
      { voz: 'Un JOIN combina filas de dos tablas que cumplen una condición. Veámoslo con tickets de soporte y técnicos.', acciones: [{ t: 'titulo', texto: 'JOIN paso a paso', sub: 'Combinar tickets y técnicos' }] },
      { voz: 'Queremos ver cada ticket con el nombre del técnico asignado.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'codigo', id: 'sql', x: 40, y: 16, w: 880, lineas: ['SELECT t.numero, tec.nombre', 'FROM tickets t JOIN tecnicos tec ON t.tecnico_id = tec.id;'] },
        { t: 'tabla', id: 'tk', x: 40, y: 110, w: 400, titulo: 'tickets', columnas: ['numero', 'tecnico_id'], filas: [['INC-1', '7'], ['INC-2', '9'], ['INC-3', '7'], ['INC-4', '—']] },
        { t: 'tabla', id: 'te', x: 520, y: 110, w: 400, titulo: 'tecnicos', columnas: ['id', 'nombre'], filas: [['7', 'Marta'], ['8', 'Luis'], ['9', 'Sergio']] }] },
      { voz: 'Primera fila: el ticket INC-1 tiene técnico 7. Buscamos el id 7: Marta. Coinciden, así que sale una fila en el resultado.', acciones: [{ t: 'tabla', id: 'tk', resaltar: [0] }, { t: 'tabla', id: 'te', resaltar: [0] }, { t: 'tabla', id: 'res', x: 520, y: 300, w: 400, titulo: 'resultado', columnas: ['numero', 'nombre'], filas: [['INC-1', 'Marta']] }] },
      { voz: 'INC-2 tiene técnico 9: Sergio. Otra fila.', acciones: [{ t: 'tabla', id: 'tk', resaltar: [1] }, { t: 'tabla', id: 'te', resaltar: [2] }, { t: 'tabla', id: 'res', filas: [['INC-1', 'Marta'], ['INC-2', 'Sergio']] }] },
      { voz: 'INC-3 vuelve a ser de Marta. Una fila de una tabla puede combinarse con varias de la otra.', acciones: [{ t: 'tabla', id: 'tk', resaltar: [2] }, { t: 'tabla', id: 'te', resaltar: [0] }, { t: 'tabla', id: 'res', filas: [['INC-1', 'Marta'], ['INC-2', 'Sergio'], ['INC-3', 'Marta']] }] },
      { voz: 'INC-4 no tiene técnico, así que con un JOIN normal, el INNER JOIN, no aparece. Y Luis tampoco, porque no tiene tickets.', acciones: [{ t: 'tabla', id: 'tk', resaltar: [], tachar: [3] }, { t: 'tabla', id: 'te', resaltar: [], tachar: [1] }] },
      { voz: 'Si quieres ver también los tickets sin asignar, usa LEFT JOIN: conserva todas las filas de la tabla de la izquierda y rellena con NULL.', acciones: [{ t: 'codigo', id: 'sql', lineas: ['SELECT t.numero, tec.nombre', 'FROM tickets t LEFT JOIN tecnicos tec ON t.tecnico_id = tec.id;'], activa: 1 }, { t: 'tabla', id: 'tk', tachar: [] }, { t: 'tabla', id: 'res', filas: [['INC-1', 'Marta'], ['INC-2', 'Sergio'], ['INC-3', 'Marta'], ['INC-4', 'NULL']], resaltar: [3] }] },
    ],
  },

  transaccion: {
    id: 'transaccion', area: 'bd', titulo: 'Transacciones: todo o nada',
    escenas: [
      { voz: 'Una transacción agrupa varias operaciones que deben hacerse todas o ninguna. El ejemplo clásico: mover stock entre almacenes.', acciones: [{ t: 'titulo', texto: 'Transacciones', sub: 'Todo o nada: COMMIT y ROLLBACK' }] },
      { voz: 'Hay cien unidades en el almacén central y cero en la tienda. Queremos trasladar treinta.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'tabla', id: 'st', x: 520, y: 80, w: 400, titulo: 'stock', columnas: ['lugar', 'unidades'], filas: [['Almacén central', '100'], ['Tienda Las Palmas', '0']] }, { t: 'codigo', id: 'sql', x: 40, y: 80, w: 440, lineas: ['BEGIN;', 'UPDATE stock SET unidades = unidades - 30', '  WHERE lugar = \'Almacén central\';', 'UPDATE stock SET unidades = unidades + 30', '  WHERE lugar = \'Tienda Las Palmas\';', 'COMMIT;'] }] },
      { voz: 'Empieza la transacción y se restan treinta unidades al almacén.', acciones: [{ t: 'codigo', id: 'sql', activa: 1 }, { t: 'tabla', id: 'st', filas: [['Almacén central', '70'], ['Tienda Las Palmas', '0']], resaltar: [0] }] },
      { voz: 'Justo entonces se cae la conexión. Sin transacción, treinta unidades habrían desaparecido: restadas de un lado y nunca sumadas al otro.', acciones: [{ t: 'codigo', id: 'sql', activa: 3 }, { t: 'nota', id: 'n', x: 40, y: 360, w: 440, tono: 'bad', texto: '✗ Error: conexión perdida antes del segundo UPDATE' }] },
      { voz: 'Pero como estaba dentro de una transacción, la base de datos hace ROLLBACK: deshace todo y vuelve al estado anterior.', acciones: [{ t: 'tabla', id: 'st', filas: [['Almacén central', '100'], ['Tienda Las Palmas', '0']], resaltar: [0] }, { t: 'nota', id: 'n', x: 40, y: 360, w: 440, tono: 'warn', texto: 'ROLLBACK automático: los datos quedan como antes de BEGIN' }] },
      { voz: 'Se repite el traslado. Esta vez todo va bien y COMMIT confirma los dos cambios a la vez.', acciones: [{ t: 'codigo', id: 'sql', activa: 5 }, { t: 'tabla', id: 'st', filas: [['Almacén central', '70'], ['Tienda Las Palmas', '30']], resaltar: [0, 1] }, { t: 'nota', id: 'n', x: 40, y: 360, w: 440, tono: 'ok', texto: '✓ COMMIT: 70 + 30 = 100. No se pierde ni se inventa nada.' }] },
      { voz: 'Esto es la atomicidad, la A de ACID. Junto con consistencia, aislamiento y durabilidad, es lo que hace fiables las bases de datos.', acciones: [{ t: 'nota', id: 'acid', x: 520, y: 260, w: 400, tono: 'violet', texto: 'ACID: Atomicidad · Consistencia · Aislamiento · Durabilidad' }] },
    ],
  },

  // ------------------------------------------------------------------ Programación
  bucle: {
    id: 'bucle', area: 'prog', titulo: 'Un bucle, paso a paso',
    escenas: [
      { voz: 'Un bucle repite instrucciones. Vamos a ejecutar uno línea a línea para sumar las ventas del día.', acciones: [{ t: 'titulo', texto: 'Un bucle paso a paso', sub: 'Sumar las ventas del día' }] },
      { voz: 'Tenemos una lista con tres ventas y una variable total que empieza en cero.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'codigo', id: 'py', x: 40, y: 80, w: 470, titulo: 'ventas.py', lineas: ['ventas = [120, 80, 50]', 'total = 0', 'for v in ventas:', '    total = total + v', 'print("Total:", total)'], activa: 1 }, { t: 'tabla', id: 'var', x: 570, y: 80, w: 340, titulo: 'Variables', columnas: ['nombre', 'valor'], filas: [['ventas', '[120, 80, 50]'], ['total', '0']] }] },
      { voz: 'Primera vuelta: v toma el primer valor, 120. Total pasa de cero a 120.', acciones: [{ t: 'codigo', id: 'py', activa: 3 }, { t: 'tabla', id: 'var', filas: [['ventas', '[120, 80, 50]'], ['total', '120'], ['v', '120']], resaltar: [1, 2] }] },
      { voz: 'Segunda vuelta: v vale 80. Total pasa a 200.', acciones: [{ t: 'tabla', id: 'var', filas: [['ventas', '[120, 80, 50]'], ['total', '200'], ['v', '80']], resaltar: [1, 2] }] },
      { voz: 'Tercera vuelta: v vale 50. Total pasa a 250.', acciones: [{ t: 'tabla', id: 'var', filas: [['ventas', '[120, 80, 50]'], ['total', '250'], ['v', '50']], resaltar: [1, 2] }] },
      { voz: 'No quedan elementos, así que el bucle termina y se ejecuta la línea siguiente: se imprime Total 250.', acciones: [{ t: 'codigo', id: 'py', activa: 4 }, { t: 'tabla', id: 'var', resaltar: [1] }, { t: 'nota', id: 'n', x: 40, y: 330, w: 470, tono: 'ok', texto: '> Total: 250' }] },
      { voz: 'Fíjate en la sangría: solo las líneas con sangría están dentro del bucle. Con mil ventas, el código sería exactamente el mismo.', acciones: [{ t: 'nota', id: 'n2', x: 570, y: 330, w: 340, tono: 'violet', texto: 'La sangría (4 espacios) marca qué se repite.' }] },
    ],
  },

  lenguajes: {
    id: 'lenguajes', area: 'prog', titulo: 'El mismo programa en cuatro lenguajes',
    escenas: [
      { voz: 'Los lenguajes de programación se parecen más de lo que crees. Escribamos el mismo programa en cuatro de los más usados.', acciones: [{ t: 'titulo', texto: 'Un programa, cuatro lenguajes', sub: 'Python · JavaScript · Java · C#' }] },
      { voz: 'El programa recorre una lista de equipos y avisa de los que tienen poco disco. Primero en Python: corto y muy legible. Se usa en automatización, datos e inteligencia artificial.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'codigo', id: 'py', x: 20, y: 20, w: 450, titulo: 'Python', lineas: ['for eq in equipos:', '    if eq["libre"] < 10:', '        print("Poco disco:", eq["nombre"])'] }] },
      { voz: 'En JavaScript, el lenguaje de la web: llaves para los bloques y punto y coma al final.', acciones: [{ t: 'codigo', id: 'js', x: 490, y: 20, w: 450, titulo: 'JavaScript', lineas: ['for (const eq of equipos) {', '  if (eq.libre < 10)', '    console.log("Poco disco:", eq.nombre);', '}'] }] },
      { voz: 'En Java: más palabras, tipos declarados y una estructura más estricta. Muy usado en empresas grandes y en Android.', acciones: [{ t: 'codigo', id: 'java', x: 20, y: 284, w: 450, titulo: 'Java', lineas: ['for (Equipo eq : equipos) {', '  if (eq.getLibre() < 10)', '    System.out.println("Poco disco: "', '      + eq.getNombre());', '}'] }] },
      { voz: 'En C#, el lenguaje de Microsoft: muy parecido a Java. Se usa en aplicaciones de empresa, Windows y videojuegos con Unity.', acciones: [{ t: 'codigo', id: 'cs', x: 490, y: 284, w: 450, titulo: 'C#', lineas: ['foreach (var eq in equipos) {', '  if (eq.Libre < 10)', '    Console.WriteLine(', '      $"Poco disco: {eq.Nombre}");', '}'] }] },
      { voz: 'Las ideas son las mismas: un bucle, una condición y una salida. Si aprendes bien uno, los demás se aprenden mucho más rápido.', acciones: [{ t: 'enfoque', ids: ['py', 'js', 'java', 'cs'] }, { t: 'nota', id: 'n', x: 230, y: 214, w: 500, tono: 'ok', texto: 'Bucle + condición + salida: los mismos conceptos en todos.' }] },
    ],
  },

  'git-flujo': {
    id: 'git-flujo', area: 'prog', titulo: 'Git: de tu cambio al proyecto del equipo',
    escenas: [
      { voz: 'Git guarda el historial de un proyecto y permite que varias personas trabajen a la vez sin pisarse. Veamos el flujo diario.', acciones: [{ t: 'titulo', texto: 'El flujo de trabajo con Git', sub: 'Rama, commit, pull request y fusión' }] },
      { voz: 'La rama principal, main, contiene la versión estable. Para un cambio nuevo creas tu propia rama.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'c1', x: 40, y: 120, w: 120, h: 70, texto: 'A', sub: 'main' }, { t: 'caja', id: 'c2', x: 220, y: 120, w: 120, h: 70, texto: 'B', sub: 'main' },
        { t: 'linea', id: 'm1', de: 'c1', a: 'c2' },
        { t: 'codigo', id: 'cmd', x: 40, y: 380, w: 560, lineas: ['git switch -c arreglo-informe'] }] },
      { voz: 'Haces tus cambios y los guardas con un commit: una foto del proyecto con un mensaje que explica qué cambiaste.', acciones: [{ t: 'caja', id: 'r1', x: 400, y: 260, w: 140, h: 70, texto: 'C', sub: 'arreglo-informe', tono: 'violet' }, { t: 'linea', id: 'b1', de: 'c2', a: 'r1', tono: 'violet' },
        { t: 'codigo', id: 'cmd', lineas: ['git add informe.py', 'git commit -m "Corrige el total del informe"', 'git push -u origin arreglo-informe'] }] },
      { voz: 'Abres una pull request. Las pruebas automáticas se ejecutan y un compañero revisa el código.', acciones: [{ t: 'caja', id: 'ci', x: 640, y: 250, w: 200, h: 90, icono: '🧪', texto: 'Pruebas', tono: 'warn' }, { t: 'viaje', de: 'r1', a: 'ci', texto: 'PR #42' }] },
      { voz: 'Una prueba falla. Mejor que falle aquí que en producción. Corriges el error con otro commit en tu rama.', acciones: [{ t: 'quitar', ids: ['cmd'] }, { t: 'caja', id: 'ci', marca: 'bad', tono: 'bad' }, { t: 'caja', id: 'r2', x: 400, y: 400, w: 140, h: 70, texto: 'D', sub: 'arreglo', tono: 'violet' }, { t: 'linea', id: 'b2', de: 'r1', a: 'r2', tono: 'violet' }] },
      { voz: 'Ahora todo pasa y la revisión es aprobada. Se fusiona la rama en main y el cambio ya es parte del proyecto.', acciones: [{ t: 'caja', id: 'ci', marca: 'ok', tono: 'ok' }, { t: 'caja', id: 'c3', x: 700, y: 120, w: 140, h: 70, texto: 'E', sub: 'main (merge)', tono: 'ok' }, { t: 'linea', id: 'm2', de: 'c2', a: 'c3' }, { t: 'linea', id: 'm3', de: 'r2', a: 'c3', tono: 'ok' }] },
    ],
  },

  busqueda: {
    id: 'busqueda', area: 'prog', titulo: 'Búsqueda lineal frente a búsqueda binaria',
    escenas: [
      { voz: 'Un algoritmo es una receta para resolver un problema. Comparemos dos formas de buscar un código de producto en una lista.', acciones: [{ t: 'titulo', texto: 'Dos maneras de buscar', sub: 'Lineal frente a binaria' }] },
      { voz: 'Buscamos el código 73 en una lista ordenada de ocho productos. La búsqueda lineal mira uno por uno desde el principio.', acciones: [{ t: 'titulo', ocultar: true }, { t: 'tabla', id: 'lin', x: 40, y: 60, w: 880, titulo: 'Búsqueda lineal', columnas: ['12', '25', '31', '48', '56', '73', '88', '95'], filas: [['1', '2', '3', '4', '5', '6', '', '']] }, { t: 'nota', id: 'n1', x: 40, y: 170, w: 880, texto: 'Mira el 12, el 25, el 31, el 48, el 56… y en el sexto intento encuentra el 73.' }] },
      { voz: 'La búsqueda binaria aprovecha que la lista está ordenada. Mira el centro: el 48. Como 73 es mayor, descarta toda la mitad izquierda.', acciones: [{ t: 'tabla', id: 'bin', x: 40, y: 270, w: 880, titulo: 'Búsqueda binaria', columnas: ['12', '25', '31', '48', '56', '73', '88', '95'], filas: [['✗', '✗', '✗', '1 ✗', '', '', '', '']] }] },
      { voz: 'En la mitad que queda, mira el centro: el 73. ¡Encontrado en el segundo intento!', acciones: [{ t: 'tabla', id: 'bin', filas: [['✗', '✗', '✗', '1 ✗', '✗', '2 ✓', '', '']], resaltar: [0] }] },
      { voz: 'Con ocho elementos la diferencia es pequeña. Con un millón, la lineal puede necesitar un millón de pasos; la binaria, unos veinte.', acciones: [{ t: 'nota', id: 'n2', x: 40, y: 400, w: 880, tono: 'ok', texto: '1 000 000 de productos → lineal: hasta 1 000 000 de pasos (O(n)) · binaria: unos 20 pasos (O(log n))' }] },
      { voz: 'Elegir bien el algoritmo y la estructura de datos marca la diferencia entre un programa que responde al instante y uno que tarda minutos.', acciones: [{ t: 'enfoque', ids: ['n2'] }] },
    ],
  },

  // ------------------------------------------------------------------ Empleo TI
  'ticket-vida': {
    id: 'ticket-vida', area: 'ti', titulo: 'La vida de un ticket de soporte',
    escenas: [
      { voz: 'Cada problema que llega a la mesa de ayuda se convierte en un ticket. Sigamos uno desde la llamada hasta el cierre.', acciones: [{ t: 'titulo', texto: 'La vida de un ticket', sub: 'De la llamada al cierre, en una empresa con tiendas' }] },
      { voz: 'Son las siete y cuarenta y ocho. Carla, encargada de una tienda, llama: no puede iniciar sesión y la tienda abre a las ocho.', acciones: [{ t: 'titulo', ocultar: true },
        { t: 'caja', id: 'carla', x: 40, y: 220, icono: '🧑‍💼', texto: 'Carla', sub: 'Tienda Los Prados' },
        { t: 'caja', id: 'mesa', x: 395, y: 220, icono: '🎧', texto: 'Mesa de ayuda', sub: 'primer nivel' },
        { t: 'linea', id: 'l1', de: 'carla', a: 'mesa', texto: 'llamada', discontinua: true },
        { t: 'burbuja', id: 'b', de: 'carla', texto: 'No puedo entrar y abrimos a las 8.' }] },
      { voz: 'El agente registra el ticket y lo prioriza: impacto medio, porque es una persona clave, y urgencia alta, por la hora. Prioridad dos.', acciones: [{ t: 'quitar', ids: ['b'] }, { t: 'tabla', id: 'tk', x: 620, y: 60, w: 300, titulo: 'INC-20431', columnas: ['campo', 'valor'], filas: [['Estado', 'En curso'], ['Impacto', 'Medio'], ['Urgencia', 'Alta'], ['Prioridad', 'P2']], resaltar: [3] }] },
      { voz: 'Primero verifica su identidad. Después diagnostica: la cuenta está bloqueada por intentos desde su teléfono, que tenía la contraseña antigua.', acciones: [{ t: 'caja', id: 'ad', x: 395, y: 400, icono: '🗂️', texto: 'Directorio', sub: 'cuenta bloqueada', tono: 'warn' }, { t: 'linea', id: 'l2', de: 'mesa', a: 'ad' }, { t: 'viaje', de: 'mesa', a: 'ad', texto: 'consultar cuenta' }] },
      { voz: 'Solución: desbloquea la cuenta y la ayuda a actualizar la contraseña en el teléfono. Carla confirma que ya entra.', acciones: [{ t: 'caja', id: 'ad', tono: 'ok', sub: 'desbloqueada', marca: 'ok' }, { t: 'viaje', de: 'mesa', a: 'carla', texto: '¿Ya puedes entrar?', tono: 'ok' }, { t: 'caja', id: 'carla', marca: 'ok' }] },
      { voz: 'Documenta el ticket: síntoma, causa, solución y verificación. Así, quien vea un caso parecido mañana lo resolverá en minutos.', acciones: [{ t: 'nota', id: 'doc', x: 40, y: 40, w: 520, tono: 'accent', texto: 'Síntoma: cuenta bloqueada · Causa: móvil con contraseña antigua · Solución: desbloqueo y actualización · Verificación: inicia sesión 07:58' }] },
      { voz: 'Y cierra con un mensaje claro, sin jerga. Ticket resuelto en diez minutos, dentro del acuerdo de nivel de servicio.', acciones: [{ t: 'tabla', id: 'tk', filas: [['Estado', 'Resuelto'], ['Impacto', 'Medio'], ['Urgencia', 'Alta'], ['Prioridad', 'P2 · 10 min']], resaltar: [0] }, { t: 'quitar', ids: ['doc'] }, { t: 'burbuja', id: 'b2', de: 'mesa', w: 260, texto: 'Carla, ya está: tu contraseña era correcta; el teléfono usaba la anterior.' }] },
    ],
  },
};

// Lección en la que aparece cada video (el compilador comprueba que existan).
export const VIDEO_EN = {
  'viaje-mensaje': 'm1-redes', 'vlan-switch': 'm2-vlan', 'router-decide': 'm3-decision', 'dhcp-nat': 'm4-nat', phishing: 'm5-conceptos',
  automatizar: 'm6-automatizacion', 'tablas-claves': 'b1-modelo', join: 'b2-join', transaccion: 'b3-transacciones',
  bucle: 'p1-bucles', lenguajes: 'p2-panorama', 'git-flujo': 'p3-git', busqueda: 'p4-algoritmos', 'ticket-vida': 's1-tickets',
};
