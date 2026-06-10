from datetime import date, datetime
from enum import Enum
from sqlalchemy.orm import Session
from app import models


def _safe_val(v):
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    if isinstance(v, Enum):
        return v.value
    return v

ENTITY_LABELS = {
    "production_record": "إنتاج",
    "deviation": "انحراف",
    "capa_case": "CAPA",
    "complaint": "شكوى",
    "user": "مستخدم",
    "hall": "عنبر",
    "machine": "ماكينة",
    "product": "منتج",
    "defect_category": "تصنيف عيب",
}


def log_action(
    db: Session,
    user: models.User,
    action: str,
    entity_type: str,
    entity_id: int = None,
    summary: str = None,
    details: dict = None,
    ip_address: str = None,
):
    safe_details = None
    if details:
        safe_details = {k: _safe_val(v) for k, v in details.items()}
    log = models.AuditLog(
        user_id=user.id,
        username=user.username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        details=safe_details,
        ip_address=ip_address,
    )
    db.add(log)
    db.flush()
