from abc import ABC, abstractmethod

from app.models.quran import Ayah, ReferenceAudio, Surah
from app.models.reciter import Reciter


class QuranAudioProvider(ABC):
    """Boundary between the analysis engine and whatever supplies Quran
    reciters/text/reference audio. `UmmahApiProvider` is the only
    implementation today; swapping providers later means writing a new class
    here, not touching `ReferenceFeatureService` or the analysis engine."""

    @abstractmethod
    async def list_reciters(self) -> list[Reciter]: ...

    @abstractmethod
    async def list_surahs(self) -> list[Surah]: ...

    @abstractmethod
    async def get_ayah(self, surah_number: int, ayah_number: int) -> Ayah: ...

    @abstractmethod
    async def get_surah_ayahs(self, surah_number: int) -> list[Ayah]:
        """All ayat of a surah in one call — used for the Ayah List screen so
        showing Al-Baqarah doesn't mean 286 individual requests."""
        ...

    @abstractmethod
    async def get_reference_audio(self, surah_number: int, ayah_number: int) -> list[ReferenceAudio]:
        """Audio URLs for every reciter for this ayah (some may be None — not every reciter has every ayah)."""
        ...
