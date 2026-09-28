"""M5: shorts (segments, reframing, word captions), metadata and thumbnail."""

import json
import os
import subprocess
from pathlib import Path

import numpy as np
import pytest

os.environ.setdefault("CF_X264_PRESET", "ultrafast")

from channelforge.pipeline import duration, metadata, shorts  # noqa: E402
from conftest import fake_words, smart_reply  # noqa: E402


def words_from(texts, gap=0.35, per_word=0.4):
    out, t = [], 0.0
    for sent in texts:
        toks = sent.split()
        for i, w in enumerate(toks):
            out.append({"start": t, "end": t + per_word * .9, "word": w + ("." if i == len(toks) - 1 else "")})
            t += per_word
        t += gap
    return out


def test_sentences_split_on_punctuation_and_gaps():
    w = words_from(["one two three", "four five"])
    s = shorts.sentences(w)
    assert [x["text"] for x in s] == ["one two three.", "four five."]


def test_snap_grows_and_shrinks_to_30_60_seconds():
    sents = [{"start": k * 10.0, "end": k * 10.0 + 9.5, "text": f"s{k}"} for k in range(20)]
    a, b = shorts.snap(sents, 3, 3)                        # 9.5 s → grown to >= 30 s
    assert 30 <= sents[b]["end"] - sents[a]["start"] <= 60
    a, b = shorts.snap(sents, 0, 15)                       # 159.5 s → shrunk to <= 60 s
    assert 30 <= sents[b]["end"] - sents[a]["start"] <= 60 and a == 0


def test_bad_model_answer_falls_back_to_valid_segments():
    sents = [{"start": k * 10.0, "end": k * 10.0 + 9.5, "text": f"s{k}"} for k in range(60)]
    segs = shorts.pick_segments(sents, lambda s, u: "I cannot do that", "es")
    assert len(segs) == 5
    assert all(30 <= s["end"] - s["start"] <= 60 for s in segs)
    assert all(segs[k]["end"] <= segs[k + 1]["start"] for k in range(4))


def test_model_segments_are_snapped_and_deduplicated():
    sents = [{"start": k * 10.0, "end": k * 10.0 + 9.5, "text": f"s{k}"} for k in range(60)]
    answer = json.dumps({"segments": [{"first": 2, "last": 5, "hook": "A"}, {"first": 4, "last": 7, "hook": "overlap"},
                                      {"first": 10, "last": 30, "hook": "too long"}]})
    segs = shorts.pick_segments(sents, lambda s, u: answer, "es")
    assert segs[0]["hook"] == "A" and len(segs) == 5
    assert all(segs[k]["end"] <= segs[k + 1]["start"] for k in range(4))


def test_crop_path_follows_activity_not_the_centre(tmp_path):
    v = tmp_path / "v.mp4"                                   # a white box moving left → right on black
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:r=24:d=10",
                    "-f", "lavfi", "-i", "color=c=white:s=200x200:r=24:d=10", "-filter_complex",
                    "[0:v][1:v]overlay=x='t*170':y=440", "-c:v", "libx264", "-preset", "ultrafast", str(v)], check=True)
    path = shorts.activity_path(v, 0, 10)
    xs = [x for _, x in path]
    assert xs[1] < 0.35 and xs[-2] > 0.6                     # starts left, ends right
    expr = shorts.crop_x_expr(path, 1920, 608)
    assert expr.startswith("if(lt(t,")


def test_ass_captions_highlight_one_word_at_a_time(tmp_path):
    w = words_from(["uno dos tres cuatro cinco"])
    p = shorts.ass_captions(w, 0.0, "El gancho", tmp_path / "c.ass")
    txt = p.read_text()
    assert "Style: Hook" in txt and "El gancho" in txt
    dialog = [l for l in txt.splitlines() if l.startswith("Dialogue: 0")]
    assert len(dialog) == 5 and all(l.count(r"{\c&H00D7FF&}") == 1 for l in dialog)


@pytest.fixture(scope="module")
def long_video(tmp_path_factory):
    d = tmp_path_factory.mktemp("long")
    v = d / "long.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=1920x1080:r=24:d=120",
                    "-f", "lavfi", "-i", "sine=f=300:d=120", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
                    "-shortest", str(v)], check=True)
    return v


