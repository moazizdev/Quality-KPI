from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import time
from datetime import datetime, timezone

from app.license import is_activated, activate, get_machine_fingerprint, get_license_expiry

router = APIRouter(prefix="/license", tags=["License"])


class ActivateRequest(BaseModel):
    key: str


@router.get("/status")
def license_status():
    expiry_ts = get_license_expiry()
    now = int(time.time())
    return {
        "activated": is_activated(),
        "fingerprint": get_machine_fingerprint(),
        "expires_at": datetime.fromtimestamp(expiry_ts, tz=timezone.utc).isoformat() if expiry_ts else None,
        "days_remaining": max(0, (expiry_ts - now) // 86400) if expiry_ts else None,
    }


@router.post("/activate")
def activate_license(payload: ActivateRequest):
    ok, msg = activate(payload.key)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}
