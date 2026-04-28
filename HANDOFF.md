# Guardian AI - Project Handoff Document

## 1. Project Overview
Guardian AI is a dual-signal sports media protection platform built for the Google Solution Challenge 2026. It protects sports organizations' digital assets by:
1. Embedding an invisible DCT frequency-domain watermark (**Signal A**).
2. Computing a neural content fingerprint using Google Vision API (**Signal B**).

## 2. Current Development Status
- **Phase 0 (Project Setup & Architecture):** COMPLETED.
- **Phase 1 (Asset Registration Pipeline):** COMPLETED & VERIFIED.
- **Phase 2 (Detection & Violation Dashboard):** NEXT STEP (Start here in the new chat).

## 3. Technology Stack
- **Frontend:** React, Vite, Tailwind CSS (v4), `react-router-dom`, `react-dropzone`, `lucide-react`, `recharts`.
- **Backend:** Python, FastAPI, Uvicorn, `httpx`.
- **Core ML / Processing:** `invisible-watermark` (dwtDct), OpenCV, `imagehash`, Google Cloud Vision API.
- **Database & Storage:** Firebase Admin SDK (Cloud Firestore, Google Cloud Storage).

## 4. What Has Been Built & Tested

### Backend (`e:\Guardian-ai\backend`)
1. **Watermark Service (`services/watermark.py`)**:
   - Injects a 16-character hex UUID into images using `invisible-watermark` (utilizing the robust `dwtDct` algorithm).
   - Capable of decoding and verifying watermarks from downloaded images.
2. **Fingerprint Service (`services/fingerprint.py`)**:
   - Generates a perceptual hash (`pHash`).
   - Integrates with Google Cloud Vision API (`LABEL_DETECTION`, `IMAGE_PROPERTIES`, `WEB_DETECTION`).
   - Aggregates the confidence scores to form a 25-dimension `fingerprint_vector`.
3. **Storage Service (`services/storage.py`)**:
   - Handles async uploads to GCS (`heroic-habitat-478501-f0.firebasestorage.app`).
4. **API Router (`api/assets.py`)**:
   - `POST /api/assets/register`: Orchestrates the complete dual-signal ingestion pipeline, GCS uploads, and Firestore document creation.
   - `GET /api/assets/{asset_id}/verify-watermark`: Extracts and validates Signal A.

### Frontend (`e:\Guardian-ai\frontend`)
1. **`App.jsx`**: Configured with robust routing architecture.
2. **`RegisterAsset.jsx`**: 
   - A highly polished upload screen using `react-dropzone`.
   - Adheres to clean, functional UI guidelines (Uncodixify rules: sky blue `#38BDF8` accents, no excessive gradients, clean cards).
   - Features an interactive processing timeline.
   - Successfully unpacks backend responses to display the Asset ID, Vision API semantic labels (chips), and Signal validation badges.

## 5. Infrastructure & Verification Context
- **Google Cloud Platform:** Successfully integrated. The project relies on a real service account (`firebase-service-account.json`) securely gitignored.
- **APIs Enabled:** Cloud Vision API, Cloud Firestore API (Native Mode), and Firebase Storage are fully active.
- **Verification:** An end-to-end test successfully executed. The backend embedded the watermark, hit the Vision API, uploaded to Storage, and successfully generated a document in Firestore (Example Asset ID: `24b69118-6259-44c2-b0aa-039ddc44c01f`).

## 6. Next Steps for the New Chat (Phase 2)
When opening the new chat, instruct the AI to read this `HANDOFF.md` file first.

**Phase 2 Objectives:**
1. **Detection Engine:** Implement a backend service (e.g., `services/detection.py`) that can take an arbitrary image, compute its Signal B, and scan the Firestore database for similar assets.
2. **Verification Protocol:** If a Signal B match is found, extract Signal A to confirm undisputed ownership.
3. **Frontend Dashboard:** Build the main application dashboard and `Violations.jsx` to visualize the global `violationCount` across the organization's assets and interface with automated DMCA notices.
