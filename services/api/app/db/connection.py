import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate database in data/curated/plants.db, fallback to api/plants.db or local
curr_path = Path(__file__).resolve()
possible_locations = [
    curr_path.parents[4] / "data" / "curated" / "plants.db",  # Monorepo root / data / curated
    curr_path.parents[4] / "api" / "plants.db",               # Legacy location
    curr_path.parents[2] / "plants.db",                       # services/api/plants.db
    curr_path.parent / "plants.db",                           # services/api/app/db/plants.db
]

db_path = None
for loc in possible_locations:
    if loc.exists():
        db_path = loc
        break

if not db_path:
    # Default to data/curated/plants.db
    db_path = curr_path.parents[4] / "data" / "curated" / "plants.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
