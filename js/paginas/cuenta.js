// Cuenta del alumno: entrar, registrarse, recuperar la contraseña, verificación en dos pasos y gestión de sus datos.
import { iniciarPagina, el, $, toast } from '../core.js';
import * as auth from '../auth.js';
import { cargar, borrarTodo, exportar } from '../progreso.js';

const raiz = $('#cuenta');
const params = new URLSearchParams(location.search);
// Solo se vuelve a páginas de este sitio (evita redirecciones abiertas).
const siguiente = /^[a-z0-9-]+\.html(\?[\w=&%.:#-]{0,200})?$/i.test(params.get('siguiente') || '') ? params.get('siguiente') : 'curso.html';

const estado = (txt = '', tipo = '') => { const p = el('p', { class: 'form-status ' + tipo, role: 'status', 'aria-live': 'polite' }, txt); return p; };
const fijar = (p, txt, tipo = '') => { p.textContent = txt; p.className = 'form-status ' + tipo; };
const campo = (label, attrs, ayuda) => { const id = 'f-' + attrs.name; return el('div', { class: 'field' }, el('label', { for: id }, label), el('input', { id, ...attrs }), ayuda ? el('span', { class: 'hint', id: id + '-h' }, ayuda) : null); };
const valor = (form, name) => form.elements[name].value.trim();

// Ejecuta una acción del formulario con el botón bloqueado y el error traducido.
async function enviar(form, salida, fn) {
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  fijar(salida, 'Un momento…');
  try { await fn(); } catch (e) { fijar(salida, auth.mensajeError(e), 'error'); } finally { btn.disabled = false; }
}

function sinCuentas() {
  raiz.replaceChildren(el('div', { class: 'auth-card card' },
    el('h1', {}, 'Modo invitado'),
    el('p', { class: 'muted' }, 'Las cuentas todavía no están activadas en esta web. Tu progreso se guarda en este navegador y puedes usar todo el curso y los laboratorios.'),
    datosLocales()));
}

function datosLocales() {
  const descargar = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Descargar mis datos');
  descargar.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportar(), null, 2)], { type: 'application/json' }));
    el('a', { href: url, download: 'aula-redes-progreso.json' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const borrar = el('button', { type: 'button', class: 'btn btn-danger-ghost' }, 'Borrar mi progreso');
  borrar.addEventListener('click', async () => {
    if (!confirm('¿Borrar todo tu progreso (lecciones, notas y simulacros)? No se puede deshacer.')) return;
    await borrarTodo();
    toast('Progreso borrado.');
  });
  return el('div', { class: 'hero-cta' }, descargar, borrar);
}

// ---------------------------------------------------------------- sin sesión
function acceso(pestana = 'entrar') {
  const tabs = el('div', { class: 'tabs', role: 'tablist' },
    ['entrar', 'registro'].map(t => el('button', { type: 'button', role: 'tab', 'aria-selected': String(t === pestana), onclick: () => acceso(t) }, t === 'entrar' ? 'Entrar' : 'Crear cuenta')));
  const salida = estado();
  let form;
  if (pestana === 'entrar') {
    form = el('form', { novalidate: true },
      campo('Correo', { name: 'email', type: 'email', autocomplete: 'email', required: true }),
      campo('Contraseña', { name: 'password', type: 'password', autocomplete: 'current-password', required: true }),
      el('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Entrar'), salida,
      el('p', { class: 'small' }, el('a', { href: '#', onclick: e => { e.preventDefault(); recuperar(); } }, '¿Olvidaste tu contraseña?')));
    form.addEventListener('submit', e => { e.preventDefault(); enviar(form, salida, async () => {
      const mfa = await auth.entrar(valor(form, 'email'), form.elements.password.value);
      if (mfa.siguiente === 'aal2' && mfa.actual !== 'aal2') return codigoMfa();
      location.replace(siguiente);
    }); });
  } else {
    const pw = campo('Contraseña', { name: 'password', type: 'password', autocomplete: 'new-password', required: true, 'aria-describedby': 'f-password-h' }, 'Mínimo 12 caracteres, con mayúsculas, minúsculas y números.');
    form = el('form', { novalidate: true },
      campo('Nombre (opcional)', { name: 'nombre', type: 'text', autocomplete: 'given-name', maxlength: 60 }),
      campo('Correo', { name: 'email', type: 'email', autocomplete: 'email', required: true }),
      pw,
      el('label', { class: 'option' }, el('input', { type: 'checkbox', name: 'acepto', required: true }), el('span', { class: 'small' }, 'Acepto los ', el('a', { href: 'terminos.html' }, 'términos'), ' y la ', el('a', { href: 'privacidad.html' }, 'política de privacidad'), '.')),
      el('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Crear cuenta gratis'), salida);
    form.elements.password.addEventListener('input', () => {
      const p = auth.problemasContrasena(form.elements.password.value, valor(form, 'email'));
      pw.querySelector('.hint').textContent = p.length ? 'Falta: ' + p.join(', ') + '.' : '✓ Contraseña aceptable.';
    });
    form.addEventListener('submit', e => { e.preventDefault();
      const email = valor(form, 'email'), password = form.elements.password.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fijar(salida, 'Escribe un correo válido.', 'error');
      const p = auth.problemasContrasena(password, email);
      if (p.length) return fijar(salida, 'La contraseña necesita ' + p.join(', ') + '.', 'error');
      if (!form.elements.acepto.checked) return fijar(salida, 'Debes aceptar los términos para continuar.', 'error');
      enviar(form, salida, async () => {
        const r = await auth.registrar({ nombre: valor(form, 'nombre').slice(0, 60), email, password });
        if (r.necesitaConfirmar) { form.replaceChildren(el('div', { class: 'alert alert-ok' }, el('p', {}, `Te hemos enviado un correo a ${email}. Abre el enlace para activar tu cuenta (mira también en spam).`))); return; }
        location.replace(siguiente);
      });
    });
  }
  raiz.replaceChildren(el('div', { class: 'auth-card card' }, el('h1', {}, pestana === 'entrar' ? 'Entra en tu cuenta' : 'Crea tu cuenta'),
    el('p', { class: 'muted small' }, 'Tu progreso se guarda en la nube y puedes seguir en cualquier dispositivo.'), tabs, form));
  form.querySelector('input').focus();
}

function recuperar() {
  const salida = estado();
  const form = el('form', { novalidate: true }, campo('Correo de tu cuenta', { name: 'email', type: 'email', autocomplete: 'email', required: true }),
    el('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Enviar enlace'), salida,
    el('p', { class: 'small' }, el('a', { href: '#', onclick: e => { e.preventDefault(); acceso(); } }, '‹ Volver')));
  form.addEventListener('submit', e => { e.preventDefault(); enviar(form, salida, async () => {
    await auth.recuperar(valor(form, 'email'));
    // El mismo mensaje exista o no la cuenta: no revela qué correos están registrados.
    fijar(salida, 'Si ese correo tiene cuenta, recibirás un enlace para elegir una contraseña nueva.', 'ok');
  }); });
  raiz.replaceChildren(el('div', { class: 'auth-card card' }, el('h1', {}, 'Recuperar la contraseña'), form));
}

function codigoMfa() {
  const salida = estado();
  const form = el('form', { novalidate: true },
    campo('Código de 6 dígitos de tu app de autenticación', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]{6}', maxlength: 6, required: true }),
    el('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Verificar'), salida,
    el('p', { class: 'small' }, el('a', { href: '#', onclick: async e => { e.preventDefault(); await auth.salir(); acceso(); } }, 'Usar otra cuenta')));
  form.addEventListener('submit', e => { e.preventDefault(); enviar(form, salida, async () => {
    const [f] = await auth.factores();
    if (!f) throw new Error('No hay ningún factor de verificación activo.');
    await auth.verificarMfa(f.id, valor(form, 'codigo'));
    location.replace(siguiente);
  }); });
  raiz.replaceChildren(el('div', { class: 'auth-card card' }, el('h1', {}, 'Verificación en dos pasos'), el('p', { class: 'muted small' }, 'Tu cuenta está protegida con un segundo factor.'), form));
  form.querySelector('input').focus();
}

function nuevaContrasena() {
  const salida = estado();
  const form = el('form', { novalidate: true }, campo('Contraseña nueva', { name: 'password', type: 'password', autocomplete: 'new-password', required: true }, 'Mínimo 12 caracteres, con mayúsculas, minúsculas y números.'),
    el('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Guardar contraseña'), salida);
  form.addEventListener('submit', async e => { e.preventDefault();
    const p = auth.problemasContrasena(form.elements.password.value);
    if (p.length) return fijar(salida, 'La contraseña necesita ' + p.join(', ') + '.', 'error');
    enviar(form, salida, async () => { await auth.cambiarContrasena(form.elements.password.value); history.replaceState(null, '', 'cuenta.html'); toast('Contraseña actualizada.'); panel(await auth.usuarioActual()); });
  });
  raiz.replaceChildren(el('div', { class: 'auth-card card' }, el('h1', {}, 'Elige una contraseña nueva'), form));
}

// ---------------------------------------------------------------- con sesión
async function seccionMfa() {
  const caja = el('div');
  const pintar = async () => {
    const activos = await auth.factores().catch(() => []);
    if (activos.length) {
      const quitar = el('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'Desactivar');
      quitar.addEventListener('click', async () => {
        if (!confirm('¿Desactivar la verificación en dos pasos? Tu cuenta quedará protegida solo por la contraseña.')) return;
        try { await auth.quitarMfa(activos[0].id); toast('Verificación en dos pasos desactivada.'); pintar(); } catch (e) { toast(auth.mensajeError(e)); }
      });
      caja.replaceChildren(el('div', { class: 'alert alert-ok' }, el('p', {}, '✓ Verificación en dos pasos activada.'), quitar));
      return;
    }
    const activar = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Activar verificación en dos pasos');
    activar.addEventListener('click', async () => {
      try {
        const { id, qr, secreto } = await auth.iniciarMfa();
        const salida = estado();
        const form = el('form', { novalidate: true },
          el('p', { class: 'small' }, '1. Escanea este código con Google Authenticator, Microsoft Authenticator, 1Password o similar.'),
          el('img', { class: 'qr', src: qr, alt: 'Código QR para tu app de autenticación', width: 200, height: 200 }),
          el('p', { class: 'small muted' }, 'O escribe esta clave: ', el('code', {}, secreto)),
          campo('2. Escribe el código de 6 dígitos que muestra la app', { name: 'codigo', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, required: true }),
          el('button', { type: 'submit', class: 'btn btn-primary' }, 'Confirmar'), salida);
        form.addEventListener('submit', e => { e.preventDefault(); enviar(form, salida, async () => { await auth.verificarMfa(id, valor(form, 'codigo')); toast('Verificación en dos pasos activada.'); pintar(); }); });
        caja.replaceChildren(form);
      } catch (e) { toast(auth.mensajeError(e)); }
    });
    caja.replaceChildren(el('p', { class: 'small muted' }, 'Protege tu cuenta con un código de tu móvil además de la contraseña.'), activar);
  };
  await pintar();
  return caja;
}

async function panel(u) {
  const salidaNombre = estado();
  const fNombre = el('form', { novalidate: true, class: 'inline-form' }, campo('Nombre', { name: 'nombre', type: 'text', value: u.nombre, maxlength: 60, autocomplete: 'given-name' }), el('button', { type: 'submit', class: 'btn btn-ghost' }, 'Guardar'), salidaNombre);
  fNombre.addEventListener('submit', e => { e.preventDefault(); enviar(fNombre, salidaNombre, async () => { await auth.cambiarNombre(valor(fNombre, 'nombre').slice(0, 60)); fijar(salidaNombre, 'Guardado.', 'ok'); }); });

  const salidaPw = estado();
  const fPw = el('form', { novalidate: true }, campo('Contraseña nueva', { name: 'password', type: 'password', autocomplete: 'new-password' }, 'Mínimo 12 caracteres, con mayúsculas, minúsculas y números.'), el('button', { type: 'submit', class: 'btn btn-ghost' }, 'Cambiar contraseña'), salidaPw);
  fPw.addEventListener('submit', e => { e.preventDefault();
    const p = auth.problemasContrasena(fPw.elements.password.value, u.email);
    if (p.length) return fijar(salidaPw, 'La contraseña necesita ' + p.join(', ') + '.', 'error');
    enviar(fPw, salidaPw, async () => { await auth.cambiarContrasena(fPw.elements.password.value); fPw.reset(); fijar(salidaPw, 'Contraseña cambiada.', 'ok'); });
  });

  const salir = el('button', { type: 'button', class: 'btn btn-ghost' }, 'Cerrar sesión');
  salir.addEventListener('click', async () => { await auth.salir(); location.replace('./'); });
  const salirTodo = el('button', { type: 'button', class: 'btn btn-quiet' }, 'Cerrar sesión en todos los dispositivos');
  salirTodo.addEventListener('click', async () => { await auth.salirDeTodo(); location.replace('./'); });

  const eliminar = el('button', { type: 'button', class: 'btn btn-danger-ghost' }, 'Eliminar mi cuenta');
  eliminar.addEventListener('click', async () => {
    if (prompt('Se borrarán tu cuenta y todo tu progreso para siempre. Escribe ELIMINAR para confirmar.') !== 'ELIMINAR') return;
    const { error } = await auth.supabase().rpc('borrar_mi_cuenta');
    if (error) { toast(auth.mensajeError(error)); return; }
    await borrarTodo().catch(() => {});
    await auth.salir().catch(() => {});
    location.replace('./');
  });

  raiz.replaceChildren(el('div', { class: 'narrow stack' },
    el('div', { class: 'page-head' }, el('h1', {}, 'Tu cuenta'), el('p', {}, u.email)),
    el('section', { class: 'card' }, el('h2', {}, 'Perfil'), fNombre),
    el('section', { class: 'card' }, el('h2', {}, 'Seguridad'), await seccionMfa(), el('hr'), fPw, el('hr'), el('div', { class: 'hero-cta' }, salir, salirTodo)),
    el('section', { class: 'card' }, el('h2', {}, 'Tus datos'), el('p', { class: 'small muted' }, 'Descarga una copia de tu progreso o bórralo. Eliminar la cuenta borra también tus datos del servidor.'), datosLocales(), el('div', { class: 'hero-cta' }, eliminar))));
}

// ---------------------------------------------------------------- arranque
await iniciarPagina();
if (!auth.cuentasActivas()) { await cargar(); sinCuentas(); }
else {
  const u = await auth.usuarioActual();
  if (!u) acceso(params.get('modo') === 'registro' ? 'registro' : 'entrar');
  else {
    const mfa = await auth.nivelMfa().catch(() => ({}));
    if (mfa.siguiente === 'aal2' && mfa.actual !== 'aal2') codigoMfa();
    else if (params.has('recuperar')) nuevaContrasena();
    else {
      await cargar();
      if (params.has('confirmado')) toast('¡Cuenta confirmada! Bienvenido.');
      if (params.has('siguiente')) location.replace(siguiente);
      else panel(u);
    }
  }
}
