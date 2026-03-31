
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


def upload_file_to_s3(file, original_filename: str, claim_id: int) -> str:
    """
    Upload a file to AWS S3 and return the public URL.
    Uses folder structure: claim_{claim_id}/{filename}
    """
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "bin"
    # To prevent overwriting files with the same name, use a small UUID
    unique_filename = f"{uuid.uuid4().hex[:8]}_{original_filename}"
    unique_key = f"claim_{claim_id}/{unique_filename}"

    s3 = get_s3_client()
    s3.upload_fileobj(
        file,
        settings.AWS_S3_BUCKET_NAME,
        unique_key,
        ExtraArgs={"ContentType": getattr(file, "content_type", "application/octet-stream")},
    )

    url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_key}"
    return url


def delete_file_from_s3(file_url: str):
    """
    Delete a file from AWS S3 using its public URL.
    """
    # Extract the key from the url
    # e.g., https://bucket-name.s3.ap-south-1.amazonaws.com/claim_123/file.jpg
    # We want "claim_123/file.jpg"
    try:
        bucket_prefix = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
        if file_url.startswith(bucket_prefix):
            key = file_url[len(bucket_prefix):]
            s3 = get_s3_client()
            s3.delete_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=key)
            return True
    except Exception as e:
        print(f"Error deleting file from S3: {e}")
    return False

def generate_presigned_url(file_url: str, expiration=3600) -> str:
    """
    Generate a presigned URL for an S3 object to allow temporary public access.
    """
    try:
        bucket_prefix = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
        if file_url.startswith(bucket_prefix):
            key = file_url[len(bucket_prefix):]
            s3 = get_s3_client()
            
            # Determine content type for the browser
            content_type = "application/octet-stream"
            lower_url = file_url.lower()
            if lower_url.endswith(".jpg") or lower_url.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif lower_url.endswith(".png"):
                content_type = "image/png"
            elif lower_url.endswith(".pdf"):
                content_type = "application/pdf"

            response = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_S3_BUCKET_NAME, 
                    'Key': key,
                    'ResponseContentDisposition': 'inline',
                    'ResponseContentType': content_type
                },
                ExpiresIn=expiration
            )
            return response
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
    return file_url
