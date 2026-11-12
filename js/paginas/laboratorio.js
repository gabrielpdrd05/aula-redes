// Un laboratorio a pantalla completa: ?l=lab:subnetting | cli:vlan | sql:join …
import { iniciarPagina, el, $ } from '../core.js';
import { CATALOGO } from '../labs/catalogo.js';

iniciarPagina();
const clave = new URLSearchParams(location.search).get('l') || 'lab:subnetting';
const info = CATALOGO.find(l => l.clave === clave);
const box = $('#lab');
const MONTAR = {
  lab: () => import('../labs/numeros.js').then(m => m.montarLab),
  cli: () => import('../labs/cli-ui.js').then(m => m.montarCli),
  sql: () => import('../labs/sql-lab.js').then(m => m.montarSql),
  code: () => import('../codigo/codigo-ui.js').then(m => m.montarCodigo),
  proyecto: () => import('../proyectos/proyecto-ui.js').then(m => m.montarProyecto),
};
if (!info) {
  box.replaceChildren(el('h1', {}, 'Laboratorio no encontrado'), el('a', { class: 'btn btn-primary', href: 'practica.html' }, 'Ver los laboratorios'));
} else {
  document.title = `${info.titulo} · Aula de Redes`;
  const [tipo, id] = clave.split(':');
  const holder = el('div');
  box.replaceChildren(el('div', { class: 'page-head' }, el('h1', {}, info.titulo), tipo === 'lab' ? el('p', {}, info.texto) : null), holder);
  $('p.small a[href="practica.html"]')?.setAttribute('href', 'practica.html#area-' + info.area);
  try { await (await MONTAR[tipo]())(holder, id); }
  catch (e) { console.error(e); holder.replaceChildren(el('div', { class: 'alert alert-warn' }, el('p', {}, 'No se pudo cargar el laboratorio. Recarga la página.'))); }
}
