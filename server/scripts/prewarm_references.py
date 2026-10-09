"""Prewarm reference features for popular reciter/surah combinations so the
first real user never waits for reference download + analysis.

Usage:
    python scripts/prewarm_references.py --reciter 9 --surah 1
    python scripts/prewarm_references.py --reciter 9 --reciter 1 --surah 1

Reciter ids and surah numbers are UmmahAPI's own ids (see GET /api/v1/reciters
and /api/v1/surahs) — this deliberately does NOT prewarm every reciter x all
114 surahs x every ayah; that would be wasteful. Pick what's actually popular.
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.dependencies import get_provider, get_reference_feature_service  # noqa: E402
from app.providers.ummah_api_provider import UmmahApiError  # noqa: E402
from app.services.reference_feature_service import ReferenceUnavailableError  # noqa: E402


async def prewarm(reciter_ids: list[str], surah_numbers: list[int]) -> None:
    provider = get_provider()
    service = get_reference_feature_service()
    surahs = {s.number: s for s in await provider.list_surahs()}

    for surah_number in surah_numbers:
        surah = surahs.get(surah_number)
        if surah is None:
            print(f"  Surah {surah_number} not found, skipping.")
            continue

        for reciter_id in reciter_ids:
            print(f"Surah {surah_number} ({surah.transliteratedName}), reciter {reciter_id}:")
            for ayah_number in range(1, surah.ayahCount + 1):
                try:
                    await service.get_or_create(reciter_id, surah_number, ayah_number)
                    print(f"  ayah {ayah_number}: ok")
                except (ReferenceUnavailableError, UmmahApiError) as error:
                    print(f"  ayah {ayah_number}: unavailable ({error})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reciter", action="append", required=True, help="UmmahAPI reciter id, repeatable")
    parser.add_argument("--surah", action="append", type=int, required=True, help="Surah number, repeatable")
    args = parser.parse_args()

    asyncio.run(prewarm(args.reciter, args.surah))


if __name__ == "__main__":
    main()
