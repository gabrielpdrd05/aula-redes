import json
import subprocess
from pathlib import Path

from . import PipelineError


def run(cmd: list[str], cwd: Path | None = None) -> None:
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if proc.returncode != 0:
        tail = (proc.stderr or "").strip().splitlines()[-8:]
        raise PipelineError("ffmpeg falló: " + " | ".join(tail))


def probe(path: Path) -> dict:
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise PipelineError("No se pudo leer el video (¿archivo dañado o formato raro?).")
    data = json.loads(proc.stdout)
    video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    audio = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    if not video:
        raise PipelineError("El archivo no tiene pista de video.")
    duration = float(data.get("format", {}).get("duration") or video.get("duration") or 0)
    w, h = int(video["width"]), int(video["height"])
    rotation = 0
    for sd in video.get("side_data_list", []) or []:
        if "rotation" in sd:
            rotation = abs(int(sd["rotation"]))
    if rotation in (90, 270):
        w, h = h, w
    return {"duration": duration, "width": w, "height": h, "has_audio": audio is not None}


def extract_audio(src: Path, wav: Path) -> None:
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000",
         "-c:a", "pcm_s16le", str(wav)])
