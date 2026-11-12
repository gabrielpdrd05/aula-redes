// Reproductor de videos explicativos generados en el navegador: escenas animadas en SVG (16:9), narración con la voz
// sintética del dispositivo (Web Speech API, sin servicios externos), subtítulos, capítulos, velocidad y pantalla completa.
//
// Un video es { id, titulo, descripcion, escenas: [{ voz, acciones: [...] }] }. Las acciones son acumulativas (el estado
// de la escena N es el resultado de aplicar 0..N), así se puede saltar a cualquier escena:
//   {t:'titulo', texto, sub} · {t:'titulo', ocultar:true}            rótulo a pantalla completa
//   {t:'caja', id, x, y, w, h, icono, texto, sub, tono, marca}         tarjeta con icono (crea o actualiza)
//   {t:'linea', id, de, a, texto, tono, discontinua}                  conexión entre dos cajas
//   {t:'tabla', id, x, y, w, titulo, columnas, filas, resaltar, tachar} tabla de datos
//   {t:'codigo', id, x, y, w, titulo, lineas, activa}                 bloque de código con la línea en ejecución
//   {t:'nota', id, x, y, w, texto, tono}                              texto explicativo
//   {t:'burbuja', id, de, texto}                                       bocadillo encima de una caja
//   {t:'quitar', ids}                                                  retira elementos
//   {t:'viaje', de, a, por, texto, tono}                               ficha que viaja (solo en su escena)
//   {t:'enfoque', ids}                                                 resalta elementos (solo en su escena)
// Movimiento explicativo: ease-out para lo que entra y ease-in-out para lo que se desplaza. Con «reducir movimiento»
// nada se desplaza: las fichas aparecen en su destino y las entradas son solo de opacidad.
import { el, reducedMotion } from '../core.js';

const W = 960, H = 540;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_MOVE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const TONOS = ['accent', 'ok', 'warn', 'bad', 'violet', 'neutral'];

// Ajuste de línea aproximado para SVG (no mide el texto: usa el ancho medio de un carácter).
function partir(texto, max) {
  const out = [];
  for (const parrafo of String(texto).split('\n')) {
    let linea = '';
    for (const p of parrafo.split(' ')) {
      if ((linea + ' ' + p).trim().length > max && linea) { out.push(linea); linea = p; } else linea = (linea + ' ' + p).trim();
    }
    out.push(linea);
  }
  return out;
}
const textoSvg = (lineas, attrs, alto) => el('text', attrs, lineas.map((l, i) => el('tspan', { x: attrs.x, dy: i ? alto : 0 }, l)));

function estadoHasta(video, n) {
  const st = { el: new Map(), titulo: null, nuevos: new Set() };
  for (let k = 0; k <= n; k++) {
    for (const a of video.escenas[k].acciones || []) {
      if (a.t === 'titulo') { st.titulo = a.ocultar ? null : a; if (k === n) st.nuevos.add('__titulo'); continue; }
      if (a.t === 'quitar') { for (const id of a.ids) st.el.delete(id); continue; }
      if (a.t === 'viaje' || a.t === 'enfoque') continue;
      const previo = st.el.get(a.id);
      st.el.set(a.id, { ...(previo || {}), ...a });
      if (k === n) st.nuevos.add(a.id);
    }
  }
  return st;
}

function centro(e) { return { x: e.x + (e.w || 180) / 2, y: e.y + (e.h || 96) / 2 }; }

