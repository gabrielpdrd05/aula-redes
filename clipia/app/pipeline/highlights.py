"""Elección de los mejores momentos del video.

Con ANTHROPIC_API_KEY la elección la hace Claude leyendo la transcripción completa.
Sin clave se usa un modo básico (volumen + ritmo del habla), mucho menos inteligente.
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

from . import PipelineError

CLIP_SCHEMA = {
    "type": "object",
    "properties": {
        "clips": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "start": {"type": "number", "description": "Segundo de inicio en el video original"},
                    "end": {"type": "number", "description": "Segundo de fin en el video original"},
                    "title": {"type": "string", "description": "Título gancho corto para poner encima del video (máx. 8 palabras)"},
                    "caption": {"type": "string", "description": "Descripción lista para publicar (1-2 frases)"},
                    "hashtags": {"type": "array", "items": {"type": "string"}},
                    "score": {"type": "integer", "description": "Potencial viral de 1 a 100"},
                    "reason": {"type": "string", "description": "Por qué este momento funciona (1 frase)"},
                },
                "required": ["start", "end", "title", "caption", "hashtags", "score", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["clips"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You are an expert short-form video editor who finds the moments in long videos and livestreams that will perform best as TikTok / Reels / YouTube Shorts clips.

You receive a timestamped transcript. Pick self-contained moments that make sense without the rest of the video:
- strong hook in the first 2 seconds (a bold claim, a question, a reaction, a punchline setup, conflict, surprise)
- a clear payoff before the clip ends (the joke lands, the story resolves, the tip is complete, the reaction happens)
- funny, emotional, controversial, surprising, highly useful or quotable moments rank highest
- avoid filler, greetings, "don't forget to subscribe", technical problems and moments that need missing context
- never cut in the middle of a sentence: start where a sentence starts and end right after a sentence ends
- clips must not overlap

Write title, caption and hashtags in the same language as the video, in a natural social-media tone. The title is overlaid on the video for the first seconds, so it must be short and punchy (max 8 words, no hashtags, no quotes). Hashtags without the # sign, 3 to 6, specific to the content.

Return the clips ordered from best to worst."""


def _fmt(t: float) -> str:
    m, s = divmod(t, 60)
    h, m = divmod(int(m), 60)
    return f"{h:d}:{m:02d}:{s:04.1f}" if h else f"{m:02d}:{s:04.1f}"


def format_transcript(segments: list[dict]) -> str:
    return "\n".join(f"[{s['start']:.1f}-{s['end']:.1f}] {s['text']}" for s in segments if s["text"])


def pick_with_claude(transcript: dict, duration: float, opts, video_title: str, api_key: str, model: str) -> list[dict]:
    import anthropic

    segments = transcript["segments"]
    if not segments:
        raise PipelineError("No se detectó voz en el video, así que la IA no tiene qué analizar.")

    if opts.num_clips:
        how_many = f"Return exactly {opts.num_clips} clips (fewer only if the video truly doesn't have enough good moments)."
    else:
        suggested = max(1, min(15, int(duration / 240) + 2))
        how_many = f"Return as many genuinely good clips as the video has, usually around {suggested}. Quality over quantity."

    extra = f"\nExtra instructions from the creator (follow them): {opts.instructions.strip()}" if opts.instructions.strip() else ""
    user = (
        f"Video title: {video_title}\n"
        f"Video length: {duration:.0f} seconds ({_fmt(duration)})\n"
        f"Detected language: {transcript.get('language') or 'unknown'}\n"
        f"Each clip must last between {opts.min_seconds} and {opts.max_seconds} seconds.\n"
        f"{how_many}{extra}\n\n"
        "Timestamps are in seconds: [start-end] text\n\n"
        f"<transcript>\n{format_transcript(segments)}\n</transcript>"
    )

    client = anthropic.Anthropic(api_key=api_key, max_retries=3)
    try:
        with client.beta.messages.stream(
            model=model,
            max_tokens=32000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "high", "format": {"type": "json_schema", "schema": CLIP_SCHEMA}},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user}],
        ) as stream:
            message = stream.get_final_message()
    except anthropic.AuthenticationError as exc:
        raise PipelineError("La clave ANTHROPIC_API_KEY no es válida.") from exc
    except anthropic.PermissionDeniedError as exc:
        raise PipelineError("Tu cuenta de Anthropic no tiene acceso a ese modelo o no tiene saldo.") from exc
    except anthropic.RateLimitError as exc:
        raise PipelineError("Límite de uso de la IA alcanzado. Espera un momento y reintenta.") from exc
    except anthropic.APIStatusError as exc:
        raise PipelineError(f"La IA devolvió un error ({exc.status_code}). Reintenta en un rato.") from exc
    except anthropic.APIConnectionError as exc:
        raise PipelineError("No se pudo conectar con la IA. Revisa la conexión a internet del servidor.") from exc

    if message.stop_reason == "refusal":
        raise PipelineError("La IA se negó a analizar este contenido.")
    if message.stop_reason == "max_tokens":
        raise PipelineError("La respuesta de la IA quedó cortada. Pide menos clips.")
    text = next((b.text for b in message.content if b.type == "text"), "")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise PipelineError("La IA devolvió una respuesta inválida. Reintenta.") from exc
    return data.get("clips", [])


