"""
Clean all violations + dmca_notices for demo-org, then run full Phase 2 verification.
"""
import urllib.request
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

# --- Clean Firestore first ---
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("./firebase-service-account.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
ORG_ID = "demo-org"

print("Cleaning old violations...")
old_v = db.collection("violations").where("orgId", "==", ORG_ID).stream()
for d in old_v:
    d.reference.delete()
    print(f"  Deleted violation {d.id}")

print("Cleaning old dmca_notices...")
old_d = db.collection("dmca_notices").where("orgId", "==", ORG_ID).stream()
for d in old_d:
    d.reference.delete()
    print(f"  Deleted notice {d.id}")

print("Cleanup complete.\n")

# --- HTTP helpers ---
BASE = "http://localhost:8000"
ASSET_ID = "24b69118-6259-44c2-b0aa-039ddc44c01f"


def get(path):
    with urllib.request.urlopen(f"{BASE}{path}") as r:
        return json.loads(r.read())


def post(path, data=None):
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


# ── STEP 2 ─────────────────────────────────────────────────────────────────────
print("=" * 60)
print("STEP 2: Seed 4 demo violations")
print("=" * 60)
seed = post(f"/api/violations/seed?orgId={ORG_ID}&assetId={ASSET_ID}")
print(json.dumps(seed, indent=2))
vids = seed["violations"]
time.sleep(1)

# ── STEP 3 ─────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 3: List all violations")
print("=" * 60)
violations = get(f"/api/violations/?orgId={ORG_ID}")
print(f"Returned {len(violations)} violations:")
for v in violations:
    cls = v.get("geminiClassification", {})
    print(f"  [{cls.get('severity','?').upper():8}] {v['platform']:12} {v['sharerHandle']}")

# ── STEP 4 ─────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4: Classify violation 1 via Gemini LIVE API")
print("=" * 60)
v1_id = vids[0]
print(f"  violation_id: {v1_id}")
classified = post(f"/api/violations/{v1_id}/classify")
gemini_cls = classified.get("geminiClassification", {})
print("\nGemini Classification JSON (live response):")
print(json.dumps(gemini_cls, indent=2))

# ── STEP 5 ─────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 5: Generate DMCA notice via Gemini LIVE API")
print("=" * 60)
notice = post(f"/api/dmca/{v1_id}/generate")
notice_text = notice.get("noticeText", "")
print(f"Notice ID   : {notice['noticeId']}")
print(f"Status      : {notice['status']}")
print(f"Word count  : {len(notice_text.split())} words")
print("\nFirst 400 chars of DMCA notice:")
print("-" * 50)
print(notice_text[:400])
print("-" * 50)

# Confirm violation updated
updated_v1 = get(f"/api/violations/{v1_id}")
print(f"\nViolation dmcaStatus: {updated_v1.get('dmcaStatus')}")

# ── STEP 6 ─────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 6: List DMCA notices for org")
print("=" * 60)
notices = get(f"/api/dmca/?orgId={ORG_ID}")
print(f"Returned {len(notices)} notice(s):")
for n in notices:
    print(f"  noticeId: {n['noticeId']} | status: {n['status']}")

print("\n" + "=" * 60)
print("PHASE 2 VERIFICATION COMPLETE")
print("=" * 60)
