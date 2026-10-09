import librosa
import numpy as np

from app.models.features import AudioFeatures


def extract_audio_features(file_path: str) -> AudioFeatures:
    """Real, deterministic DSP — no ML model, no guessing. Pitch via YIN
    (librosa.yin — the plain autocorrelation-based estimator, not the much
    slower probabilistic `pyin`: pyin took ~35s on a 3-second ayah clip in
    testing, which is too slow for a per-attempt request; yin is near-
    instant and accurate enough for coaching purposes). Voicing is gated by
    frame energy since plain yin has no built-in voiced/unvoiced detector.
    Pitch is normalized to semitones relative to this speaker's own median
    voiced pitch (never absolute Hz, per the "relative to your own range"
    product principle). Pauses/word-ish boundaries via energy-based silence split.
    """
    y, sr = librosa.load(file_path, sr=16000, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    frame_length = 2048
    hop_length = 512
    f0 = librosa.yin(
        y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"),
        sr=sr, frame_length=frame_length, hop_length=hop_length,
    )
    times = librosa.times_like(f0, sr=sr, hop_length=hop_length)

    frame_rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    voiced_threshold = float(np.max(frame_rms)) * 0.15 if len(frame_rms) else 0.0
    voiced_mask = frame_rms[: len(f0)] > voiced_threshold

    voiced_f0 = f0[voiced_mask]
    median_f0 = float(np.median(voiced_f0)) if len(voiced_f0) > 0 else 0.0

    pitch_contour: list[float] = []
    pitch_timestamps: list[float] = []
    if median_f0 > 0:
        for t, hz, voiced in zip(times, f0, voiced_mask):
            if not voiced or hz is None or np.isnan(hz) or hz <= 0:
                continue
            semitones = 12.0 * np.log2(hz / median_f0)
            pitch_contour.append(float(np.clip(semitones, -24.0, 24.0)))
            pitch_timestamps.append(float(t))

    rms = librosa.feature.rms(y=y)[0]
    energy_times = librosa.times_like(rms, sr=sr)

    intervals = librosa.effects.split(y, top_db=30)
    voiced_segments = [[float(start / sr), float(end / sr)] for start, end in intervals]

    pause_count = max(0, len(voiced_segments) - 1)
    pause_total = sum(
        voiced_segments[i][0] - voiced_segments[i - 1][1] for i in range(1, len(voiced_segments))
    )

    return AudioFeatures(
        durationSeconds=duration,
        pitchContour=pitch_contour,
        pitchTimestamps=pitch_timestamps,
        energyContour=[float(v) for v in rms],
        energyTimestamps=[float(t) for t in energy_times],
        voicedSegments=voiced_segments,
        pauseCount=pause_count,
        pauseTotalSeconds=float(pause_total),
    )
