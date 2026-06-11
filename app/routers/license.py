from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.license import is_activated, activate, get_machine_fingerprint

router = APIRouter(prefix="/license", tags=["License"])


class ActivateRequest(BaseModel):
    key: str


@router.get("/status")
def license_status():
    return {
        "activated": is_activated(),
        "fingerprint": get_machine_fingerprint(),
    }


@router.post("/activate")
def activate_license(payload: ActivateRequest):
    ok, msg = activate(payload.key)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}