function dibujar(svg, video, n) {
  const st = estadoHasta(video, n);
  const escena = video.escenas[n];
  const enfoque = new Set((escena.acciones || []).filter(a => a.t === 'enfoque').flatMap(a => a.ids));
  const capas = { lineas: el('g'), cosas: el('g'), fichas: el('g', { class: 'v-fichas' }), titulo: el('g') };
  const entrar = [];
  const marcar = (id, g) => { if (st.nuevos.has(id)) entrar.push(g); if (enfoque.has(id)) g.classList.add('v-foco'); return g; };

  for (const [id, e] of st.el) {
    if (e.t === 'linea') {
      const a = st.el.get(e.de), b = st.el.get(e.a);
      if (!a || !b) continue;
      const p = centro(a), q = centro(b);
      const g = el('g', { class: 'v-linea v-' + (e.tono || 'neutral') + (e.discontinua ? ' v-disc' : '') });
      const linea = el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, pathLength: 1 });
      g.append(linea);
      if (e.texto) g.append(el('text', { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 - 10, class: 'v-etq' }, e.texto));
      capas.lineas.append(marcar(id, g));
      if (st.nuevos.has(id) && !reducedMotion()) linea.animate([{ strokeDashoffset: 1, strokeDasharray: '1 1' }, { strokeDashoffset: 0, strokeDasharray: '1 1' }], { duration: 650, easing: EASE_OUT });
    } else if (e.t === 'caja') {
      const w = e.w || 180, h = e.h || 96;
      const g = el('g', { class: 'v-caja v-' + (TONOS.includes(e.tono) ? e.tono : 'accent'), transform: `translate(${e.x} ${e.y})` });
      g.append(el('rect', { width: w, height: h, rx: 16 }));
      const conIcono = !!e.icono;
      if (conIcono) g.append(el('text', { x: w / 2, y: e.texto ? 40 : h / 2 + 12, class: 'v-icono' }, e.icono));
      if (e.texto) g.append(textoSvg(partir(e.texto, Math.floor(w / 11)), { x: w / 2, y: conIcono ? 66 : (e.sub ? h / 2 - 2 : h / 2 + 7), class: 'v-txt' }, 21));
      if (e.sub) g.append(textoSvg(partir(e.sub, Math.floor(w / 8.2)), { x: w / 2, y: h - (partir(e.sub, Math.floor(w / 8.2)).length > 1 ? 26 : 11), class: 'v-sub' }, 15));
      if (e.marca) g.append(el('g', { class: 'v-marca v-marca-' + e.marca, transform: `translate(${w - 6} 6)` }, el('circle', { r: 15 }), el('text', { y: 6 }, e.marca === 'ok' ? '✓' : '✗')));
      capas.cosas.append(marcar(id, g));
    } else if (e.t === 'tabla') {
      const w = e.w || 360, fila = 34, cols = e.columnas.length;
      const g = el('g', { class: 'v-tabla', transform: `translate(${e.x} ${e.y})` });
      const alto = (e.titulo ? 32 : 0) + fila * (e.filas.length + 1) + 6;
      g.append(el('rect', { class: 'v-tabla-fondo', width: w, height: alto, rx: 12 }));
      let y = 0;
      if (e.titulo) { g.append(el('text', { x: 14, y: 22, class: 'v-tabla-titulo' }, e.titulo)); y = 32; }
      g.append(el('rect', { class: 'v-tabla-cab', x: 4, y: y + 3, width: w - 8, height: fila - 2, rx: 6 }));
      e.columnas.forEach((c, j) => g.append(el('text', { x: 14 + j * (w - 20) / cols, y: y + 23, class: 'v-tabla-col' }, c)));
      e.filas.forEach((f, r) => {
        const yy = y + fila * (r + 1);
        const clase = (e.resaltar || []).includes(r) ? 'v-fila v-fila-hl' : (e.tachar || []).includes(r) ? 'v-fila v-fila-off' : 'v-fila';
        const gf = el('g', { class: clase });
        gf.append(el('rect', { x: 4, y: yy + 3, width: w - 8, height: fila - 2, rx: 6 }));
        f.forEach((c, j) => gf.append(el('text', { x: 14 + j * (w - 20) / cols, y: yy + 24 }, String(c))));
        g.append(gf);
      });
      capas.cosas.append(marcar(id, g));
    } else if (e.t === 'codigo') {
      const w = e.w || 420, fila = 29;
      const g = el('g', { class: 'v-codigo', transform: `translate(${e.x} ${e.y})` });
      const alto = (e.titulo ? 30 : 8) + fila * e.lineas.length + 10;
      g.append(el('rect', { width: w, height: alto, rx: 12 }));
      let y = 8;
      if (e.titulo) { g.append(el('text', { x: 14, y: 21, class: 'v-codigo-titulo' }, e.titulo)); y = 30; }
      e.lineas.forEach((l, i) => {
        if (i === e.activa) g.append(el('rect', { class: 'v-codigo-activa', x: 4, y: y + i * fila + 2, width: w - 8, height: fila, rx: 5 }));
        g.append(el('text', { x: 16, y: y + i * fila + 21, class: 'v-codigo-linea' }, l));
      });
      capas.cosas.append(marcar(id, g));
    } else if (e.t === 'nota') {
      const w = e.w || 300;
      const lineas = partir(e.texto, Math.floor(w / 9.6));
      const g = el('g', { class: 'v-nota v-' + (e.tono || 'neutral'), transform: `translate(${e.x} ${e.y})` });
      g.append(el('rect', { width: w, height: 22 + lineas.length * 24, rx: 10 }), textoSvg(lineas, { x: 14, y: 28, class: 'v-nota-txt' }, 24));
      capas.cosas.append(marcar(id, g));
    } else if (e.t === 'burbuja') {
      const c = st.el.get(e.de);
      if (!c) continue;
      const w = e.w || 260;
      const lineas = partir(e.texto, Math.floor(w / 9));
      const h = 20 + lineas.length * 21;
      const x = Math.max(8, Math.min(W - w - 8, centro(c).x - w / 2)), y = c.y - h - 18;
      const g = el('g', { class: 'v-burbuja', transform: `translate(${x} ${y})` });
      const px = centro(c).x - x;
      g.append(el('path', { d: `M12 0h${w - 24}a12 12 0 0 1 12 12v${h - 24}a12 12 0 0 1 -12 12H${px + 9}l-9 12 -9 -12H12a12 12 0 0 1 -12 -12V12A12 12 0 0 1 12 0z` }), textoSvg(lineas, { x: 14, y: 26, class: 'v-burbuja-txt' }, 21));
      capas.cosas.append(marcar(id, g));
    }
  }
  if (st.titulo) {
    const g = el('g', { class: 'v-rotulo' }, el('rect', { width: W, height: H }),
      textoSvg(partir(st.titulo.texto, 34), { x: W / 2, y: H / 2 - (st.titulo.sub ? 24 : 0), class: 'v-rotulo-txt' }, 50),
      st.titulo.sub ? textoSvg(partir(st.titulo.sub, 60), { x: W / 2, y: H / 2 + 40 + (partir(st.titulo.texto, 34).length - 1) * 50, class: 'v-rotulo-sub' }, 28) : null);
    capas.titulo.append(g);
    if (st.nuevos.has('__titulo')) entrar.push(g);
  }
  svg.replaceChildren(el('rect', { class: 'v-fondo', width: W, height: H }), capas.lineas, capas.cosas, capas.fichas, capas.titulo);
  // Entradas: solo opacidad (los grupos SVG se posicionan con el atributo transform, que una animación CSS de transform pisaría).
  entrar.forEach((g, i) => g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedMotion() ? 150 : 420, delay: reducedMotion() ? 0 : i * 60, easing: EASE_OUT, fill: 'backwards' }));

  // Fichas que viajan entre cajas (solo en su escena).
  const viajes = (escena.acciones || []).filter(a => a.t === 'viaje').map((a, k) => {
    const ruta = [a.de, ...(a.por || []), a.a].map(id => st.el.get(id)).filter(Boolean).map(centro);
    if (ruta.length < 2) return Promise.resolve();
    const w = Math.max(60, String(a.texto).length * 9 + 24);
    const g = el('g', { class: 'v-ficha v-' + (a.tono || 'accent') }, el('rect', { x: -w / 2, y: -16, width: w, height: 32, rx: 16 }), el('text', { y: 6 }, a.texto));
    capas.fichas.append(g);
    const pos = p => `translate(${p.x}px, ${p.y - 8}px)`;
    if (reducedMotion()) { g.style.transform = pos(ruta[ruta.length - 1]); return g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'both' }).finished.catch(() => {}); }
    const frames = ruta.map((p, i) => ({ transform: pos(p), offset: i / (ruta.length - 1), opacity: 1 }));
    frames[0].opacity = 0;
    return g.animate(frames, { duration: 1100 * (ruta.length - 1), delay: (a.retardo || 0) + k * 160, easing: EASE_MOVE, fill: 'both' }).finished.catch(() => {});
  });
  return Promise.all(viajes);
}

