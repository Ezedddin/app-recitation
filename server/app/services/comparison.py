import librosa
import numpy as np

from app.models.analysis import StyleScores
from app.models.features import AudioFeatures


def _resample(values: list[float], target_len: int) -> np.ndarray:
    if len(values) == 0:
        return np.zeros(target_len)
    x_old = np.linspace(0, 1, num=len(values))
    x_new = np.linspace(0, 1, num=target_len)
    return np.interp(x_new, x_old, values)


def _dtw_distance(a: np.ndarray, b: np.ndarray) -> float:
    d_matrix, warp_path = librosa.sequence.dtw(X=a.reshape(1, -1), Y=b.reshape(1, -1))
    return float(d_matrix[-1, -1] / max(len(warp_path), 1))


def _score_from_distance(distance: float, scale: float) -> float:
    return float(np.clip(100.0 * np.exp(-distance / scale), 0.0, 100.0))


def compare_features(user: AudioFeatures, reference: AudioFeatures) -> StyleScores:
    """A real, if intentionally simple, heuristic DSP comparison — dynamic
    time warping on the pitch/pacing contours plus a duration ratio. This is
    not a peer-reviewed music-similarity model; it's documented here as
    exactly what it is so nobody mistakes it for more than that.
    """
    resample_len = 60
    user_pitch = _resample(user.pitchContour, resample_len)
    ref_pitch = _resample(reference.pitchContour, resample_len)

    pitch_score = _score_from_distance(_dtw_distance(user_pitch, ref_pitch), scale=8.0)

    if np.std(user_pitch) > 0 and np.std(ref_pitch) > 0:
        correlation = float(np.corrcoef(user_pitch, ref_pitch)[0, 1])
    else:
        correlation = 0.0
    melody_score = float(np.clip((correlation + 1) / 2 * 100, 0.0, 100.0))

    ref_duration = max(reference.durationSeconds, 0.01)
    duration_ratio_error = abs(user.durationSeconds - reference.durationSeconds) / ref_duration
    timing_score = float(np.clip(100 * (1 - duration_ratio_error), 0.0, 100.0))

    user_segment_durations = [end - start for start, end in user.voicedSegments]
    ref_segment_durations = [end - start for start, end in reference.voicedSegments]
    if user_segment_durations and ref_segment_durations:
        # Scale calibrated on real recitations (5 professional reciters x 11
        # ayat): two different pros on the same ayah land around a median of
        # ~84, a mismatched ayah around ~63. The previous 0.5 scored most pro
        # pairs near zero.
        rhythm_score = _score_from_distance(
            _dtw_distance(_resample(user_segment_durations, 20), _resample(ref_segment_durations, 20)),
            scale=4.0,
        )
    else:
        rhythm_score = 50.0

    similarity = float(np.mean([pitch_score, rhythm_score, timing_score, melody_score]))

    return StyleScores(
        pitch=round(pitch_score, 1),
        rhythm=round(rhythm_score, 1),
        timing=round(timing_score, 1),
        melody=round(melody_score, 1),
        similarity=round(similarity, 1),
    )
