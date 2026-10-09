import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.models.analysis import CoachInsight, CorrectnessScores, PitchPoint, RecitationAnalysis, WordAnalysis
from app.models.quran import Ayah
from app.providers.quran_audio_provider import QuranAudioProvider
from app.services.audio_convert import convert_to_wav
from app.services.audio_features import extract_audio_features
from app.services.comparison import compare_features
from app.services.insights import build_overall_insight, build_style_insight
from app.services.pronunciation_service import PronunciationService, PronunciationServiceUnavailableError
from app.services.reference_feature_service import ReferenceFeatureService, ReferenceUnavailableError

_STATUS_SCORE = {"excellent": 95.0, "good": 82.0, "needsWork": 65.0, "practice": 45.0}
_VALID_STATUSES = set(_STATUS_SCORE)


class AnalysisFailedError(RuntimeError):
    """Any failure along the way — the router turns this into a proper HTTP
    error. There is no fallback path that returns fake data instead."""


class AnalysisEngine:
    def __init__(
        self,
        provider: QuranAudioProvider,
        reference_features: ReferenceFeatureService,
        pronunciation: PronunciationService,
    ) -> None:
        self._provider = provider
        self._reference_features = reference_features
        self._pronunciation = pronunciation

    async def analyze(
        self,
        *,
        surah_number: int,
        ayah_number: int,
        reciter_id: str,
        attempt_number: int,
        recording_path: str,
        ayah_number_end: int | None = None,
    ) -> RecitationAnalysis:
        is_range = ayah_number_end is not None and ayah_number_end > ayah_number

        try:
            if is_range:
                ayah = await self._load_ayah_range(surah_number, ayah_number, ayah_number_end)
            else:
                ayah = await self._provider.get_ayah(surah_number, ayah_number)
        except Exception as error:  # noqa: BLE001 — any provider failure is a hard failure here
            raise AnalysisFailedError(f"Could not load ayah text: {error}") from error

        try:
            if is_range:
                reference_features = await self._reference_features.get_or_create_range(
                    reciter_id, surah_number, ayah_number, ayah_number_end
                )
            else:
                reference_features = await self._reference_features.get_or_create(
                    reciter_id, surah_number, ayah_number
                )
        except ReferenceUnavailableError as error:
            raise AnalysisFailedError(str(error)) from error

        with tempfile.TemporaryDirectory() as tmp_dir:
            wav_path = str(Path(tmp_dir) / "user.wav")
            try:
                convert_to_wav(recording_path, wav_path)
            except Exception as error:  # noqa: BLE001
                raise AnalysisFailedError(f"Could not decode the recording: {error}") from error

            user_features = extract_audio_features(wav_path)
            style = compare_features(user_features, reference_features)

            try:
                pronunciation_result = await self._pronunciation.analyze(wav_path, ayah.arabicText)
            except PronunciationServiceUnavailableError as error:
                raise AnalysisFailedError(str(error)) from error

        correctness = CorrectnessScores(
            pronunciation=pronunciation_result.pronunciation, tajweed=pronunciation_result.tajweed
        )

        words = _build_word_analyses(ayah.words, user_features, style, pronunciation_result.words)

        overall_score = round(
            correctness.pronunciation * 0.3
            + correctness.tajweed * 0.3
            + style.pitch * 0.15
            + style.rhythm * 0.1
            + style.timing * 0.1
            + style.melody * 0.05,
            1,
        )

        insights: list[CoachInsight] = [build_overall_insight(correctness, style, overall_score)]
        for draft in pronunciation_result.insights:
            insights.append(CoachInsight(id=f"correctness-{uuid.uuid4().hex[:8]}", headline=draft.headline, detail=draft.detail))
        style_insight = build_style_insight(words)
        if style_insight:
            insights.append(style_insight)

        return RecitationAnalysis(
            id=f"analysis-{uuid.uuid4().hex}",
            createdAt=datetime.now(UTC).isoformat(),
            surahId=str(surah_number),
            ayahNumber=ayah_number,
            reciterId=reciter_id,
            attemptNumber=attempt_number,
            overallScore=overall_score,
            correctness=correctness,
            style=style,
            words=words,
            referencePitchContour=_to_pitch_points(reference_features.pitchContour, reference_features.pitchTimestamps),
            userPitchContour=_to_pitch_points(user_features.pitchContour, user_features.pitchTimestamps),
            insights=insights,
        )

    async def _load_ayah_range(self, surah_number: int, start_ayah: int, end_ayah: int) -> Ayah:
        ayahs = [
            await self._provider.get_ayah(surah_number, ayah_number)
            for ayah_number in range(start_ayah, end_ayah + 1)
        ]
        return Ayah(
            surahId=str(surah_number),
            number=start_ayah,
            arabicText=" ".join(a.arabicText for a in ayahs),
            words=[word for a in ayahs for word in a.words],
        )


def _to_pitch_points(contour: list[float], timestamps: list[float]) -> list[PitchPoint]:
    return [
        PitchPoint(timestamp=round(t * 1000), normalizedPitch=round(max(-1.0, min(1.0, v / 24.0)), 3))
        for t, v in zip(timestamps, contour)
    ]


def _build_word_analyses(ayah_words, user_features, style, pronunciation_words) -> list[WordAnalysis]:
    """Word-level timing comes from real silence-split segments when the
    segment count happens to match the word count; otherwise it falls back
    to an even split of the total duration — an honest approximation, not
    fabricated precision. Per-word pronunciation/Tajweed scores are a
    documented coarse mapping from OpenAI's qualitative status, not
    false-precision numbers the model was never asked to invent.
    """
    segments = user_features.voicedSegments
    word_count = len(ayah_words)

    if len(segments) == word_count:
        timings = segments
    else:
        total = user_features.durationSeconds or 1.0
        step = total / max(word_count, 1)
        timings = [[i * step, (i + 1) * step] for i in range(word_count)]

    word_analyses: list[WordAnalysis] = []
    for i, word in enumerate(ayah_words):
        start, end = timings[i] if i < len(timings) else (0.0, 0.0)
        pron = pronunciation_words[i] if i < len(pronunciation_words) else None
        status = pron.status if pron and pron.status in _VALID_STATUSES else "good"
        score = _STATUS_SCORE[status]
        feedback = pron.feedback if pron else "No specific feedback for this word."

        pitch_cue = _pitch_cue_for_span(user_features.pitchContour, user_features.pitchTimestamps, start, end)

        word_analyses.append(
            WordAnalysis(
                index=i,
                arabicText=word,
                startTime=round(start * 1000),
                endTime=round(end * 1000),
                status=status,
                pronunciationScore=score,
                tajweedScore=score,
                pitchScore=style.pitch,
                pitchCue=pitch_cue,
                feedback=feedback,
            )
        )
    return word_analyses


def _pitch_cue_for_span(contour: list[float], timestamps: list[float], start: float, end: float) -> str:
    span = [v for t, v in zip(timestamps, contour) if start <= t <= end]
    if len(span) < 2:
        return "hold"
    delta = span[-1] - span[0]
    if delta > 2.5:
        return "raise"
    if delta > 0.8:
        return "graduallyRaise"
    if delta < -2.5:
        return "lower"
    if delta < -0.8:
        return "graduallyLower"
    return "hold"
