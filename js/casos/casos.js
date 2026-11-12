// Casos de soporte técnico y mesa de ayuda (sin DOM, se prueban en Node).
// Cada caso es un ticket de una empresa ficticia con sus sedes (oficina central, tiendas, almacén y sucursales).
// El alumno prioriza el ticket, investiga con acciones (algunas útiles, otras inútiles o arriesgadas), decide la causa,
// elige la solución, documenta el ticket y elige cómo comunicarlo. Se evalúan cuatro dimensiones:
// diagnóstico, solución, documentación y comunicación.

export const EMPRESA = 'Comercial La Ceiba (empresa ficticia)';

export const DIMENSIONES = [
  ['diagnostico', 'Diagnóstico'],
  ['solucion', 'Solución'],
  ['documentacion', 'Documentación'],
  ['comunicacion', 'Comunicación'],
];

// Matriz de prioridad: impacto × urgencia (como en la mayoría de mesas de ayuda con ITIL).
export const IMPACTO = {
  alto: 'Alto: una sede completa, muchas personas o las ventas detenidas',
  medio: 'Medio: un área, un proceso o una persona clave sin alternativa',
  bajo: 'Bajo: una persona, con alternativa para seguir trabajando',
};
export const URGENCIA = {
  alta: 'Alta: el daño crece cada minuto (ventas, clientes esperando, una hora límite inminente)',
  media: 'Media: hay que resolverlo hoy o antes de una fecha cercana',
  baja: 'Baja: puede planificarse sin perjuicio',
};
const MATRIZ = { alto: { alta: 'P1', media: 'P2', baja: 'P3' }, medio: { alta: 'P2', media: 'P3', baja: 'P4' }, bajo: { alta: 'P3', media: 'P4', baja: 'P4' } };
export const prioridad = (impacto, urgencia) => MATRIZ[impacto]?.[urgencia] || null;
export const SLA = { P1: 'respuesta 15 min · solución 4 h', P2: 'respuesta 30 min · solución 8 h', P3: 'respuesta 4 h · solución 3 días', P4: 'respuesta 1 día · solución planificada' };

