"""Transcripción con marcas de tiempo por palabra (faster-whisper, local y gratis)."""
import threading
from pathlib import Path
from typing import Callable

from . import Cancelled

_models: dict = {}
_lock = threading.Lock()


def _resolve_device(device: str) -> tuple[str, str]:
    if device == "auto":
        try:
            import ctranslate2
            device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        except Exception:
            device = "cpu"
    return device, ("float16" if device == "cuda" else "int8")


def get_model(name: str, device: str):
    from faster_whisper import WhisperModel

    dev, compute = _resolve_device(device)
    key = (name, dev)
    with _lock:
        if key not in _models:
            _models[key] = WhisperModel(name, device=dev, compute_type=compute)
        return _models[key]


def transcribe(
    wav: Path,
    duration: float,
    language: str,
    model_name: str,
    device: str,
    on_progress: Callable[[float, str], None],
    should_cancel: Callable[[], bool],
) -> dict:
    on_progress(0.0, "Cargando el modelo de voz (la primera vez tarda un poco)…")
    model = get_model(model_name, device)
    segments, info = model.transcribe(
        str(wav),
        language=None if language in ("", "auto") else language,
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
        condition_on_previous_text=False,
    )
    out = []
    for seg in segments:
        if should_cancel():
            raise Cancelled()
        words = [
            {"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip()}
            for w in (seg.words or []) if w.word.strip()
        ]
        out.append({"start": round(seg.start, 3), "end": round(seg.end, 3), "text": seg.text.strip(), "words": words})
        frac = min(seg.end / duration, 1.0) if duration else 0.0
        on_progress(frac, f"Transcribiendo… {int(frac * 100)}%")
    return {"language": info.language, "segments": out}
