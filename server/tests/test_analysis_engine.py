"""The analysis returns exactly one score plus the AI's feedback text; the
score blends the AI judgement with the DSP style match to the reciter, and
the AI hears the reciter's recording next to the user's along with the
measured pitch differences. Offline — audio, DSP and OpenAI are faked."""

from pathlib import Path

from app.models.analysis import StyleScores
from app.models.features import AudioFeatures
from app.models.quran import Ayah
from app.services import analysis_engine
from app.services.analysis_engine import AnalysisEngine
from app.services.recitation_feedback_service import RecitationFeedback

_FEATURES = AudioFeatures(
    durationSeconds=3.0,
    pitchContour=[],
    pitchTimestamps=[],
    energyContour=[],
    energyTimestamps=[],
    voicedSegments=[],
    pauseCount=0,
    pauseTotalSeconds=0.0,
)


class _Provider:
    async def get_ayah(self, surah_number, ayah_number):
        return Ayah(surahId=str(surah_number), number=ayah_number, arabicText="بِسْمِ ٱللَّهِ", words=[])


class _References:
    async def get_or_create(self, reciter_id, surah_number, ayah_number):
        return _FEATURES

    async def get_audio_path(self, reciter_id, surah_number, ayah_number):
        return Path(f"/refs/{reciter_id}/{surah_number}/{ayah_number}.audio")


class _Feedback:
    def __init__(self):
        self.call = None

    async def analyze(self, user_wav_path, reference_wav_path, arabic_text, pitch_differences):
        self.call = (Path(user_wav_path).name, Path(reference_wav_path).name, arabic_text, pitch_differences)
        return RecitationFeedback(score=90, feedback="Clear and fluent — keep the pace steady.")


async def test_overall_score_blends_ai_and_style(monkeypatch):
    concatenated = []
    monkeypatch.setattr(analysis_engine, "convert_to_wav", lambda src, dst: None)
    monkeypatch.setattr(analysis_engine, "concat_to_wav", lambda srcs, dst: concatenated.append(srcs))
    monkeypatch.setattr(analysis_engine, "pitch_differences", lambda words, user, ref: ["measured hint"])
    monkeypatch.setattr(analysis_engine, "extract_audio_features", lambda path: _FEATURES)
    monkeypatch.setattr(
        analysis_engine,
        "compare_features",
        lambda user, ref: StyleScores(pitch=0, rhythm=0, timing=0, melody=0, similarity=60),
    )
    feedback = _Feedback()
    engine = AnalysisEngine(_Provider(), _References(), feedback)

    result = await engine.analyze(
        surah_number=1, ayah_number=1, reciter_id="1", attempt_number=2, recording_path="unused.m4a"
    )

    assert result.overallScore == 90 * 0.7 + 60 * 0.3
    assert result.feedback == "Clear and fluent — keep the pace steady."
    assert feedback.call == ("user.wav", "reference.wav", "بِسْمِ ٱللَّهِ", ["measured hint"])
    assert concatenated == [["/refs/1/1/1.audio"]]
    assert set(result.model_dump()) == {
        "id", "createdAt", "surahId", "ayahNumber", "reciterId", "attemptNumber", "overallScore", "feedback",
    }
