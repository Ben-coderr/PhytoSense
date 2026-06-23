import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from .routers import plants

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PhytoSense API",
    description="API for identifying medicinal plants and their properties",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants.router)

@app.get("/")
def root():
    return {"message": "Welcome to PhytoSense API. Visit /docs for documentation."}
