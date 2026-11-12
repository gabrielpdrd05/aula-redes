'use strict';
// Se carga antes que nada en todas las páginas:
//  - Si alguien mete la web dentro de un marco de otra página (clickjacking), intenta salir a pantalla completa y,
//    si no puede, se oculta. GitHub Pages no permite enviar la cabecera X-Frame-Options.
//  - Importa el progreso traído desde la dirección antigua de la web.
//  - Aplica el tema claro u oscuro y la preferencia de luces LED antes de pintar, para evitar un parpadeo.
(function () {
  var framed;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (framed) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(window.location.href); } catch (e) { /* marco restringido */ }
  }
  // Traslado desde la dirección antigua (gabrielpdrd05.github.io/aula-redes): la página de redirección envía el
  // progreso guardado en ese navegador en el fragmento #migrar=… (el fragmento nunca llega a ningún servidor).
  // Solo se importan claves «aula:» que no existan ya aquí, y el fragmento se borra de la barra de direcciones.
  try {
    if (location.hash.indexOf('#migrar=') === 0) {
      var datos = location.hash.slice(8);
      history.replaceState(null, '', location.pathname + location.search);
      if (datos.length < 4000000) {
        var json = decodeURIComponent(escape(atob(datos.replace(/-/g, '+').replace(/_/g, '/'))));
        var obj = JSON.parse(json);
        for (var k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k) && /^aula:[\w:.-]+$/.test(k) && typeof obj[k] === 'string' && localStorage.getItem(k) === null) localStorage.setItem(k, obj[k]);
        }
      }
    }
  } catch (e) { /* datos de traslado no válidos: se ignoran */ }
  try {
    var t = localStorage.getItem('aula:tema');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    if (localStorage.getItem('aula:luces') === 'off') document.documentElement.classList.add('sin-luces');
  } catch (e) { /* almacenamiento bloqueado */ }
})();
