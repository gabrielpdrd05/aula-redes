"""Cola de publicaciones: sube los clips en segundo plano y guarda el resultado en el trabajo."""
import queue
import threading
import time
import traceback

from .. import connections
from . import PLATFORMS, PublishError, meta, tiktok, youtube


def platform_ready(p: str) -> bool:
    if p in ("instagram", "facebook"):
        c = connections.get("meta")
        return bool(c["token"] and (c["ig_user_id"] if p == "instagram" else c["page_id"]))
    return connections.connected(p)


def available() -> dict:
    return {p: platform_ready(p) for p in PLATFORMS}


def caption_for(clip: dict, text: str | None = None) -> str:
    if text is not None:
        return text.strip()
    tags = " ".join("#" + h for h in clip.get("hashtags", []))
    return "\n\n".join(x for x in [clip.get("caption", ""), tags] if x).strip()


class Publisher(threading.Thread):
    def __init__(self, store) -> None:
        super().__init__(daemon=True, name="clipia-publisher")
        self.store = store
        self.q: "queue.Queue[tuple]" = queue.Queue()

    def _set(self, job_id: str, index: int, platform: str, **state) -> None:
        def fn(job):
            for c in job["clips"]:
                if c["index"] == index:
                    c.setdefault("published", {})[platform] = {**c.get("published", {}).get(platform, {}), **state}
        self.store.mutate(job_id, fn)

    def enqueue(self, job_id: str, index: int, platforms: list[str], title: str | None = None,
                caption: str | None = None) -> list[str]:
        accepted = []
        for p in platforms:
            if p in PLATFORMS and platform_ready(p):
                self._set(job_id, index, p, status="queued", url=None, error=None, at=time.time())
                self.q.put((job_id, index, p, title, caption))
                accepted.append(p)
        return accepted

    def resume_pending(self) -> None:
        for job in self.store.list():
            for c in job.get("clips", []):
                for p, st in (c.get("published") or {}).items():
                    if st.get("status") in ("queued", "uploading"):
                        self.q.put((job["id"], c["index"], p, None, None))

    def run(self) -> None:
        while True:
            job_id, index, platform, title, text = self.q.get()
            job = self.store.get(job_id)
            clip = next((c for c in (job or {}).get("clips", []) if c["index"] == index), None)
            if not clip:
                continue
            path = self.store.dir(job_id) / clip["video"]
            self._set(job_id, index, platform, status="uploading", error=None)
            try:
                title = (title or clip.get("title") or "Clip").strip()
                caption = caption_for(clip, text)
                if platform == "youtube":
                    url = youtube.upload(path, title, caption, clip.get("hashtags", []))
                elif platform == "tiktok":
                    url = tiktok.upload(path, f"{title}\n\n{caption}" if caption else title)
                elif platform == "instagram":
                    url = meta.upload_instagram(path, f"{title}\n\n{caption}" if caption else title)
                else:
                    url = meta.upload_facebook(path, f"{title}\n\n{caption}" if caption else title)
                self._set(job_id, index, platform, status="done", url=url, at=time.time())
            except PublishError as exc:
                self._set(job_id, index, platform, status="error", error=str(exc), at=time.time())
            except Exception as exc:  # noqa: BLE001
                traceback.print_exc()
                self._set(job_id, index, platform, status="error", error=f"Error inesperado: {exc}", at=time.time())
