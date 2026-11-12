// Cuentas con Supabase Auth: registro con confirmación por correo, inicio de sesión, recuperación de contraseña y
// verificación en dos pasos (TOTP). Si el proyecto de Supabase todavía no está configurado (config.json vacío), la web
// funciona en "modo invitado": el progreso se guarda solo en este navegador.
import { CONFIG } from './config.js';

let client = null;
export const cuentasActivas = () => !!(CONFIG.supabaseUrl && CONFIG.supabaseKey && window.supabase?.createClient);

export function supabase() {
  if (!cuentasActivas()) return null;
  if (!client) {
    client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    });
  }
  return client;
}

const aUsuario = (u) => u ? { id: u.id, email: u.email, nombre: u.user_metadata?.nombre || '', confirmado: !!u.email_confirmed_at } : null;

export async function usuarioActual() {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return aUsuario(data.session?.user);
}

export function alCambiarSesion(fn) {
  const sb = supabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_evento, session) => fn(aUsuario(session?.user)));
  return () => data.subscription.unsubscribe();
}

export async function token() {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || null;
}

// Mensajes de error de Supabase traducidos a algo comprensible.
export function mensajeError(err) {
  const m = String(err?.message || err || '');
  if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(m)) return 'Todavía no has confirmado tu correo. Abre el enlace que te enviamos (revisa también spam).';
  if (/user already registered/i.test(m)) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (/password should be at least|weak password|pwned|known to be weak/i.test(m)) return 'La contraseña es demasiado débil o aparece en filtraciones conocidas. Elige otra más larga.';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  if (/invalid totp|invalid code|code.*expired/i.test(m)) return 'El código no es válido o ha caducado. Prueba con el siguiente.';
  if (/reauthenticat/i.test(m)) return 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.';
  if (/network|fetch/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet.';
  return 'No se pudo completar la operación: ' + m;
}

export function problemasContrasena(pw, email = '') {
  const p = [];
  if (pw.length < 12) p.push('al menos 12 caracteres');
  if (!/[a-zà-ÿ]/.test(pw) || !/[A-ZÀ-Þ]/.test(pw)) p.push('mayúsculas y minúsculas');
  if (!/\d/.test(pw)) p.push('algún número');
  const local = (email.split('@')[0] || '').toLowerCase();
  if (local.length > 3 && pw.toLowerCase().includes(local)) p.push('que no contenga tu correo');
  return p;
}

const volverA = (pagina) => new URL(pagina, location.href).href;

export async function registrar({ nombre, email, password }) {
  const { data, error } = await supabase().auth.signUp({ email, password, options: { data: { nombre }, emailRedirectTo: volverA('cuenta.html?confirmado=1') } });
  if (error) throw error;
  return { necesitaConfirmar: !data.session };
}

export async function entrar(email, password) {
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return nivelMfa();
}

export async function salir() { await supabase()?.auth.signOut({ scope: 'local' }); }
export async function salirDeTodo() { await supabase()?.auth.signOut({ scope: 'global' }); }

export async function recuperar(email) {
  const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo: volverA('cuenta.html?recuperar=1') });
  if (error) throw error;
}

export async function cambiarContrasena(password) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function cambiarNombre(nombre) {
  const { error } = await supabase().auth.updateUser({ data: { nombre } });
  if (error) throw error;
}

// ---------------------------------------------------------------- verificación en dos pasos (TOTP)
// Devuelve { actual, siguiente }: si siguiente es 'aal2' y actual 'aal1', falta introducir el código.
export async function nivelMfa() {
  const { data, error } = await supabase().auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return { actual: data.currentLevel, siguiente: data.nextLevel };
}

export async function factores() {
  const { data, error } = await supabase().auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.filter(f => f.status === 'verified');
}

export async function iniciarMfa() {
  const { data, error } = await supabase().auth.mfa.enroll({ factorType: 'totp', friendlyName: 'App de autenticación ' + new Date().toISOString().slice(0, 10) });
  if (error) throw error;
  return { id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret };
}

export async function verificarMfa(factorId, codigo) {
  const { data: ch, error: e1 } = await supabase().auth.mfa.challenge({ factorId });
  if (e1) throw e1;
  const { error } = await supabase().auth.mfa.verify({ factorId, challengeId: ch.id, code: codigo });
  if (error) throw error;
}

export async function quitarMfa(factorId) {
  const { error } = await supabase().auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
