from pydantic import BaseModel


class Reciter(BaseModel):
    """Mirrors the RN `Reciter` type (src/types/reciter.ts). Audio availability
    isn't a fixed reciter property in UmmahAPI — it's resolved per ayah
    (some reciters are missing specific ayat), so it isn't modeled here."""

    id: str
    name: str
    nameArabic: str
    style: str
