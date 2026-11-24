"""Directo simulado: un servidor HLS local que emite en vivo; ClipIA debe grabar por bloques y sacar
clips mientras la emisión sigue, y terminar cuando se le pide."""
import functools
import http.server
import socketserver
import subprocess
import threading
import time

import pytest

import app.jobs as jobs_mod
from app.jobs import JobStore, Worker
from app.models import JobOptions
from conftest import fake_transcript


@pytest.fixture()
def live_stream(tmp_path):
    proc = subprocess.Popen(
        ["ffmpeg", "-loglevel", "error", "-re", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=25",
         "-f", "lavfi", "-i", "sine=frequency=300", "-t", "240", "-c:v", "libx264", "-preset", "ultrafast",
         "-g", "50", "-c:a", "aac", "-f", "hls", "-hls_time", "2", "-hls_list_size", "20",
         "-hls_flags", "delete_segments", str(tmp_path / "stream.m3u8")])
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(tmp_path))
    handler.log_message = lambda *a: None
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    for _ in range(50):
        if (tmp_path / "stream.m3u8").exists():
            break
        time.sleep(0.2)
    time.sleep(4)
    yield f"http://127.0.0.1:{httpd.server_address[1]}/stream.m3u8"
    httpd.shutdown()
    proc.terminate()
    proc.wait(10)


def wait_for(store, job_id, cond, timeout):
    end = time.time() + timeout
    while time.time() < end:
        job = store.get(job_id)
        if cond(job):
            return job
        time.sleep(1)
    raise AssertionError(f"tiempo agotado: {store.get(job_id)}")


def test_live_clips_while_streaming(live_stream, tmp_path, monkeypatch):
    monkeypatch.setattr(jobs_mod, "LIVE_MINUTE", 8)  # bloques de 3×8 = 24 s
    monkeypatch.setattr(jobs_mod, "transcribe", lambda wav, dur, *a, **k: fake_transcript(dur))
    published = []

    class FakePublisher:
        def enqueue(self, job_id, index, platforms, *a):
            published.append((index, tuple(platforms)))

    store = JobStore(tmp_path / "data")
    worker = Worker(store, FakePublisher())
    worker.start()
    opts = JobOptions(min_seconds=8, max_seconds=12, max_live_minutes=30, live_chunk_minutes=3,
                      auto_publish=["tiktok"])
    job = store.create(live_stream, opts)
    worker.submit(job["id"])

    # Mientras sigue al aire ya hay clips
    job = wait_for(store, job["id"], lambda j: j["clips"] or j["status"] in ("error", "done"), 120)
    assert job["status"] == "processing", job
    assert job["is_live"] and job["live"]["recording"]
    first = job["clips"][0]
    assert first["height"] == 1920 and "live_start" in first

    # Esperar a que haya al menos dos bloques analizados y terminar la grabación
    wait_for(store, job["id"], lambda j: (j["live"] or {}).get("blocks_done", 0) >= 2, 120)
    worker.stop_recording.add(job["id"])
    job = wait_for(store, job["id"], lambda j: j["status"] in ("done", "error", "cancelled"), 120)
    assert job["status"] == "done", job
    assert job["live"]["ended"] == "detenido por ti"
    assert len(job["clips"]) >= 2
    # Los clips no se pisan entre sí
    spans = sorted((c["live_start"], c["live_end"]) for c in job["clips"])
    for (a1, b1), (a2, b2) in zip(spans, spans[1:]):
        assert a2 >= b1 - 1.5
    # Cada clip se mandó a publicar automáticamente
    assert sorted(i for i, _ in published) == [c["index"] for c in job["clips"]]
    assert all(p == ("tiktok",) for _, p in published)
