"""Vigilancia de canales: cuando el canal empieza un directo, arranca un trabajo automáticamente."""
import json
import random
import re
import threading
import time
import uuid

from .config import settings
from .models import JobOptions
from .pipeline.download import fetch_info

CHECK_EVERY = 180  # segundos entre comprobaciones de cada canal


def normalize_channel_url(url: str) -> str:
    """Convierte la dirección de un canal en la dirección de "su directo actual"."""
    url = url.strip().rstrip("/")
    if re.search(r"youtube\.com/(@[^/]+|channel/[^/]+|c/[^/]+|user/[^/]+)$", url):
        return url + "/live"
    if re.search(r"tiktok\.com/@[^/]+$", url):
        return url + "/live"
    return url


class Watchers(threading.Thread):
    def __init__(self, store, worker) -> None:
        super().__init__(daemon=True, name="clipia-watchers")
        self.store, self.worker = store, worker
        self.path = settings.data_dir / "watchers.json"
        self._lock = threading.RLock()
        self._wake = threading.Event()
        self.fetch = fetch_info  # reemplazable en pruebas

    # --- Persistencia ---
    def all(self) -> list[dict]:
        with self._lock:
            if not self.path.exists():
                return []
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                return []

    def _save(self, items: list[dict]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(self.path)

    def _edit(self, wid: str, **fields) -> dict | None:
        with self._lock:
            items = self.all()
            for w in items:
                if w["id"] == wid:
                    w.update(fields)
                    self._save(items)
                    return w
        return None

    def add(self, url: str, options: JobOptions) -> dict:
        w = {"id": uuid.uuid4().hex[:10], "url": url.strip(), "check_url": normalize_channel_url(url),
             "enabled": True, "options": options.model_dump(), "status": "pendiente", "name": None,
             "last_check": None, "live_id": None, "job_id": None, "error": None, "created": time.time()}
        with self._lock:
            items = self.all()
            items.append(w)
            self._save(items)
        self._wake.set()
        return w

    def remove(self, wid: str) -> None:
        with self._lock:
            self._save([w for w in self.all() if w["id"] != wid])

    def set_enabled(self, wid: str, enabled: bool) -> dict | None:
        w = self._edit(wid, enabled=enabled, status="pendiente" if enabled else "en pausa")
        self._wake.set()
        return w

    # --- Bucle ---
    def check(self, w: dict) -> None:
        """Comprueba un canal una vez."""
        if w.get("job_id"):
            job = self.store.get(w["job_id"])
            if job and job["status"] not in ("done", "error", "cancelled"):
                self._edit(w["id"], status="en vivo", last_check=time.time())
                return
            self._edit(w["id"], job_id=None)
        try:
            info = self.fetch(w["check_url"], settings.cookies_file)
        except Exception:  # noqa: BLE001  (sin directo, la plataforma responde con error)
            self._edit(w["id"], status="sin directo", last_check=time.time(), error=None)
            return
        name = info.get("uploader") or info.get("channel") or info.get("uploader_id")
        if not info.get("is_live"):
            self._edit(w["id"], status="sin directo", name=name or w.get("name"), last_check=time.time(), error=None)
            return
        live_id = str(info.get("id") or info.get("webpage_url"))
        if live_id == w.get("live_id"):  # este directo ya se procesó (o lo cancelaste)
            self._edit(w["id"], status="en vivo (ya procesado)", name=name, last_check=time.time())
            return
        job = self.store.create(info.get("webpage_url") or w["check_url"], JobOptions(**w["options"]), watcher=w["id"])
        self.worker.submit(job["id"])
        self._edit(w["id"], status="en vivo", name=name, live_id=live_id, job_id=job["id"], last_check=time.time())

    def run(self) -> None:
        while True:
            for w in self.all():
                if not w["enabled"]:
                    continue
                if w["last_check"] and time.time() - w["last_check"] < CHECK_EVERY:
                    continue
                try:
                    self.check(w)
                except Exception as exc:  # noqa: BLE001
                    self._edit(w["id"], status="error", error=str(exc)[:200], last_check=time.time())
            self._wake.wait(20 + random.random() * 10)
            self._wake.clear()
