"""
Service handling storage operations.
"""

from google.cloud import storage
import firebase_admin
from firebase_admin import storage as firebase_storage
import os
import uuid
import io
import logging
from fastapi import HTTPException
import httpx

logger = logging.getLogger(__name__)

class StorageService:
    async def upload_file(self, file_bytes: bytes, destination_path: str, content_type: str = 'image/jpeg') -> str:
        logger.info(f"upload_file: Uploading to {destination_path}")
        try:
            bucket = firebase_storage.bucket()
            blob = bucket.blob(destination_path)
            blob.upload_from_string(file_bytes, content_type=content_type)
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error(f"upload_file: Failed - {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")

    async def upload_asset(self, file_bytes: bytes, asset_id: str, is_protected: bool = False) -> str:
        if is_protected:
            destination_path = f"assets/protected/{asset_id}/protected.jpg"
        else:
            destination_path = f"assets/original/{asset_id}/original.jpg"
        
        return await self.upload_file(file_bytes, destination_path)

    async def download_file(self, gcs_url: str) -> bytes:
        logger.info(f"download_file: Downloading from {gcs_url}")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(gcs_url)
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.error(f"download_file: Failed - {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

storage_service = StorageService()
