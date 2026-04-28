from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
import os

load_dotenv()

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': os.getenv("GCS_BUCKET_NAME", "guardian-ai-assets.appspot.com")
    })

from api.assets import router as assets_router
from api.violations import router as violations_router
from api.dmca import router as dmca_router
from api.detection import router as detection_router
from api.organizations import router as organizations_router

app = FastAPI(
    title="Guardian AI API",
    description="Dual-signal sports media protection platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "https://*.web.app",
        "https://*.firebaseapp.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets_router, prefix="/api/assets", tags=["Assets"])
app.include_router(violations_router, prefix="/api/violations", tags=["Violations"])
app.include_router(dmca_router, prefix="/api/dmca", tags=["DMCA"])
app.include_router(detection_router, prefix="/api/detection", tags=["Detection"])
app.include_router(organizations_router, prefix="/api/organizations", tags=["Organizations"])

@app.get("/")
async def root():
    return {
        "service": "Guardian AI API",
        "version": "1.0.0",
        "status": "operational",
        "signals": ["DCT-watermark (Signal A)", "Vision-fingerprint (Signal B)"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
