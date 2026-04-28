from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from datetime import datetime, timedelta
import uuid
import logging

from services.gemini import gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_violations(orgId: str, severity: str = None):
    """List all violations for an org, optionally filtered by severity."""
    try:
        db = firestore.client()
        query = db.collection("violations").where("orgId", "==", orgId)
        docs = query.stream()

        violations = []
        for doc in docs:
            data = doc.to_dict()
            # Apply in-memory severity filter if provided (Firestore doesn't
            # support nested field ordering without a composite index)
            if severity:
                classification = data.get("geminiClassification", {})
                if classification.get("severity") != severity:
                    continue
            violations.append(data)

        # Sort by detectedAt descending (in-memory)
        violations.sort(
            key=lambda v: v.get("detectedAt", ""),
            reverse=True
        )
        return violations
    except Exception as e:
        logger.error(f"list_violations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{violation_id}")
async def get_violation(violation_id: str):
    """Fetch a single violation and include its associated asset info."""
    try:
        db = firestore.client()
        violation_ref = db.collection("violations").document(violation_id)
        violation_doc = violation_ref.get()

        if not violation_doc.exists:
            raise HTTPException(status_code=404, detail="Violation not found")

        violation = violation_doc.to_dict()

        # Enrich with asset data
        asset_id = violation.get("assetId")
        asset_data = {}
        if asset_id:
            asset_doc = db.collection("assets").document(asset_id).get()
            if asset_doc.exists:
                asset_data = asset_doc.to_dict()

        return {**violation, "asset": asset_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_violation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{violation_id}/classify")
async def classify_violation(violation_id: str):
    """Call Gemini to classify a violation and persist the result."""
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

        # --- Fetch organization (fall back to sensible defaults if no org doc) ---
        org_doc = db.collection("organizations").document(violation["orgId"]).get()
        org = org_doc.to_dict() if org_doc.exists else {}
        org_name = org.get("name", violation["orgId"])
        whitelist = org.get("whitelist", [])

        # --- Call Gemini ---
        logger.info(f"Calling Gemini classify_violation for {violation_id}")
        classification = await gemini_service.classify_violation(
            asset_filename=asset.get("filename", "unknown"),
            org_name=org_name,
            infringing_url=violation.get("infringingUrl", ""),
            platform=violation.get("platform", ""),
            sharer_handle=violation.get("sharerHandle", ""),
            detection_signal=violation.get("detectionSignal", ""),
            whitelist=whitelist,
            asset_labels=asset.get("signalB", {}).get("labels", [])
        )

        # --- Persist classification to Firestore ---
        db.collection("violations").document(violation_id).update({
            "geminiClassification": classification,
            "classifiedAt": datetime.utcnow().isoformat()
        })

        updated_violation = db.collection("violations").document(violation_id).get().to_dict()
        logger.info(f"Violation {violation_id} classified successfully")
        return updated_violation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"classify_violation failed for {violation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed")
