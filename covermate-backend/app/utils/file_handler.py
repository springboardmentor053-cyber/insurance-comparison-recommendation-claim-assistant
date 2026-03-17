import os
import shutil
from fastapi import HTTPException, UploadFile

UPLOAD_DIR = "uploads"

ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024 


BASE_URL = "http://127.0.0.1:8000/uploads"


def validate_file(file: UploadFile):
    """Check file type and size before saving."""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Only JPG, PNG, and PDF are allowed."
        )
        
        
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 10MB."
        )


    file.file.seek(0)
    return content


# ── Save file locally ──────────────────────────────────────────
def save_file(file: UploadFile, claim_id: int) -> str:

    # Validate first
    validate_file(file)
    
    claim_folder = os.path.join(UPLOAD_DIR, f"claim_{claim_id}")
    os.makedirs(claim_folder, exist_ok=True)

    file_path = os.path.join(claim_folder, file.filename)

    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return accessible URL
    file_url = f"{BASE_URL}/claim_{claim_id}/{file.filename}"
    return file_url