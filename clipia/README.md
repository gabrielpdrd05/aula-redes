# ClipIA

Página web privada que convierte videos y **directos en vivo** en **clips cortos ya editados**, y los
**publica** en YouTube Shorts, TikTok, Instagram Reels y Facebook Reels.

## Qué hace

- **Pegas un enlace** (YouTube, Twitch, TikTok, Facebook, Kick, Instagram, X…) o **subes un archivo**.
- **Directos en vivo, mientras siguen al aire**: la página se conecta al directo, lo graba por bloques
  (cada 5, 10, 15 o 20 minutos) y **va sacando clips de cada bloque sin esperar a que termine**.
  Tú no tienes que descargar nada.
- **Vigilar canal**: dejas tu canal y la página revisa cada 3 minutos; **en cuanto empiezas un directo,
  arranca sola**.
- La **IA (Claude) lee la transcripción** y elige los momentos con más potencial (gancho al inicio,
  remate al final, sin cortar frases). En los directos, repasa también el final del bloque anterior para no
  partir un buen momento por la mitad, y nunca repite un momento.
- Cada clip sale **editado**:
  - **vertical 9:16 siguiendo la cara**, o el video entero con **fondo difuminado** si no hay cara (gameplay, pantalla); también hay formato horizontal;
  - **subtítulos animados palabra por palabra** (4 estilos) y **título gancho** en los primeros segundos;
  - **audio normalizado** al volumen que usan las redes.
- Para cada clip: **título, descripción y hashtags**, y una nota de 1 a 100.
- **Publicar**:
  - **Botón «Compartir»** en el celular: abre TikTok, Instagram o YouTube con el clip ya cargado y el texto copiado. No necesita configurar nada.
  - **Botón «Publicar»**: lo sube directamente a las cuentas que conectes.
  - **Publicar automáticamente**: cada clip se publica solo en cuanto está listo (ideal con directos).
- **Privada**: entras con contraseña y los buscadores no la indexan.

## ¿Web o aplicación?

Es una **aplicación web**. Funciona igual en la compu y en el celular (en el celular: «Añadir a pantalla de
inicio» y queda como una app). El trabajo pesado lo hace el servidor, no tu teléfono. Si algún día la abres al
público con suscripción, una web es lo más fácil de convertir.

## Qué necesitas

1. **Dónde correrla**. Para directos y para vigilar canales tiene que estar **encendida siempre**, así que lo
   recomendable es un **servidor en la nube (VPS)** de 4 núcleos y 8 GB de RAM (8–15 USD/mes: Hetzner,
   Contabo, DigitalOcean…). También funciona en tu propia compu con Docker Desktop, pero solo mientras esté prendida.
2. **Una clave de Claude** en <https://console.anthropic.com>. Se paga por uso: aproximadamente
   **0,10–0,30 USD por cada hora de video**. Sin clave funciona en un «modo básico» mucho peor.
3. **Un dominio** (unos 10 USD/año). Es obligatorio para conectar TikTok, que solo acepta https, y recomendable para todo lo demás.

## Instalación en un servidor (recomendado)

1. Crea un VPS con Ubuntu e instala Docker: `curl -fsSL https://get.docker.com | sh`
2. Apunta un subdominio (por ejemplo `clips.tudominio.com`) a la IP del servidor (registro DNS tipo A).
3. Descarga este repositorio en el servidor:
   `git clone https://github.com/TU_USUARIO/clipia.git && cd clipia`
4. `cp .env.example .env` y edita el archivo `.env`:
   ```
   CLIPIA_PASSWORD=una-contraseña-larga
   CLIPIA_SECRET=texto-aleatorio-largo
   ANTHROPIC_API_KEY=sk-ant-...
   CLIPIA_DOMAIN=clips.tudominio.com
   CLIPIA_PUBLIC_URL=https://clips.tudominio.com
   CLIPIA_BIND=127.0.0.1
   CLIPIA_SECURE_COOKIES=1
   ```
