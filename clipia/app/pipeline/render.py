"""Edición de cada clip: reencuadre, subtítulos, audio normalizado, exportación MP4."""
from pathlib import Path

import numpy as np

from .media import run
from .subtitles import build_ass

OUT_V = (1080, 1920)
OUT_H = (1920, 1080)


def detect_face_track(src: Path, start: float, end: float, samples_per_sec: float = 2.0) -> list[tuple[float, float | None]]:
    """Centro horizontal (0-1) de la cara principal en momentos del clip. None si no hay cara."""
    import cv2

    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    cap = cv2.VideoCapture(str(src))
    track: list[tuple[float, float | None]] = []
    t = start
    step = 1.0 / samples_per_sec
    try:
        while t < end:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if not ok:
                track.append((t - start, None))
                t += step
                continue
            h, w = frame.shape[:2]
            scale = 640 / w if w > 640 else 1.0
            small = cv2.resize(frame, (int(w * scale), int(h * scale))) if scale != 1.0 else frame
            gray = cv2.equalizeHist(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY))
            min_side = max(24, int(small.shape[0] * 0.07))
            faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(min_side, min_side))
            if len(faces):
                x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
                track.append((t - start, (x + fw / 2) / small.shape[1]))
            else:
                track.append((t - start, None))
            t += step
    finally:
        cap.release()
    return track


def plan_shots(track: list[tuple[float, float | None]], min_ratio: float = 0.35) -> list[tuple[float, float]] | None:
    """Convierte el seguimiento en "planos" estables (tiempo, centro). None si casi no hay caras."""
    if not track:
        return None
    found = [c for _, c in track if c is not None]
    if len(found) < max(2, min_ratio * len(track)):
        return None
    # Rellenar huecos con el último valor conocido
    filled, last = [], found[0]
    for t, c in track:
        last = c if c is not None else last
        filled.append((t, last))
    # Mediana móvil para quitar saltos del detector
    vals = np.array([c for _, c in filled])
    k = 2
    smooth = np.array([np.median(vals[max(0, i - k): i + k + 1]) for i in range(len(vals))])

    shots = [(0.0, float(smooth[0]))]
    dead_zone = 0.10
    pending_since = None
    for i, (t, _) in enumerate(filled):
        cur = shots[-1][1]
        if abs(smooth[i] - cur) > dead_zone:
            if pending_since is None:
                pending_since = i
            elif t - filled[pending_since][0] >= 1.0:  # el cambio se mantiene 1 s → nuevo plano
                new_c = float(np.median(smooth[pending_since: i + 1]))
                shots.append((filled[pending_since][0], new_c))
                pending_since = None
        else:
            pending_since = None
    return shots


def crop_x_expr(shots: list[tuple[float, float]], src_w: int, crop_w: int) -> str:
    def x_of(c: float) -> int:
        return int(min(max(c * src_w - crop_w / 2, 0), src_w - crop_w))

    expr = str(x_of(shots[-1][1]))
    for i in range(len(shots) - 2, -1, -1):
        expr = f"if(lt(t,{shots[i + 1][0]:.2f}),{x_of(shots[i][1])},{expr})"
    return expr


def build_video_filter(layout: str, src_w: int, src_h: int, shots, ass_name: str, fonts_dir: str | None) -> tuple[str, tuple[int, int], str]:
    """Devuelve (filter_complex, tamaño_salida, layout_usado)."""
    ass = f"ass={ass_name}" + (f":fontsdir='{fonts_dir}'" if fonts_dir else "")
    if layout == "horizontal":
        w, h = OUT_H
        chain = (f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos,"
                 f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,{ass}[v]")
        return chain, OUT_H, "horizontal"

    w, h = OUT_V
    landscape = src_w / src_h > 1.0
    if layout in ("auto", "crop") and landscape and shots:
        crop_w = min(src_w, int(src_h * 9 / 16) // 2 * 2)
        x = crop_x_expr(shots, src_w, crop_w)
        chain = (f"[0:v]crop=w={crop_w}:h={src_h}:x='{x}':y=0,scale={w}:{h}:flags=lanczos,"
                 f"setsar=1,fps=30,{ass}[v]")
        return chain, OUT_V, "crop"
    if layout == "crop" and landscape:
        crop_w = min(src_w, int(src_h * 9 / 16) // 2 * 2)
        chain = (f"[0:v]crop=w={crop_w}:h={src_h}:x=(iw-{crop_w})/2:y=0,scale={w}:{h}:flags=lanczos,"
                 f"setsar=1,fps=30,{ass}[v]")
        return chain, OUT_V, "crop"
    # Fondo difuminado: el video completo en el centro, ideal para gameplay o pantallas
    chain = (f"[0:v]split=2[a][b];"
             f"[a]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},gblur=sigma=28,eq=brightness=-0.10[bg];"
             f"[b]scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos[fg];"
             f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30,{ass}[v]")
    return chain, OUT_V, "blur"


def render_clip(
    src: Path,
    info: dict,
    clip: dict,
    words: list[dict],
    out_dir: Path,
    index: int,
    opts,
    font: str,
    fonts_dir: str | None,
) -> dict:
    start, end = clip["start"], clip["end"]
    duration = end - start
    name = f"clip_{index:02d}"

    shots = None
    if opts.layout in ("auto", "crop") and info["width"] > info["height"]:
        shots = plan_shots(detect_face_track(src, start, end))

    # Primero se decide el tamaño para escribir los subtítulos a esa resolución
    _, size, _ = build_video_filter(opts.layout, info["width"], info["height"], shots, "x.ass", fonts_dir)
    ass_name = f"{name}.ass"
    (out_dir / ass_name).write_text(
        build_ass(words, start, end, size[0], size[1], opts.subtitle_style, opts.uppercase,
                  clip["title"] if opts.hook_title else "", font),
        encoding="utf-8",
    )
    graph, size, used = build_video_filter(opts.layout, info["width"], info["height"], shots, ass_name, fonts_dir)

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{start:.3f}", "-t", f"{duration:.3f}", "-i", str(src),
           "-filter_complex", graph, "-map", "[v]"]
    if info["has_audio"]:
        cmd += ["-map", "0:a:0", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", f"{name}.mp4"]
    run(cmd, cwd=out_dir)
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{min(1.0, duration / 2):.2f}", "-i", f"{name}.mp4",
         "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", f"{name}.jpg"], cwd=out_dir)

    tags = " ".join("#" + h for h in clip.get("hashtags", []))
    (out_dir / f"{name}.txt").write_text(f"{clip['title']}\n\n{clip['caption']}\n\n{tags}\n", encoding="utf-8")
    return {**clip, "index": index, "video": f"{name}.mp4", "thumb": f"{name}.jpg",
            "width": size[0], "height": size[1], "layout": used, "duration": round(duration, 2)}
