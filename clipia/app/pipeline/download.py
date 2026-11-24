"""Descarga de videos y grabación de directos (YouTube, Twitch, TikTok, Facebook, Kick, X...)."""
from pathlib import Path
from typing import Callable

import yt_dlp

from . import Cancelled, PipelineError

ProgressFn = Callable[[float, str], None]


def _base_opts(cookies: str | None) -> dict:
    opts = {"quiet": True, "no_warnings": True, "noplaylist": True, "socket_timeout": 30, "retries": 5}
    if cookies:
        opts["cookiefile"] = cookies
    return opts


def friendly_error(exc: Exception) -> str:
    msg = str(exc)
    low = msg.lower()
    if "urlopen error" in low or "tunnel connection" in low or "timed out" in low or "name resolution" in low:
        return "El servidor no pudo conectarse a la plataforma. Revisa su conexión a internet y reintenta."
    if "sign in" in low or "log in" in low or "login required" in low or "not a bot" in low or "--cookies" in low:
        return ("La plataforma pide iniciar sesión para este video. Exporta tus cookies del navegador "
                "a un archivo cookies.txt y configúralo en CLIPIA_COOKIES_FILE (ver README).")
    if "private" in low:
        return "El video es privado o no tienes acceso."
    if "unsupported url" in low:
        return "Ese enlace no es compatible. Prueba con el enlace directo del video o del directo."
    if "not currently live" in low or "will begin" in low or "premieres" in low:
        return "El directo todavía no ha empezado."
    if "unable to download" in low or "http error" in low:
        return "No se pudo descargar el video (la plataforma rechazó la conexión). Inténtalo de nuevo o sube el archivo."
    return "No se pudo descargar: " + msg.replace("ERROR: ", "")[:300]


def fetch_info(url: str, cookies: str | None) -> dict:
    try:
        with yt_dlp.YoutubeDL({**_base_opts(cookies), "format": "b/bv*+ba"}) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise PipelineError(friendly_error(exc)) from exc
    if info.get("_type") == "playlist":
        entries = [e for e in info.get("entries") or [] if e]
        if not entries:
            raise PipelineError("El enlace es una lista sin videos.")
        info = entries[0]
    return info


def download_source(
    url: str,
    out_dir: Path,
    cookies: str | None,
    on_progress: ProgressFn,
    should_cancel: Callable[[], bool],
    info: dict | None = None,
) -> tuple[Path, str]:
    """Descarga un video ya publicado. Devuelve (archivo, título)."""
    if info is None:
        on_progress(0.0, "Leyendo el enlace…")
        info = fetch_info(url, cookies)
    title = info.get("title") or info.get("fulltitle") or "video"

    def hook(d: dict) -> None:
        if should_cancel():
            raise Cancelled()
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            done = d.get("downloaded_bytes") or 0
            frac = done / total if total else 0.0
            on_progress(min(frac, 1.0), f"Descargando video… {int(frac * 100)}%")

    opts = {
        **_base_opts(cookies),
        "format": "bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b",
        "merge_output_format": "mp4",
        "outtmpl": str(out_dir / "source.%(ext)s"),
        "progress_hooks": [hook],
        "concurrent_fragment_downloads": 4,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([info.get("webpage_url") or url])
    except Cancelled:
        raise
    except yt_dlp.utils.DownloadError as exc:
        if should_cancel():
            raise Cancelled() from exc
        raise PipelineError(friendly_error(exc)) from exc

    files = [p for p in out_dir.glob("source.*") if p.suffix not in (".part", ".ytdl") and p.is_file()]
    if not files:
        raise PipelineError("La descarga terminó pero no se encontró el archivo.")
    return max(files, key=lambda p: p.stat().st_size), title
