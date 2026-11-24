import app.watchers as w_mod
from app.jobs import JobStore
from app.models import JobOptions
from app.watchers import Watchers, normalize_channel_url


def test_normalize_channel_url():
    assert normalize_channel_url("https://www.youtube.com/@micanal") == "https://www.youtube.com/@micanal/live"
    assert normalize_channel_url("https://www.tiktok.com/@yo/") == "https://www.tiktok.com/@yo/live"
    assert normalize_channel_url("https://www.twitch.tv/yo") == "https://www.twitch.tv/yo"


def test_watcher_starts_job_once_per_live(tmp_path, monkeypatch):
    monkeypatch.setattr(w_mod.settings, "data_dir", tmp_path)
    store = JobStore(tmp_path)
    submitted = []

    class FakeWorker:
        def submit(self, job_id):
            submitted.append(job_id)

    ws = Watchers(store, FakeWorker())
    w = ws.add("https://www.twitch.tv/yo", JobOptions(live_chunk_minutes=5))
    state = {"live": False}

    def fake_fetch(url, cookies):
        if not state["live"]:
            raise RuntimeError("The channel is not currently live")
        return {"is_live": True, "id": "live-1", "webpage_url": "https://www.twitch.tv/yo", "uploader": "Yo"}

    ws.fetch = fake_fetch
    ws.check(ws.all()[0])
    assert ws.all()[0]["status"] == "sin directo" and not submitted

    state["live"] = True
    ws.check(ws.all()[0])
    assert len(submitted) == 1 and ws.all()[0]["status"] == "en vivo"
    job = store.get(submitted[0])
    assert job["options"]["live_chunk_minutes"] == 5 and job["watcher"] == w["id"]

    # Mientras el trabajo sigue activo, no se crea otro
    ws.check(ws.all()[0])
    assert len(submitted) == 1
    # Termina el trabajo pero el directo (mismo id) sigue: no se repite
    store.update(job["id"], status="done")
    ws.check(ws.all()[0])
    assert len(submitted) == 1
    # Nuevo directo otro día: arranca de nuevo
    ws.fetch = lambda url, c: {"is_live": True, "id": "live-2", "webpage_url": "https://www.twitch.tv/yo"}
    ws.check(ws.all()[0])
    assert len(submitted) == 2
