from pathlib import Path

from app.models.features import ReferenceFeatureRecord


class ReferenceFeatureStore:
    """Permanent, reusable storage for reference (imam) audio features — one
    file per (provider, reciter, surah, ayah, analysisVersion). A dev-time
    filesystem implementation; swapping to object storage + a database later
    means replacing this class, not the analysis engine that calls it.
    """

    def __init__(self, root: Path) -> None:
        self.root = root

    def _path(self, provider: str, reciter_id: str, surah_number: int, ayah_number: int, version: int) -> Path:
        return self.root / provider / reciter_id / str(surah_number) / f"{ayah_number}.v{version}.json"

    def load(
        self, provider: str, reciter_id: str, surah_number: int, ayah_number: int, version: int
    ) -> ReferenceFeatureRecord | None:
        path = self._path(provider, reciter_id, surah_number, ayah_number, version)
        if not path.exists():
            return None
        return ReferenceFeatureRecord.model_validate_json(path.read_text())

    def save(self, record: ReferenceFeatureRecord) -> None:
        path = self._path(
            record.provider, record.reciterId, record.surahNumber, record.ayahNumber, record.analysisVersion
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(record.model_dump_json())
