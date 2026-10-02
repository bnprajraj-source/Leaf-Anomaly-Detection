"""
Bulk CSV Import Routes
======================
POST /import/plants      — Import plants from CSV
POST /import/validate    — Validate CSV before import
GET  /import/template    — Download CSV template
"""

import csv
import io
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.database import get_database, is_db_connected, PLANTS_COLLECTION, LOCATIONS_COLLECTION
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["CSV Import"])

# CSV column mappings
REQUIRED_COLUMNS = ["name"]
OPTIONAL_COLUMNS = ["species", "location", "notes", "tags"]


@router.get("/template")
async def download_csv_template():
    """Download a CSV template for importing plants."""
    template = "name,species,location,notes,tags\n"
    template += "Tomato,Tomato,Back Garden,Vine variety,vegetable\n"
    template += "Basil,Basil,Herb Pot,Culinary herb,herb\n"
    template += "Rose,Rose,Front Yard,Climbing rose,flower\n"

    return StreamingResponse(
        iter([template]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plant_import_template.csv"},
    )


@router.post("/validate")
async def validate_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Validate a CSV file before import.
    Returns errors and warnings without actually importing.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no headers")

    # Check required columns
    missing = [col for col in REQUIRED_COLUMNS if col not in reader.fieldnames]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing)}")

    rows = list(reader)
    errors = []
    warnings = []
    valid_count = 0

    for i, row in enumerate(rows, 1):
        row_errors = []

        if not row.get("name", "").strip():
            row_errors.append(f"Row {i}: Name is required")

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_count += 1

        # Warnings
        if row.get("location"):
            warnings.append(f"Row {i}: Location '{row['location']}' will be created if it doesn't exist")

    return {
        "filename": file.filename,
        "total_rows": len(rows),
        "valid_rows": valid_count,
        "error_rows": len(rows) - valid_count,
        "errors": errors[:50],
        "warnings": warnings[:50],
        "columns_found": list(reader.fieldnames),
        "ready_to_import": len(errors) == 0,
    }


@router.post("/plants")
async def import_plants_from_csv(
    file: UploadFile = File(...),
    dry_run: bool = False,
    current_user: dict = Depends(get_current_user),
):
    """
    Import plants from a CSV file.
    Set dry_run=true to preview without saving.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    missing = [col for col in REQUIRED_COLUMNS if col not in reader.fieldnames]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing)}")

    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    rows = list(reader)
    imported = 0
    skipped = 0
    errors = []
    created_locations = set()

    for i, row in enumerate(rows, 1):
        name = row.get("name", "").strip()
        if not name:
            errors.append(f"Row {i}: Empty name, skipped")
            skipped += 1
            continue

        # Check for duplicate
        existing = await db[PLANTS_COLLECTION].find_one({"user_id": user_id, "name": name})
        if existing:
            errors.append(f"Row {i}: Plant '{name}' already exists, skipped")
            skipped += 1
            continue

        # Handle location
        location_id = None
        location_name = row.get("location", "").strip()
        if location_name:
            location = await db[LOCATIONS_COLLECTION].find_one({
                "user_id": user_id,
                "name": {"$regex": f"^{location_name}$", "$options": "i"}
            })
            if not location and not dry_run:
                # Create location
                loc_doc = {
                    "user_id": user_id,
                    "name": location_name,
                    "type": "garden",
                    "plant_count": 0,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
                loc_result = await db[LOCATIONS_COLLECTION].insert_one(loc_doc)
                location_id = str(loc_result.inserted_id)
                created_locations.add(location_name)
            elif location:
                location_id = str(location["_id"])

        # Handle tags
        tags = []
        tags_str = row.get("tags", "").strip()
        if tags_str:
            tags = [t.strip() for t in tags_str.split(",") if t.strip()]

        if not dry_run:
            plant_doc = {
                "user_id": user_id,
                "name": name,
                "species": row.get("species", "").strip() or None,
                "location_id": location_id,
                "notes": row.get("notes", "").strip() or None,
                "tags": tags,
                "health_status": "unknown",
                "scan_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            await db[PLANTS_COLLECTION].insert_one(plant_doc)

        imported += 1

    return {
        "dry_run": dry_run,
        "filename": file.filename,
        "total_rows": len(rows),
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:50],
        "created_locations": list(created_locations),
    }
