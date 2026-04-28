from fastapi import APIRouter, HTTPException, Body
from firebase_admin import firestore
from datetime import datetime
import uuid
import logging

from services.gemini import gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_STATUSES = {"draft", "sent", "acknowledged", "resolved"}


@router.post("/{violation_id}/generate")
async def generate_dmca(violation_id: str):
    """Generate a Gemini-powered DMCA notice for a violation."""
    try:
        db = firestore.client()

        # --- Fetch violation ---
        violation_doc = db.collection("violations").document(violation_id).get()
        if not violation_doc.exists:
            raise HTTPException(status_code=404, detail="Violation not found")
        violation = violation_doc.to_dict()

        # --- Fetch asset ---
        asset_doc = db.collection("assets").document(violation["assetId"]).get()
        if not asset_doc.exists:
            raise HTTPException(status_code=404, detail="Associated asset not found")
        asset = asset_doc.to_dict()

        # --- Fetch organization (fall back gracefully if no org doc) ---
        org_doc = db.collection("organizations").document(violation["orgId"]).get()
        org = org_doc.to_dict() if org_doc.exists else {}
        org_name = org.get("name", violation["orgId"])
        org_email = org.get("email", f"legal@{violation['orgId'].replace(' ', '').lower()}.com")

        violation_type = (
            violation.get("geminiClassification", {}).get("violationType", "unauthorized_redistribution")
        )

        # --- Call Gemini ---
        logger.info(f"Calling Gemini generate_dmca_notice for violation {violation_id}")
        notice_text = await gemini_service.generate_dmca_notice(
            org_name=org_name,
            org_email=org_email,
            asset_filename=asset.get("filename", "unknown"),
            asset_id=asset.get("assetId", violation["assetId"]),
            protected_url=asset.get("protectedFileUrl", ""),
            infringing_url=violation.get("infringingUrl", ""),
            platform=violation.get("platform", ""),
            sharer_handle=violation.get("sharerHandle", ""),
            violation_type=violation_type,
            detected_at=violation.get("detectedAt", datetime.utcnow().isoformat())
        )

        # --- Create DMCA notice document ---
        notice_id = str(uuid.uuid4())
        notice_doc = {
            "noticeId": notice_id,
            "violationId": violation_id,
            "assetId": violation["assetId"],
            "orgId": violation["orgId"],
            "generatedAt": datetime.utcnow().isoformat(),
            "noticeText": notice_text,
            "status": "draft"
        }
        db.collection("dmca_notices").document(notice_id).set(notice_doc)
        logger.info(f"DMCA notice {notice_id} saved to Firestore")

        # --- Update violation dmcaStatus ---
        db.collection("violations").document(violation_id).update(
            {"dmcaStatus": "drafted", "dmcaNoticeId": notice_id}
        )
        logger.info(f"Violation {violation_id} dmcaStatus updated to 'drafted'")

        return notice_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"generate_dmca failed for violation {violation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_dmca_notices(orgId: str):
    """List all DMCA notices for an organization, newest first."""
    try:
        db = firestore.client()
        docs = db.collection("dmca_notices").where("orgId", "==", orgId).stream()

        notices = [doc.to_dict() for doc in docs]
        notices.sort(key=lambda n: n.get("generatedAt", ""), reverse=True)
        return notices
    except Exception as e:
        logger.error(f"list_dmca_notices failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{notice_id}/status")
async def update_dmca_status(notice_id: str, status: str = Body(..., embed=True)):
    """Update the status of a DMCA notice and sync to the associated violation."""
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Must be one of: {sorted(VALID_STATUSES)}"
        )

    try:
        db = firestore.client()

        notice_ref = db.collection("dmca_notices").document(notice_id)
        notice_doc = notice_ref.get()
        if not notice_doc.exists:
            raise HTTPException(status_code=404, detail="DMCA notice not found")

        notice = notice_doc.to_dict()

        # Update the notice document
        notice_ref.update({"status": status, "updatedAt": datetime.utcnow().isoformat()})

        # Sync dmcaStatus on the associated violation
        violation_id = notice.get("violationId")
        if violation_id:
            db.collection("violations").document(violation_id).update(
                {"dmcaStatus": status}
            )
            logger.info(f"Synced violation {violation_id} dmcaStatus → '{status}'")

        updated = notice_ref.get().to_dict()
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_dmca_status failed for notice {notice_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
