"""Credenciales de las plataformas (se guardan en data/connections.json, solo legible por el servidor)."""
import json
import os
import threading
from pathlib import Path

from .config import settings

FIELDS = {
    "youtube": ["client_id", "client_secret", "refresh_token", "channel", "privacy"],
    "tiktok": ["client_key", "client_secret", "access_token", "refresh_token", "expires_at", "account", "mode", "privacy"],
    "meta": ["token", "page_id", "ig_user_id", "graph_version", "page_name", "ig_username"],
}
SECRET_FIELDS = {"client_secret", "refresh_token", "access_token", "token"}
ENV = {
    ("youtube", "client_id"): "GOOGLE_CLIENT_ID",
    ("youtube", "client_secret"): "GOOGLE_CLIENT_SECRET",
    ("tiktok", "client_key"): "TIKTOK_CLIENT_KEY",
    ("tiktok", "client_secret"): "TIKTOK_CLIENT_SECRET",
    ("meta", "token"): "META_ACCESS_TOKEN",
    ("meta", "page_id"): "META_PAGE_ID",
    ("meta", "ig_user_id"): "META_IG_USER_ID",
}
DEFAULTS = {("youtube", "privacy"): "public", ("tiktok", "mode"): "draft", ("tiktok", "privacy"): "SELF_ONLY",
            ("meta", "graph_version"): "v23.0"}

_lock = threading.RLock()


def _path() -> Path:
    return settings.data_dir / "connections.json"


def _load() -> dict:
    p = _path()
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
    return {}


def get(platform: str) -> dict:
    with _lock:
        stored = _load().get(platform, {})
    out = {}
    for f in FIELDS[platform]:
        val = stored.get(f)
        if not val and (platform, f) in ENV:
            val = os.environ.get(ENV[(platform, f)], "")
        if not val:
            val = DEFAULTS.get((platform, f), "")
        out[f] = val
    return out


def update(platform: str, **values) -> dict:
    with _lock:
        data = _load()
        cur = data.setdefault(platform, {})
        for k, v in values.items():
            if k in FIELDS[platform]:
                if v is None:
                    cur.pop(k, None)
                else:
                    cur[k] = v
        p = _path()
        p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=1), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(p)
    return get(platform)


def connected(platform: str) -> bool:
    c = get(platform)
    if platform == "youtube":
        return bool(c["client_id"] and c["client_secret"] and c["refresh_token"])
    if platform == "tiktok":
        return bool(c["client_key"] and c["client_secret"] and c["refresh_token"])
    if platform == "meta":
        return bool(c["token"] and (c["page_id"] or c["ig_user_id"]))
    return False


def public_view(platform: str) -> dict:
    """Lo que puede ver la página: nunca devuelve secretos, solo si están puestos."""
    c = get(platform)
    return {k: (bool(v) if k in SECRET_FIELDS else v) for k, v in c.items()}
