"""Subida a YouTube (Shorts) con la API oficial YouTube Data v3."""
from pathlib import Path
from urllib.parse import urlencode

from .. import connections
from . import PublishError
from .http import check, client

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
SCOPES = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"


def auth_url(redirect_uri: str, state: str) -> str:
    c = connections.get("youtube")
    if not (c["client_id"] and c["client_secret"]):
        raise PublishError("Primero guarda el Client ID y el Client Secret de Google.")
    return AUTH_URL + "?" + urlencode({
        "client_id": c["client_id"], "redirect_uri": redirect_uri, "response_type": "code",
        "scope": SCOPES, "access_type": "offline", "prompt": "consent", "state": state,
    })


def finish_auth(code: str, redirect_uri: str) -> str:
    c = connections.get("youtube")
    with client() as http:
        data = check(http.post(TOKEN_URL, data={
            "code": code, "client_id": c["client_id"], "client_secret": c["client_secret"],
            "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        }), "Google no aceptó la autorización")
        if not data.get("refresh_token"):
            raise PublishError("Google no devolvió permiso permanente. Quita el acceso de la app en tu cuenta de Google y conecta otra vez.")
        ch = check(http.get(CHANNELS_URL, params={"part": "snippet", "mine": "true"},
                            headers={"Authorization": f"Bearer {data['access_token']}"}), "No se pudo leer tu canal")
    name = (ch.get("items") or [{}])[0].get("snippet", {}).get("title", "")
    connections.update("youtube", refresh_token=data["refresh_token"], channel=name)
    return name


def _access_token(http) -> str:
    c = connections.get("youtube")
    data = check(http.post(TOKEN_URL, data={
        "client_id": c["client_id"], "client_secret": c["client_secret"],
        "refresh_token": c["refresh_token"], "grant_type": "refresh_token",
    }), "YouTube: la conexión caducó, vuelve a conectar")
    return data["access_token"]


def upload(path: Path, title: str, description: str, tags: list[str], privacy: str | None = None) -> str:
    c = connections.get("youtube")
    privacy = privacy or c["privacy"] or "public"
    size = path.stat().st_size
    body = {
        "snippet": {"title": (title or "Clip")[:100], "description": description[:4900],
                    "tags": [t[:30] for t in tags][:15], "categoryId": "22"},
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    with client() as http:
        token = _access_token(http)
        init = http.post(UPLOAD_URL, params={"uploadType": "resumable", "part": "snippet,status"}, json=body,
                         headers={"Authorization": f"Bearer {token}", "X-Upload-Content-Type": "video/mp4",
                                  "X-Upload-Content-Length": str(size)})
        check(init, "YouTube rechazó la subida")
        location = init.headers.get("location")
        if not location:
            raise PublishError("YouTube no dio dirección de subida.")
        with path.open("rb") as fh:
            done = check(http.put(location, content=fh.read(), headers={"Content-Type": "video/mp4"}),
                         "YouTube cortó la subida")
    return f"https://www.youtube.com/shorts/{done['id']}"
