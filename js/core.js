// Utilidades comunes: construir DOM sin innerHTML, avisos, tema, cabecera con el estado de la sesión.
import { usuarioActual, alCambiarSesion } from './auth.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Crea un elemento. Nunca se usa innerHTML: los textos se insertan siempre como texto.
export function el(tag, attrs = {}, ...children) {
  const svg = ['svg', 'g', 'rect', 'circle', 'line', 'path', 'text', 'tspan', 'polygon', 'polyline', 'title', 'defs', 'marker', 'ellipse'].includes(tag);
  const node = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.setAttribute('class', v);
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

let toastTimer;
export function toast(msg, ms = 3600) {
  let t = $('#toast');
  if (t) t.remove();
  t = el('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' }, msg);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), ms);
}

export const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export function setMeter(meter, fraction) { meter.firstElementChild.style.setProperty('--p', String(Math.max(0, Math.min(1, fraction)))); }
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Almacenamiento local que no rompe la página si el navegador lo bloquea.
export const local = {
  get(k, def = null) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* nada */ } },
};

function initTheme() {
  const btn = $('#themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('aula:tema', next); } catch { /* nada */ }
  });
}

export function iniciales(nombre = '', email = '') {
  const base = (nombre || email.split('@')[0] || '?').trim();
  const partes = base.split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '?') + (partes[1]?.[0] || '')).toUpperCase();
}

function pintarSesion(u) {
  $$('[data-auth="in"]').forEach(n => { n.hidden = !u; });
  $$('[data-auth="out"]').forEach(n => { n.hidden = !!u; });
  if (u) $$('[data-user="initials"]').forEach(n => { n.textContent = iniciales(u.nombre, u.email); });
  $$('[data-user="name"]').forEach(n => { n.textContent = u ? (u.nombre || u.email) : ''; });
}

// Se llama al principio de cada página.
export async function iniciarPagina() {
  initTheme();
  const u = await usuarioActual();
  pintarSesion(u);
  alCambiarSesion(pintarSesion);
  return u;
}
