from app.models import JobOptions
from app.pipeline.highlights import normalize_clips
from app.pipeline.render import crop_x_expr, plan_shots
from app.pipeline.subtitles import _ts, build_ass, group_words
from conftest import fake_transcript


def test_timestamps():
    assert _ts(0) == "0:00:00.00"
    assert _ts(61.257) == "0:01:01.26"
    assert _ts(3725.5) == "1:02:05.50"


def test_group_words_respects_limits():
    words = [{"start": i * 0.3, "end": i * 0.3 + 0.25, "word": w} for i, w in enumerate("uno dos tres cuatro cinco".split())]
    groups = group_words(words, max_words=3, max_chars=40)
    assert [len(g) for g in groups] == [3, 2]
    # Un silencio largo corta el grupo
    words[1]["start"] += 2
    assert len(group_words(words, 3, 40)[0]) == 1


def test_build_ass_highlights_and_title():
    words = [{"start": 10.0, "end": 10.3, "word": "hola"}, {"start": 10.4, "end": 10.7, "word": "mundo"}]
    ass = build_ass(words, 9.5, 20, 1080, 1920, "viral", True, "Mi título")
    assert "PlayResY: 1920" in ass
    assert "MI TÍTULO" in ass
    assert "\\c&H0000E6FF}HOLA" in ass  # palabra activa resaltada
    assert "0:00:00.50" in ass  # tiempos relativos al inicio del clip


def test_build_ass_escapes_braces():
    ass = build_ass([{"start": 0, "end": 1, "word": "{\\malo}"}], 0, 5, 1080, 1920, "minimal", False)
    assert "{\\malo}" not in ass


def test_normalize_clips_limits_and_overlap():
    tr = fake_transcript(120)
    opts = JobOptions(min_seconds=15, max_seconds=30)
    raw = [
        {"start": 5, "end": 90, "title": "largo", "caption": "", "hashtags": ["#a"], "score": 90, "reason": ""},
        {"start": 10, "end": 25, "title": "solapado", "caption": "", "hashtags": [], "score": 80, "reason": ""},
        {"start": 60, "end": 63, "title": "corto", "caption": "", "hashtags": [], "score": 70, "reason": ""},
        {"start": 500, "end": 600, "title": "fuera", "caption": "", "hashtags": [], "score": 60, "reason": ""},
    ]
    clips = normalize_clips(raw, tr, 120, opts)
    assert [c["title"] for c in clips] == ["largo", "corto"]
    for c in clips:
        assert 15 - 0.2 <= c["end"] - c["start"] <= 30 + 0.6
    assert clips[0]["hashtags"] == ["a"]


def test_plan_shots():
    assert plan_shots([(i * 0.5, None) for i in range(20)]) is None
    track = [(i * 0.5, 0.2 if i < 10 else 0.8) for i in range(20)]
    shots = plan_shots(track)
    assert len(shots) == 2 and shots[1][0] == 5.0
    assert crop_x_expr(shots, 1920, 606) == "if(lt(t,5.00),81,1233)"
