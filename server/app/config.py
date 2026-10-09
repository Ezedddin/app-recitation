from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Optional — UmmahAPI works anonymously; a key only raises the rate limit.
    ummahapi_key: str | None = None
    ummahapi_base_url: str = "https://ummahapi.com/api"

    # Required for pronunciation/Tajweed scoring and coaching text. Analysis
    # requests fail with a clear error (never fake results) if this is unset.
    openai_api_key: str | None = None
    # "gpt-4o-audio-preview" (the name in most docs at build time) 404'd on
    # the account this was tested with — `gpt-audio` is what that account's
    # model list actually exposes for audio-capable chat completions.
    # Override via OPENAI_MODEL if your account differs.
    openai_model: str = "gpt-audio"

    reference_features_dir: Path = SERVER_ROOT / "reference_features"
    # v2: switched pitch extraction from librosa.pyin to librosa.yin + an
    # energy-based voicing gate (pyin was ~35s per short ayah clip; yin is
    # near-instant). Bumping this deliberately regenerates references —
    # normal requests never do this automatically.
    reference_analysis_version: int = 2

    # Ayah clips cut from mp3quran full-surah audio (see mp3quran_clip_source.py).
    audio_clip_dir: Path = SERVER_ROOT / "audio_clips"

    cors_origins: list[str] = ["*"]


settings = Settings()
