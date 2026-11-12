# Activar las cuentas y el tutor con IA

Se hace una sola vez. Necesitas una cuenta gratuita de [Supabase](https://supabase.com) y una clave de la API de [Anthropic](https://console.anthropic.com).

> **Nunca** pegues la clave de Anthropic ni la clave `service_role`/`sb_secret_` de Supabase en `config.json`, en el código ni en GitHub. Solo van como *secretos* de Supabase (paso 4).

## 1. Crear el proyecto de Supabase

1. En supabase.com → **New project**. Elige una región cercana a tus alumnos y una contraseña fuerte para la base de datos.
2. **SQL Editor → New query**: pega todo `supabase/migrations/20261111000000_aula.sql` y pulsa **Run**. Se puede repetir sin problemas.

## 2. Configurar la autenticación

En **Authentication**:

- **Sign In / Providers → Email**: activado, con **Confirm email** activado.
- **Passwords**: longitud mínima **12**, exigir minúsculas, mayúsculas y números, y activa **Prevent use of leaked passwords** (si tu plan lo incluye).
- **URL Configuration**:
  - *Site URL*: `https://loopback-academia.github.io/`
  - *Redirect URLs*: `https://loopback-academia.github.io/cuenta.html*`
- **Multi-Factor**: deja activado **TOTP** (app de autenticación).
- **Rate Limits**: los valores por defecto están bien; bájalos si ves abuso.
- Recomendado para producción: **SMTP propio** (Emails → SMTP Settings); el correo de prueba de Supabase tiene un límite muy bajo de envíos por hora.

## 3. Conectar la web

En **Project Settings → API** (o **API Keys**) copia la **Project URL** y la clave **publishable** (o `anon`). Ponlas en `config.json`:

```json
"supabaseUrl": "https://TU-PROYECTO.supabase.co",
"supabaseKey": "sb_publishable_…"
```

Después ejecuta `node scripts/paginas.mjs` (regenera `js/config.js` y añade tu proyecto a la CSP) y sube los cambios. Esa clave es pública por diseño: lo que protege los datos es RLS.

## 4. (Opcional) Activar el tutor con IA

El tutor usa la API de Anthropic, que se paga por uso (aparte de cualquier suscripción a Claude). Sin él, la web usa el buscador del curso. Para activarlo, pon `"tutorIA": true` en `config.json`, ejecuta `node scripts/paginas.mjs` y despliega la función:


Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref TU-PROYECTO
supabase secrets set ANTHROPIC_API_KEY=…            # tu clave de Anthropic
supabase secrets set ALLOWED_ORIGINS=https://loopback-academia.github.io
supabase secrets set TUTOR_LIMITE_DIARIO=40          # opcional: mensajes por alumno y día
supabase functions deploy tutor
```

`ALLOWED_ORIGINS` es obligatorio: sin él la función rechaza todas las peticiones. La función se despliega con la verificación de JWT activada (valor por defecto); no uses `--no-verify-jwt`.

En la consola de Anthropic pon un **límite de gasto mensual** a la clave.

## 5. Comprobar

1. Abre la web, **Entrar → Crear cuenta**, confirma el correo.
2. Completa una lección y mira que en **Table Editor → progreso** aparece la fila.
3. Abre una lección y pregunta algo al tutor.
4. En **Tu cuenta**, activa la verificación en dos pasos.

## Mantenimiento

- Limpieza del uso del tutor (opcional, mensual): en el SQL Editor, `select public.tutor_limpiar();`.
- Para cambiar el modelo, edita `MODEL` en `supabase/functions/tutor/index.ts` y vuelve a desplegar.
