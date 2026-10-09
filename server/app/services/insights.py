from app.models.analysis import CoachInsight, CorrectnessScores, StyleScores, WordAnalysis


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


def build_style_insight(words: list[WordAnalysis]) -> CoachInsight | None:
    """Deterministic, templated — no LLM call needed for a style-side insight
    since the pitch score itself is already real (DSP-derived)."""
    if not words:
        return None
    weakest = min(words, key=lambda w: w.pitchScore)
    return CoachInsight(
        id=f"pitch-{weakest.index}",
        headline=f"The biggest style opportunity is your pitch movement during {weakest.arabicText}.",
        detail=weakest.feedback,
        relatedWordIndex=weakest.index,
    )


def build_overall_insight(correctness: CorrectnessScores, style: StyleScores, overall_score: float) -> CoachInsight:
    return CoachInsight(id="overall", headline=_overall_headline(overall_score), detail=_overall_detail(correctness, style))
