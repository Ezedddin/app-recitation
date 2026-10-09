import librosa
import numpy as np
import soundfile as sf


def convert_to_wav(input_path: str, output_path: str, sr: int = 16000) -> None:
    """Normalizes any input format (m4a from the app, mp3 from UmmahAPI, ...)
    to mono 16kHz wav. Requires ffmpeg (or another audioread-supported
    decoder) available on the host for compressed formats — librosa's
    default soundfile backend only reads uncompressed/FLAC/OGG directly.
    """
    y, _ = librosa.load(input_path, sr=sr, mono=True)
    sf.write(output_path, y, sr)


def concat_to_wav(input_paths: list[str], output_path: str, sr: int = 16000) -> None:
    """Joins several recordings (e.g. each ayah of a flowing-recitation
    range) into one mono 16kHz wav, in order."""
    parts = [librosa.load(path, sr=sr, mono=True)[0] for path in input_paths]
    sf.write(output_path, np.concatenate(parts), sr)
