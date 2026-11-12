'use strict';
// La web se mudó a https://loopback-academia.github.io. Esta página lleva a la misma sección en la nueva dirección
// y, si este navegador tenía progreso guardado sin cuenta (claves «aula:»), lo envía en el fragmento #migrar=…
// para que la nueva dirección lo importe. El fragmento no llega a ningún servidor. La sesión de la cuenta no se envía.
(function () {
  var destino = 'https://loopback-academia.github.io';
  var ruta = location.pathname.replace(/^\/aula-redes/, '') || '/';
  var fragmento = location.hash;
  try {
    var datos = {}, hay = false;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('aula:') === 0) { datos[k] = localStorage.getItem(k); hay = true; }
    }
    if (hay) {
      var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(datos)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      fragmento = '#migrar=' + b64;
    }
  } catch (e) { /* sin acceso al almacenamiento: se redirige sin progreso */ }
  location.replace(destino + ruta + location.search + fragmento);
})();
