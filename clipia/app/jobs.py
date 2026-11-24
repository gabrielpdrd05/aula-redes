"""Almacén de trabajos (archivos JSON) y trabajadores en segundo plano.

- Videos normales: se procesan de uno en uno en una cola.
- Directos en vivo: cada uno tiene su propio hilo, así graban y sacan clips sin bloquear la cola.
"""
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
from .pipeline.download import download_source, fetch_info
from .pipeline.highlights import normalize_clips, pick_heuristic, pick_with_claude
from .pipeline.live import LiveRecorder
from .pipeline.media import extract_audio, probe, run
from .pipeline.render import render_clip
from .pipeline.transcribe import transcribe

JOB_ID = re.compile(r"^[a-f0-9]{12}$")
FINISHED = {"done", "error", "cancelled"}
LIVE_MINUTE = 60  # segundos por "minuto" de las opciones de directo (las pruebas lo acortan)
LIVE_OVERLAP = 90  # segundos del bloque anterior que se vuelven a mirar para no cortar momentos en el borde

# Peso de cada etapa en la barra de progreso total (videos normales)
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

    def create(self, url: str, options: JobOptions, source_name: str | None = None, watcher: str | None = None) -> dict:
        job_id = uuid.uuid4().hex[:12]
        self.dir(job_id).mkdir(parents=True)
        job = {
            "id": job_id, "url": url, "source_name": source_name, "options": options.model_dump(),
            "status": "queued", "stage": "queued", "progress": 0, "message": "En cola…",
            "title": source_name or url, "is_live": False, "live": None, "duration": None, "clips": [],
            "error": None, "used_ai": None, "created": time.time(), "finished": None, "watcher": watcher,
        }
        with self._lock:
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

    def mutate(self, job_id: str, fn) -> dict | None:
        """Cambia el trabajo dentro del candado (varios hilos escriben a la vez)."""
        with self._lock:
            job = self.get(job_id)
            if job is None:
                return None
            fn(job)
            self._save(job)
            return job

    def update(self, job_id: str, **fields) -> dict | None:
        return self.mutate(job_id, lambda j: j.update(fields))

    def list(self) -> list[dict]:
        jobs = []
        for p in self.root.glob("*/job.json"):
            try:
                jobs.append(json.loads(p.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError):
                continue
        return sorted(jobs, key=lambda j: j["created"], reverse=True)

    def delete(self, job_id: str) -> None:
        with self._lock:
            shutil.rmtree(self.dir(job_id), ignore_errors=True)


def _fmt(sec: float) -> str:
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


class Worker(threading.Thread):
    def __init__(self, store: JobStore, publisher=None) -> None:
        super().__init__(daemon=True, name="clipia-worker")
        self.store = store
        self.publisher = publisher
        self.q: "queue.Queue[str]" = queue.Queue()
        self.cancelled: set[str] = set()
        self.stop_recording: set[str] = set()
        self.live_threads: dict[str, threading.Thread] = {}

    def resume_pending(self) -> None:
        for job in sorted(self.store.list(), key=lambda j: j["created"]):
            if job["status"] not in FINISHED:
                if job.get("is_live") and job.get("clips"):
                    # Un directo a medias: nos quedamos con lo que ya salió.
                    self.store.update(job["id"], status="done", stage="done", progress=100, finished=time.time(),
                                      message=f"Se reinició el servidor durante el directo · {len(job['clips'])} clips")
                    continue
                self.store.update(job["id"], status="queued", stage="queued", progress=0, clips=[],
                                  message="En cola (se reinició el servidor)…")
                self.q.put(job["id"])

    def submit(self, job_id: str) -> None:
        self.q.put(job_id)

    def cancel(self, job_id: str) -> None:
        self.cancelled.add(job_id)
        job = self.store.get(job_id)
        if job and job["status"] == "queued":
            self.store.update(job_id, status="cancelled", message="Cancelado", finished=time.time())

    def active_live_jobs(self) -> list[str]:
        return [k for k, t in self.live_threads.items() if t.is_alive()]

    def run(self) -> None:
        while True:
            job_id = self.q.get()
            job = self.store.get(job_id)
            if not job or job["status"] in FINISHED:
                continue
            self._guard(job_id, lambda: self.process(job))

    def _guard(self, job_id: str, fn) -> None:
        try:
            fn()
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

    # --- Pasos compartidos ---
    def _add_clip(self, job_id: str, clip: dict, opts: JobOptions) -> None:
        self.store.mutate(job_id, lambda j: j["clips"].append(clip))
        if opts.auto_publish and self.publisher:
            self.publisher.enqueue(job_id, clip["index"], opts.auto_publish)

    def _choose(self, transcript, wav, duration, opts, title, live=None, avoid=None, limit=None):
        use_ai = bool(settings.anthropic_key) and bool(transcript["segments"])
        if use_ai:
            raw = pick_with_claude(transcript, duration, opts, title, settings.anthropic_key, settings.claude_model, live)
        elif wav is not None and wav.exists():
            raw = pick_heuristic(transcript, wav, duration, opts, wanted=1 if live else None,
                                 min_end=live["min_end"] if live else 0.0)
        else:
            return [], use_ai
        clips = normalize_clips(raw, transcript, duration, opts, min_end=live["min_end"] if live else 0.0,
                                avoid=avoid, limit=limit)
        return clips, use_ai

    # --- Video normal ---
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
            progress("download", 0, "Leyendo el enlace…")
            info = fetch_info(job["url"], settings.cookies_file)
            if info.get("is_live"):
                # Los directos van en su propio hilo para no bloquear la cola.
                t = threading.Thread(target=self._guard, args=(job_id, lambda: self.process_live(job, info)),
                                     daemon=True, name=f"live-{job_id}")
                self.live_threads[job_id] = t
                t.start()
                return
            src, title = download_source(job["url"], work, settings.cookies_file,
                                         lambda f, m: progress("download", f, m), cancelled, info=info)
            self.store.update(job_id, title=title)
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
        title = self.store.get(job_id)["title"]
        ai = bool(settings.anthropic_key) and bool(transcript["segments"])
        progress("analyze", 0.1, "La IA está buscando los mejores momentos…" if ai else "Buscando los mejores momentos (modo básico)…")
        if not info["has_audio"]:
            raise PipelineError("El video no tiene audio; no hay forma de encontrar los momentos.")
        clips, used_ai = self._choose(transcript, wav, info["duration"], opts, title)
        if not clips:
            raise PipelineError("No se encontraron momentos que sirvan como clip.")
        self.store.update(job_id, used_ai=used_ai)

        # 4) Editar y exportar cada clip
        words = [w for s in transcript["segments"] for w in s["words"]]
        for i, clip in enumerate(clips, start=1):
            if cancelled():
                raise Cancelled()
            progress("render", (i - 1) / len(clips), f"Editando clip {i} de {len(clips)}…")
            self._add_clip(job_id, render_clip(src, info, clip, words, work, i, opts, settings.font, settings.fonts_dir), opts)

        if not settings.keep_source:
            for p in [src, wav]:
                p.unlink(missing_ok=True)
        n = len(self.store.get(job_id)["clips"])
        self.store.update(job_id, status="done", stage="done", progress=100, message=f"¡Listo! {n} clips",
                          finished=time.time())

    # --- Directo en vivo ---
    def process_live(self, job: dict, info: dict) -> None:
        job_id = job["id"]
        opts = JobOptions(**job["options"])
        work = self.store.dir(job_id)
        max_seconds = min(opts.max_live_minutes, settings.max_live_minutes) * LIVE_MINUTE
        chunk = opts.live_chunk_minutes * LIVE_MINUTE
        title = info.get("title") or "Directo"
        self.store.update(job_id, title=title, is_live=True, status="processing", stage="live",
                          live={"recording": True, "recorded": 0, "max": max_seconds, "blocks_done": 0,
                                "analyzing": False, "ended": None})
        rec = LiveRecorder(info.get("webpage_url") or job["url"], info, work, max_seconds, chunk, settings.cookies_file)
        rec.start()
        state = {"analyzing": "", "prev": None, "used_ai": None}

        def status(extra: str = "") -> None:
            n = len(self.store.get(job_id)["clips"])
            head = (f"🔴 Grabando {_fmt(rec.recorded)}" if not rec.finished else f"Grabación terminada ({rec.ended_reason})")
            msg = " · ".join(x for x in [head, f"{n} clips", extra or state["analyzing"]] if x)
            self.store.update(job_id, message=msg, duration=round(rec.recorded, 1),
                              progress=round(min(99.0, rec.recorded / max_seconds * 100), 1),
                              live={"recording": not rec.finished, "recorded": round(rec.recorded, 1), "max": max_seconds,
                                    "blocks_done": done, "analyzing": bool(state["analyzing"]),
                                    "ended": rec.ended_reason or None})

        done = 0
        try:
            while True:
                if job_id in self.cancelled:
                    rec.stop()
                    rec.join(20)
                    raise Cancelled()
                if job_id in self.stop_recording:
                    rec.stop()
                segs = rec.completed()
                if done < len(segs):
                    self._live_block(job_id, opts, title, segs, done, state, status)
                    done += 1
                    state["analyzing"] = ""
                    status()
                    continue
                if rec.finished:
                    break
                status()
                time.sleep(2)
        finally:
            rec.stop()

        if rec.error and not rec.segments:
            raise PipelineError(rec.error)
        if not settings.keep_source:
            shutil.rmtree(work / "live", ignore_errors=True)
        n = len(self.store.get(job_id)["clips"])
        self.store.update(job_id, status="done", stage="done", progress=100, used_ai=state["used_ai"],
                          message=f"Directo terminado ({rec.ended_reason}) · {n} clips", finished=time.time(),
                          live={"recording": False, "recorded": round(rec.recorded, 1), "max": max_seconds,
                                "blocks_done": done, "analyzing": False, "ended": rec.ended_reason})

    def _live_block(self, job_id, opts, title, segs, i, state, status) -> None:
        seg = segs[i]
        work = self.store.dir(job_id)
        cancelled = lambda: job_id in self.cancelled  # noqa: E731
        label = f"Analizando {_fmt(seg['start'])}–{_fmt(seg['start'] + seg['duration'])}"
        state["analyzing"] = label + "…"
        status()
        seg_info = probe(seg["path"])
        if not seg_info["has_audio"]:
            return
        wav = work / f"block_{i}.wav"
        extract_audio(seg["path"], wav)
        tr = transcribe(wav, seg["duration"], opts.language, settings.whisper_model, settings.whisper_device,
                        lambda f, m: None, cancelled)

        prev = state["prev"]  # (seg, transcript) del bloque anterior
        if prev:
            pseg, ptr = prev
            pdur = pseg["duration"]
            window = work / "window.mkv"
            lst = work / "window.txt"
            lst.write_text(f"file '{pseg['path'].as_posix()}'\nfile '{seg['path'].as_posix()}'\n")
            run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
                 str(window)])
            tail = [s for s in ptr["segments"] if s["end"] > pdur - LIVE_OVERLAP]
            shifted = [{**s, "start": s["start"] + pdur, "end": s["end"] + pdur,
                        "words": [{**w, "start": w["start"] + pdur, "end": w["end"] + pdur} for w in s["words"]]}
                       for s in tr["segments"]]
            wtr = {"language": tr["language"], "segments": tail + shifted}
            offset, min_end, src = pseg["start"], pdur, window
        else:
            wtr, offset, min_end, src = tr, seg["start"], 0.0, seg["path"]
        src_info = probe(src)

        job = self.store.get(job_id)
        avoid = [(c["live_start"] - offset, c["live_end"] - offset) for c in job["clips"] if "live_start" in c]
        remaining = (opts.num_clips - len(job["clips"])) if opts.num_clips else None
        if remaining is not None and remaining <= 0:
            state["prev"] = (seg, tr)
            return
        heur_wav = None
        if not (settings.anthropic_key and wtr["segments"]):
            heur_wav = work / "window.wav"
            extract_audio(src, heur_wav)
        state["analyzing"] = "La IA está buscando momentos…"
        status()
        clips, used_ai = self._choose(wtr, heur_wav, src_info["duration"], opts, title,
                                      live={"min_end": min_end, "minutes": opts.live_chunk_minutes},
                                      avoid=avoid, limit=remaining)
        state["used_ai"] = used_ai
        words = [w for s in wtr["segments"] for w in s["words"]]
        for clip in clips:
            if cancelled():
                raise Cancelled()
            index = len(self.store.get(job_id)["clips"]) + 1
            state["analyzing"] = f"Editando clip {index}…"
            status()
            out = render_clip(src, src_info, clip, words, work, index, opts, settings.font, settings.fonts_dir)
            out.update(live_start=round(clip["start"] + offset, 2), live_end=round(clip["end"] + offset, 2))
            self._add_clip(job_id, out, opts)

        for p in [wav, heur_wav, work / "window.mkv", work / "window.txt"]:
            if p:
                Path(p).unlink(missing_ok=True)
        if prev and not settings.keep_source:
            prev[0]["path"].unlink(missing_ok=True)
        state["prev"] = (seg, tr)
