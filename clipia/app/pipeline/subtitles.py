"""Subtítulos .ass animados: grupos cortos de palabras con la palabra hablada resaltada."""
import re

# Colores ASS: &HAABBGGRR (AA=transparencia, 00 = opaco)
STYLES = {
    "viral":   {"primary": "&H00FFFFFF", "highlight": "&H0000E6FF", "outline": "&H00000000", "back": "&H96000000",
                "border": 1, "outline_w": 9, "shadow": 4, "size": 1.0, "karaoke": True},
    "verde":   {"primary": "&H00FFFFFF", "highlight": "&H006EFF3D", "outline": "&H00000000", "back": "&H96000000",
                "border": 1, "outline_w": 9, "shadow": 4, "size": 1.0, "karaoke": True},
    "caja":    {"primary": "&H00FFFFFF", "highlight": "&H0000E6FF", "outline": "&H00141414", "back": "&H00000000",
                "border": 3, "outline_w": 18, "shadow": 0, "size": 0.9, "karaoke": True},
    "minimal": {"primary": "&H00FFFFFF", "highlight": "&H00FFFFFF", "outline": "&H00000000", "back": "&H80000000",
                "border": 1, "outline_w": 4, "shadow": 2, "size": 0.75, "karaoke": False},
}


def _ts(t: float) -> str:
    t = max(0.0, t)
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h:d}:{m:02d}:{s:02d}.{cs:02d}"


def _esc(text: str) -> str:
    return text.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def group_words(words: list[dict], max_words: int, max_chars: int) -> list[list[dict]]:
    groups: list[list[dict]] = []
    cur: list[dict] = []
    for w in words:
        if cur:
            gap = w["start"] - cur[-1]["end"]
            chars = sum(len(x["word"]) + 1 for x in cur) + len(w["word"])
            ends_sentence = bool(re.search(r"[.!?…,;:]$", cur[-1]["word"]))
            if len(cur) >= max_words or chars > max_chars or gap > 0.6 or ends_sentence:
                groups.append(cur)
                cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return groups


def build_ass(
    words: list[dict],
    clip_start: float,
    clip_end: float,
    width: int,
    height: int,
    style: str = "viral",
    uppercase: bool = True,
    title: str = "",
    font: str = "Montserrat",
) -> str:
    st = STYLES.get(style, STYLES["viral"])
    vertical = height > width
    base = (88 if vertical else 66) * st["size"]
    margin_v = int(height * (0.27 if vertical else 0.08))
    margin_lr = int(width * 0.07)
    title_size = 62 if vertical else 50

    lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {width}",
        f"PlayResY: {height}",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "YCbCr Matrix: TV.709",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
        "MarginR, MarginV, Encoding",
        f"Style: Sub,{font},{base:.0f},{st['primary']},{st['primary']},{st['outline']},{st['back']},-1,0,0,0,100,100,1,0,"
        f"{st['border']},{st['outline_w']},{st['shadow']},2,{margin_lr},{margin_lr},{margin_v},1",
        f"Style: Title,{font},{title_size},&H00FFFFFF,&H00FFFFFF,&H20000000,&H00000000,-1,0,0,0,100,100,0,0,"
        f"3,20,0,8,{int(width * 0.09)},{int(width * 0.09)},{int(height * (0.11 if vertical else 0.06))},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    duration = clip_end - clip_start
    if title:
        shown = _esc(title.upper() if uppercase else title)
        lines.append(f"Dialogue: 1,{_ts(0)},{_ts(min(3.5, duration))},Title,,0,0,0,,{{\\fad(150,300)}}{shown}")

    local = []
    for w in words:
        if w["end"] <= clip_start or w["start"] >= clip_end:
            continue
        txt = _esc(w["word"].strip())
        if not txt:
            continue
        local.append({"start": max(0.0, w["start"] - clip_start), "end": min(duration, w["end"] - clip_start),
                      "word": txt.upper() if uppercase else txt})

    max_chars = (16 if uppercase else 20) if vertical else 32
    groups = group_words(local, max_words=3 if vertical else 6, max_chars=max_chars)
    for gi, g in enumerate(groups):
        next_start = groups[gi + 1][0]["start"] if gi + 1 < len(groups) else duration
        g_end = min(g[-1]["end"] + 0.3, next_start, duration)
        if not st["karaoke"]:
            text = " ".join(x["word"] for x in g)
            lines.append(f"Dialogue: 0,{_ts(g[0]['start'])},{_ts(g_end)},Sub,,0,0,0,,{text}")
            continue
        for wi, w in enumerate(g):
            start = w["start"]
            end = g[wi + 1]["start"] if wi + 1 < len(g) else g_end
            if end - start < 0.02:
                continue
            parts = []
            for k, x in enumerate(g):
                parts.append(f"{{\\c{st['highlight']}}}{x['word']}{{\\c{st['primary']}}}" if k == wi else x["word"])
            pop = "{\\fscx88\\fscy88\\t(0,80,\\fscx100\\fscy100)}" if wi == 0 else ""
            lines.append(f"Dialogue: 0,{_ts(start)},{_ts(end)},Sub,,0,0,0,,{pop}{' '.join(parts)}")
    return "\n".join(lines) + "\n"
