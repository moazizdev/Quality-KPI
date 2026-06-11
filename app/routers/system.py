import os
import subprocess
import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import require_admin
from app import models

router = APIRouter(prefix="/system", tags=["System"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def _run(cmd):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=BASE_DIR)
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except Exception as e:
        return "", str(e), -1


def _current_commit():
    out, _, _ = _run("git rev-parse --short HEAD")
    return out or "unknown"


def _remote_latest():
    out, _, _ = _run("git ls-remote origin master")
    if out:
        return out.split()[0][:7]

    # Fallback: use GitHub API
    try:
        import urllib.request
        import json
        url = "https://api.github.com/repos/moazizdev/Quality-KPI/commits/master"
        resp = urllib.request.urlopen(url, timeout=5)
        data = json.loads(resp.read())
        return data["sha"][:7]
    except Exception:
        return "unknown"


@router.get("/version")
def version_info(admin_user: models.User = Depends(require_admin)):
    current = _current_commit()
    latest = _remote_latest()
    return {
        "current_commit": current,
        "latest_commit": latest,
        "up_to_date": current == latest,
    }


class UpdateResponse(BaseModel):
    message: str
    success: bool


@router.post("/update", response_model=UpdateResponse)
def trigger_update(admin_user: models.User = Depends(require_admin)):
    updater = BASE_DIR / "tools" / "updater.py"
    if not updater.exists():
        raise HTTPException(status_code=500, detail="Updater script not found")

    out, err, code = _run(f"{sys.executable} {updater}")
    if code != 0:
        raise HTTPException(status_code=500, detail=err or out)

    return UpdateResponse(message=out, success=True)