export const CASOS = {
  login: {
    id: 'login', nivel: 'principiante', lugar: 'Tienda',
    titulo: 'Un empleado no puede iniciar sesión',
    resumen: 'Una encargada de tienda no puede entrar a su computadora minutos antes de abrir. Diagnostica, resuelve sin saltarte la seguridad y explica la causa.',
    ticket: { numero: 'INC-20431', de: 'Carla Méndez', puesto: 'Encargada de cajas', sede: 'Tienda Los Prados', canal: 'Llamada', hora: '07:48',
      texto: 'No puedo entrar a la computadora de la oficina de la tienda. Me dice que la contraseña es incorrecta, pero la cambié ayer y estoy segura de que es la nueva. Tengo que sacar el reporte de apertura antes de las 8.' },
    contexto: 'La tienda abre a las 8:00 y hoy Carla es la única con acceso al reporte de apertura. Las cajas usan usuarios propios y funcionan.',
    prioridad: { impacto: 'medio', urgencia: 'alta', porque: 'Afecta a una persona, pero es clave para abrir la tienda y no tiene alternativa (impacto medio); quedan minutos para la apertura (urgencia alta) → P2.' },
    acciones: [
      { id: 'identidad', tipo: 'clave', texto: 'Verificar la identidad de quien llama según el procedimiento (código de empleado y devolución de llamada al número registrado)', resultado: 'Devuelves la llamada al teléfono de la tienda registrado y Carla da su código de empleado (40218). Identidad verificada.' },
      { id: 'reiniciar', tipo: 'inutil', texto: 'Pedirle que reinicie la computadora', resultado: 'Reinicia: tarda 4 minutos y el mensaje sigue igual. Se perdió tiempo valioso antes de la apertura.' },
      { id: 'mensaje', tipo: 'clave', texto: 'Pedir el mensaje de error exacto', resultado: 'Ahora dice: «La cuenta a la que se hace referencia está bloqueada y no se puede iniciar sesión en ella». Antes decía «contraseña incorrecta».' },
      { id: 'mayus', tipo: 'util', texto: 'Comprobar Bloq Mayús y el idioma del teclado', resultado: 'Bloq Mayús apagado y teclado en español. No es eso.' },
      { id: 'ad', tipo: 'clave', texto: 'Revisar la cuenta en la consola de usuarios del directorio (Active Directory)', resultado: 'Cuenta cmendez: BLOQUEADA desde las 07:41. Contraseña cambiada ayer a las 16:05. 5 intentos fallidos: 2 desde TIENDA-LP-OF01 y 3 desde el dispositivo móvil MOV-CMENDEZ.' },
      { id: 'reset', tipo: 'riesgo', texto: 'Restablecer la contraseña enseguida y dictársela por teléfono', resultado: 'Arriesgado: cambiar una contraseña por teléfono es justo lo que busca la ingeniería social, y dictarla la expone. Además era innecesario: la contraseña nueva de Carla era correcta.' },
      { id: 'otros', tipo: 'util', texto: 'Preguntar si a otros compañeros les pasa lo mismo', resultado: 'No: el resto del personal entra sin problemas. Es algo de su cuenta, no de la tienda.' },
      { id: 'movil', tipo: 'clave', texto: 'Preguntar si tiene el correo de la empresa en el teléfono u otro equipo', resultado: 'Sí: tiene el correo en su teléfono y no actualizó ahí la contraseña. El teléfono sigue probando la antigua cada pocos minutos.' },
      { id: 'cable', tipo: 'inutil', texto: 'Revisar el cable de red de la computadora', resultado: 'El equipo tiene red: el mensaje de cuenta bloqueada viene del servidor. No era el problema.' },
    ],
    preguntaCausa: '¿Cuál es la causa?',
    causas: [
      { texto: 'El teléfono, con la contraseña antigua guardada, bloqueó la cuenta tras varios intentos fallidos', ok: true },
      { texto: 'Carla olvidó la contraseña nueva', porque: 'El registro muestra intentos desde el móvil y Carla escribe la nueva; su contraseña era correcta.' },
      { texto: 'La computadora perdió la relación de confianza con el dominio', porque: 'Ese error tiene otro mensaje y afectaría a cualquiera que use ese equipo.' },
      { texto: 'Hay una falla de red en la tienda', porque: 'El resto del personal trabaja con normalidad y el servidor responde.' },
    ],
    solucion: [
      { texto: 'Desbloquear la cuenta en el directorio', ok: true },
      { texto: 'Guiarla para actualizar la contraseña en el correo del teléfono (o quitar la cuenta y volver a añadirla)', ok: true, porque: 'Si no, el teléfono la vuelve a bloquear en minutos.' },
      { texto: 'Confirmar con ella que inicia sesión y que puede sacar el reporte', ok: true },
      { texto: 'Restablecer la contraseña y obligarla a cambiarla', porque: 'Innecesario: su contraseña era válida; solo añade otra contraseña que recordar.' },
      { texto: 'Desactivar el bloqueo por intentos fallidos en su usuario', porque: 'Debilita la seguridad: el bloqueo protege contra ataques de adivinación de contraseñas.' },
      { texto: 'Escalar el ticket al nivel 2 de infraestructura', porque: 'Se resuelve en el primer nivel; escalar solo retrasaría la apertura.' },
    ],
    documentacion: [
      { campo: 'Síntoma', ayuda: 'Qué reportó la usuaria y qué mensaje veía', claves: ['bloque', 'no puede iniciar', 'no podia iniciar', 'no puede entrar', 'contrasena incorrecta', 'inicio de sesion', 'iniciar sesion'] },
      { campo: 'Causa', ayuda: 'Qué la provocó, con la evidencia', claves: ['movil', 'telefono', 'celular', 'contrasena antigua', 'contrasena anterior', 'contrasena vieja'] },
      { campo: 'Solución aplicada', ayuda: 'Qué hiciste, paso a paso', claves: ['desbloque'] },
      { campo: 'Verificación y prevención', ayuda: 'Cómo comprobaste que funciona y qué evita que se repita', claves: ['inicio sesion', 'inicia sesion', 'entro', 'reporte', 'verific', 'confirm', 'actualiz'] },
    ],
    modelo: [
      'Síntoma: la usuaria cmendez no podía iniciar sesión en TIENDA-LP-OF01 («contraseña incorrecta» y después «cuenta bloqueada») a las 07:48, antes de la apertura.',
      'Causa: tras el cambio de contraseña de ayer, el correo de su teléfono (MOV-CMENDEZ) seguía usando la contraseña antigua y bloqueó la cuenta (3 de 5 intentos fallidos).',
      'Solución: identidad verificada por devolución de llamada; cuenta desbloqueada; contraseña actualizada en el correo del teléfono con la usuaria.',
      'Verificación: inicia sesión y genera el reporte de apertura a las 07:58. Prevención: recordar actualizar dispositivos móviles al cambiar la contraseña (artículo KB-112).',
    ],
    comunicacion: [
      { para: 'Mensaje de cierre a Carla', opciones: [
        { texto: 'Carla, ya desbloqueé tu cuenta: tu contraseña nueva era correcta. Se bloqueó porque el correo de tu teléfono seguía probando la anterior; como ya la actualizamos ahí, no debería repetirse. ¿Me confirmas que entraste y que sale el reporte?', ok: true },
        { texto: 'Listo, era un lockout por credenciales cacheadas en un dispositivo con ActiveSync. Cierro el ticket.', porque: 'Usa jerga que la usuaria no entiende y cierra sin confirmar que todo funciona.' },
        { texto: 'Ya funciona. La próxima vez fíjate bien en lo que escribes.', porque: 'Culpa a la usuaria, y además es falso: su contraseña era correcta.' },
      ] },
    ],
    aprendizaje: 'Una cuenta que se bloquea justo después de un cambio de contraseña casi siempre es un dispositivo (teléfono, tableta, unidad de red mapeada) con la contraseña antigua. Verifica siempre la identidad antes de tocar una cuenta.',
  },

  'impresora-etiquetas': {
    id: 'impresora-etiquetas', nivel: 'intermedio', lugar: 'Almacén',
    titulo: 'Una impresora de etiquetas deja de funcionar',
    resumen: 'La impresora térmica de un muelle de recepción no imprime y hay camiones esperando. Encuentra la causa con pruebas, restablece el servicio y evita que se repita.',
    ticket: { numero: 'INC-20457', de: 'Luis Ortega', puesto: 'Encargado de recepción', sede: 'Centro de distribución', canal: 'Portal de tickets y llamada', hora: '10:15',
      texto: 'La impresora de etiquetas del muelle 3 no imprime desde esta mañana. Mandamos la etiqueta desde el sistema y no sale nada. Tenemos dos camiones esperando para descargar.' },
    contexto: 'Las etiquetas se envían desde el sistema de almacén (SGA, ficticio) al servidor de impresión, que las manda a impresoras térmicas de red. Las impresoras obtienen su dirección IP por DHCP.',
    prioridad: { impacto: 'medio', urgencia: 'alta', porque: 'Afecta a un proceso (un muelle) y hay otros muelles operando (impacto medio); los camiones esperando hacen que el daño crezca cada minuto (urgencia alta) → P2.' },
    acciones: [
      { id: 'otras', tipo: 'util', texto: 'Preguntar si las impresoras de los otros muelles funcionan', resultado: 'Sí: los muelles 1, 2 y 4 imprimen bien. Solo falla el muelle 3, así que el SGA y el servidor funcionan.' },
      { id: 'driver', tipo: 'inutil', texto: 'Reinstalar el controlador de impresora en la PC de recepción', resultado: '15 minutos después, sigue igual: la PC no imprime directamente, envía al servidor de impresión.' },
      { id: 'config', tipo: 'clave', texto: 'Pedir que impriman la página de configuración de la impresora (botón de avance mantenido)', resultado: 'Sale perfecta: rollo y cinta bien. La página muestra IP 10.20.30.57, obtenida por DHCP.' },
      { id: 'cola', tipo: 'clave', texto: 'Revisar la cola y el puerto de la impresora en el servidor de impresión', resultado: 'Cola IMP-MUELLE3: 14 trabajos en error. Puerto configurado: 10.20.30.41.' },
      { id: 'ping', tipo: 'clave', texto: 'Hacer ping desde el servidor a la IP del puerto y a la que muestra la impresora', resultado: 'ping 10.20.30.41 → tiempo de espera agotado. ping 10.20.30.57 → respuesta en 2 ms.' },
      { id: 'cambios', tipo: 'util', texto: 'Preguntar por cambios o incidentes recientes', resultado: 'Anoche hubo un corte de luz de 20 minutos en el almacén y todos los equipos se reiniciaron.' },
      { id: 'desarmar', tipo: 'riesgo', texto: 'Pedir que abran la impresora para revisar el cabezal', resultado: 'Arriesgado: la página de configuración demuestra que el hardware está bien. Abrirla sin necesidad puede dañar el cabezal y deja el muelle sin impresora más tiempo.' },
      { id: 'rollo', tipo: 'inutil', texto: 'Cambiar el rollo de etiquetas', resultado: 'El rollo estaba bien. No cambia nada.' },
    ],
    preguntaCausa: '¿Cuál es la causa?',
    causas: [
      { texto: 'Tras el corte de luz, la impresora recibió otra IP por DHCP (no tenía reserva) y el servidor sigue enviando a la antigua', ok: true },
      { texto: 'El cabezal de impresión está dañado', porque: 'La página de configuración salió perfecta.' },
      { texto: 'El controlador de la PC de recepción está corrupto', porque: 'La PC no imprime directamente y los otros muelles usan el mismo servidor sin problema.' },
      { texto: 'El sistema de almacén (SGA) está caído', porque: 'Los otros muelles imprimen desde el mismo sistema.' },
    ],
    solucion: [
      { texto: 'Mientras tanto, imprimir las etiquetas del muelle 3 en la impresora del muelle 4', ok: true, porque: 'Una solución temporal mantiene la operación mientras arreglas la causa.' },
      { texto: 'Cambiar el puerto de la cola a 10.20.30.57 y reenviar los trabajos pendientes', ok: true },
      { texto: 'Crear una reserva DHCP para la impresora (o IP fija documentada) y dejar el puerto con esa IP', ok: true, porque: 'Es la solución definitiva: evita que se repita en el próximo corte.' },
      { texto: 'Imprimir una etiqueta de prueba con el encargado y confirmar que salen los trabajos pendientes', ok: true },
      { texto: 'Borrar la cola y pedir que vuelvan a generar todas las etiquetas a mano', porque: 'Innecesario: los 14 trabajos pueden reenviarse sin rehacer nada.' },
      { texto: 'Solicitar la compra de una impresora nueva', porque: 'La impresora funciona; el problema era de dirección de red.' },
      { texto: 'Escalar el ticket al proveedor del SGA', porque: 'El SGA funciona: los otros muelles imprimen.' },
    ],
    documentacion: [
      { campo: 'Síntoma', ayuda: 'Qué fallaba, dónde y desde cuándo', claves: ['no imprim', 'no sale', 'etiqueta', 'muelle'] },
      { campo: 'Causa', ayuda: 'Qué la provocó y cómo lo comprobaste', claves: ['ip', 'dhcp', 'corte', 'direccion'] },
      { campo: 'Solución aplicada', ayuda: 'Solución temporal y definitiva', claves: ['puerto', 'reserva', 'ip fija', '10.20.30.57'] },
      { campo: 'Verificación y prevención', ayuda: 'Prueba realizada y qué evita que se repita', claves: ['prueba', 'imprim', 'confirm', 'reserva', 'verific'] },
    ],
    modelo: [
      'Síntoma: la impresora térmica IMP-MUELLE3 no imprimía desde el inicio del turno; 14 trabajos en error en el servidor de impresión.',
      'Causa: tras el corte eléctrico de anoche, la impresora obtuvo por DHCP la IP 10.20.30.57; la cola seguía apuntando a 10.20.30.41 (sin respuesta al ping).',
      'Solución: temporal, etiquetas por el muelle 4; definitiva, puerto de la cola cambiado a 10.20.30.57 y reserva DHCP creada para su MAC; trabajos reenviados.',
      'Verificación: etiqueta de prueba correcta con Luis Ortega a las 10:48. Prevención: revisar que todas las impresoras de red tengan reserva DHCP (tarea REQ-3125).',
    ],
    comunicacion: [
      { para: 'Mensaje de cierre a Luis (encargado de recepción)', opciones: [
        { texto: 'Luis, el muelle 3 ya imprime. Tras el corte de luz, la impresora cambió de dirección de red y el servidor la seguía buscando en la antigua. Ya reenvié los 14 trabajos pendientes y le dejé una dirección fija para que no se repita. Si ves algo raro, responde a este ticket.', ok: true },
        { texto: 'Resuelto: el lease DHCP expiró, la IP cambió y el puerto TCP/IP del spooler quedó huérfano. Creé reservation.', porque: 'Correcto, pero en jerga: el usuario no sabe qué pasó ni qué tiene que hacer.' },
        { texto: 'Ya está. El problema fue de la red, no nuestro.', porque: 'No explica nada útil, culpa a otro equipo y no confirma los trabajos pendientes.' },
      ] },
      { para: 'Nota a tu supervisor', opciones: [
        { texto: 'INC-20457 (P2) resuelto en 33 min. Causa: tras el corte eléctrico, la impresora del muelle 3 tomó otra IP por DHCP. Se corrigió el puerto y se creó una reserva. Propongo revisar que todas las impresoras de red del almacén tengan reserva (abrí REQ-3125).', ok: true },
        { texto: 'Lo del almacén ya quedó, todo bien.', porque: 'No sirve para el seguimiento: falta qué pasó, cuánto duró y si puede repetirse.' },
        { texto: 'Otra vez redes no reservó las IP. Que alguien hable con ellos porque siempre es lo mismo.', porque: 'Busca culpables en lugar de proponer una mejora concreta.' },
      ] },
    ],
    aprendizaje: 'Los equipos que otros dispositivos buscan por su IP (impresoras, lectores, servidores) necesitan una dirección estable: reserva DHCP o IP fija documentada. Empieza siempre por acotar: si los otros muelles funcionan, el sistema central no es el problema.',
  },

  sucursal: {
    id: 'sucursal', nivel: 'intermedio', lugar: 'Sucursal',
    titulo: 'Una sucursal pierde la conexión',
    resumen: 'Una tienda llena de clientes se queda sin sistema y no pasan las tarjetas. Es un P1: restablece la venta con el respaldo, coordina al proveedor y mantén informados a todos.',
    ticket: { numero: 'INC-20502', de: 'Ana Rosario', puesto: 'Gerente de tienda', sede: 'Tienda Las Palmas', canal: 'Llamada', hora: '15:10',
      texto: 'No tenemos sistema en ninguna caja ni en la oficina. Las tarjetas no pasan. La tienda está llena de clientes.' },
    contexto: 'Cada tienda tiene un router con un enlace principal de fibra y un enlace de respaldo 4G que se activa desde el portal de gestión (ficticio). El monitoreo central marca la tienda en rojo desde las 15:02.',
    prioridad: { impacto: 'alto', urgencia: 'alta', porque: 'Toda una sede sin ventas (impacto alto) y con clientes esperando ahora mismo (urgencia alta) → P1.' },
    acciones: [
      { id: 'alcance', tipo: 'clave', texto: 'Confirmar el alcance: ¿todas las cajas? ¿la oficina? ¿hay electricidad?', resultado: 'Todo sin sistema: cajas, oficina, verificador de precios y teléfonos IP. La electricidad funciona con normalidad.' },
      { id: 'monitoreo', tipo: 'clave', texto: 'Revisar el monitoreo central y el router de la tienda', resultado: 'El router TDA-LP-RT01 responde por su canal de gestión 4G: está encendido. La interfaz de fibra está caída desde las 15:02. Las demás tiendas funcionan.' },
      { id: 'reiniciar-cajas', tipo: 'inutil', texto: 'Pedir que reinicien todas las cajas', resultado: 'Se reinician 8 cajas: 10 minutos con la tienda llena. El problema no estaba en las cajas.' },
      { id: 'ont', tipo: 'clave', texto: 'Pedir que miren las luces del equipo del proveedor (ONT) sin desconectar nada', resultado: 'La luz LOS parpadea en rojo: no llega señal de fibra desde la calle.' },
      { id: 'reset', tipo: 'riesgo', texto: 'Pedir que reseteen el router de la tienda a valores de fábrica', resultado: 'Muy arriesgado: el reseteo borra la VPN, las VLAN y el respaldo 4G. La tienda habría seguido sin conexión aun cuando volviera la fibra.' },
      { id: 'respaldo', tipo: 'clave', texto: 'Activar el enlace de respaldo 4G desde el portal de gestión', resultado: 'Respaldo activo a las 15:24: las cajas vuelven a cobrar con tarjeta (algo más lento, pero funciona).' },
      { id: 'proveedor', tipo: 'clave', texto: 'Abrir un reporte de avería con el proveedor de fibra', resultado: 'Ticket del proveedor PRV-88812: avería de fibra en la zona por obras. Tiempo estimado: 3 horas.' },
      { id: 'supervisor', tipo: 'util', texto: 'Avisar al supervisor de guardia de que hay una tienda caída (P1)', resultado: 'Queda informado y pide actualizaciones cada 30 minutos.' },
    ],
    preguntaCausa: '¿Cuál es la causa?',
    causas: [
      { texto: 'Una avería de la fibra del proveedor en la zona (falla externa a la tienda)', ok: true },
      { texto: 'Una falla en las cajas registradoras', porque: 'También fallan la oficina y los teléfonos: el problema es común a toda la tienda.' },
      { texto: 'Un corte de electricidad en la tienda', porque: 'Hay electricidad y el router está encendido.' },
      { texto: 'Un virus en la red de la tienda', porque: 'Nada lo indica: la ONT no recibe señal de fibra.' },
    ],
    solucion: [
      { texto: 'Activar el respaldo 4G para que la tienda vuelva a vender', ok: true },
      { texto: 'Reportar la avería al proveedor y anotar su número de ticket y el tiempo estimado', ok: true },
      { texto: 'Informar a la gerente y al supervisor, con actualizaciones periódicas', ok: true },
      { texto: 'Cuando vuelva la fibra, verificar que el router regresa al enlace principal y luego cerrar', ok: true },
      { texto: 'Recomendar cerrar la tienda hasta que vuelva la fibra', porque: 'Desproporcionado: con el respaldo 4G la tienda puede seguir vendiendo.' },
      { texto: 'Cambiar la configuración de VLAN de la tienda', porque: 'Nada indica un problema de VLAN; tocar la configuración en medio de un P1 añade riesgo.' },
    ],
    documentacion: [
      { campo: 'Síntoma', ayuda: 'Qué servicios fallaban, dónde y desde cuándo', claves: ['sin conexion', 'sin sistema', 'caid', 'no cobra', 'tarjeta', 'sin servicio'] },
      { campo: 'Causa', ayuda: 'Qué la provocó y la evidencia', claves: ['fibra', 'proveedor', 'obra', 'ont'] },
      { campo: 'Acciones y escalamiento', ayuda: 'Qué hiciste y a quién escalaste (con referencias)', claves: ['respaldo', '4g', 'lte', 'prv-88812', 'proveedor'] },
      { campo: 'Estado y próximos pasos', ayuda: 'Cómo queda el servicio y qué falta para cerrar', claves: ['cobra', 'funciona', 'actualiz', 'pendiente', 'verific', 'cerrar', 'principal'] },
    ],
    modelo: [
      'Síntoma: Tienda Las Palmas sin conexión desde las 15:02 (cajas, oficina y telefonía IP); no se procesaban tarjetas.',
      'Causa: avería de la fibra del proveedor en la zona por obras (ONT con LOS en rojo; router encendido y accesible por la gestión 4G).',
      'Acciones: respaldo 4G activado a las 15:24 (ventas restablecidas); avería reportada al proveedor, ticket PRV-88812, estimado 3 h; gerente y supervisor informados.',
      'Estado: operando por respaldo. Pendiente: confirmar el regreso al enlace principal cuando el proveedor repare y cerrar. Próxima actualización: 16:00.',
    ],
    comunicacion: [
      { para: 'Mensaje a la gerente durante la incidencia', opciones: [
        { texto: 'Ana, el corte es de la fibra del proveedor en la zona, no de la tienda. Ya activamos el enlace de respaldo: las cajas pueden cobrar otra vez, aunque un poco más lento. El proveedor estima unas 3 horas; te aviso en cuanto vuelva o, como tarde, a las 16:00.', ok: true },
        { texto: 'Hay LOS en la ONT; hicimos failover manual a LTE. El ISP tiene el caso.', porque: 'Jerga técnica: la gerente no sabe si ya puede vender ni cuándo tendrá noticias.' },
        { texto: 'Es culpa del proveedor; no podemos hacer nada. Toca esperar.', porque: 'Falso y desalentador: sí había un respaldo, y no da ningún plazo.' },
      ] },
      { para: 'Actualización al supervisor de guardia', opciones: [
        { texto: 'P1 · Tienda Las Palmas sin enlace principal desde las 15:02 por avería de fibra del proveedor (PRV-88812, estimado 18:00). Respaldo 4G activo desde las 15:24; ventas operando. Próxima actualización: 16:00.', ok: true },
        { texto: 'Tuvimos un problemita en una tienda, pero ya casi está.', porque: 'Minimiza un P1 y no da datos: ni tienda, ni causa, ni estado, ni plazo.' },
        { texto: 'Llamé a la tienda, revisé el monitoreo, vi el router, miré las luces, abrí ticket… (sigue un relato de 20 líneas)', porque: 'Un supervisor necesita lo esencial: impacto, causa, estado, próximo paso y hora.' },
      ] },
    ],
    aprendizaje: 'En un P1, lo primero es restablecer el servicio (respaldo o solución temporal) y comunicar; la causa raíz se resuelve después. Nunca hagas cambios destructivos (resetear, reconfigurar) en plena incidencia sin evidencia.',
  },

  'nuevo-empleado': {
    id: 'nuevo-empleado', nivel: 'principiante', lugar: 'Oficina',
    titulo: 'Preparar los accesos de un empleado nuevo',
    resumen: 'Recursos Humanos pide los accesos de un empleado que empieza el lunes. Sigue el procedimiento de ingreso con mínimo privilegio y entrega las credenciales de forma segura.',
    ticket: { numero: 'REQ-3110', de: 'Patricia Gómez', puesto: 'Recursos Humanos', sede: 'Oficina central', canal: 'Portal de solicitudes', hora: '09:30 (jueves)',
      texto: 'Ingreso de nuevo empleado: Daniel Castillo, Analista de Compras, empieza el lunes a las 8:00. Necesita computadora, correo, acceso a la carpeta de Compras y al sistema de compras.' },
    contexto: 'Procedimiento: toda alta necesita la aprobación del jefe del área. Convención de usuarios: inicial del nombre + apellido; si ya existe, dos letras del nombre. Ya existe el usuario dcastillo (Diana Castillo, almacén).',
    prioridad: { impacto: 'bajo', urgencia: 'media', porque: 'Es una solicitud planificada con varios días de margen (impacto bajo, urgencia media) → P4 con fecha comprometida: debe estar lista antes del lunes a las 8:00.' },
    acciones: [
      { id: 'aprobacion', tipo: 'clave', texto: 'Verificar que la solicitud está aprobada por el jefe de Compras', resultado: 'Aprobada por Roberto Lima, jefe de Compras, el martes.' },
      { id: 'llamar', tipo: 'inutil', texto: 'Llamar a Daniel para preguntarle qué permisos quiere', resultado: 'Daniel todavía no trabaja aquí y no sabe qué necesita: los accesos los define el perfil del puesto y los aprueba su jefe.' },
      { id: 'duplicado', tipo: 'clave', texto: 'Comprobar si ya existe un usuario con ese nombre', resultado: 'Ya existe dcastillo (Diana Castillo, almacén). Según la convención, toca dacastillo, que está libre.' },
      { id: 'perfil', tipo: 'clave', texto: 'Consultar el perfil de accesos del puesto «Analista de Compras»', resultado: 'Perfil: grupos GG-Compras-Lectura y GG-Compras-Analistas, licencia de correo estándar y rol «Compras-Consulta» en el sistema de compras. Sin permisos de administrador.' },
      { id: 'copiar', tipo: 'riesgo', texto: 'Copiar los permisos de otro analista de Compras con más antigüedad', resultado: 'Arriesgado: ese usuario acumuló permisos de puestos anteriores (aprobar órdenes, carpeta de Finanzas). Copiar usuarios hereda privilegios que el nuevo empleado no necesita: va contra el mínimo privilegio.' },
      { id: 'inventario', tipo: 'util', texto: 'Revisar el inventario de equipos disponibles', resultado: 'Hay un portátil PT-0457 preparado con la imagen corporativa.' },
      { id: 'admin', tipo: 'riesgo', texto: 'Hacerlo administrador de su equipo para que instale lo que necesite', resultado: 'Arriesgado: con permisos de administrador cualquier programa malicioso que abra controla el equipo. El software se instala desde el catálogo aprobado.' },
    ],
    preguntaCausa: '¿Qué nombre de usuario le corresponde a Daniel?',
    causas: [
      { texto: 'dacastillo', ok: true },
      { texto: 'dcastillo', porque: 'Ya existe (Diana Castillo): dos personas no pueden compartir cuenta.' },
      { texto: 'daniel.castillo', porque: 'No sigue la convención de la empresa; las convenciones evitan errores y duplicados.' },
      { texto: 'Usar la cuenta de Diana mientras tanto', porque: 'Nunca: cada acción debe poder atribuirse a una persona.' },
    ],
    solucion: [
      { texto: 'Crear la cuenta dacastillo con una contraseña temporal que debe cambiar en el primer inicio', ok: true },
      { texto: 'Añadirla solo a los grupos del perfil del puesto', ok: true },
      { texto: 'Asignar la licencia de correo y exigir el registro de la verificación en dos pasos (MFA)', ok: true },
      { texto: 'Asignar el portátil PT-0457 a Daniel en el inventario y probar con la cuenta nueva la carpeta y el sistema de compras', ok: true },
      { texto: 'Entregar la contraseña temporal en persona el lunes (o a través de su jefe), nunca por correo', ok: true },
      { texto: 'Enviar usuario y contraseña al correo personal de Daniel para que lo tenga listo', porque: 'Las credenciales por correo pueden ser leídas por terceros; el correo personal no está bajo control de la empresa.' },
      { texto: 'Añadirlo al grupo de administradores del dominio «por si acaso»', porque: 'Viola el mínimo privilegio: es el permiso más peligroso de toda la red.' },
    ],
    documentacion: [
      { campo: 'Solicitud', ayuda: 'Qué se pidió, quién y quién lo aprobó', claves: ['req-3110', 'solicitud', 'ingreso', 'alta', 'aprob'] },
      { campo: 'Accesos creados', ayuda: 'Usuario, grupos, licencias y sistemas', claves: ['dacastillo', 'grupo', 'licencia', 'gg-compras'] },
      { campo: 'Seguridad', ayuda: 'Contraseña, MFA y mínimo privilegio', claves: ['mfa', 'dos pasos', 'temporal', 'minimo privilegio', 'perfil'] },
      { campo: 'Entrega y pendientes', ayuda: 'Equipo asignado y cómo/cuándo se entrega', claves: ['lunes', 'entrega', 'pt-0457', 'portatil', 'equipo'] },
    ],
    modelo: [
      'Solicitud: REQ-3110, ingreso de Daniel Castillo (Analista de Compras) para el lunes 8:00; aprobada por Roberto Lima (jefe de Compras).',
      'Accesos: usuario dacastillo (dcastillo ya existía); grupos GG-Compras-Lectura y GG-Compras-Analistas; licencia de correo estándar; rol Compras-Consulta en el sistema de compras.',
      'Seguridad: contraseña temporal de un solo uso con cambio obligatorio; MFA obligatorio en el primer inicio; sin permisos de administrador (perfil del puesto, mínimo privilegio).',
      'Entrega: portátil PT-0457 asignado en el inventario; accesos probados el jueves. Lunes 8:00: entrega presencial de credenciales y registro del MFA con el usuario.',
    ],
    comunicacion: [
      { para: 'Respuesta a Recursos Humanos y al jefe de Compras', opciones: [
        { texto: 'Hola, Patricia y Roberto: los accesos de Daniel Castillo están listos para el lunes: usuario dacastillo, correo, carpeta de Compras, sistema de compras (consulta) y el portátil PT-0457. El lunes a las 8:00 le entrego la contraseña temporal en persona y lo ayudo a configurar la verificación en dos pasos (unos 15 minutos). Si necesita otro acceso, el jefe del área debe aprobarlo en una nueva solicitud.', ok: true },
        { texto: 'Listo. Usuario: dcastillo · Contraseña: Bienvenido2026', porque: 'Envía la contraseña por correo y además con el usuario equivocado.' },
        { texto: 'Le di los mismos permisos que a Pedro para que no le falte nada.', porque: 'Copiar permisos de otra persona viola el mínimo privilegio y no informa qué se entregó.' },
      ] },
    ],
    aprendizaje: 'Ingresos y salidas de personal siguen un procedimiento: aprobación, perfil del puesto, mínimo privilegio, entrega segura y registro. En una salida se hace lo contrario el mismo día: deshabilitar la cuenta, revocar accesos y recuperar el equipo.',
  },

  lento: {
    id: 'lento', nivel: 'principiante', lugar: 'Oficina',
    titulo: 'La computadora va muy lenta',
    resumen: 'Una asistente de contabilidad dice que su equipo está lentísimo. Mide antes de actuar, encuentra la causa real y resuélvela sin perder datos.',
    ticket: { numero: 'INC-20519', de: 'Rosa Peña', puesto: 'Asistente de Contabilidad', sede: 'Oficina central', canal: 'Correo', hora: '11:20',
      texto: 'Mi computadora está lentísima desde hace dos días, tarda mucho en abrir Excel y a veces se congela.' },
    contexto: 'Portátil con 8 GB de RAM y disco SSD de 256 GB. Nadie más ha reportado lentitud.',
    prioridad: { impacto: 'bajo', urgencia: 'media', porque: 'Una persona que puede seguir trabajando, aunque más lenta (impacto bajo); hay que resolverlo pronto, pero no hay un daño inmediato (urgencia media) → P4.' },
    acciones: [
      { id: 'cambios', tipo: 'util', texto: 'Preguntar desde cuándo ocurre y qué cambió', resultado: 'Hace dos días descargó los videos de una capacitación y marcó en OneDrive «Mantener siempre en este dispositivo».' },
      { id: 'tareas', tipo: 'clave', texto: 'Abrir el Administrador de tareas (CPU, memoria y disco)', resultado: 'Disco al 100 % de uso y memoria al 92 %. El proceso que más usa el disco es la sincronización de OneDrive.' },
      { id: 'desfrag', tipo: 'inutil', texto: 'Desfragmentar el disco', resultado: 'Es un SSD: no se desfragmenta (Windows lo optimiza solo). No ayuda.' },
      { id: 'espacio', tipo: 'clave', texto: 'Revisar el espacio libre del disco', resultado: 'C: tiene 1,8 GB libres de 237 GB.' },
      { id: 'formatear', tipo: 'riesgo', texto: 'Formatear y reinstalar Windows', resultado: 'Desproporcionado y arriesgado: puede perder datos locales y la deja un día sin trabajar, por un problema que se arregla en minutos.' },
      { id: 'carpetas', tipo: 'clave', texto: 'Ver qué carpetas ocupan más espacio', resultado: 'Descargas ocupa 96 GB (videos de la capacitación y tres copias del mismo archivo). OneDrive guarda 41 GB «siempre en este dispositivo».' },
      { id: 'eventos', tipo: 'util', texto: 'Revisar el Visor de eventos', resultado: 'Advertencias de poco espacio en disco desde hace dos días. Ningún error de hardware.' },
      { id: 'borrar', tipo: 'riesgo', texto: 'Vaciar la carpeta Descargas sin preguntar', resultado: 'Arriesgado: puede haber documentos de trabajo. Lo que se borra se decide con la usuaria.' },
    ],
    preguntaCausa: '¿Cuál es la causa?',
    causas: [
      { texto: 'El disco está casi lleno por descargas grandes y archivos de OneDrive guardados sin conexión', ok: true },
      { texto: 'Un virus', porque: 'El consumo lo explican la sincronización y el disco lleno; no hay otras señales.' },
      { texto: 'La memoria RAM está dañada', porque: 'No hay errores de hardware y el problema empezó con un cambio concreto.' },
      { texto: 'Excel está corrupto', porque: 'Todo el equipo va lento, no solo Excel.' },
    ],
    solucion: [
      { texto: 'Revisar con Rosa qué archivos de Descargas se pueden borrar o mover y vaciar la papelera', ok: true },
      { texto: 'Configurar OneDrive con «Liberar espacio» en las carpetas que no usa a diario', ok: true, porque: 'Los archivos siguen visibles y se descargan al abrirlos.' },
      { texto: 'Ejecutar el liberador de espacio o el Sensor de almacenamiento de Windows', ok: true },
      { texto: 'Comprobar con ella que Excel abre rápido y que el disco queda con al menos un 15 % libre', ok: true },
      { texto: 'Pedir una computadora nueva', porque: 'El equipo es adecuado; el problema era de espacio.' },
      { texto: 'Desactivar el antivirus para que vaya más rápido', porque: 'Nunca: deja el equipo desprotegido y no era la causa.' },
    ],
    documentacion: [
      { campo: 'Síntoma', ayuda: 'Qué notaba la usuaria y desde cuándo', claves: ['lent', 'congela', 'excel'] },
      { campo: 'Causa', ayuda: 'Qué encontraste y con qué herramienta', claves: ['disco', 'espacio', 'lleno', 'onedrive', 'descargas'] },
      { campo: 'Solución aplicada', ayuda: 'Qué hiciste (y qué se acordó con la usuaria)', claves: ['liber', 'borr', 'mov', 'onedrive', 'sensor'] },
      { campo: 'Verificación y prevención', ayuda: 'Cómo comprobaste el resultado y cómo evitar que vuelva', claves: ['libre', 'excel', 'verific', 'confirm', 'rapid', '%'] },
    ],
    modelo: [
      'Síntoma: lentitud general y bloqueos desde hace 2 días en el portátil de rpena; Excel tarda en abrir.',
      'Causa: disco con 1,8 GB libres de 237 GB (Descargas 96 GB y 41 GB de OneDrive sin conexión); disco al 100 % en el Administrador de tareas.',
      'Solución: con la usuaria, se borraron copias duplicadas y videos ya vistos; OneDrive configurado con «Liberar espacio»; Sensor de almacenamiento activado.',
      'Verificación: 112 GB libres (47 %); Excel abre en 3 s. Prevención: Sensor de almacenamiento activo; se explicó cómo usar los archivos a petición.',
    ],
    comunicacion: [
      { para: 'Mensaje de cierre a Rosa', opciones: [
        { texto: 'Rosa, la lentitud venía de que el disco estaba casi lleno (los videos de la capacitación y archivos de OneDrive guardados en el equipo). Liberamos más de 100 GB y OneDrive ahora guarda en la nube lo que no usas a diario: lo abres igual, con doble clic. Si vuelve a ir lento, responde a este correo.', ok: true },
        { texto: 'Tenías el disco lleno de basura. No descargues tantas cosas.', porque: 'Culpa a la usuaria y no le explica cómo trabajar a partir de ahora.' },
        { texto: 'Se liberó almacenamiento y se configuró Files On-Demand con política de deshidratación.', porque: 'Jerga: Rosa no sabrá qué cambió ni cómo encontrar sus archivos.' },
      ] },
    ],
    aprendizaje: 'Antes de actuar, mide: el Administrador de tareas y el espacio en disco explican la mayoría de los equipos lentos. Nunca borres datos de un usuario sin acordarlo con él.',
  },
};