@pytest.mark.parametrize("layout", ["track", "stack"])
def test_render_short_is_vertical_captioned_and_in_range(tmp_path, long_video, layout):
    words = fake_words(long_video)
    seg = {"start": 10.0, "end": 52.0, "hook": "Por qué importa", "index": 1}
    s = shorts.render_short(long_video, seg, words, tmp_path / "s.mp4", layout, "ultrafast")
    assert shorts.check_short(s.path) == []
    assert abs(s.duration_s - 42.0) < 0.3
    # not a centre crop: the stacked layout shows the whole 16:9 frame (blurred fill above/below);
    # the tracked crop's window moves with activity (tested above)
    frame = subprocess.run(["ffmpeg", "-v", "error", "-ss", "5", "-i", str(s.path), "-frames:v", "1", "-f", "rawvideo",
                            "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
    img = np.frombuffer(frame, np.uint8).reshape(1920, 1080)
    assert img.std() > 10


def test_metadata_limits_chapters_sources_and_disclosure(tmp_path):
    src = tmp_path / "sources.json"
    src.write_text(json.dumps({"claims": [{"id": "c1", "text": "x", "sources": [
        {"url": "https://data.worldbank.org/a", "publisher": "World Bank"},
        {"url": "https://data.worldbank.org/a", "publisher": "World Bank"}]}]}))
    sections = [{"start": t, "text": "..."} for t in (0, 4, 60, 130, 300, 595)]
    meta = metadata.build(lambda s, u: smart_reply({"messages": [{"role": "system", "content": s}]}),
                          language="es", channel="geopolitics", script_text="texto", sections=sections, video_s=600,
                          sources_path=src, n_shorts=5, short_texts=["a"] * 5, cta_url="https://contractor.ai",
                          cta_title="Contractor AI")
    yt = meta["youtube"]
    assert yt["chapters"][0].startswith("0:00") and len(yt["chapters"]) == 4          # 4 s and 595 s dropped (<10 s)
    assert yt["description"].count("https://data.worldbank.org/a") == 1              # sources de-duplicated
    assert "Contractor AI" in yt["description"] and "herramientas de IA" in yt["description"]
    assert yt["contains_synthetic_media"] is True
    assert sum(len(t) + 1 for t in yt["tags"]) <= 500 and "open" in yt["tags"]
    ig = meta["shorts"][0]["ig_reels"]["caption"]
    assert len(metadata._hashtags(ig)) <= 30
    assert meta["shorts"][0]["yt_shorts"]["title"].endswith("#Shorts")


def test_thumbnail_is_1280x720_under_2mb(tmp_path, long_video):
    t = metadata.thumbnail(long_video, 20, "Sigue el dinero", tmp_path / "t.jpg")
    assert metadata.check_thumbnail(t) == []


def test_captions_do_not_flicker_between_chunks(tmp_path):
    w = words_from(["a b c d e f g h"], per_word=0.5)
    for x in w:
        x["end"] = x["start"] + 0.3                         # 0.2 s gaps between words
    txt = shorts.ass_captions(w, 0.0, "", tmp_path / "c.ass").read_text()
    spans = [l.split(",")[1:3] for l in txt.splitlines() if l.startswith("Dialogue: 0")]
    for (_, end), (start, _) in zip(spans, spans[1:]):
        assert end == start                                 # continuous coverage


def test_long_thumbnail_text_fits_the_frame(tmp_path, long_video):
    t = metadata.thumbnail(long_video, 20, "Follow the public money trail", tmp_path / "t.jpg")
    img = subprocess.run(["ffmpeg", "-v", "error", "-i", str(t), "-vf", "crop=1280:40:0:535,format=gray", "-f", "rawvideo",
                          "-"], capture_output=True, check=True).stdout
    row = np.frombuffer(img, np.uint8).reshape(40, 1280)
    assert (row[:, :12] > 200).sum() == 0 and (row[:, -12:] > 200).sum() == 0   # no white glyphs at the edges
