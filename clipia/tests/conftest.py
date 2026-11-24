import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["CLIPIA_PASSWORD"] = "prueba-123"
os.environ["CLIPIA_SECRET"] = "x" * 32
os.environ["CLIPIA_DATA_DIR"] = tempfile.mkdtemp(prefix="clipia-test-")
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["CLIPIA_FONT"] = "DejaVu Sans"


@pytest.fixture(scope="session")
def sample_video(tmp_path_factory) -> Path:
    path = tmp_path_factory.mktemp("video") / "muestra.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=45",
         "-f", "lavfi", "-i", "sine=frequency=330:duration=45", "-c:v", "libx264", "-preset", "ultrafast",
         "-c:a", "aac", "-shortest", str(path)],
        check=True,
    )
    return path


def fake_transcript(duration: float = 45.0) -> dict:
    frase = "hola a todos hoy les traigo algo increíble no lo van a creer miren esto jajaja qué locura".split()
    words, t = [], 1.0
    while t < duration - 1:
        for w in frase:
            if t >= duration - 1:
                break
            words.append({"start": round(t, 2), "end": round(t + 0.3, 2), "word": w})
            t += 0.4
        t += 0.8
    return {"language": "es", "segments": [{"start": words[0]["start"], "end": words[-1]["end"],
                                            "text": " ".join(w["word"] for w in words), "words": words}]}
