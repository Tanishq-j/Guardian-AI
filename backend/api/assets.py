from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from firebase_admin import firestore
from datetime import datetime, timezone
import uuid
import os
import logging

from services.watermark import watermark_service
from services.fingerprint import fingerprint_service
from services.storage import storage_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register")
async def register_asset(
    file: UploadFile = File(...),
    orgId: str = Form(...)
):
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")
        
        file_bytes = await file.read()
        asset_id = str(uuid.uuid4())
        
        logger.info(f"Starting Signal A — DCT watermark embedding for asset {asset_id}")
        payload = watermark_service.generate_payload(asset_id)
        
        protected_bytes = watermark_service.embed_watermark(file_bytes, payload)
        logger.info(f"Signal A complete — watermark payload: {payload}")
        
        logger.info("Starting Signal B — Vision API neural fingerprint computation")
        fingerprint = fingerprint_service.compute_full_fingerprint(file_bytes)
        logger.info(f"Signal B complete — phash: {fingerprint['phash']}, labels detected: {len(fingerprint['vision']['labels'])}")
        
        original_url = await storage_service.upload_asset(file_bytes, asset_id, is_protected=False)
        protected_url = await storage_service.upload_asset(protected_bytes, asset_id, is_protected=True)
        
        doc_data = {
            "assetId": asset_id,
            "orgId": orgId,
            "filename": file.filename,
            "pHash": fingerprint["phash"],
            "watermarkPayload": payload,
            "signalA": {
                "method": "dwtDct",
                "payload": payload,
                "status": "embedded"
            },
            "signalB": {
                "phash": fingerprint["phash"],
                "labels": fingerprint["vision"]["labels"],
                "dominantColors": fingerprint["vision"]["dominant_colors"],
                "webEntities": fingerprint["vision"]["web_entities"],
                "fingerprintVector": fingerprint["vision"]["fingerprint_vector"],
                "computedAt": fingerprint["computed_at"]
            },
            "originalFileUrl": original_url,
            "protectedFileUrl": protected_url,
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "violationCount": 0
        }
        
        db = firestore.client()
        db.collection("assets").document(asset_id).set(doc_data)
        
        logger.info(f"Asset {asset_id} registered successfully in Firestore")
        
        return {
            "message": "Asset registered with dual-signal protection",
            "downloadUrl": protected_url,
            **doc_data
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"register_asset failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_assets(orgId: str):
    try:
        db = firestore.client()
        assets_ref = db.collection("assets").where("orgId", "==", orgId)
        docs = assets_ref.stream()
        
        assets = []
        for doc in docs:
            data = doc.to_dict()
            assets.append({
                "assetId": data.get("assetId"),
                "filename": data.get("filename"),
                "uploadedAt": data.get("uploadedAt"),
                "status": data.get("status"),
                "violationCount": data.get("violationCount"),
                "protectedFileUrl": data.get("protectedFileUrl"),
                "signalA_status": data.get("signalA", {}).get("status"),
                "signalB_phash": data.get("signalB", {}).get("phash")
            })
        return assets
    except Exception as e:
        logger.error(f"list_assets failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{asset_id}")
async def get_asset(asset_id: str):
    try:
        db = firestore.client()
        doc_ref = db.collection("assets").document(asset_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Asset not found")
        return doc.to_dict()
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"get_asset failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{asset_id}/verify-watermark")
async def verify_watermark(asset_id: str):
    try:
        db = firestore.client()
        doc_ref = db.collection("assets").document(asset_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        data = doc.to_dict()
        protected_url = data.get("protectedFileUrl")
        stored_payload = data.get("watermarkPayload")
        
        if not protected_url or not stored_payload:
            raise HTTPException(status_code=400, detail="Asset missing protected URL or payload")
            
        downloaded_bytes = await storage_service.download_file(protected_url)
        extracted = watermark_service.extract_watermark(downloaded_bytes)
        verified = watermark_service.verify_watermark(downloaded_bytes, stored_payload)
        
        return {
            "assetId": asset_id,
            "watermarkVerified": verified,
            "expectedPayload": stored_payload,
            "extractedPayload": extracted,
            "signalA": "verified" if verified else "not_verified"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"verify_watermark failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
