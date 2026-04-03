import os
import shutil
from datetime import datetime
from fastapi import UploadFile, HTTPException
from typing import Optional

# Directory where files will be stored
UPLOAD_DIR = "uploads"

# Allowed file types
ALLOWED_EXTENSIONS = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
    'image/gif': ['.gif']
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes


def create_upload_directory():
    """Create uploads directory if it doesn't exist"""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)


def validate_file(file: UploadFile) -> bool:
    """
    Validate file type and size
    Returns True if valid, raises HTTPException if invalid
    """
    # Check file type
    if file.content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: JPG, PNG, PDF, GIF"
        )
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS[file.content_type]:
        raise HTTPException(
            status_code=400,
            detail=f"File extension doesn't match content type"
        )
    
    return True


def save_claim_document(file: UploadFile, claim_id: int, file_type: str) -> dict:
    """
    Save uploaded file to local storage
    
    Args:
        file: UploadFile from FastAPI
        claim_id: ID of the claim
        file_type: Type of document (medical_bill, accident_photo, etc.)
    
    Returns:
        dict with file info: {file_name, file_path, file_size}
    """
    # Validate file
    validate_file(file)
    
    # Create uploads directory
    create_upload_directory()
    
    # Create claim-specific directory
    claim_dir = os.path.join(UPLOAD_DIR, f"claim_{claim_id}")
    if not os.path.exists(claim_dir):
        os.makedirs(claim_dir)
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_ext = os.path.splitext(file.filename)[1]
    new_filename = f"{file_type}_{timestamp}{file_ext}"
    
    # Full file path
    file_path = os.path.join(claim_dir, new_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        # Delete the file if too large
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 10MB"
        )
    
    return {
        "file_name": file.filename,
        "file_path": file_path,
        "file_size": file_size
    }


def delete_claim_document(file_path: str) -> bool:
    """
    Delete a file from storage
    
    Args:
        file_path: Path to the file
    
    Returns:
        True if deleted, False if file doesn't exist
    """
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False


def get_file_url(file_path: str) -> str:
    """
    Convert file path to URL for frontend access
    For local storage, we'll serve files via an endpoint
    
    Args:
        file_path: Local file path
    
    Returns:
        URL to access the file
    """
    # For now, return the path as-is
    # Later we'll create an endpoint to serve these files
    return file_path
