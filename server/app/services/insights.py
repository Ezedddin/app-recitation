from app.models.analysis import CoachInsight, CorrectnessScores, StyleScores


def _overall_headline(score: float) -> str:
    if score >= 90:
        return "Beautiful recitation — this is very close to mastery."
    if score >= 78:
        return "Solid recitation, with a couple of clear areas to polish."
    if score >= 62:
        return "Good foundation — a few focused fixes will make a big difference."
    return "Nice attempt — let's build up the basics together."


def _overall_detail(correctness: CorrectnessScores, style: StyleScores) -> str:
    correctness_avg = (correctness.pronunciation + correctness.tajweed) / 2
    style_avg = (style.pitch + style.rhythm + style.timing + style.melody) / 4
    if correctness_avg >= style_avg + 8:
        return (
            "Your pronunciation and Tajweed are ahead of your style match to the reciter — "
            "that's the more important part, well done."
        )
    if style_avg >= correctness_avg + 8:
        return "You already sound close to your chosen reciter's style — now bring pronunciation and Tajweed up to match."
    return "Correctness and style are fairly balanced right now — keep practicing both together."


_STYLE_TIPS = {
    "pitch": (
        "Your pitch is the biggest style gap to your reciter.",
        "Listen to where the reference voice rises and falls, then follow those movements within your own range.",
    ),
    "rhythm": (
        "Your rhythm is the biggest style gap to your reciter.",
        "Pay attention to where the reference pauses and how long each phrase lasts, and mirror that pacing.",
    ),
    "timing": (
        "Your overall timing is the biggest style gap to your reciter.",
        "Your recitation was noticeably faster or slower than the reference — try matching its total length.",
    ),
    "melody": (
        "Your melody is the biggest style gap to your reciter.",
        "The overall shape of your tune differs from the reference — replay it and hum along before reciting.",
    ),
}


def build_style_insight(style: StyleScores) -> CoachInsight:
    """Deterministic, templated — no LLM call needed for a style-side insight
    since the style scores themselves are real (DSP-derived). Points at the
    weakest whole-recitation dimension; there's no per-word style score to
    attribute it to a specific word honestly."""
    scores = {"pitch": style.pitch, "rhythm": style.rhythm, "timing": style.timing, "melody": style.melody}
    weakest = min(scores, key=scores.__getitem__)
    headline, detail = _STYLE_TIPS[weakest]
    return CoachInsight(id=f"style-{weakest}", headline=headline, detail=detail)


def build_overall_insight(correctness: CorrectnessScores, style: StyleScores, overall_score: float) -> CoachInsight:
    return CoachInsight(id="overall", headline=_overall_headline(overall_score), detail=_overall_detail(correctness, style))
