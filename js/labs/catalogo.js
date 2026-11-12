// Catálogo de laboratorios para la página de práctica y la del laboratorio.
import { LABS } from './ios-labs.js';
import { EJERCICIOS } from './sql-ejercicios.js';

const SQL_TITULOS = { select: 'Consultas SELECT y filtros', join: 'Uniones (JOIN)', agregacion: 'Agrupar y contar', modificar: 'INSERT, UPDATE y DELETE', inventario: 'Reto: inventario de red' };

export const NIVELES = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };

export const CATALOGO = [
  { clave: 'lab:subnetting', grupo: 'numeros', nivel: 'principiante', progreso: 'subnetting', titulo: 'Entrenador de subnetting', texto: 'Red, broadcast, hosts y máscara de direcciones al azar. Completa 10 aciertos seguidos.' },
  { clave: 'lab:binario', grupo: 'numeros', nivel: 'principiante', progreso: 'binario', titulo: 'Binario y decimal', texto: 'Convierte octetos de binario a decimal y al revés hasta hacerlo de cabeza.' },
  { clave: 'lab:vlsm', grupo: 'numeros', nivel: 'intermedio', progreso: 'vlsm', titulo: 'Diseño VLSM', texto: 'Reparte un bloque de direcciones entre varias redes de distinto tamaño.' },
  ...Object.entries(LABS).map(([id, l]) => ({ clave: 'cli:' + id, grupo: l.tipo === 'averia' ? 'averias' : 'cli', nivel: l.nivel, progreso: 'cli-' + id, titulo: l.titulo.replace(/^Avería:\s*/, ''), texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  ...Object.entries(EJERCICIOS).map(([id, l]) => ({ clave: 'sql:' + id, grupo: 'sql', nivel: id === 'select' ? 'principiante' : id === 'inventario' ? 'avanzado' : 'intermedio', progreso: 'sql-' + id, titulo: SQL_TITULOS[id] || id, texto: `${l.length} ejercicios sobre la base de datos de inventario de red de una empresa.` })),
];
