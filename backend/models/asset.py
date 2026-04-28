from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssetCreate(BaseModel):
    orgId: str
    filename: str

class AssetResponse(BaseModel):
    assetId: str
    orgId: str
    filename: str
    pHash: str
    watermarkPayload: str
    uploadedAt: str
    protectedFileUrl: str
    originalFileUrl: str
    status: str
    signalA: str
    signalB: dict

class AssetListItem(BaseModel):
    assetId: str
    filename: str
    uploadedAt: str
    status: str
    violationCount: int