# ---------- Modo básico sin IA ----------

def _loudness_per_second(wav_path: Path) -> np.ndarray:
    with wave.open(str(wav_path), "rb") as wf:
        rate = wf.getframerate()
        frames = wf.readframes(wf.getnframes())
    audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    n = len(audio) // rate
    if n == 0:
        return np.zeros(1)
    rms = np.sqrt(np.mean(audio[: n * rate].reshape(n, rate) ** 2, axis=1) + 1e-9)
    return 20 * np.log10(rms)


def pick_heuristic(transcript: dict, wav_path: Path, duration: float, opts) -> list[dict]:
    loud = _loudness_per_second(wav_path)
    target = (opts.min_seconds + opts.max_seconds) / 2
    words = [w for s in transcript["segments"] for w in s["words"]]
    loud_norm = (loud - loud.mean()) / (loud.std() + 1e-6)
    candidates = []
    step = max(3.0, target / 4)
    t = 0.0
    while t + opts.min_seconds <= duration:
        end = min(t + target, duration)
        a, b = int(t), max(int(t) + 1, int(end))
        energy = float(np.mean(loud_norm[a:b])) if b <= len(loud_norm) else 0.0
        in_win = [w for w in words if t <= w["start"] < end]
        text = " ".join(w["word"] for w in in_win)
        density = len(in_win) / max(end - t, 1)
        excite = len(re.findall(r"[!¡?¿]|ja+ja|ha+ha|jaja|wow|no puede ser|omg", text.lower()))
        score = energy * 1.0 + density * 0.4 + excite * 0.3
        candidates.append((score, t, end, text))
        t += step
    candidates.sort(reverse=True)
    wanted = opts.num_clips or max(1, min(10, int(duration / 240) + 2))
    chosen: list[dict] = []
    for score, start, end, text in candidates:
        if any(start < c["end"] and end > c["start"] for c in chosen):
            continue
        title = " ".join(text.split()[:7]) or f"Momento {_fmt(start)}"
        chosen.append({
            "start": start, "end": end, "title": title.strip(" ,.") + ("…" if len(text.split()) > 7 else ""),
            "caption": (text[:180] + "…") if len(text) > 180 else text,
            "hashtags": [], "score": 0, "reason": "Elegido por volumen y ritmo (modo básico sin IA).",
        })
        if len(chosen) >= wanted:
            break
    for rank, c in enumerate(chosen):
        c["score"] = max(10, 80 - rank * 7)
    return chosen


# ---------- Ajuste fino de los cortes ----------

def normalize_clips(raw: list[dict], transcript: dict, duration: float, opts) -> list[dict]:
    """Ajusta los cortes a inicios/finales de palabra, respeta duraciones y quita solapes."""
    words = [w for s in transcript["segments"] for w in s["words"]]
    starts = np.array([w["start"] for w in words]) if words else np.array([])
    ends = np.array([w["end"] for w in words]) if words else np.array([])
    result: list[dict] = []

    for c in raw:
        try:
            s, e = float(c["start"]), float(c["end"])
        except (KeyError, TypeError, ValueError):
            continue
        s, e = max(0.0, min(s, duration)), max(0.0, min(e, duration))
        if e <= s:
            continue
        if len(words):
            i = int(np.argmin(np.abs(starts - s)))
            if abs(starts[i] - s) <= 2.0:
                s = float(starts[i])
            j = int(np.argmin(np.abs(ends - e)))
            if abs(ends[j] - e) <= 2.0:
                e = float(ends[j])
        if e - s > opts.max_seconds:
            limit = s + opts.max_seconds
            valid = ends[(ends <= limit) & (ends > s + opts.min_seconds)] if len(words) else []
            e = float(valid.max()) if len(valid) else limit
        if e - s < opts.min_seconds:
            needed = s + opts.min_seconds
            later = ends[ends >= needed] if len(words) else []
            e = float(later.min()) if len(later) and later.min() - s <= opts.max_seconds else needed
        s = max(0.0, s - 0.15)
        e = min(duration, e + 0.4)
        if e - s < 3:
            continue
        if any(s < r["end"] - 1 and e > r["start"] + 1 for r in result):
            continue
        hashtags = [h.strip().lstrip("#").replace(" ", "") for h in c.get("hashtags", []) if str(h).strip()]
        result.append({
            "start": round(s, 2), "end": round(e, 2),
            "title": str(c.get("title", "")).strip().strip('"“”')[:120],
            "caption": str(c.get("caption", "")).strip()[:600],
            "hashtags": hashtags[:8],
            "score": int(max(0, min(100, c.get("score", 0) or 0))),
            "reason": str(c.get("reason", "")).strip()[:300],
        })
        if opts.num_clips and len(result) >= opts.num_clips:
            break
    return result
