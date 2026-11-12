// Acceso al temario compilado (data/curso.json).
let cache = null;

export function cargarCurso() {
  return cache || (cache = fetch('data/curso.json', { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error('No se pudo cargar el temario.');
    return r.json();
  }).then(curso => {
    curso.lecciones = curso.modulos.flatMap(m => m.lecciones.map(l => ({ ...l, modulo: m })));
    return curso;
  }));
}

export function buscarLeccion(curso, id) {
  const i = curso.lecciones.findIndex(l => l.id === id);
  if (i < 0) return null;
  return { leccion: curso.lecciones[i], anterior: curso.lecciones[i - 1] || null, siguiente: curso.lecciones[i + 1] || null, indice: i };
}

export const numeroModulo = m => m.id.replace(/^[a-z]+/, '');
