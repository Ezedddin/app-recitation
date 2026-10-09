from pydantic import BaseModel


class Surah(BaseModel):
    id: str
    number: int
    arabicName: str
    transliteratedName: str
    englishName: str
    ayahCount: int


class Ayah(BaseModel):
    surahId: str
    number: int
    arabicText: str
    words: list[str]


class ReferenceAudio(BaseModel):
    reciterId: str
    ayahAudioUrl: str | None
    surahAudioUrl: str | None
