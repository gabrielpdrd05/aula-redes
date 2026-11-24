"""Publicación en TikTok con la Content Posting API oficial.

Modo "draft": el video llega a tu bandeja de TikTok y lo terminas en la app (sonido, texto) con un toque.
Modo "direct": se publica directamente. Hasta que TikTok apruebe tu app, solo deja publicar en privado.
"""
import math
import time
from pathlib import Path
from urllib.parse import urlencode

from .. import connections
from . import PublishError
from .http import check, client

AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
API = "https://open.tiktokapis.com/v2"
SCOPES = "user.info.basic,video.upload,video.publish"


def auth_url(redirect_uri: str, state: str) -> str:
    c = connections.get("tiktok")
    if not (c["client_key"] and c["client_secret"]):
        raise PublishError("Primero guarda el Client Key y el Client Secret de TikTok.")
    return AUTH_URL + "?" + urlencode({"client_key": c["client_key"], "scope": SCOPES, "response_type": "code",
                                       "redirect_uri": redirect_uri, "state": state})


def _save_tokens(data: dict) -> None:
    connections.update("tiktok", access_token=data["access_token"], refresh_token=data["refresh_token"],
                       expires_at=str(int(time.time()) + int(data.get("expires_in", 86400)) - 300))


def finish_auth(code: str, redirect_uri: str) -> str:
    c = connections.get("tiktok")
    with client() as http:
        data = check(http.post(f"{API}/oauth/token/", data={
            "client_key": c["client_key"], "client_secret": c["client_secret"], "code": code,
            "grant_type": "authorization_code", "redirect_uri": redirect_uri,
        }), "TikTok no aceptó la autorización")
        if "access_token" not in data:
            raise PublishError("TikTok: " + str(data.get("error_description") or data))
        _save_tokens(data)
        info = http.get(f"{API}/user/info/", params={"fields": "display_name"},
                        headers={"Authorization": f"Bearer {data['access_token']}"}).json()
    name = info.get("data", {}).get("user", {}).get("display_name", "")
    connections.update("tiktok", account=name)
    return name


def _token(http) -> str:
    c = connections.get("tiktok")
    if c["access_token"] and int(c["expires_at"] or 0) > time.time():
        return c["access_token"]
    data = check(http.post(f"{API}/oauth/token/", data={
        "client_key": c["client_key"], "client_secret": c["client_secret"],
        "grant_type": "refresh_token", "refresh_token": c["refresh_token"],
    }), "TikTok: la conexión caducó, vuelve a conectar")
    if "access_token" not in data:
        raise PublishError("TikTok: la conexión caducó, vuelve a conectar")
    _save_tokens(data)
    return data["access_token"]


def _api(http, token: str, path: str, body: dict, what: str) -> dict:
    data = check(http.post(f"{API}{path}", json=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json; charset=UTF-8"}), what)
    err = data.get("error", {})
    if err.get("code") not in (None, "ok"):
        raise PublishError(f"{what}: {err.get('message') or err.get('code')}")
    return data.get("data", {})


def upload(path: Path, caption: str, mode: str | None = None, privacy: str | None = None) -> str:
    c = connections.get("tiktok")
    mode = mode or c["mode"] or "draft"
    size = path.stat().st_size
    # TikTok: trozos de 5 a 64 MB; si el archivo cabe en uno, va entero.
    chunk = size if size <= 64 * 1024 * 1024 else 10 * 1024 * 1024
    count = max(1, math.floor(size / chunk))
    source = {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": chunk, "total_chunk_count": count}
    with client() as http:
        token = _token(http)
        if mode == "direct":
            body = {"post_info": {"title": caption[:2200], "privacy_level": privacy or c["privacy"] or "SELF_ONLY",
                                  "disable_comment": False, "disable_duet": False, "disable_stitch": False},
                    "source_info": source}
            init = _api(http, token, "/post/publish/video/init/", body, "TikTok rechazó la publicación")
        else:
            init = _api(http, token, "/post/publish/inbox/video/init/", {"source_info": source},
                        "TikTok rechazó el borrador")
        with path.open("rb") as fh:
            for i in range(count):
                start = i * chunk
                end = size - 1 if i == count - 1 else start + chunk - 1
                fh.seek(start)
                part = fh.read(end - start + 1)
                r = http.put(init["upload_url"], content=part, headers={
                    "Content-Type": "video/mp4", "Content-Length": str(len(part)),
                    "Content-Range": f"bytes {start}-{end}/{size}"})
                if r.status_code >= 400:
                    raise PublishError(f"TikTok cortó la subida (HTTP {r.status_code})")
        publish_id = init["publish_id"]
        for _ in range(60):
            st = _api(http, token, "/post/publish/status/fetch/", {"publish_id": publish_id}, "TikTok")
            status = st.get("status")
            if status in ("PUBLISH_COMPLETE", "SEND_TO_USER_INBOX"):
                break
            if status == "FAILED":
                raise PublishError("TikTok no aceptó el video: " + str(st.get("fail_reason", "")))
            time.sleep(5)
    if mode == "direct":
        return "https://www.tiktok.com/"
    return "tiktok://inbox"  # el borrador te espera en las notificaciones de TikTok
