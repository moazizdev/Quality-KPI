from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import date, datetime, timezone

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_engineer_machine_ids
from app.excel_export import build_excel
from app.audit import log_action

router = APIRouter(prefix="/capa", tags=["CAPA"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.CAPACaseOut])
def list_capa(
    response: Response,
    status: Optional[models.CAPAStatusEnum] = None,
    deviation_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.CAPACase)
    if status:
        q = q.filter_by(status=status)
    if deviation_id:
        q = q.filter_by(deviation_id=deviation_id)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.join(models.Deviation).filter(models.Deviation.machine_id.in_(machine_ids))
    total = q.count()
    items = q.order_by(models.CAPACase.created_at.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("", response_model=schemas.CAPACaseOut, status_code=201)
def create_capa(
    payload: schemas.CAPACaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deviation = db.query(models.Deviation).get(payload.deviation_id)
    if not deviation:
        raise HTTPException(status_code=404, detail="Deviation not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and deviation.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    case = models.CAPACase(**payload.model_dump())
    db.add(case)
    db.flush()
    log_action(db, current_user, "CREATE", "capa_case", case.id,
               f"CAPA #{case.id} (Deviation #{payload.deviation_id})", payload.model_dump())
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=schemas.CAPACaseOut)
def get_capa(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    case = db.query(models.CAPACase).get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="CAPA case not found")
    return case


@router.patch("/{case_id}", response_model=schemas.CAPACaseOut)
def update_capa(
    case_id: int,
    payload: schemas.CAPACaseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    case = db.query(models.CAPACase).get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="CAPA case not found")
    changed = payload.model_dump(exclude_unset=True)
    for field, value in changed.items():
        setattr(case, field, value)
    log_action(db, current_user, "UPDATE", "capa_case", case_id,
               f"CAPA #{case_id} (Deviation #{case.deviation_id})", changed)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_capa(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    case = db.query(models.CAPACase).get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="CAPA case not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        dev = db.query(models.Deviation).get(case.deviation_id)
        if dev and dev.machine_id not in machine_ids:
            raise HTTPException(status_code=403, detail="Not your assigned machine")
    log_action(db, current_user, "DELETE", "capa_case", case_id, f"CAPA #{case_id}")
    db.delete(case)
    db.commit()


@router.get("/export/excel")
def export_capa_excel(
    status: Optional[models.CAPAStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.CAPACase)
    if status:
        q = q.filter_by(status=status)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.join(models.Deviation).filter(models.Deviation.machine_id.in_(machine_ids))
    items = q.order_by(models.CAPACase.created_at.desc()).all()

    rows = []
    for c in items:
        rows.append([
            c.id, c.deviation_id, c.capa_time or "", c.status,
            c.assigned_department or "", c.probable_cause or "",
            c.corrective_action or "", c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "",
        ])
    return build_excel(
        f"capa_cases_{date.today()}.xlsx",
        ["ID", "Deviation ID", "Time", "Status", "Department", "Probable Cause", "Corrective Action", "Created"],
        rows,
    )