async def seed_demo_violations(orgId: str, assetId: str):
    """Seed 4 realistic demo violations into Firestore for the given asset."""
    try:
        db = firestore.client()

        # Verify the asset exists
        asset_doc = db.collection("assets").document(assetId).get()
        if not asset_doc.exists:
            raise HTTPException(status_code=404, detail=f"Asset {assetId} not found")

        now = datetime.utcnow()

        violations = [
            {
                "violationId": str(uuid.uuid4()),
                "assetId": assetId,
                "orgId": orgId,
                "detectedAt": (now - timedelta(hours=2)).isoformat(),
                "infringingUrl": "https://twitter.com/sportsfan_pk/status/demo123456",
                "platform": "twitter",
                "sharerHandle": "@sportsfan_pk",
                "confidenceScore": 0.97,
                "detectionSignal": "A",
                "geminiClassification": {
                    "violationType": "unauthorized_redistribution",
                    "severity": "critical",
                    "reasoning": (
                        "Official match photography redistributed without license "
                        "to an account with 45,000 followers. No authorization on whitelist. "
                        "Commercial engagement activity detected on the post."
                    ),
                    "isWhitelisted": False,
                    "recommendedAction": "send_dmca",
                    "estimatedImpact": "severe",
                    "sportContext": (
                        "Match photography carries automatic copyright to the "
                        "sports organization under standard broadcast rights agreements."
                    )
                },
                "dmcaStatus": "none"
            },
            {
                "violationId": str(uuid.uuid4()),
                "assetId": assetId,
                "orgId": orgId,
                "detectedAt": (now - timedelta(hours=5)).isoformat(),
                "infringingUrl": "https://instagram.com/reels/demo789012",
                "platform": "instagram",
                "sharerHandle": "@cricket_highlights_daily",
                "confidenceScore": 0.89,
                "detectionSignal": "B",
                "geminiClassification": {
                    "violationType": "modified_repost",
                    "severity": "critical",
                    "reasoning": (
                        "Video highlights reel posted with color grading applied "
                        "to obscure watermark. Signal A was stripped by AI editing; detected "
                        "via Signal B neural fingerprint matching. Account shows history of "
                        "monetized sports content."
                    ),
                    "isWhitelisted": False,
                    "recommendedAction": "send_dmca",
                    "estimatedImpact": "severe",
                    "sportContext": (
                        "AI-edited copy designed to evade watermark detection — "
                        "demonstrates deliberate infringement rather than accidental repost."
                    )
                },
                "dmcaStatus": "none"
            },
            {
                "violationId": str(uuid.uuid4()),
                "assetId": assetId,
                "orgId": orgId,
                "detectedAt": (now - timedelta(hours=8)).isoformat(),
                "infringingUrl": "https://reddit.com/r/Cricket/demo345678",
                "platform": "reddit",
                "sharerHandle": "u/cricket_fan_mumbai",
                "confidenceScore": 0.78,
                "detectionSignal": "A",
                "geminiClassification": {
                    "violationType": "unauthorized_redistribution",
                    "severity": "high",
                    "reasoning": (
                        "Player portrait shared in r/Cricket subreddit (1.2M members) "
                        "without attribution or license. Non-commercial fan post but significant "
                        "reach and no authorization on whitelist."
                    ),
                    "isWhitelisted": False,
                    "recommendedAction": "contact_directly",
                    "estimatedImpact": "significant",
                    "sportContext": (
                        "Fan communities often share sports photography "
                        "believing it to be in the public domain — a direct message may resolve "
                        "without DMCA."
                    )
                },
                "dmcaStatus": "none"
            },
            {
                "violationId": str(uuid.uuid4()),
                "assetId": assetId,
                "orgId": orgId,
                "detectedAt": (now - timedelta(days=1)).isoformat(),
                "infringingUrl": "https://sportsblog.in/ipl-2026-preview/demo901234",
                "platform": "web",
                "sharerHandle": "sportsblog.in",
                "confidenceScore": 0.65,
                "detectionSignal": "B",
                "geminiClassification": {
                    "violationType": "potential_fair_use",
                    "severity": "medium",
                    "reasoning": (
                        "Sports news blog using image in editorial context with "
                        "partial attribution. May qualify as fair use under commentary and "
                        "criticism exemption. Monetized site — warrants monitoring."
                    ),
                    "isWhitelisted": False,
                    "recommendedAction": "monitor",
                    "estimatedImpact": "moderate",
                    "sportContext": (
                        "Editorial fair use in sports journalism is a gray area "
                        "— recommend legal review before sending DMCA for this case."
                    )
                },
                "dmcaStatus": "none"
            }
        ]

        saved_ids = []
        for v in violations:
            db.collection("violations").document(v["violationId"]).set(v)
            saved_ids.append(v["violationId"])
            logger.info(f"Seeded violation {v['violationId']} ({v['platform']})")

        # Update asset's violationCount
        db.collection("assets").document(assetId).update(
            {"violationCount": firestore.Increment(len(violations))}
        )

        return {"seeded": len(violations), "violations": saved_ids}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"seed_demo_violations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
