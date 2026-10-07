import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.connection import engine, Base
from .api.v1 import health, plants, identify, research, recommend, cultivation, sync, diagnose

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PhytoSense v2 Resilient API",
    description="Fault-tolerant multi-provider API for botanical identification, phytochemical analysis, and pharmacology prediction.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# v1 Routers (For Mobile & modern API clients)
app.include_router(health.router, prefix="/v1")
app.include_router(plants.router, prefix="/v1")
app.include_router(identify.router, prefix="/v1")
app.include_router(research.router, prefix="/v1")
app.include_router(recommend.router, prefix="/v1")
app.include_router(cultivation.router, prefix="/v1")
app.include_router(sync.router, prefix="/v1")
app.include_router(diagnose.router, prefix="/v1")

# Backward-Compatibility Routers (Preserves existing web app routes at /api/plants/...)
app.include_router(plants.router, prefix="/api")
app.include_router(identify.router, prefix="/api/plants")
app.include_router(research.router, prefix="/api/plants")

@app.get("/")
def root():
    return {
        "name": "PhytoSense v2 API",
        "status": "operational",
        "docs": "/docs",
        "health": "/v1/health",
        "providers_health": "/v1/health/providers"
    }

@app.get("/health")
def health_alias():
    return {
        "status": "healthy",
        "version": "2.0.0"
    }

