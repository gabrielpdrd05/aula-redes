"""Publicación simulando los servidores de YouTube, TikTok y Meta (no sale nada a internet)."""
import json
import time

import httpx
import pytest

from app import connections
from app.publish import meta, tiktok, youtube
from app.publish import http as http_mod


@pytest.fixture()
def clip_file(tmp_path):
    p = tmp_path / "clip.mp4"
    p.write_bytes(b"\x00" * 300_000)
    return p


@pytest.fixture()
def fake_net(monkeypatch):
    calls = []

    def install(handler):
        def client():
            return httpx.Client(transport=httpx.MockTransport(lambda req: (calls.append(req), handler(req))[1]))
        for mod in (youtube, tiktok, meta, http_mod):
            monkeypatch.setattr(mod, "client", client)
        return calls
    return install


def test_youtube_upload(fake_net, clip_file):
    connections.update("youtube", client_id="cid", client_secret="sec", refresh_token="rt", privacy="unlisted")

    def handler(req):
        if req.url.host == "oauth2.googleapis.com":
            assert b"refresh_token=rt" in req.content
            return httpx.Response(200, json={"access_token": "at"})
        if req.method == "POST":
            body = json.loads(req.content)
            assert body["status"]["privacyStatus"] == "unlisted"
            assert req.headers["authorization"] == "Bearer at"
            return httpx.Response(200, headers={"Location": "https://upload.example/session1"})
        assert str(req.url) == "https://upload.example/session1" and len(req.content) == 300_000
        return httpx.Response(200, json={"id": "abc123"})

    calls = fake_net(handler)
    assert youtube.upload(clip_file, "Título", "desc #a", ["a"]) == "https://www.youtube.com/shorts/abc123"
    assert len(calls) == 3


def test_youtube_auth_url_has_offline_access():
    connections.update("youtube", client_id="cid", client_secret="sec")
    url = youtube.auth_url("https://x/oauth/youtube/callback", "st")
    assert "access_type=offline" in url and "state=st" in url and "youtube.upload" in url


def test_tiktok_draft_upload(fake_net, clip_file):
    connections.update("tiktok", client_key="ck", client_secret="cs", refresh_token="rt", access_token=None,
                       expires_at="0", mode="draft")

    def handler(req):
        path = req.url.path
        if path.endswith("/oauth/token/"):
            return httpx.Response(200, json={"access_token": "at", "refresh_token": "rt2", "expires_in": 86400})
        if path.endswith("/inbox/video/init/"):
            src = json.loads(req.content)["source_info"]
            assert src["video_size"] == 300_000 and src["total_chunk_count"] == 1
            return httpx.Response(200, json={"data": {"publish_id": "p1", "upload_url": "https://up.tiktok.example/u"},
                                             "error": {"code": "ok"}})
        if req.method == "PUT":
            assert req.headers["content-range"] == "bytes 0-299999/300000"
            return httpx.Response(201)
        if path.endswith("/status/fetch/"):
            return httpx.Response(200, json={"data": {"status": "SEND_TO_USER_INBOX"}, "error": {"code": "ok"}})
        raise AssertionError(path)

    fake_net(handler)
    assert tiktok.upload(clip_file, "texto") == "tiktok://inbox"
    assert connections.get("tiktok")["refresh_token"] == "rt2"


def test_tiktok_error_is_readable(fake_net, clip_file):
    connections.update("tiktok", access_token="at", expires_at=str(int(time.time()) + 999), mode="direct")
    fake_net(lambda req: httpx.Response(200, json={"error": {"code": "spam_risk_too_many_posts",
                                                             "message": "Demasiadas publicaciones"}}))
    with pytest.raises(Exception, match="Demasiadas publicaciones"):
        tiktok.upload(clip_file, "texto")


def test_instagram_and_facebook(fake_net, clip_file):
    connections.update("meta", token="EAAtok", page_id="111", ig_user_id="222", graph_version="v23.0")

    def handler(req):
        p = req.url.path
        if p == "/v23.0/222/media":
            assert b"media_type=REELS" in req.content and b"upload_type=resumable" in req.content
            return httpx.Response(200, json={"id": "c1", "uri": "https://rupload.facebook.com/ig-api-upload/v23.0/c1"})
        if req.url.host == "rupload.facebook.com":
            assert req.headers["authorization"] == "OAuth EAAtok" and req.headers["file_size"] == "300000"
            return httpx.Response(200, json={"success": True})
        if p == "/v23.0/c1":
            return httpx.Response(200, json={"status_code": "FINISHED"})
        if p == "/v23.0/222/media_publish":
            return httpx.Response(200, json={"id": "m1"})
        if p == "/v23.0/m1":
            return httpx.Response(200, json={"permalink": "https://www.instagram.com/reel/xyz/"})
        if p == "/v23.0/111/video_reels":
            if b"upload_phase=start" in req.content:
                return httpx.Response(200, json={"video_id": "v9", "upload_url": "https://rupload.facebook.com/video-upload/v9"})
            assert b"video_state=PUBLISHED" in req.content
            return httpx.Response(200, json={"success": True})
        if p == "/video-upload/v9":
            return httpx.Response(200, json={"success": True})
        raise AssertionError(str(req.url))

    fake_net(handler)
    assert meta.upload_instagram(clip_file, "hola") == "https://www.instagram.com/reel/xyz/"
    assert meta.upload_facebook(clip_file, "hola") == "https://www.facebook.com/reel/v9"


def test_meta_graph_error_message(fake_net, clip_file):
    connections.update("meta", token="EAAtok", page_id="111", ig_user_id="222")
    fake_net(lambda req: httpx.Response(400, json={"error": {"message": "Invalid OAuth access token"}}))
    with pytest.raises(Exception, match="Invalid OAuth access token"):
        meta.upload_instagram(clip_file, "hola")
