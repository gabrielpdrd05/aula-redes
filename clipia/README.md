# ClipIA

Página web privada: pegas el enlace de un video o de un directo (YouTube, Twitch, TikTok, Facebook, Kick,
Instagram, X…) y te devuelve **clips cortos ya editados**, listos para subir a TikTok, Reels o Shorts:

- La **IA (Claude) lee toda la transcripción** y elige los momentos con más potencial (gancho al inicio, remate al final, sin cortar frases).
- **Formato vertical 9:16** que **sigue la cara** de quien habla; si no hay cara (gameplay, pantalla), pone el video entero con **fondo difuminado**. También hay formato horizontal.
- **Subtítulos animados palabra por palabra** (la palabra que suena se resalta), 4 estilos.
- **Título gancho** en los primeros segundos.
- **Audio normalizado** al volumen que usan TikTok/Instagram/YouTube.
- Para cada clip: **título, descripción y hashtags** listos para copiar, y nota de 1 a 100.
- Descarga uno por uno o **todo en un .zip**.
- **Directos en vivo**: los graba hasta el tiempo que elijas (o hasta que pulses "Terminar grabación y sacar clips").
- Si una plataforma no deja descargar, puedes **subir el archivo** directamente.
- **Protegida con contraseña**: solo entras tú.

## ¿Web o aplicación?

