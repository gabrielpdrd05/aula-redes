// Rutas de preparación para empleos de TI de entrada en empresas grandes (oficinas, tiendas, almacenes y sucursales).
// Sin DOM: la página rutas.html y las pruebas usan estos datos. Los módulos que aún no existen en el temario
// se muestran como «en preparación» y no cuentan para el porcentaje.

// Plan de los 12 módulos del área «Empleo TI». modulo: id en el temario (contenido/4x-*.md) cuando ya está publicado.
// navegador: qué se practica aquí mismo; externo: qué necesita un laboratorio propio y cómo prepararlo.
export const MODULOS_TI = [
  { n: 1, id: 's1', titulo: 'Soporte técnico y mesa de ayuda', icono: '🎧',
    navegador: 'Casos de tickets con diagnóstico, solución, documentación y comunicación; priorización; turno completo de mesa de ayuda.',
    externo: 'Diagnóstico real de Windows (Administrador de tareas, Visor de eventos, impresoras): una máquina virtual con Windows de evaluación.' },
  { n: 2, id: 's2', titulo: 'Windows y administración corporativa', icono: '🪟',
    navegador: 'Casos de cuentas, grupos y permisos; ejercicios de ingreso y salida de empleados.',
    externo: 'Windows Server de evaluación con Active Directory, GPO y carpetas compartidas en VirtualBox (2 VM: servidor y cliente).' },
  { n: 3, id: 's3', titulo: 'Microsoft 365', icono: '☁️',
    navegador: 'Casos de cuentas, licencias, MFA, Outlook, Teams, OneDrive y SharePoint.',
    externo: 'Un inquilino de pruebas de Microsoft 365 (programa para desarrolladores o prueba gratuita, si está disponible en tu país).' },
  { n: 4, id: 's4', titulo: 'Redes empresariales', icono: '🌐',
    navegador: 'Consola Cisco simulada, proyecto de la oficina, casos de sucursales, Wi-Fi, VPN, DHCP y DNS.',
    externo: 'Cisco Packet Tracer (gratis con cuenta de Networking Academy) para topologías de varias sedes.' },
  { n: 5, id: 's5', titulo: 'Tecnología para tiendas y almacenes', icono: '🏪',
    navegador: 'Casos de punto de venta, lectores, impresoras de recibos y etiquetas e inventario con sistemas ficticios.',
    externo: 'Opcional: un lector de códigos USB (funciona como teclado) y una impresora térmica para practicar en casa.' },
  { n: 6, id: 's6', titulo: 'Seguridad informática corporativa', icono: '🛡️',
    navegador: 'Detección de phishing, casos de permisos, respaldos y respuesta inicial ante incidentes.',
    externo: 'Ninguno imprescindible; opcional: una VM para practicar copias de seguridad y restauración.' },
  { n: 7, id: 's7', titulo: 'Linux y servidores', icono: '🐧',
    navegador: 'Ejercicios de comandos, permisos y lectura de registros.',
    externo: 'Ubuntu Server en VirtualBox o WSL en Windows para usuarios, servicios (systemd), registros y cron.' },
  { n: 8, id: 's8', titulo: 'Bases de datos y reportes', icono: '📊',
    navegador: 'SQL real en el navegador con datos ficticios de ventas, inventario y tickets.',
    externo: 'Excel (o LibreOffice Calc) y Power BI Desktop (gratis, solo Windows) con los archivos de práctica.' },
  { n: 9, id: 's9', titulo: 'Automatización con PowerShell y Python', icono: '⚙️',
    navegador: 'Python ejecutado en el navegador para procesar archivos CSV y automatizar tareas.',
    externo: 'PowerShell 7 (Windows, macOS o Linux) para scripts de usuarios, equipos e inventario.' },
  { n: 10, id: 's10', titulo: 'Operación de TI', icono: '📋',
    navegador: 'Casos de SLA, cambios, inventario de activos, respaldos y comunicación de fallas.',
    externo: 'Opcional: una herramienta de tickets de código abierto en una VM para practicar el flujo completo.' },
  { n: 11, id: 's11', titulo: 'Inglés técnico', icono: '🇬🇧',
    navegador: 'Lectura de errores, documentación, tickets y correos con ejercicios corregidos.',
    externo: 'Ninguno.' },
  { n: 12, id: 's12', titulo: 'Preparación para conseguir empleo', icono: '💼',
    navegador: 'Currículum, portafolio, simulación de entrevistas técnicas y de atención al usuario.',
    externo: 'Ninguno.' },
];