// Turno de mesa de ayuda (proyecto de portafolio de la ruta de soporte): clasificar y resolver cinco tickets.
export const TURNO = {
  id: 'soporte', progreso: 'turno-soporte', nivel: 'intermedio',
  titulo: 'Proyecto: un turno en la mesa de ayuda',
  resumen: 'Atiendes la mesa de ayuda de una cadena de tiendas durante un turno: clasificas cinco tickets por prioridad y los resuelves con diagnóstico, solución, documentación y comunicación. Al final descargas un informe para tu portafolio.',
  casos: ['sucursal', 'login', 'impresora-etiquetas', 'lento', 'nuevo-empleado'],
};

const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
export const MIN_NOTA = 15; // caracteres mínimos para que un campo de la nota cuente
// Las claves cortas (ip, 4g, ont) cuentan solo como palabra completa: «equipo» no menciona una «ip».
const escapar = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const contiene = (texto, clave) => { const k = normalizar(clave); return k.length <= 3 && /^[a-z0-9]+$/.test(k) ? new RegExp(`(^|[^a-z0-9])${escapar(k)}([^a-z0-9]|$)`).test(texto) : texto.includes(k); };

// respuestas: { impacto, urgencia, acciones: [ids en el orden en que se hicieron], causa: índice, solucion: [índices],
//               notas: { campo: texto }, mensajes: [índice elegido por cada mensaje] }
export function evaluarCaso(caso, r) {
  const comentarios = [];
  const nota = (dim, ok, texto) => comentarios.push({ dim, ok, texto });

  // Diagnóstico: prioridad (15) + comprobaciones clave (50) + causa (35), con penalización por acciones de riesgo o inútiles.
  const hechas = new Set(r.acciones || []);
  const claves = caso.acciones.filter(a => a.tipo === 'clave');
  const vistas = claves.filter(a => hechas.has(a.id));
  const prio = prioridad(r.impacto, r.urgencia);
  const prioOk = prio === prioridad(caso.prioridad.impacto, caso.prioridad.urgencia);
  const causaOk = !!caso.causas[r.causa]?.ok;
  const riesgos = caso.acciones.filter(a => a.tipo === 'riesgo' && hechas.has(a.id));
  const inutiles = caso.acciones.filter(a => a.tipo === 'inutil' && hechas.has(a.id));
  let diag = (prioOk ? 15 : 0) + Math.round((vistas.length / claves.length) * 50) + (causaOk ? 35 : 0) - riesgos.length * 20 - inutiles.length * 5;
  nota('diagnostico', prioOk, prioOk ? `Prioridad correcta (${prio}). ${caso.prioridad.porque}` : `Prioridad: marcaste ${prio || 'sin clasificar'}. ${caso.prioridad.porque}`);
  for (const a of claves) if (!hechas.has(a.id)) nota('diagnostico', false, `Te faltó comprobar: ${a.texto.charAt(0).toLowerCase() + a.texto.slice(1)}.`);
  if (vistas.length === claves.length) nota('diagnostico', true, 'Hiciste todas las comprobaciones clave.');
  for (const a of riesgos) nota('diagnostico', false, a.resultado);
  for (const a of inutiles) nota('diagnostico', false, `Acción que no aportaba: ${a.texto.charAt(0).toLowerCase() + a.texto.slice(1)}. ${a.resultado}`);
  nota('diagnostico', causaOk, causaOk ? 'Causa identificada correctamente.' : `La causa no era «${caso.causas[r.causa]?.texto || 'sin respuesta'}». ${caso.causas[r.causa]?.porque || ''} Era: ${caso.causas.find(c => c.ok).texto}.`);

  // Solución: proporción de pasos correctos marcados, −25 por cada paso incorrecto.
  const elegidos = new Set(r.solucion || []);
  const correctos = caso.solucion.map((s, i) => [s, i]).filter(([s]) => s.ok);
  const aciertos = correctos.filter(([, i]) => elegidos.has(i)).length;
  const errores = caso.solucion.map((s, i) => [s, i]).filter(([s, i]) => !s.ok && elegidos.has(i));
  let sol = Math.round((aciertos / correctos.length) * 100) - errores.length * 25;
  for (const [s, i] of correctos) if (!elegidos.has(i)) nota('solucion', false, `Faltó: ${s.texto.charAt(0).toLowerCase() + s.texto.slice(1)}.${s.porque ? ' ' + s.porque : ''}`);
  for (const [s] of errores) nota('solucion', false, `No conviene: ${s.texto.charAt(0).toLowerCase() + s.texto.slice(1)}. ${s.porque || ''}`);
  if (aciertos === correctos.length && !errores.length) nota('solucion', true, 'Solución completa: restableces el servicio, atacas la causa y verificas.');

  // Documentación: cada campo cuenta si tiene contenido suficiente y menciona algo esencial.
  const campos = caso.documentacion.map(c => {
    const t = normalizar(r.notas?.[c.campo]);
    const ok = t.length >= MIN_NOTA && c.claves.some(k => contiene(t, k));
    nota('documentacion', ok, ok ? `«${c.campo}» bien documentado.` : t.length < MIN_NOTA ? `«${c.campo}»: está vacío o es demasiado breve. ${c.ayuda}.` : `«${c.campo}»: falta lo esencial (${c.ayuda.toLowerCase()}).`);
    return ok;
  });
  const doc = Math.round((campos.filter(Boolean).length / campos.length) * 100);

  // Comunicación: el mensaje adecuado para cada destinatario.
  const msgs = caso.comunicacion.map((m, k) => {
    const o = m.opciones[r.mensajes?.[k]];
    nota('comunicacion', !!o?.ok, o?.ok ? `${m.para}: claro, sin jerga, con la causa, lo que se hizo y el siguiente paso.` : `${m.para}: ${o ? o.porque : 'sin elegir'}`);
    return !!o?.ok;
  });
  const com = Math.round((msgs.filter(Boolean).length / msgs.length) * 100);

  const dims = { diagnostico: Math.max(0, Math.min(100, diag)), solucion: Math.max(0, Math.min(100, sol)), documentacion: doc, comunicacion: com };
  const total = Math.round((dims.diagnostico + dims.solucion + dims.documentacion + dims.comunicacion) / 4);
  const aprobado = total >= 70 && Object.values(dims).every(v => v >= 50) && !riesgos.length;
  return { dims, total, aprobado, prioridad: prio, riesgos: riesgos.length, comentarios };
}