5. Arranca con HTTPS automático: `docker compose --profile https up -d --build`
6. Entra a `https://clips.tudominio.com`.

Actualizar a una versión nueva: `git pull && docker compose --profile https up -d --build`

### En tu propia compu

Instala Docker Desktop, crea el `.env` (sin las líneas de dominio), ejecuta `docker compose up -d --build` y
entra a <http://localhost:8000>. Desde el celular, en la misma red WiFi: `http://IP-DE-TU-COMPU:8000`.

## Conectar las plataformas para publicar

Se hace **una sola vez**, desde la página, botón **«Conexiones»**. Cada plataforma pide crear una «app de
desarrollador» gratuita. Hazlo desde una computadora: son unos 15–30 minutos por plataforma.

### YouTube Shorts

1. Entra a <https://console.cloud.google.com>, crea un proyecto y activa **YouTube Data API v3**.
2. En «Pantalla de consentimiento OAuth», elige «Externo» y añade tu correo como «usuario de prueba».
3. En «Credenciales», crea un «ID de cliente OAuth» de tipo **Aplicación web** y pega como URI de redirección la
   que te muestra ClipIA en «Conexiones» (`https://clips.tudominio.com/oauth/youtube/callback`).
4. Copia el Client ID y el Client Secret en ClipIA, pulsa **Guardar** y después **Conectar mi canal**.

> Google deja los videos subidos desde apps nuevas como **privados** hasta que pides la verificación de la app
> (formulario «YouTube API Services – Audit», gratis). Mientras tanto, cambia la visibilidad en YouTube Studio
> con un toque.

### TikTok

1. Entra a <https://developers.tiktok.com>, crea una app y añade los productos **Login Kit** y **Content Posting API**.
2. Pon como Redirect URI la que te muestra ClipIA (`https://clips.tudominio.com/oauth/tiktok/callback`).
3. Copia el Client Key y el Client Secret en ClipIA, pulsa **Guardar** y después **Conectar mi cuenta**.
4. Modo recomendado: **Borrador**. El clip llega a tus notificaciones de TikTok y lo publicas desde la app con un toque, pudiendo añadir sonidos de moda.

> El modo «Publicar directo» solo deja publicar en **privado** hasta que TikTok revise y apruebe tu app (desde
> el panel de desarrolladores, «Submit for review»).

### Instagram Reels y Facebook Reels

1. Tu Instagram debe ser **cuenta profesional** (creador o empresa).
2. Entra a <https://developers.facebook.com>, crea una app de tipo «Empresa».
3. Opción A, con página de Facebook vinculada a tu Instagram: añade «Inicio de sesión con Facebook para empresas»,
   y en el «Explorador de la API Graph» genera un **token de página** con los permisos
   `pages_manage_posts`, `pages_read_engagement`, `instagram_basic` e `instagram_content_publish`.
   Conviértelo en token de larga duración, que no caduca. Copia el ID de la página y el ID de tu cuenta de Instagram.
   Este token sirve para Instagram y Facebook.
4. Opción B, solo Instagram y sin página: añade «API de Instagram con inicio de sesión de Instagram», genera un
   token (empieza por `IG`) y copia tu ID de usuario de Instagram.
5. Pega el token y los IDs en ClipIA y pulsa **Guardar y probar**.

Mientras la app de Meta esté en «modo desarrollo», puede publicar en tus propias cuentas sin revisión.

## Directos: cómo funciona

1. Pegas el enlace del directo (o vigilas tu canal).
2. La página se conecta a la señal y graba en bloques. Si la señal se cae, se reconecta sola hasta 5 veces.
3. Cada vez que se completa un bloque, la IA lo analiza junto al final del bloque anterior y saca los clips buenos.
   Pueden salir 0 si en ese tramo no pasó nada interesante.
