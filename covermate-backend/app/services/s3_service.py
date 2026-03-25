"""
S3 Service – Handles file uploads to AWS S3 and generates presigned URLs.
"""

import boto3
import os
from dotenv import load_dotenv
from botocore.exceptions import ClientError
from botocore.config import Config

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

from botocore.config import Config

s3 = boto3.client(
    "s3",
    aws_access_key_id     = os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name           = os.getenv("AWS_REGION", "eu-north-1"),
    config                = Config(signature_version="s3v4"),
    endpoint_url          = f"https://s3.{os.getenv('AWS_REGION', 'eu-north-1')}.amazonaws.com",
)

BUCKET = os.getenv("S3_BUCKET_NAME", "covermate-insurance-docs")


def upload_file_to_s3(file, folder: str) -> str:
    """
    Upload a file to S3 and return its permanent S3 key URL.
    Files are private — use get_presigned_url() to view them.
    """
    file_key = f"{folder}/{file.filename}"

    try:
        s3.upload_fileobj(
            file.file,
            BUCKET,
            file_key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")

    region = os.getenv("AWS_REGION", "eu-north-1")
    return f"https://{BUCKET}.s3.{region}.amazonaws.com/{file_key}"


def get_presigned_url(file_url: str, expiry_seconds: int = 3600) -> str:
    """
    Generate a temporary presigned URL for a private S3 file.
    Default expiry: 1 hour.
    """
    from urllib.parse import urlparse, unquote

    # Parse the URL properly — handles spaces and special characters
    parsed   = urlparse(file_url)
    # path is like /claims/9/noc%20form%20iit%20h.pdf → decode → claims/9/noc form iit h.pdf
    file_key = unquote(parsed.path.lstrip("/"))

    try:
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": file_key},
            ExpiresIn=expiry_seconds,
        )
        return presigned_url
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned URL: {e}")