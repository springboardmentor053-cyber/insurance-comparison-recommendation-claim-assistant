import boto3
import os
import uuid
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from typing import List

# Load from environment
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "insurance-claims-documents")

# Validate credentials
if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
    raise ValueError("AWS credentials not set in environment variables")

# Create S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"]

async def upload_file_to_s3(file: UploadFile, claim_id: int, doc_type: str = "claim_document") -> str:
    """
    Upload a file to S3 and return its URL.
    - Validates file type
    - Generates unique filename under claims/{claim_id}/
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {ALLOWED_CONTENT_TYPES}"
        )

    # Create a safe filename
    original_name = file.filename.replace(" ", "_")
    ext = original_name.split(".")[-1] if "." in original_name else "bin"
    unique_filename = f"claims/{claim_id}/{uuid.uuid4()}.{ext}"

    try:
        # Upload to S3
        s3_client.upload_fileobj(
            file.file,
            S3_BUCKET_NAME,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type}
        )

        # Generate URL (adjust if bucket is private; use pre-signed URLs later)
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        return file_url
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")