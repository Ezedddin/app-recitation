from functools import lru_cache

from app.config import settings
from app.providers.quran_audio_provider import QuranAudioProvider
from app.providers.ummah_api_provider import UmmahApiProvider
from app.services.analysis_engine import AnalysisEngine
from app.services.pronunciation_service import PronunciationService
from app.services.reference_feature_service import ReferenceFeatureService
from app.storage.reference_store import ReferenceFeatureStore


@lru_cache
def get_provider() -> QuranAudioProvider:
    return UmmahApiProvider()


@lru_cache
def get_reference_store() -> ReferenceFeatureStore:
    return ReferenceFeatureStore(settings.reference_features_dir)


@lru_cache
def get_reference_feature_service() -> ReferenceFeatureService:
    return ReferenceFeatureService(get_provider(), get_reference_store())


@lru_cache
def get_pronunciation_service() -> PronunciationService:
    return PronunciationService()


@lru_cache
def get_analysis_engine() -> AnalysisEngine:
    return AnalysisEngine(get_provider(), get_reference_feature_service(), get_pronunciation_service())
