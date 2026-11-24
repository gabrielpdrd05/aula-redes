"""Configuración leída de variables de entorno (archivo .env)."""
import os
import secrets
from pathlib import Path


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


class Settings:
    def __init__(self) -> None:
        # Contraseña de acceso a la página. Obligatoria.
        self.password = os.environ.get("CLIPIA_PASSWORD", "")
        # Clave para firmar la cookie de sesión. Si falta, se genera una al arrancar
        # (funciona, pero tendrás que volver a entrar cada vez que reinicies).
        self.secret = os.environ.get("CLIPIA_SECRET") or secrets.token_hex(32)
        self.secure_cookies = os.environ.get("CLIPIA_SECURE_COOKIES", "0") == "1"

        self.data_dir = Path(os.environ.get("CLIPIA_DATA_DIR", "./data")).resolve()

        # IA que elige los mejores momentos (Claude). Sin clave se usa un modo básico.
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self.claude_model = os.environ.get("CLIPIA_CLAUDE_MODEL", "claude-opus-5-5")

        # Transcripción local con Whisper (tiny, base, small, medium, large-v3, turbo).
        self.whisper_model = os.environ.get("CLIPIA_WHISPER_MODEL", "small")
        self.whisper_device = os.environ.get("CLIPIA_WHISPER_DEVICE", "auto")  # auto | cpu | cuda

        # cookies.txt exportado del navegador: necesario a veces para TikTok, Facebook
        # o YouTube cuando piden "inicia sesión".
        self.cookies_file = os.environ.get("CLIPIA_COOKIES_FILE") or None

        self.max_live_minutes = _int("CLIPIA_MAX_LIVE_MINUTES", 240)
        self.keep_source = os.environ.get("CLIPIA_KEEP_SOURCE", "0") == "1"
        self.max_upload_mb = _int("CLIPIA_MAX_UPLOAD_MB", 4096)

        # Dirección pública de la página (para conectar YouTube/TikTok). Ej.: https://clips.tudominio.com
        self.public_url = (os.environ.get("CLIPIA_PUBLIC_URL") or "").rstrip("/")

        self.font = os.environ.get("CLIPIA_FONT", "Montserrat")
        self.fonts_dir = os.environ.get("CLIPIA_FONTS_DIR") or None


settings = Settings()
