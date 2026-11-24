import json
import time

import pytest
from fastapi.testclient import TestClient

import app.jobs as jobs_mod
from app.main import app
from conftest import fake_transcript

H = {"X-Clipia": "1"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def login(c):
    r = c.post("/login", data={"password": "prueba-123"}, follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == "/"


def test_requires_login(client):
    client.cookies.clear()
    assert client.get("/", follow_redirects=False).headers["location"] == "/login"
    assert client.get("/api/jobs").status_code == 401
    r = client.post("/login", data={"password": "mala"}, follow_redirects=False)
    assert r.headers["location"] == "/login?e=1"


def test_rejects_requests_without_header(client):
    login(client)
    r = client.post("/api/jobs", json={"url": "https://youtube.com/watch?v=x"})
    assert r.status_code == 403


def test_rejects_bad_url(client):
    login(client)
    r = client.post("/api/jobs", json={"url": "javascript:alert(1)"}, headers=H)
    assert r.status_code == 400


def test_full_pipeline_with_upload(client, sample_video, monkeypatch):
    login(client)
    monkeypatch.setattr(jobs_mod, "transcribe", lambda *a, **k: fake_transcript(45))
    opts = {"num_clips": 2, "min_seconds": 10, "max_seconds": 15, "layout": "auto", "subtitle_style": "viral"}
    with sample_video.open("rb") as fh:
        r = client.post("/api/jobs/upload", files={"file": ("muestra.mp4", fh, "video/mp4")},
                        data={"options": json.dumps(opts)}, headers=H)
    assert r.status_code == 200, r.text
    job_id = r.json()["id"]

    deadline = time.time() + 240
    while time.time() < deadline:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] in ("done", "error", "cancelled"):
            break
        time.sleep(1)
    assert job["status"] == "done", job
    assert job["used_ai"] is False
    assert len(job["clips"]) == 2
    clip = job["clips"][0]
    assert clip["width"] == 1080 and clip["height"] == 1920
    assert 9.5 <= clip["duration"] <= 16

    v = client.get(f"/media/{job_id}/{clip['video']}")
    assert v.status_code == 200 and v.headers["content-type"] == "video/mp4"
    part = client.get(f"/media/{job_id}/{clip['video']}", headers={"Range": "bytes=0-99"})
    assert part.status_code == 206
    assert client.get(f"/media/{job_id}/job.json").status_code == 404
    assert client.get(f"/media/{job_id}/..%2Fjob.json").status_code == 404
    z = client.get(f"/api/jobs/{job_id}/zip")
    assert z.status_code == 200 and z.content[:2] == b"PK"

    assert client.delete(f"/api/jobs/{job_id}", headers=H).status_code == 200
    assert client.get(f"/api/jobs/{job_id}").status_code == 404


def test_connections_never_leak_secrets(client):
    login(client)
    r = client.post("/api/connections/youtube", json={"client_id": "id-1", "client_secret": "SUPER-SECRETO"}, headers=H)
    assert r.status_code == 200
    data = client.get("/api/connections").json()
    assert data["youtube"]["client_id"] == "id-1"
    assert data["youtube"]["client_secret"] is True
    assert "SUPER-SECRETO" not in client.get("/api/connections").text
    assert data["youtube"]["redirect_uri"].endswith("/oauth/youtube/callback")
    # Guardar con el secreto vacío no lo borra
    client.post("/api/connections/youtube", json={"client_id": "id-2", "client_secret": ""}, headers=H)
    assert client.get("/api/connections").json()["youtube"]["client_secret"] is True


def test_oauth_flow_checks_state(client):
    login(client)
    r = client.get("/connect/youtube", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"].startswith("https://accounts.google.com/")
    bad = client.get("/oauth/youtube/callback?code=x&state=otro", follow_redirects=False)
    assert "connect_error=youtube" in bad.headers["location"]


def test_publish_requires_connected_platform(client, sample_video, monkeypatch):
    login(client)
    monkeypatch.setattr(jobs_mod, "transcribe", lambda *a, **k: fake_transcript(45))
    with sample_video.open("rb") as fh:
        job = client.post("/api/jobs/upload", files={"file": ("m.mp4", fh, "video/mp4")},
                          data={"options": json.dumps({"num_clips": 1, "min_seconds": 10, "max_seconds": 12})},
                          headers=H).json()
    for _ in range(120):
        j = client.get(f"/api/jobs/{job['id']}").json()
        if j["status"] in ("done", "error"):
            break
        time.sleep(1)
    assert j["status"] == "done"
    r = client.post(f"/api/jobs/{job['id']}/clips/1/publish", json={"platforms": ["tiktok"]}, headers=H)
    assert r.status_code == 400 and "Conecta primero" in r.json()["detail"]
    assert client.post(f"/api/jobs/{job['id']}/clips/1/publish", json={"platforms": ["myspace"]}, headers=H).status_code == 400


def test_watchers_api(client):
    login(client)
    r = client.post("/api/watchers", json={"url": "https://www.twitch.tv/prueba"}, headers=H)
    assert r.status_code == 200
    wid = r.json()["id"]
    assert any(w["id"] == wid for w in client.get("/api/watchers").json())
    assert client.post(f"/api/watchers/{wid}/toggle", json={"enabled": False}, headers=H).json()["enabled"] is False
    assert client.delete(f"/api/watchers/{wid}", headers=H).status_code == 200
