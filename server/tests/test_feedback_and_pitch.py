"""How the AI's structured answer becomes the single feedback text, and the
measured pitch differences it's grounded on. Offline."""

from app.models.features import AudioFeatures
from app.services.pitch_guidance import pitch_differences
from app.services.recitation_feedback_service import _AiResponse, _compose_feedback


def _features(contour: list[float]) -> AudioFeatures:
    timestamps = [i * 0.05 for i in range(len(contour))]
    return AudioFeatures(
        durationSeconds=timestamps[-1],
        pitchContour=contour,
        pitchTimestamps=timestamps,
        energyContour=[],
        energyTimestamps=[],
        voicedSegments=[[0.0, timestamps[-1]]],
        pauseCount=0,
        pauseTotalSeconds=0.0,
    )


def test_feedback_lists_tips_under_headings_and_skips_empty_sections():
    text = _compose_feedback(
        _AiResponse(score=80, summary="Nice and steady.", melodyTips=["Rise on ٱلْحَمْدُ."], letterTips=[])
    )
    assert text == "Nice and steady.\n\nMelody\n• Rise on ٱلْحَمْدُ."


def test_identical_recitations_have_no_pitch_differences():
    rising = _features([float(i % 20) / 4 for i in range(80)])
    assert pitch_differences(["ٱلْحَمْدُ", "لِلَّهِ"], rising, rising) == []


def test_opposite_melody_is_reported_on_the_right_word():
    reference = _features([0.0] * 30 + [i / 3 for i in range(30)])  # second word rises ~10 semitones
    user = _features([0.0] * 30 + [-i / 3 for i in range(30)])  # second word falls instead
    hints = pitch_differences(["لِلَّهِ", "رَبِّ"], user, reference)
    assert any(h.startswith("رَبِّ: the reciter's voice rises, yours falls") for h in hints)
    assert not any(h.startswith("لِلَّهِ") for h in hints)
