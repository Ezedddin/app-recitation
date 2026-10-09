import re
from dataclasses import dataclass

import numpy as np

from app.models.features import AudioFeatures

# Harakat, tanween, sukun, shadda, superscript alif, Quranic annotation marks
# and tatweel — they don't take time on their own, so they don't count as letters.
_NON_LETTERS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ\s]")

# Semitones. Contours are relative to each speaker's own median pitch, so
# these compare melodic *shape*, never absolute voice height.
_MOVEMENT_THRESHOLD = 1.5
_LEVEL_THRESHOLD = 2.5
_MAX_HINTS = 4


@dataclass
class _SpanPitch:
    level: float  # median pitch in the word, semitones vs. the speaker's own median
    movement: float  # end-of-word minus start-of-word pitch, semitones


def _letter_count(word: str) -> int:
    return max(1, len(_NON_LETTERS.sub("", word)))


def _word_spans(features: AudioFeatures, words: list[str]) -> list[tuple[float, float]]:
    """There's no forced alignment, so each word gets a share of the voiced
    span proportional to its letter count — an approximation, good enough to
    say which word a clear melodic difference falls in."""
    if features.voicedSegments:
        start, end = features.voicedSegments[0][0], features.voicedSegments[-1][1]
    else:
        start, end = 0.0, features.durationSeconds
    weights = np.array([_letter_count(w) for w in words], dtype=float)
    bounds = start + (end - start) * np.concatenate([[0.0], np.cumsum(weights) / weights.sum()])
    return [(float(bounds[i]), float(bounds[i + 1])) for i in range(len(words))]


def _span_pitch(features: AudioFeatures, start: float, end: float) -> _SpanPitch | None:
    values = [v for t, v in zip(features.pitchTimestamps, features.pitchContour) if start <= t <= end]
    if len(values) < 6:
        return None
    third = len(values) // 3
    return _SpanPitch(
        level=float(np.median(values)),
        movement=float(np.median(values[-third:]) - np.median(values[:third])),
    )


def _describe_movement(movement: float) -> str:
    if movement >= _MOVEMENT_THRESHOLD:
        return "rises"
    if movement <= -_MOVEMENT_THRESHOLD:
        return "falls"
    return "stays level"


def pitch_differences(words: list[str], user: AudioFeatures, reference: AudioFeatures) -> list[str]:
    """Deterministic, measured melody differences per word — handed to the AI
    as facts to phrase for the learner, because audio LLMs judge pitch
    poorly. Returns at most a few of the clearest differences, in word order."""
    if not words:
        return []

    found: list[tuple[float, int, str]] = []
    for index, ((u_start, u_end), (r_start, r_end)) in enumerate(
        zip(_word_spans(user, words), _word_spans(reference, words))
    ):
        u = _span_pitch(user, u_start, u_end)
        r = _span_pitch(reference, r_start, r_end)
        if u is None or r is None:
            continue
        word = words[index]

        u_move, r_move = _describe_movement(u.movement), _describe_movement(r.movement)
        if u_move != r_move:
            found.append(
                (abs(u.movement - r.movement), index, f"{word}: the reciter's voice {r_move}, yours {u_move}")
            )

        level_diff = u.level - r.level
        if abs(level_diff) >= _LEVEL_THRESHOLD:
            direction = "higher" if level_diff > 0 else "lower"
            strength = "much " if abs(level_diff) >= 2 * _LEVEL_THRESHOLD else ""
            found.append(
                (
                    abs(level_diff),
                    index,
                    f"{word}: you are {strength}{direction} than the reciter, relative to your own normal pitch",
                )
            )

    clearest = sorted(found, key=lambda item: item[0], reverse=True)[:_MAX_HINTS]
    return [hint for _, _, hint in sorted(clearest, key=lambda item: item[1])]
