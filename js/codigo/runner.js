// Ejecuta código de los alumnos en el entorno aislado (sandbox.html dentro de un iframe sin mismo origen).
// Las ejecuciones van en cola: una cada vez. Python se descarga (≈14 MB) solo la primera vez que se usa.
let frame = null, listo = null, cola = Promise.resolve(), contador = 0;
const pendientes = new Map();

function iniciar() {
  if (listo) return listo;
  listo = new Promise((resolve, reject) => {
    frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', 'Entorno de ejecución de código');
    frame.setAttribute('aria-hidden', 'true');
    frame.hidden = true;
    frame.src = new URL('../../sandbox.html', import.meta.url).href;
    const espera = setTimeout(() => reject(new Error('El entorno de ejecución no responde. Recarga la página.')), 15000);
    window.addEventListener('message', ev => {
      if (!frame || ev.source !== frame.contentWindow) return;
      const m = ev.data || {};
      if (m.type === 'sandbox-ready') { clearTimeout(espera); resolve(); return; }
      pendientes.get(m.id)?.(m);
    });
    document.body.append(frame);
  });
  return listo;
}

// opciones: { lang: 'python'|'javascript', code, tests: [{code}], timeout, alSalir(texto, tipo), alEstado(estado) }
// Devuelve { ok, results: [bool], error, timeout }.
export function ejecutarCodigo({ lang, code, tests = [], timeout = 5000, alSalir, alEstado }) {
  const tarea = cola.then(async () => {
    await iniciar();
    const id = ++contador;
    return new Promise(resolve => {
      pendientes.set(id, m => {
        if (m.type === 'stdout' || m.type === 'stderr') alSalir?.(String(m.text), m.type);
        else if (m.type === 'loading' || m.type === 'running' || m.type === 'ready') alEstado?.(m.type);
        else if (m.type === 'done') { pendientes.delete(id); resolve(m); }
      });
      frame.contentWindow.postMessage({ id, lang, code: String(code), tests: tests.map(t => ({ code: t.code })), timeout }, '*');
    });
  });
  cola = tarea.catch(() => {});
  return tarea;
}