// ---------------------------------------------------------------- voz
const voz = {
  disponible: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
  elegida: null,
  elegir() {
    if (!this.disponible) return null;
    const vs = speechSynthesis.getVoices().filter(v => /^es(-|_|$)/i.test(v.lang));
    this.elegida = vs.find(v => /es-(MX|US|419|DO)/i.test(v.lang) && /natural|online|google/i.test(v.name)) || vs.find(v => /natural|online|google/i.test(v.name)) || vs.find(v => /es-(MX|US|419)/i.test(v.lang)) || vs[0] || null;
    return this.elegida;
  },
  hablar(texto, velocidad) {
    return new Promise(resolve => {
      if (!this.disponible || !this.elegir()) return resolve(false);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.voice = this.elegida; u.lang = this.elegida.lang; u.rate = velocidad; u.pitch = 1;
      u.onend = () => resolve(true); u.onerror = () => resolve(false);
      speechSynthesis.speak(u);
    });
  },
  callar() { if (this.disponible) speechSynthesis.cancel(); },
};
if (voz.disponible) speechSynthesis.addEventListener?.('voiceschanged', () => voz.elegir());

const duracionLectura = (texto, velocidad) => Math.max(2600, String(texto).length * 62) / velocidad;
const fmt = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function crearVideo(contenedor, video) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'v-svg', role: 'img', 'aria-label': video.titulo });
  let n = 0, reproduciendo = false, token = 0, velocidad = 1, conVoz = voz.disponible, conSubtitulos = true;
  const total = video.escenas.length;
  const durTotal = video.escenas.reduce((s, e) => s + duracionLectura(e.voz, 1) + 500, 0);

  const subtitulo = el('p', { class: 'v-subtitulo', 'aria-live': 'polite' });
  const capitulos = el('div', { class: 'v-capitulos', role: 'group', 'aria-label': 'Escenas' }, video.escenas.map((_, i) => {
    const b = el('button', { type: 'button', class: 'v-cap', 'aria-label': `Ir a la escena ${i + 1}` }, el('span'));
    b.addEventListener('click', () => { ir(i, reproduciendo); });
    return b;
  }));
  const btnPlay = el('button', { type: 'button', class: 'v-btn v-btn-play', 'aria-label': 'Reproducir' }, '▶');
  const btnAnt = el('button', { type: 'button', class: 'v-btn', 'aria-label': 'Escena anterior' }, '⏮');
  const btnSig = el('button', { type: 'button', class: 'v-btn', 'aria-label': 'Escena siguiente' }, '⏭');
  const contador = el('span', { class: 'v-tiempo' });
  const btnVoz = el('button', { type: 'button', class: 'v-btn', 'aria-pressed': String(conVoz), 'aria-label': 'Narración por voz', disabled: !voz.disponible, title: voz.disponible ? 'Narración por voz' : 'Tu navegador no tiene voz sintética: se muestran subtítulos' }, conVoz ? '🔊' : '🔇');
  const btnCC = el('button', { type: 'button', class: 'v-btn v-btn-cc', 'aria-pressed': 'true', 'aria-label': 'Subtítulos' }, 'CC');
  const selVel = el('select', { class: 'v-vel', 'aria-label': 'Velocidad' }, [0.75, 1, 1.25, 1.5].map(v => el('option', { value: String(v), selected: v === 1 }, v + '×')));
  const btnFull = el('button', { type: 'button', class: 'v-btn', 'aria-label': 'Pantalla completa' }, '⛶');
  const portada = el('button', { type: 'button', class: 'v-portada', 'aria-label': 'Reproducir el video: ' + video.titulo },
    el('span', { class: 'v-portada-play', 'aria-hidden': 'true' }, '▶'),
    el('span', { class: 'v-portada-titulo' }, video.titulo),
    el('span', { class: 'v-portada-meta' }, `${total} escenas · ${fmt(durTotal)} min · ${voz.disponible ? 'narrado con voz sintética' : 'con subtítulos'}`));
  const pantalla = el('div', { class: 'v-pantalla' }, svg, portada);
  const transcripcion = el('details', { class: 'v-transcripcion' }, el('summary', {}, 'Transcripción'), el('ol', {}, video.escenas.map(e => el('li', {}, e.voz))));

  const raiz = el('figure', { class: 'video', id: 'video-' + video.id, role: 'group', 'aria-label': 'Video: ' + video.titulo },
    el('div', { class: 'anim-head' }, el('strong', {}, video.titulo), el('span', { class: 'badge badge-violet' }, '🎬 Video')),
    pantalla, subtitulo,
    el('div', { class: 'v-controles' }, btnPlay, btnAnt, btnSig, capitulos, contador, btnVoz, btnCC, selVel, btnFull),
    transcripcion);
  raiz.style.margin = '0';
  contenedor.append(raiz);

  function pintarControles() {
    btnPlay.textContent = reproduciendo ? '⏸' : '▶';
    btnPlay.setAttribute('aria-label', reproduciendo ? 'Pausa' : 'Reproducir');
    contador.textContent = `${n + 1}/${total}`;
    btnAnt.disabled = n === 0; btnSig.disabled = n === total - 1;
    [...capitulos.children].forEach((c, i) => { c.classList.toggle('hecho', i < n); c.classList.toggle('actual', i === n); if (i === n) c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current'); });
  }

  async function ir(i, reproducir) {
    const yo = ++token;
    voz.callar();
    n = Math.max(0, Math.min(total - 1, i));
    reproduciendo = !!reproducir;
    portada.hidden = true;
    pintarControles();
    const esc = video.escenas[n];
    subtitulo.textContent = esc.voz;
    subtitulo.hidden = !conSubtitulos;
    const relleno = capitulos.children[n].firstElementChild;
    relleno.getAnimations().forEach(a => a.cancel());
    const viajes = dibujar(svg, video, n);
    if (!reproduciendo) return;
    const estimada = duracionLectura(esc.voz, velocidad);
    const barra = reducedMotion() ? null : relleno.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: estimada, easing: 'linear', fill: 'forwards' });
    const habla = conVoz ? voz.hablar(esc.voz, velocidad) : Promise.resolve(false);
    const hablo = await habla;
    if (!hablo) await new Promise(r => setTimeout(r, estimada));
    await viajes;
    if (yo !== token) return;
    barra?.finish();
    await new Promise(r => setTimeout(r, 450 / velocidad));
    if (yo !== token) return;
    if (n < total - 1) ir(n + 1, true);
    else { reproduciendo = false; pintarControles(); }
  }
  function pausar() { token++; voz.callar(); reproduciendo = false; [...capitulos.children].forEach(c => c.firstElementChild.getAnimations().forEach(a => a.pause())); pintarControles(); }

  portada.addEventListener('click', () => ir(0, true));
  btnPlay.addEventListener('click', () => (reproduciendo ? pausar() : ir(n === total - 1 && !reproduciendo && capitulos.children[n].classList.contains('actual') && n > 0 ? 0 : n, true)));
  btnAnt.addEventListener('click', () => ir(n - 1, reproduciendo));
  btnSig.addEventListener('click', () => ir(n + 1, reproduciendo));
  btnVoz.addEventListener('click', () => { conVoz = !conVoz; btnVoz.textContent = conVoz ? '🔊' : '🔇'; btnVoz.setAttribute('aria-pressed', String(conVoz)); if (!conVoz) voz.callar(); if (reproduciendo) ir(n, true); });
  btnCC.addEventListener('click', () => { conSubtitulos = !conSubtitulos; btnCC.setAttribute('aria-pressed', String(conSubtitulos)); subtitulo.hidden = !conSubtitulos; });
  selVel.addEventListener('change', () => { velocidad = Number(selVel.value); if (reproduciendo) ir(n, true); });
  btnFull.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else raiz.requestFullscreen?.().catch(() => {}); });
  raiz.addEventListener('keydown', e => {
    if (e.target.closest('select')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); reproduciendo ? pausar() : ir(n, true); }
    else if (e.key === 'ArrowRight') ir(n + 1, reproduciendo);
    else if (e.key === 'ArrowLeft') ir(n - 1, reproduciendo);
  });
  // Si el video sale de la pantalla o se cambia de pestaña, se pausa (y se calla la voz).
  new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && reproduciendo) pausar(); })).observe(raiz);
  document.addEventListener('visibilitychange', () => { if (document.hidden && reproduciendo) pausar(); });

  dibujar(svg, video, 0);
  subtitulo.textContent = video.escenas[0].voz;
  pintarControles();
  return { ir, pausar, get escena() { return n; }, get reproduciendo() { return reproduciendo; } };
}

export async function montarVideo(holder, id) {
  const { VIDEOS } = await import('./videos.js');
  const v = VIDEOS[id];
  if (!v) throw new Error('Video desconocido: ' + id);
  crearVideo(holder, v);
}