// Prácticas que cuentan en cada ruta (claves del catálogo de laboratorios).
export const RUTAS = [
  { id: 'soporte', titulo: 'Técnico de soporte', icono: '🧰', prioridad: true,
    puesto: 'Atiende a los usuarios en sitio y en remoto: computadoras, impresoras, programas, cuentas y periféricos de oficinas, tiendas y almacenes.',
    requisitos: ['Diagnosticar fallas de hardware y software de Windows', 'Instalar y configurar programas e impresoras', 'Gestionar tickets y priorizar', 'Atender al usuario con claridad', 'Conocer redes básicas (IP, DHCP, DNS)'],
    modulos: ['s1', 's2', 's3', 's5', 's6', 'm1', 's10', 's11', 's12'],
    practicas: ['caso:login', 'caso:lento', 'caso:impresora-etiquetas', 'caso:nuevo-empleado', 'lab:subnetting'],
    proyecto: { clave: 'turno:soporte', titulo: 'Un turno en la mesa de ayuda', texto: 'Clasifica y resuelve cinco tickets reales de una cadena de tiendas y entrega el informe del turno.' } },
  { id: 'mesa', titulo: 'Agente de mesa de ayuda', icono: '🎧', prioridad: true,
    puesto: 'Primer contacto con el usuario por teléfono, chat o portal: registra, clasifica, resuelve en primer nivel y escala lo demás.',
    requisitos: ['Registrar y clasificar tickets por impacto y urgencia', 'Resolver incidencias de primer nivel (cuentas, contraseñas, correo)', 'Escalar con información completa', 'Comunicación clara y empática, también en inglés básico', 'Documentar en la base de conocimiento'],
    modulos: ['s1', 's3', 's2', 's6', 's10', 's11', 's12'],
    practicas: ['caso:login', 'caso:sucursal', 'caso:nuevo-empleado', 'caso:lento'],
    proyecto: { clave: 'turno:soporte', titulo: 'Un turno en la mesa de ayuda', texto: 'Tu cola de tickets de un turno: priorizar, resolver, documentar y comunicar.' } },
  { id: 'redes', titulo: 'Técnico de redes', icono: '🌐',
    puesto: 'Instala, configura y diagnostica la red de oficinas, tiendas y sucursales: switches, routers, Wi-Fi, VPN y enlaces.',
    requisitos: ['Direccionamiento IP y subnetting', 'Switches, VLAN y trunks', 'Enrutamiento, DHCP, DNS y NAT', 'Wi-Fi corporativo y VPN entre sedes', 'Diagnóstico de fallas y monitoreo'],
    modulos: ['m1', 'm2', 'm3', 'm4', 's4', 'm5', 's6', 's10', 's12'],
    practicas: ['lab:subnetting', 'cli:vlan', 'cli:trunk', 'cli:intervlan', 'cli:dhcp', 'cli:nat', 'cli:averia-trunk', 'caso:sucursal'],
    proyecto: { clave: 'proyecto:oficina', titulo: 'La red de la oficina central', texto: 'Configura desde cero switch y router: VLAN, trunk, enrutamiento, DHCP, NAT y SSH, con pruebas de extremo a extremo.' } },
  { id: 'sysadmin', titulo: 'Administrador junior de sistemas', icono: '🖥️',
    puesto: 'Administra servidores Windows y Linux, el directorio de usuarios, Microsoft 365, respaldos y la automatización de tareas.',
    requisitos: ['Active Directory, GPO y permisos', 'Administración de Microsoft 365', 'Linux: usuarios, servicios, registros y cron', 'Respaldos y recuperación', 'Automatización con PowerShell y Python'],
    modulos: ['s2', 's3', 's7', 's6', 's9', 's10', 'm1', 's12'],
    practicas: ['caso:nuevo-empleado', 'caso:login', 'code:python-basico'],
    proyecto: null },
  { id: 'datos', titulo: 'Analista junior de datos', icono: '📊', independiente: true,
    puesto: 'Convierte los datos de ventas, inventario y soporte en reportes que ayudan a decidir: consultas SQL, hojas de cálculo y tableros.',
    requisitos: ['SQL: filtros, uniones, agregados y funciones de ventana', 'Excel: tablas dinámicas, fórmulas de búsqueda y gráficos', 'Introducción a Power BI: modelo, medidas y tableros', 'Limpieza de datos con Python', 'Comunicar hallazgos con claridad'],
    modulos: ['b1', 'b2', 's8', 'p1', 's9', 's11', 's12'],
    practicas: ['sql:select', 'sql:join', 'sql:agregacion', 'sql:ventanas', 'code:python-colecciones'],
    proyecto: null },
];

// Progreso de una ruta. hecha(id) → lección completada; labHecho(progreso) → práctica completada.
export function progresoRuta(ruta, curso, catalogo, { leccionHecha, labHecho }) {
  const mods = ruta.modulos.map(id => ({ id, modulo: curso.modulos.find(m => m.id === id) || null }));
  const lecciones = mods.flatMap(x => x.modulo?.lecciones || []);
  const practicas = ruta.practicas.map(c => catalogo.find(l => l.clave === c)).filter(Boolean);
  const proyecto = ruta.proyecto ? catalogo.find(l => l.clave === ruta.proyecto.clave) || null : null;
  const hechas = lecciones.filter(l => leccionHecha(l.id)).length;
  const pracHechas = practicas.filter(p => labHecho(p.progreso)).length;
  const proyHecho = !!(proyecto && labHecho(proyecto.progreso));
  const total = lecciones.length + practicas.length + (proyecto ? 1 : 0);
  return {
    modulos: mods, lecciones: lecciones.length, hechas, practicas, pracHechas, proyecto, proyHecho,
    disponibles: mods.filter(x => x.modulo).length, enPreparacion: mods.filter(x => !x.modulo).length,
    porcentaje: total ? Math.round(((hechas + pracHechas + (proyHecho ? 1 : 0)) / total) * 100) : 0,
  };
}
