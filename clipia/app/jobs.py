"""Almacén de trabajos (archivos JSON) y trabajador en segundo plano que los procesa en orden."""
import json
import queue
import re
import shutil
import threading
import time
import traceback
import uuid
from pathlib import Path

from .config import settings
from .models import JobOptions
from .pipeline import Cancelled, PipelineError
from .pipeline.download import download_source
from .pipeline.highlights import normalize_clips, pick_heuristic, pick_with_claude
from .pipeline.media import extract_audio, probe
from .pipeline.render import render_clip
from .pipeline.transcribe import transcribe

JOB_ID = re.compile(r"^[a-f0-9]{12}$")
FINISHED = {"done", "error", "cancelled"}

# Peso de cada etapa en la barra de progreso total
STAGES = {"download": (0, 25), "transcribe": (25, 60), "analyze": (60, 66), "render": (66, 100)}


class JobStore:
    def __init__(self, root: Path) -> None:
        self.root = root / "jobs"
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()

    def dir(self, job_id: str) -> Path:
        if not JOB_ID.match(job_id):
            raise KeyError(job_id)
        return self.root / job_id

    def create(self, url: str, options: JobOptions, source_name: str | None = None) -> dict:
        job_id = uuid.uuid4().hex[:12]
        self.dir(job_id).mkdir(parents=True)
        job = {
            "id": job_id, "url": url, "source_name": source_name, "options": options.model_dump(),
            "status": "queued", "stage": "queued", "progress": 0, "message": "En cola…",
            "title": source_name or url, "is_live": False, "duration": None, "clips": [],
            "error": None, "used_ai": None, "created": time.time(), "finished": None,
        }
        self._save(job)
        return job

    def _save(self, job: dict) -> None:
        path = self.dir(job["id"]) / "job.json"
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(job, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(path)

    def get(self, job_id: str) -> dict | None:
        try:
            path = self.dir(job_id) / "job.json"
        except KeyError:
            return None
        with self._lock:
            if not path.exists():
                return None
            return json.loads(path.read_text(encoding="utf-8"))

    def update(self, job_id: str, **fields) -> dict | None:
        with self._lock:
            job = self.get(job_id)
            if job is None:
                return None
            job.update(fields)
            self._save(job)
            return job

    def list(self) -> list[dict]:
        jobs = []
        for p in self.root.glob("*/job.json"):
            try:
                jobs.append(json.loads(p.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError):
                continue
        return sorted(jobs, key=lambda j: j["created"], reverse=True)

    def delete(self, job_id: str) -> None:
        shutil.rmtree(self.dir(job_id), ignore_errors=True)


class Worker(threading.Thread):
    def __init__(self, store: JobStore) -> None:
        super().__init__(daemon=True, name="clipia-worker")
        self.store = store
        self.q: "queue.Queue[str]" = queue.Queue()
        self.cancelled: set[str] = set()
        self.stop_recording: set[str] = set()

    def resume_pending(self) -> None:
        for job in sorted(self.store.list(), key=lambda j: j["created"]):
            if job["status"] not in FINISHED:
                self.store.update(job["id"], status="queued", stage="queued", progress=0,
                                  message="En cola (se reinició el servidor)…")
                self.q.put(job["id"])

    def submit(self, job_id: str) -> None:
        self.q.put(job_id)

    def cancel(self, job_id: str) -> None:
        self.cancelled.add(job_id)
        job = self.store.get(job_id)
        if job and job["status"] == "queued":
            self.store.update(job_id, status="cancelled", message="Cancelado", finished=time.time())

    def run(self) -> None:
        while True:
            job_id = self.q.get()
            job = self.store.get(job_id)
            if not job or job["status"] in FINISHED:
                continue
            try:
                self.process(job)
            except Cancelled:
                self.store.update(job_id, status="cancelled", message="Cancelado", finished=time.time())
            except PipelineError as exc:
                self.store.update(job_id, status="error", error=str(exc), message=str(exc), finished=time.time())
            except Exception as exc:  # noqa: BLE001
                traceback.print_exc()
                self.store.update(job_id, status="error", error=f"Error inesperado: {exc}",
                                  message="Error inesperado", finished=time.time())
            finally:
                self.cancelled.discard(job_id)
                self.stop_recording.discard(job_id)

    # --- El proceso completo de un trabajo ---
    def process(self, job: dict) -> None:
        job_id = job["id"]
        opts = JobOptions(**job["options"])
        work = self.store.dir(job_id)
        cancelled = lambda: job_id in self.cancelled  # noqa: E731

        def progress(stage: str, frac: float, msg: str) -> None:
            lo, hi = STAGES[stage]
            self.store.update(job_id, status="processing", stage=stage,
                              progress=round(lo + (hi - lo) * max(0.0, min(frac, 1.0)), 1), message=msg)

        # 1) Conseguir el video
        if job.get("source_name"):
            src = next(work.glob("source.*"))
            progress("download", 1, "Archivo recibido")
        else:
            src, title, is_live = download_source(
                job["url"], work, settings.cookies_file, opts.max_live_minutes * 60,
                lambda f, m: progress("download", f, m), cancelled, lambda: job_id in self.stop_recording,
            )
            self.store.update(job_id, title=title, is_live=is_live)
        info = probe(src)
        self.store.update(job_id, duration=round(info["duration"], 1))
        if info["duration"] < 6:
            raise PipelineError("El video es demasiado corto para sacar clips.")

        # 2) Transcribir
        wav = work / "audio.wav"
        if info["has_audio"]:
            progress("transcribe", 0, "Extrayendo audio…")
            extract_audio(src, wav)
            transcript = transcribe(wav, info["duration"], opts.language, settings.whisper_model,
                                    settings.whisper_device, lambda f, m: progress("transcribe", f, m), cancelled)
        else:
            transcript = {"language": None, "segments": []}
        (work / "transcript.json").write_text(json.dumps(transcript, ensure_ascii=False), encoding="utf-8")

        # 3) Elegir los mejores momentos
        if cancelled():
            raise Cancelled()
        job = self.store.get(job_id)
        use_ai = bool(settings.anthropic_key) and bool(transcript["segments"])
        progress("analyze", 0.1, "La IA está buscando los mejores momentos…" if use_ai else "Buscando los mejores momentos (modo básico)…")
        if use_ai:
            raw = pick_with_claude(transcript, info["duration"], opts, job["title"], settings.anthropic_key, settings.claude_model)
        elif info["has_audio"]:
            raw = pick_heuristic(transcript, wav, info["duration"], opts)
        else:
            raise PipelineError("El video no tiene audio; no hay forma de encontrar los momentos.")
        clips = normalize_clips(raw, transcript, info["duration"], opts)
        if not clips:
            raise PipelineError("No se encontraron momentos que sirvan como clip.")
        self.store.update(job_id, used_ai=use_ai)

        # 4) Editar y exportar cada clip
        words = [w for s in transcript["segments"] for w in s["words"]]
        done = []
        for i, clip in enumerate(clips, start=1):
            if cancelled():
                raise Cancelled()
            progress("render", (i - 1) / len(clips), f"Editando clip {i} de {len(clips)}…")
            done.append(render_clip(src, info, clip, words, work, i, opts, settings.font, settings.fonts_dir))
            self.store.update(job_id, clips=done)

        if not settings.keep_source:
            for p in [src, wav]:
                p.unlink(missing_ok=True)
        self.store.update(job_id, status="done", stage="done", progress=100,
                          message=f"¡Listo! {len(done)} clips", finished=time.time())
