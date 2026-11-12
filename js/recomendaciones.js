// Recomendaciones a partir del progreso: siguiente lección, prácticas pendientes y temas que conviene reforzar.
// Las usan el panel del curso ("Continúa por aquí") y la página de repaso.
import { CATALOGO } from './labs/catalogo.js';
import { leccionHecha, notaQuiz, labHecho, repaso } from './progreso.js';

const PORTADA = new Set(['cli', 'sql', 'code', 'lab', 'proyecto', 'caso', 'turno']);

// Laboratorios que aparecen dentro de una lección (como entradas del catálogo).
export function labsDeLeccion(leccion) {
  return (leccion.blocks || []).flatMap(b => (b.t === 'embed' && PORTADA.has(b.kind) ? [CATALOGO.find(c => c.clave === `${b.kind}:${b.id}`)] : [])).filter(Boolean);
}

// Siguiente lección de la ruta por niveles del área (todo el nivel 1, luego el 2 y el 3).
export function siguienteLeccion(curso, area) {
  return curso.lecciones.filter(l => l.modulo.area === area).sort((a, b) => a.nivel - b.nivel).find(l => !leccionHecha(l.id)) || null;
}

// Prácticas sin terminar de las lecciones ya estudiadas (completadas o con el cuestionario hecho), más los proyectos empezados.
export function practicasPendientes(curso, area, max = 4) {
  const vistas = new Set();
  const out = [];
  for (const l of curso.lecciones.filter(l => l.modulo.area === area && (leccionHecha(l.id) || notaQuiz(l.id)))) {
    for (const lab of labsDeLeccion(l)) {
      if (vistas.has(lab.clave) || labHecho(lab.progreso) || lab.libre) continue;
      vistas.add(lab.clave);
      out.push({ ...lab, leccion: l });
    }
  }
  return out.slice(0, max);
}

// Temas (lecciones) con preguntas falladas pendientes o con el cuestionario suspendido, de más a menos urgente.
export function temasAReforzar(curso, area = null, ahora = Date.now()) {
  const porLeccion = new Map();
  for (const r of repaso(ahora)) {
    const t = porLeccion.get(r.leccion) || { pendientes: 0, enRepaso: 0, dominadas: 0, fallos: 0 };
    if (r.dominada) t.dominadas++; else t.enRepaso++;
    if (r.pendiente && !r.dominada) t.pendientes++;
    t.fallos += r.fallos;
    porLeccion.set(r.leccion, t);
  }
  const out = [];
  for (const l of curso.lecciones) {
    if (area && l.modulo.area !== area) continue;
    const t = porLeccion.get(l.id);
    const q = notaQuiz(l.id);
    const suspendido = q && !q.hecho;
    if (!t?.enRepaso && !suspendido) continue;
    out.push({ leccion: l, ...(t || { pendientes: 0, enRepaso: 0, dominadas: 0, fallos: 0 }), suspendido, nota: q, peso: (t?.pendientes || 0) * 3 + (t?.enRepaso || 0) + (suspendido ? 4 : 0) + (t?.fallos || 0) * 0.5 });
  }
  return out.sort((a, b) => b.peso - a.peso);
}

export function resumenRepaso(curso, area = null, ahora = Date.now()) {
  const areaDe = id => curso.lecciones.find(l => l.id === id.split('#')[0])?.modulo.area;
  const lista = repaso(ahora).filter(r => !area || areaDe(r.id) === area);
  return { total: lista.length, pendientes: lista.filter(r => r.pendiente && !r.dominada).length, hoy: lista.filter(r => r.pendiente).length, dominadas: lista.filter(r => r.dominada).length, enRepaso: lista.filter(r => !r.dominada).length };
}