4. Los clips van apareciendo en la página y, si activaste «Publicar automáticamente», se publican solos.
5. Termina cuando acaba el directo, cuando llega al máximo de horas o cuando pulsas **Terminar grabación**.
   El último bloque también se analiza.

Con un servidor de 4 núcleos y el modelo de voz `small`, cada bloque de 10 minutos se procesa en 2 a 4 minutos,
así que va al ritmo del directo. Con `CLIPIA_WHISPER_MODEL=base` es el doble de rápido.

## Cuando una plataforma pide «iniciar sesión»

YouTube, TikTok, Facebook e Instagram a veces bloquean descargas desde servidores. Para evitarlo:

1. Instala en tu navegador la extensión «Get cookies.txt LOCALLY».
2. Entra a la plataforma con tu cuenta y exporta las cookies.
3. Guarda el archivo como `data/cookies.txt` en el servidor y añade al `.env`: `CLIPIA_COOKIES_FILE=/data/cookies.txt`
4. Reinicia: `docker compose --profile https up -d`

## Ajustes del archivo `.env`

| Variable | Para qué |
|---|---|
| `CLIPIA_PASSWORD` | Contraseña de acceso (obligatoria) |
| `CLIPIA_SECRET` | Firma de la sesión |
| `ANTHROPIC_API_KEY` | Clave de Claude |
| `CLIPIA_CLAUDE_MODEL` | Modelo de Claude (por defecto `claude-opus-5-5`) |
| `CLIPIA_WHISPER_MODEL` | `tiny`, `base`, `small`, `medium`, `large-v3` |
| `CLIPIA_MAX_LIVE_MINUTES` | Tope de grabación de directos (por defecto 240) |
| `CLIPIA_PUBLIC_URL` | Dirección pública exacta, para conectar YouTube y TikTok |
| `CLIPIA_KEEP_SOURCE` | `1` para conservar el video original (ocupa mucho disco) |
| `CLIPIA_COOKIES_FILE` | Ruta al `cookies.txt` |
| `CLIPIA_MAX_UPLOAD_MB` | Tamaño máximo al subir archivos |

## Cómo funciona por dentro

```
enlace ─► ¿en vivo? ─sí─► ffmpeg graba en bloques ─► cada bloque: Whisper → Claude → edición → (publicar)
          └─no──► yt-dlp descarga ─► Whisper transcribe (tiempo de cada palabra)
                                    ─► Claude elige momentos ─► OpenCV busca la cara
                                    ─► ffmpeg corta, reencuadra, subtitula, normaliza ─► MP4
                                    ─► (publicar en YouTube / TikTok / Instagram / Facebook)
```

| Archivo | Qué hace |
|---|---|
| `app/main.py` | Servidor web, contraseña, rutas |
| `app/jobs.py` | Cola de trabajos, proceso de videos y de directos |
| `app/watchers.py` | Vigilancia de canales |
| `app/pipeline/` | Descarga, grabación en vivo, transcripción, elección de momentos, subtítulos, edición |
| `app/publish/` | Subida a YouTube, TikTok, Instagram y Facebook |
| `app/connections.py` | Credenciales de las plataformas (`data/connections.json`, nunca se muestran en la página) |
| `app/static/` | La interfaz |

## Pruebas

```bash
pip install -r requirements.txt pytest
pytest -q
```

Las pruebas incluyen un directo simulado: una transmisión HLS local en vivo de la que ClipIA tiene que sacar
clips mientras sigue emitiendo.

## Importante

Usa la herramienta con tu propio contenido o con el que tengas permiso de recortar y republicar.

## Si algún día la abres al público

Faltaría: cuentas de usuario, pagos con Stripe, límites de minutos por plan, una cola de trabajos separada
(Redis) con varios procesadores con GPU, almacenamiento en la nube (S3/R2) y pasar la revisión de las apps de
TikTok, Google y Meta para publicar en nombre de otros usuarios.
