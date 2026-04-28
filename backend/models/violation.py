from pydantic import BaseModel
from typing import Optional

class ViolationCreate(BaseModel):
    assetId: str
    orgId: str
    infringingUrl: str
    platform: str
    sharerHandle: str
    confidenceScore: float
    detectionSignal: str

class GeminiClassification(BaseModel):
    violationType: str
    severity: str
    reasoning: str
    isWhitelisted: bool
    recommendedAction: str

class ViolationResponse(BaseModel):
    violationId: str
    assetId: str
    orgId: str
    detectedAt: str
    infringingUrl: str
    platform: str
    sharerHandle: str
    confidenceScore: float
    detectionSignal: str
    geminiClassification: Optional[GeminiClassification]
    dmcaStatus: str
