from fastapi import APIRouter

router = APIRouter()

# TODO: Endpoints to be built in Phase 1

@router.get("/")
async def status():
    return {"status": "module ready", "module": "detection"}