// Respuestas de referencia (las usan las pruebas y el botón «Ver la resolución de referencia»).
export function respuestaModelo(caso) {
  return {
    impacto: caso.prioridad.impacto, urgencia: caso.prioridad.urgencia,
    acciones: caso.acciones.filter(a => a.tipo === 'clave').map(a => a.id),
    causa: caso.causas.findIndex(c => c.ok),
    solucion: caso.solucion.map((s, i) => (s.ok ? i : -1)).filter(i => i >= 0),
    notas: Object.fromEntries(caso.documentacion.map((c, i) => [c.campo, caso.modelo[i].replace(/^[^:]+:\s*/, '')])),
    mensajes: caso.comunicacion.map(m => m.opciones.findIndex(o => o.ok)),
  };
}

// Informe de texto del turno (o de un caso suelto) para el portafolio.
export function informeTurno(resultados, fecha = new Date()) {
  const L = [];
  L.push('INFORME DE TURNO · MESA DE AYUDA (proyecto académico simulado)');
  L.push(`Plataforma: Aula de Redes · Escenario: ${EMPRESA} · Fecha: ${fecha.toISOString().slice(0, 10)}`);
  L.push('Nota: los tickets, personas y sistemas son ficticios. Este informe documenta una práctica de formación, no experiencia laboral.');
  L.push('');
  const hechos = Object.entries(resultados).filter(([id]) => CASOS[id]);
  const media = hechos.length ? Math.round(hechos.reduce((s, [, x]) => s + x.evaluacion.total, 0) / hechos.length) : 0;
  L.push(`Tickets resueltos: ${hechos.length} · Puntuación media: ${media}/100`);
  L.push('');
  for (const [id, x] of hechos) {
    const c = CASOS[id];
    const ev = x.evaluacion;
    L.push('='.repeat(72));
    L.push(`${c.ticket.numero} · ${c.titulo} · ${c.ticket.sede}`);
    L.push(`Prioridad asignada: ${ev.prioridad} (${SLA[ev.prioridad] || '—'}) · Resultado: ${ev.total}/100 ${ev.aprobado ? '(aprobado)' : '(a mejorar)'}`);
    L.push(`Diagnóstico ${ev.dims.diagnostico} · Solución ${ev.dims.solucion} · Documentación ${ev.dims.documentacion} · Comunicación ${ev.dims.comunicacion}`);
    L.push('');
    L.push('Comprobaciones realizadas:');
    for (const a of x.respuestas.acciones || []) { const ac = c.acciones.find(y => y.id === a); if (ac) L.push(`  - ${ac.texto}`); }
    L.push(`Causa identificada: ${c.causas[x.respuestas.causa]?.texto || '—'}`);
    L.push('Solución aplicada:');
    for (const i of x.respuestas.solucion || []) L.push(`  - ${c.solucion[i]?.texto}`);
    L.push('');
    L.push('Notas del ticket (redactadas por el alumno):');
    for (const d of c.documentacion) L.push(`  ${d.campo}: ${(x.respuestas.notas?.[d.campo] || '—').trim()}`);
    L.push('');
    c.comunicacion.forEach((m, k) => L.push(`${m.para}:\n  «${m.opciones[x.respuestas.mensajes?.[k]]?.texto || '—'}»`));
    L.push('');
  }
  L.push('='.repeat(72));
  L.push('Cómo presentarlo con honestidad en tu currículum o entrevista:');
  L.push('  «Proyecto académico: resolví un turno simulado de mesa de ayuda con 5 incidencias y solicitudes');
  L.push('   (bloqueo de cuenta, impresora de red, caída de sucursal, rendimiento y alta de usuario), aplicando');
  L.push('   priorización por impacto y urgencia, diagnóstico por pasos, documentación de tickets y comunicación');
  L.push('   con usuarios y supervisores.»');
  return L.join('\n');
}
