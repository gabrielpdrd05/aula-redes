"""Grabación de un directo en bloques de N minutos mientras sigue al aire.

Cada bloque terminado queda listo para analizarse aunque el directo continúe.
Si la señal se corta, se vuelve a conectar (hasta 5 veces) mientras el directo siga en vivo.
"""
import subprocess
import threading
import time
from pathlib import Path

from .download import fetch_info
from .media import probe


def _stream_url(info: dict) -> tuple[str | None, str]:
    url = info.get("url")
    if not url and info.get("requested_formats"):
        url = info["requested_formats"][0].get("url")
    headers = "".join(f"{k}: {v}\r\n" for k, v in (info.get("http_headers") or {}).items())
    return url, headers


class LiveRecorder(threading.Thread):
    def __init__(self, page_url: str, info: dict, out_dir: Path, max_seconds: int, chunk_seconds: int,
                 cookies: str | None) -> None:
        super().__init__(daemon=True, name="clipia-live")
        self.page_url, self.info, self.cookies = page_url, info, cookies
        self.dir = out_dir / "live"
        self.dir.mkdir(parents=True, exist_ok=True)
        self.max_seconds, self.chunk_seconds = max_seconds, chunk_seconds
        self.segments: list[dict] = []  # {path, start, duration} con tiempos desde el inicio de la grabación
        self.recorded = 0.0
        self.finished = False
        self.error: str | None = None
        self.ended_reason = ""
        self._stop = threading.Event()
        self._proc: subprocess.Popen | None = None
        self._lock = threading.Lock()
        self._next_number = 0

    # --- API para el procesador ---
    def stop(self) -> None:
        self._stop.set()
        proc = self._proc
        if proc and proc.poll() is None:
            proc.terminate()

    def completed(self) -> list[dict]:
        with self._lock:
            return list(self.segments)

    # --- Interno ---
    def _add_segment(self, path: Path) -> None:
        with self._lock:
            if any(s["path"] == path for s in self.segments):
                return
        try:
            dur = probe(path)["duration"]
        except Exception:  # noqa: BLE001  (bloque vacío o dañado: se ignora)
            return
        if dur < 1:
            return
        with self._lock:
            start = self.segments[-1]["start"] + self.segments[-1]["duration"] if self.segments else 0.0
            self.segments.append({"path": path, "start": start, "duration": dur})

    def _read_list(self, list_file: Path, session_files: list[Path]) -> None:
        if not list_file.exists():
            return
        for line in list_file.read_text().splitlines():
            name = line.split(",")[0].strip()
            if name:
                p = self.dir / name
                if p not in session_files:
                    session_files.append(p)
                    self._add_segment(p)

    def run(self) -> None:
        reconnects = 0
        info = self.info
        session = 0
        try:
            while not self._stop.is_set():
                remaining = self.max_seconds - self.recorded
                if remaining < 5:
                    self.ended_reason = "límite de tiempo"
                    break
                url, headers = _stream_url(info)
                if not url:
                    self.error = "No se encontró la señal del directo."
                    break
                base = self.recorded
                list_file = self.dir / f"session_{session}.csv"
                cmd = ["ffmpeg", "-y", "-loglevel", "error", "-nostdin", "-nostats", "-progress", "pipe:1"]
                if headers:
                    cmd += ["-headers", headers]
                cmd += ["-i", url, "-map", "0:v:0?", "-map", "0:a:0?", "-c", "copy", "-t", f"{remaining:.0f}",
                        "-f", "segment", "-segment_time", str(self.chunk_seconds), "-segment_format", "matroska",
                        "-reset_timestamps", "1", "-segment_start_number", str(self._next_number),
                        "-segment_list", str(list_file), "-segment_list_type", "csv",
                        str(self.dir / "chunk_%05d.mkv")]
                self._proc = subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                              stderr=subprocess.PIPE, text=True)
                err: list[str] = []
                threading.Thread(target=lambda p=self._proc: err.extend(p.stderr), daemon=True).start()
                session_files: list[Path] = []
                for line in self._proc.stdout:
                    if line.startswith("out_time_us="):
                        try:
                            self.recorded = base + max(0, int(line.split("=")[1])) / 1e6
                        except ValueError:
                            pass
                    elif line.startswith("progress="):
                        self._read_list(list_file, session_files)
                self._proc.wait()
                time.sleep(0.5)
                self._read_list(list_file, session_files)
                self._next_number += len(session_files)
                with self._lock:
                    self.recorded = max(self.recorded, sum(s["duration"] for s in self.segments))
                session += 1

                if self._stop.is_set():
                    self.ended_reason = "detenido por ti"
                    break
                if self.recorded >= self.max_seconds - 5:
                    self.ended_reason = "límite de tiempo"
                    break
                # ¿Terminó el directo o se cayó la conexión?
                try:
                    info = fetch_info(self.page_url, self.cookies)
                except Exception:  # noqa: BLE001
                    info = {}
                if info.get("is_live") and reconnects < 5:
                    reconnects += 1
                    time.sleep(3)
                    continue
                self.ended_reason = "el directo terminó"
                if not self.segments:
                    self.error = "No se pudo grabar el directo. " + " | ".join(x.strip() for x in err[-3:])
                break
        except Exception as exc:  # noqa: BLE001
            self.error = f"Falló la grabación: {exc}"
        finally:
            self.finished = True
