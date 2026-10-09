import base64
import json
import re

from openai import AsyncOpenAI, OpenAIError
from pydantic import BaseModel

from app.config import settings

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def _extract_json(content: str) -> dict:
    """`gpt-audio` doesn't support `response_format: json_object` (learned
    live — it 400s), so the model is only prompt-instructed to return JSON
    and occasionally wraps it in prose or a markdown fence. Pull out the
    first {...} block rather than assuming `content` is bare JSON."""
    match = _JSON_BLOCK_RE.search(content)
    if not match:
        raise ValueError("no JSON object found in response")
    return json.loads(match.group(0))

_SYSTEM_PROMPT = """You are a JSON API, not a conversational assistant — you are called \
programmatically and nothing reads a chatty reply. Your ENTIRE response must be a single valid JSON \
object and nothing else: no greeting, no "let me analyze this", no acknowledgement, no markdown code \
fence, no text before or after the JSON. Go straight to the final answer in your first and only message.

You are an expert Quran recitation coach specializing in Tajweed and Arabic pronunciation. You will be \
given a short audio recording of someone reciting a specific ayah, along with the ayah's correct \
Arabic text. Assess ONLY correctness — pronunciation accuracy and Tajweed rule application (madd, \
ghunnah, qalqalah, idgham, ikhfa, etc.). Do NOT assess pitch, rhythm, melody, or how closely they \
sound like any particular reciter — that is scored separately by audio signal processing, not by you.

Be encouraging but honest. Never claim certainty you don't have; if the audio is unclear, say so in \
your notes and score conservatively rather than guessing.

Respond with ONLY a JSON object matching exactly this shape:
{
  "pronunciation": <number 0-100>,
  "tajweed": <number 0-100>,
  "insights": [ { "headline": <short string>, "detail": <one sentence> } ],
  "words": [ { "arabicText": <string, copied exactly from the given ayah text, in order>,
               "status": "excellent" | "good" | "needsWork" | "practice",
               "feedback": <one short sentence specific to this word> } ]
}

"words" must cover every word of the given ayah text, in the same order, using the exact same text.
"""


class WordPronunciation(BaseModel):
    arabicText: str
    status: str
    feedback: str


class InsightDraft(BaseModel):
    headline: str
    detail: str


class PronunciationResult(BaseModel):
    pronunciation: float
    tajweed: float
    insights: list[InsightDraft]
    words: list[WordPronunciation]


class PronunciationServiceUnavailableError(RuntimeError):
    pass


class PronunciationService:
    """The ONLY place OpenAI is called, and only on the user's own recording
    — never on reference/imam audio (that's the deterministic DSP engine's
    job, see audio_features.py + comparison.py).

    Live-tested and working with model="gpt-audio". Two things learned only
    by testing against a real key, not from docs: (1) that account's model
    list has no "gpt-4o-audio-preview" — "gpt-audio" is what's available;
    (2) `response_format: json_object` 400s on this model, and without it
    the model sometimes opens with a conversational aside ("I'll analyze
    this...") before the JSON — the system prompt now explicitly forbids
    that, and `_extract_json` pulls the {...} block out defensively either way.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def analyze(self, wav_path: str, arabic_text: str) -> PronunciationResult:
        if self._client is None:
            raise PronunciationServiceUnavailableError(
                "OPENAI_API_KEY is not configured — pronunciation/Tajweed scoring is unavailable."
            )

        with open(wav_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        try:
            response = await self._client.chat.completions.create(
                model=settings.openai_model,
                modalities=["text"],
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Ayah text: {arabic_text}\n\nOutput the JSON now."},
                            {"type": "input_audio", "input_audio": {"data": audio_b64, "format": "wav"}},
                        ],
                    },
                ],
            )
        except OpenAIError as error:
            raise PronunciationServiceUnavailableError(f"OpenAI request failed: {error}") from error

        content = response.choices[0].message.content
        if not content:
            raise PronunciationServiceUnavailableError("OpenAI returned an empty response.")

        try:
            payload = _extract_json(content)
            return PronunciationResult(**payload)
        except (json.JSONDecodeError, TypeError, ValueError) as error:
            raise PronunciationServiceUnavailableError(f"Could not parse OpenAI response: {error}") from error
