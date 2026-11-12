// Catálogo de laboratorios para la página de práctica, el panel y la página del laboratorio.
import { LABS } from './ios-labs.js';
import { EJERCICIOS } from './sql-ejercicios.js';
import { EJERCICIOS as CODIGO } from '../codigo/ejercicios.js';
import { PROYECTOS } from '../proyectos/proyectos.js';
import { CASOS, TURNO } from '../casos/casos.js';

const SQL_INFO = {
  select: ['Consultas SELECT y filtros', 'principiante'],
  join: ['Uniones (JOIN)', 'intermedio'],
  agregacion: ['Agrupar y contar (GROUP BY)', 'intermedio'],
  funciones: ['Funciones de texto, fecha y CASE', 'intermedio'],
  subconsultas: ['Subconsultas y CTE (WITH)', 'intermedio'],
  modificar: ['INSERT, UPDATE y DELETE', 'intermedio'],
  ddl: ['Crear tablas, índices y vistas (DDL)', 'intermedio'],
  ventanas: ['Funciones de ventana (OVER)', 'avanzado'],
  inventario: ['Reto: informes del inventario de red', 'avanzado'],
};

export const NIVELES = { principiante: 'Nivel 1 · Principiante', intermedio: 'Nivel 2 · Intermedio', avanzado: 'Nivel 3 · Avanzado' };
export const AREAS = { redes: 'Redes', bd: 'Bases de datos', prog: 'Programación', ti: 'Empleo TI' };

export const CATALOGO = [
  { clave: 'turno:' + TURNO.id, area: 'ti', grupo: 'proyectos', nivel: TURNO.nivel, progreso: TURNO.progreso, titulo: TURNO.titulo.replace(/^Proyecto: (.)/, (_, c) => c.toUpperCase()), texto: TURNO.resumen, tareas: TURNO.casos.length, unidad: 'tickets' },
  ...Object.values(CASOS).map(c => ({ clave: 'caso:' + c.id, area: 'ti', grupo: 'casos', nivel: c.nivel, progreso: 'caso-' + c.id, titulo: c.titulo, texto: c.resumen, lugar: c.lugar })),
  ...Object.values(PROYECTOS).map(p => ({ clave: 'proyecto:' + p.id, area: p.area, grupo: 'proyectos', nivel: p.nivel, progreso: p.progreso, titulo: p.titulo.replace(/^Proyecto: (.)/, (_, c) => c.toUpperCase()), texto: p.resumen, tareas: p.fases.reduce((n, f) => n + f.requisitos.length, 0) })),
  { clave: 'lab:subnetting', area: 'redes', grupo: 'numeros', nivel: 'principiante', progreso: 'subnetting', titulo: 'Entrenador de subnetting', texto: 'Red, broadcast, hosts y máscara de direcciones al azar. Completa 10 aciertos seguidos.' },
  { clave: 'lab:binario', area: 'redes', grupo: 'numeros', nivel: 'principiante', progreso: 'binario', titulo: 'Binario y decimal', texto: 'Convierte octetos de binario a decimal y al revés hasta hacerlo de cabeza.' },
  { clave: 'lab:vlsm', area: 'redes', grupo: 'numeros', nivel: 'intermedio', progreso: 'vlsm', titulo: 'Diseño VLSM', texto: 'Reparte un bloque de direcciones entre varias redes de distinto tamaño.' },
  ...Object.entries(LABS).map(([id, l]) => ({ clave: 'cli:' + id, area: 'redes', grupo: l.tipo === 'averia' ? 'averias' : 'cli', nivel: l.nivel, progreso: 'cli-' + id, titulo: l.titulo.replace(/^Avería:\s*/, ''), texto: l.intro.split('. ')[0] + '.', tareas: l.tareas.length })),
  ...Object.entries(EJERCICIOS).map(([id, l]) => ({ clave: 'sql:' + id, area: 'bd', grupo: 'sql', nivel: SQL_INFO[id]?.[1] || 'intermedio', progreso: 'sql-' + id, titulo: SQL_INFO[id]?.[0] || id, texto: `${l.length} ejercicios sobre la base de datos del inventario de red de una empresa (SQLite en tu navegador).`, tareas: l.length })),
  ...Object.entries(CODIGO).map(([id, c]) => ({ clave: 'code:' + id, area: 'prog', grupo: c.libre ? 'libre' : c.lang, nivel: c.nivel, progreso: 'code-' + id, titulo: c.titulo, texto: c.libre ? `Escribe y ejecuta cualquier programa en ${c.lang === 'python' ? 'Python' : 'JavaScript'}, sin corrección.` : `${c.ejercicios.length} ejercicios en ${c.lang === 'python' ? 'Python' : 'JavaScript'} que se corrigen solos.`, tareas: c.libre ? null : c.ejercicios.length, libre: !!c.libre })),
];
