// Catálogo de laboratorios para la página de práctica y la del laboratorio.
import { LABS } from './ios-labs.js';
import { EJERCICIOS } from './sql-ejercicios.js';

const SQL_TITULOS = { select: 'Consultas SELECT y filtros', join: 'Uniones (JOIN)', agregacion: 'Agrupar y contar', modificar: 'INSERT, UPDATE y DELETE', inventario: 'Reto: inventario de red' };

export const CATALOGO = [
  { clave: 'lab:subnetting', grupo: 'numeros', progreso: 'subnetting', titulo: 'Entrenador de subnetting', texto: 'Red, broadcast, hosts y máscara de direcciones al azar. Completa 10 aciertos seguidos.' },
  { clave: 'lab:binario', grupo: 'numeros', progreso: 'binario', titulo: 'Binario y decimal', texto: 'Convierte octetos de binario a decimal y al revés hasta hacerlo de cabeza.' },
  { clave: 'lab:vlsm', grupo: 'numeros', progreso: 'vlsm', titulo: 'Diseño VLSM', texto: 'Reparte un bloque de direcciones entre varias redes de distinto tamaño.' },
  ...Object.entries(LABS).map(([id, l]) => ({ clave: 'cli:' + id, grupo: 'cli', progreso: 'cli-' + id, titulo: l.titulo, texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  ...Object.entries(EJERCICIOS).map(([id, l]) => ({ clave: 'sql:' + id, grupo: 'sql', progreso: 'sql-' + id, titulo: SQL_TITULOS[id] || id, texto: `${l.length} ejercicios sobre la base de datos de inventario de red de una empresa.` })),
];
