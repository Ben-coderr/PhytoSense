import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/sync", tags=["sync"])

def _get_project_root() -> Path:
    curr = Path(__file__).resolve()
    # Go up from services/api/app/api/v1/sync.py -> root is 5 levels up
    return curr.parents[4]

@router.get("/manifest")
def get_sync_manifest():
    root = _get_project_root()
    manifest_path = root / "data" / "curated" / "manifest.json"
    if not manifest_path.exists():
        # Fallback search
        manifest_path = Path("data/curated/manifest.json")

    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Manifest not found")

    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/db")
def download_sqlite_db():
    root = _get_project_root()
    db_path = root / "data" / "curated" / "plants_v2.sqlite"
    if not db_path.exists():
        db_path = Path("data/curated/plants_v2.sqlite")

    if not db_path.exists():
        raise HTTPException(status_code=404, detail="SQLite database not found")

    return FileResponse(
        path=str(db_path),
        media_type="application/vnd.sqlite3",
        filename="plants_v2.sqlite"
    )
