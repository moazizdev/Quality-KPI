from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.AuditLogOut])
def list_audit_logs(
    response: Response,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(models.AuditLog)
    if action:
        q = q.filter(models.AuditLog.action == action.upper())
    if entity_type:
        q = q.filter(models.AuditLog.entity_type == entity_type)
    if user_id:
        q = q.filter(models.AuditLog.user_id == user_id)
    total = q.count()
    items = q.order_by(desc(models.AuditLog.created_at)).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    return items
