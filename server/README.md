# Analysis backend

Real analysis engine for the app: UmmahAPI for Quran text/reciters/reference
audio, deterministic DSP (librosa) for pitch/rhythm/timing, OpenAI for
the overall score and feedback text on the user's own recording. No mock mode —
see the module docstrings in `app/` for how each piece fits together.

## Run it

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in OPENAI_API_KEY at minimum
uvicorn app.main:app --host 0.0.0.0 --port 8787
```

Requires `ffmpeg` on PATH (used by librosa/audioread to decode the app's
`.m4a` recordings and UmmahAPI's `.mp3` reference audio).

Reciters that UmmahAPI only has as full-surah audio (Bandar Baleela,
Abdullah Al-Buajan) get per-ayah clips cut from mp3quran.net using its
published ayah timings — served at `/api/v1/audio/...` and cached in
`audio_clips/` (see `app/providers/mp3quran_clip_source.py`).

The iOS Simulator reaches `http://localhost:8787` directly. A physical
device needs the Mac's LAN IP — set `EXPO_PUBLIC_API_BASE_URL` when starting
Expo.

## Prewarm popular references

```bash
python scripts/prewarm_references.py --reciter 9 --surah 1
```

## Tests

```bash
PYTHONPATH=. pytest tests/ -v                        # offline, fast — proves the caching/locking behavior
PYTHONPATH=. python tests/manual_reference_check.py   # hits real UmmahAPI + real DSP, not part of the suite
```