Es una **aplicación web**. Funciona igual en la compu y en el celular (en el celular puedes "Añadir a pantalla de
inicio" y queda como una app). El trabajo pesado (descargar, transcribir, editar video) lo hace el servidor, no tu
teléfono, así que una app nativa no aportaría nada y costaría el doble de mantener. Y si algún día la quieres abrir al
público con suscripción, una web es lo más fácil de convertir.

## Qué necesitas

1. **Dónde correrla** (elige una):
   - **Tu propia compu** (Windows, Mac o Linux) con [Docker Desktop](https://www.docker.com/products/docker-desktop/). Gratis. Solo funciona mientras la compu está prendida.
   - **Un servidor en la nube (VPS)** para tenerla siempre disponible. Uno de 4 núcleos y 8 GB de RAM cuesta unos 8–15 USD/mes (Hetzner, Contabo, DigitalOcean…).
2. **Una clave de Claude** en <https://console.anthropic.com> (pagas por uso: aproximadamente **0,10–0,30 USD por cada hora de video** analizado). Sin clave la app funciona en "modo básico", que elige por volumen y ritmo y es mucho peor.

La transcripción (Whisper) corre en tu propio servidor y es gratis.

## Instalación en tu compu (la forma más fácil)

1. Instala Docker Desktop y ábrelo.
2. Descarga esta carpeta `clipia`.
3. Copia `.env.example` como `.env` y edítalo:
   - `CLIPIA_PASSWORD`: tu contraseña.
   - `CLIPIA_SECRET`: cualquier texto largo y aleatorio.
   - `ANTHROPIC_API_KEY`: tu clave de Claude.
4. Abre una terminal en la carpeta `clipia` y ejecuta:
   ```bash
   docker compose up -d --build
   ```
5. Entra a <http://localhost:8000>. Desde el celular en la misma red WiFi: `http://IP-DE-TU-COMPU:8000`.

La primera vez tarda unos minutos en construirse y, en el primer video, en bajar el modelo de voz (~500 MB).

Para apagarla: `docker compose down`. Para actualizar tras cambios: `docker compose up -d --build`.

## Instalación en un servidor con tu dominio y HTTPS

1. Compra un VPS con Ubuntu e instala Docker (`curl -fsSL https://get.docker.com | sh`).
2. Apunta un subdominio (por ejemplo `clips.tudominio.com`) a la IP del servidor (registro DNS tipo A).
3. Copia la carpeta `clipia` al servidor y crea el `.env` como arriba, añadiendo:
   ```
   CLIPIA_DOMAIN=clips.tudominio.com
   CLIPIA_BIND=127.0.0.1
   CLIPIA_SECURE_COOKIES=1
   ```
4. Arranca con HTTPS automático:
   ```bash
   docker compose --profile https up -d --build
   ```
5. Entra a `https://clips.tudominio.com`.

## Cuánto tarda

En un servidor de 4 núcleos sin tarjeta gráfica, con el modelo `small`: un video de 1 hora tarda más o menos
15–25 minutos en total (lo más lento es transcribir). Cada clip se edita en 10–30 segundos. Con
`CLIPIA_WHISPER_MODEL=base` va el doble de rápido con algo menos de precisión en los subtítulos.

## Cuando una plataforma pide "iniciar sesión"

YouTube, TikTok, Facebook e Instagram a veces bloquean descargas desde servidores. Solución:

1. Instala en tu navegador una extensión que exporte cookies en formato `cookies.txt`
   (por ejemplo "Get cookies.txt LOCALLY").
2. Entra a la plataforma con tu cuenta y exporta las cookies.
3. Guarda el archivo como `data/cookies.txt` y añade al `.env`: `CLIPIA_COOKIES_FILE=/data/cookies.txt`
4. Reinicia: `docker compose up -d`.

Si aun así no se puede, descarga el video tú mismo y usa la pestaña **Subir archivo**.

## Opciones de cada trabajo

| Opción | Qué hace |
|---|---|
| Cantidad de clips | Un número fijo, o "los que valgan la pena" (la IA decide) |
| Duración | 15–30 s, 20–60 s, 45–90 s o 1–3 min |
| Formato | Vertical automático, vertical siguiendo la cara, vertical con fondo difuminado, horizontal |
| Subtítulos | Viral amarillo, viral verde, caja oscura, minimalista; en mayúsculas o no |
| Título gancho | Texto grande arriba durante los primeros 3,5 s |
| Indicaciones para la IA | Por ejemplo "solo los momentos graciosos" o "nada de política" |
| Directo | Minutos máximos de grabación |

## Ajustes del archivo `.env`

| Variable | Para qué |
|---|---|
| `CLIPIA_PASSWORD` | Contraseña de acceso (obligatoria) |
| `CLIPIA_SECRET` | Firma de la sesión; si cambia, tendrás que volver a entrar |
| `ANTHROPIC_API_KEY` | Clave de Claude |
| `CLIPIA_CLAUDE_MODEL` | Modelo de Claude (por defecto `claude-opus-5-5`) |
| `CLIPIA_WHISPER_MODEL` | `tiny`, `base`, `small`, `medium`, `large-v3` |
| `CLIPIA_MAX_LIVE_MINUTES` | Tope de grabación de directos |
| `CLIPIA_KEEP_SOURCE` | `1` para conservar el video original (ocupa mucho disco) |
| `CLIPIA_COOKIES_FILE` | Ruta al `cookies.txt` |
| `CLIPIA_MAX_UPLOAD_MB` | Tamaño máximo al subir archivos |

## Cómo funciona por dentro

```
enlace ─► yt-dlp descarga (o ffmpeg graba el directo)
       ─► Whisper transcribe con el tiempo exacto de cada palabra
       ─► Claude lee la transcripción y devuelve los mejores momentos (inicio, fin, título, descripción, hashtags)
       ─► se ajustan los cortes al inicio/fin de frase
       ─► OpenCV busca la cara para encuadrar en vertical
       ─► ffmpeg corta, reencuadra, quema subtítulos animados, normaliza el audio y exporta MP4 (H.264 + AAC)
```

Código: `app/pipeline/` (`download.py`, `transcribe.py`, `highlights.py`, `subtitles.py`, `render.py`),
servidor en `app/main.py`, cola de trabajos en `app/jobs.py`, interfaz en `app/static/`.

## Pruebas

```bash
pip install -r requirements.txt pytest httpx
pytest -q
```

## Importante

Usa la herramienta con contenido tuyo o que tengas permiso de recortar y republicar. Subir clips de otros creadores
sin permiso puede violar derechos de autor y las normas de las plataformas.

## Si algún día la abres al público

Lo que habría que añadir: cuentas de usuario (registro e inicio de sesión), pagos con Stripe, límites de minutos por
plan, una cola de trabajos separada (Redis) para varios procesadores con GPU, y guardar los clips en almacenamiento
en la nube (S3/R2). La estructura actual (cola de trabajos, procesamiento separado de la web) ya está pensada para
crecer en esa dirección.
