'use strict';
// Se carga antes que nada en todas las páginas:
//  - Si alguien mete la web dentro de un marco de otra página (clickjacking), intenta salir a pantalla completa y,
//    si no puede, se oculta. GitHub Pages no permite enviar la cabecera X-Frame-Options.
//  - Aplica el tema claro u oscuro y la preferencia de luces LED antes de pintar, para evitar un parpadeo.
(function () {
  var framed;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (framed) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(window.location.href); } catch (e) { /* marco restringido */ }
  }
  try {
    var t = localStorage.getItem('aula:tema');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    if (localStorage.getItem('aula:luces') === 'off') document.documentElement.classList.add('sin-luces');
  } catch (e) { /* almacenamiento bloqueado */ }
})();
