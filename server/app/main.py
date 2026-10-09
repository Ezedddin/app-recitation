from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analyze, quran, reciters

app = FastAPI(title="App Recitatie Analysis Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reciters.router)
app.include_router(quran.router)
app.include_router(analyze.router)


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}
