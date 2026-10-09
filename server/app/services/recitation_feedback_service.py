import base64
import json
import re

from openai import AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError

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

You are a warm, experienced Quran recitation teacher. You get two recordings of the same passage plus \
its Arabic text: FIRST the reference reciter the student wants to learn from, THEN the student. Compare \
the student to the reciter and tell them what to focus on.

1. Score the student's recitation 0-100: were all words recited, in order, clearly and fluently, and how \
close is it to the reciter? 90+ very close to the reciter and accurate; 70-89 good with small slips; \
50-69 understandable but with noticeable mistakes or hesitation; below 50 major parts missing or unclear.

2. Melody tips — where to go up or down. You will be given MEASURED pitch differences per word from \
signal analysis. Pitch is hard to judge by ear, so base melody tips ONLY on those measurements: turn the \
clearest ones into short, practical instructions that quote the Arabic word, e.g. "On ٱلْحَمْدُ, let your \
voice rise like the reciter does instead of dropping." Never mention numbers, semitones or other \
technical terms — say "higher", "lower", "rise", "fall" or "stay level". If there are no measured \
differences, give no melody tips.

3. Letter tips — which letters to focus on. Listen to how the reciter pronounces each word and compare \
the student. Point out letters that clearly sound different, quoting the Arabic word and the letter, \
and describe how to make it sound like the reciter (e.g. "In ٱلرَّحِيمِ, make the ح come from deeper in \
the throat, as the reciter does."). Only mention differences you can clearly hear; if the student's \
letters match the reciter well, give no letter tips. Do not lecture about Tajweed rule names.

Respond with ONLY a JSON object matching exactly this shape:
{
  "score": <number 0-100>,
  "summary": <1-2 short, encouraging sentences in English on the overall recitation>,
  "melodyTips": [<0-3 short English sentences>],
  "letterTips": [<0-3 short English sentences>]
}
"""


class _AiResponse(BaseModel):
    score: float = Field(ge=0, le=100)
    summary: str
    melodyTips: list[str] = []
    letterTips: list[str] = []


class RecitationFeedback(BaseModel):
    score: float = Field(ge=0, le=100)
    feedback: str


# The prompt asks for at most 3, but the model doesn't always comply.
_MAX_TIPS_PER_SECTION = 3


def _compose_feedback(response: _AiResponse) -> str:
    """One text for the app's single feedback box: the summary, then the
    melody and letter tips as short bulleted sections when there are any."""
    parts = [response.summary.strip()]
    for title, tips in (("Melody", response.melodyTips), ("Letters", response.letterTips)):
        tips = [tip.strip() for tip in tips if tip.strip()][:_MAX_TIPS_PER_SECTION]
        if tips:
            parts.append(f"{title}\n" + "\n".join(f"• {tip}" for tip in tips))
    return "\n\n".join(parts)


def _audio_part(wav_path: str) -> dict:
    with open(wav_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return {"type": "input_audio", "input_audio": {"data": data, "format": "wav"}}


class RecitationFeedbackUnavailableError(RuntimeError):
    pass


class RecitationFeedbackService:
    """The ONLY place OpenAI is called: it hears the reference reciter and
    the user side by side and turns that, plus the DSP-measured pitch
    differences (pitch_guidance.py), into a score and coaching text.

    Live-tested with model="gpt-audio". Two things learned only by testing
    against a real key, not from docs: (1) that account's model list has no
    "gpt-4o-audio-preview" — "gpt-audio" is what's available; (2)
    `response_format: json_object` 400s on this model, and without it the
    model sometimes opens with a conversational aside before the JSON — the
    system prompt forbids that, and `_extract_json` pulls the {...} block
    out defensively either way.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def analyze(
        self, user_wav_path: str, reference_wav_path: str, arabic_text: str, pitch_differences: list[str]
    ) -> RecitationFeedback:
        if self._client is None:
            raise RecitationFeedbackUnavailableError(
                "OPENAI_API_KEY is not configured — recitation scoring is unavailable."
            )

        measured = "\n".join(f"- {line}" for line in pitch_differences) or "- none"
        prompt = (
            f"Passage text: {arabic_text}\n\n"
            f"Measured pitch differences (student vs. reciter):\n{measured}\n\n"
            "The first recording is the reciter, the second is the student. Output the JSON now."
        )

        sampling = {} if settings.openai_temperature is None else {"temperature": settings.openai_temperature}
        try:
            response = await self._client.chat.completions.create(
                **sampling,
                model=settings.openai_model,
                modalities=["text"],
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            _audio_part(reference_wav_path),
                            _audio_part(user_wav_path),
                        ],
                    },
                ],
            )
        except OpenAIError as error:
            raise RecitationFeedbackUnavailableError(f"OpenAI request failed: {error}") from error

        content = response.choices[0].message.content
        if not content:
            raise RecitationFeedbackUnavailableError("OpenAI returned an empty response.")

        try:
            ai = _AiResponse(**_extract_json(content))
            return RecitationFeedback(score=ai.score, feedback=_compose_feedback(ai))
        except (json.JSONDecodeError, TypeError, ValueError, ValidationError) as error:
            raise RecitationFeedbackUnavailableError(f"Could not parse OpenAI response: {error}") from error
