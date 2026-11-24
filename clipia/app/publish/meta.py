"""Instagram Reels y Facebook Reels con la Graph API oficial de Meta.

Acepta dos tipos de token:
- Token de página de Facebook (Facebook Login): sirve para Facebook Reels y para Instagram
  si la cuenta de Instagram profesional está vinculada a esa página.
- Token de Instagram (empieza por "IG", Instagram Login): solo Instagram, no hace falta página.
"""
import time
from pathlib import Path

from .. import connections
from . import PublishError
from .http import check, client


def _host(token: str) -> str:
    return "https://graph.instagram.com" if token.startswith("IG") else "https://graph.facebook.com"


def test_connection() -> dict:
    c = connections.get("meta")
    if not c["token"]:
        raise PublishError("Falta el token de Meta.")
    v, host = c["graph_version"], _host(c["token"])
    out = {}
    with client() as http:
        if c["page_id"] and host.endswith("facebook.com"):
            page = check(http.get(f"{host}/{v}/{c['page_id']}", params={"fields": "name", "access_token": c["token"]}),
                         "Facebook no reconoce la página o el token")
            out["page_name"] = page.get("name", "")
        if c["ig_user_id"]:
            ig = check(http.get(f"{host}/{v}/{c['ig_user_id']}", params={"fields": "username", "access_token": c["token"]}),
                       "Instagram no reconoce la cuenta o el token")
            out["ig_username"] = ig.get("username", "")
    connections.update("meta", **out)
    return out


def upload_instagram(path: Path, caption: str) -> str:
    c = connections.get("meta")
    if not (c["token"] and c["ig_user_id"]):
        raise PublishError("Instagram no está conectado (falta token o ID de la cuenta).")
    v, host, token = c["graph_version"], _host(c["token"]), c["token"]
    size = path.stat().st_size
    with client() as http:
        cont = check(http.post(f"{host}/{v}/{c['ig_user_id']}/media", data={
            "media_type": "REELS", "upload_type": "resumable", "caption": caption[:2200],
            "share_to_feed": "true", "access_token": token}), "Instagram rechazó el reel")
        upload_uri = cont.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{v}/{cont['id']}"
        with path.open("rb") as fh:
            check(http.post(upload_uri, content=fh.read(), headers={
                "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)}), "Instagram cortó la subida")
        for _ in range(90):  # Instagram procesa el video antes de dejar publicarlo
            st = check(http.get(f"{host}/{v}/{cont['id']}", params={"fields": "status_code,status", "access_token": token}),
                       "Instagram")
            if st.get("status_code") == "FINISHED":
                break
            if st.get("status_code") in ("ERROR", "EXPIRED"):
                raise PublishError("Instagram no pudo procesar el video: " + str(st.get("status", "")))
            time.sleep(5)
        else:
            raise PublishError("Instagram tardó demasiado en procesar el video.")
        pub = check(http.post(f"{host}/{v}/{c['ig_user_id']}/media_publish",
                              data={"creation_id": cont["id"], "access_token": token}), "Instagram no publicó el reel")
        link = http.get(f"{host}/{v}/{pub['id']}", params={"fields": "permalink", "access_token": token}).json()
    return link.get("permalink") or "https://www.instagram.com/"


def upload_facebook(path: Path, caption: str) -> str:
    c = connections.get("meta")
    if not (c["token"] and c["page_id"]):
        raise PublishError("Facebook no está conectado (falta token o ID de la página).")
    if c["token"].startswith("IG"):
        raise PublishError("Ese token es de Instagram; para Facebook hace falta un token de página.")
    v, token = c["graph_version"], c["token"]
    base = f"https://graph.facebook.com/{v}/{c['page_id']}/video_reels"
    size = path.stat().st_size
    with client() as http:
        start = check(http.post(base, data={"upload_phase": "start", "access_token": token}), "Facebook rechazó el reel")
        with path.open("rb") as fh:
            check(http.post(start["upload_url"], content=fh.read(), headers={
                "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)}), "Facebook cortó la subida")
        check(http.post(base, data={"upload_phase": "finish", "video_id": start["video_id"], "video_state": "PUBLISHED",
                                    "description": caption[:2200], "access_token": token}), "Facebook no publicó el reel")
    return f"https://www.facebook.com/reel/{start['video_id']}"
