"""Manual smoke test (not pytest) — proves the reference feature pipeline
works end-to-end against real UmmahAPI + real DSP, and that the second call
reuses the stored file instead of re-downloading/re-analyzing."""

import asyncio
import time

from app.dependencies import get_reference_feature_service
from app.providers.ummah_api_provider import UmmahApiProvider


async def main() -> None:
    service = get_reference_feature_service()

    t0 = time.monotonic()
    features_1 = await service.get_or_create(reciter_id="9", surah_number=1, ayah_number=1)
    t1 = time.monotonic()
    print(f"First call (expected: download + analyze): {t1 - t0:.2f}s")
    print(f"  duration={features_1.durationSeconds:.2f}s pitch_points={len(features_1.pitchContour)} "
          f"voiced_segments={len(features_1.voicedSegments)} pauses={features_1.pauseCount}")

    t2 = time.monotonic()
    features_2 = await service.get_or_create(reciter_id="9", surah_number=1, ayah_number=1)
    t3 = time.monotonic()
    print(f"Second call (expected: instant, cache hit): {t3 - t2:.2f}s")

    assert features_1 == features_2, "Cached features should be identical to the first extraction"
    assert (t3 - t2) < (t1 - t0) / 3, "Second call should be dramatically faster (cache hit, no download/analysis)"
    print("PASS: reference features reused on second call.")


if __name__ == "__main__":
    asyncio.run(main())
