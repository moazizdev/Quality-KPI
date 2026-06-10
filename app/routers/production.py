from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin, get_engineer_machine_ids
from app.excel_export import build_excel
from app.audit import log_action

router = APIRouter(prefix="/production-records", tags=["Production Records"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.ProductionRecordOut])
def list_records(
    response: Response,
    machine_id: Optional[int] = None,
    product_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    shift: Optional[models.ShiftEnum] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.ProductionRecord)
    if machine_id:
        q = q.filter_by(machine_id=machine_id)
    if product_id:
        q = q.filter_by(product_id=product_id)
    if date_from:
        q = q.filter(models.ProductionRecord.production_date >= date_from)
    if date_to:
        q = q.filter(models.ProductionRecord.production_date <= date_to)
    if shift:
        q = q.filter_by(shift=shift)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.ProductionRecord.machine_id.in_(machine_ids))
    total = q.count()
    items = q.order_by(models.ProductionRecord.production_date.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("", response_model=schemas.ProductionRecordOut, status_code=201)
def create_record(
    payload: schemas.ProductionRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.query(models.Machine).get(payload.machine_id):
        raise HTTPException(status_code=404, detail="Machine not found")
    if not db.query(models.Product).get(payload.product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and payload.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    record = models.ProductionRecord(**payload.model_dump())
    db.add(record)
    db.flush()
    log_action(db, current_user, "CREATE", "production_record", record.id,
               f"Batch #{record.batch_no}", payload.model_dump())
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.ProductionRecordOut)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = db.query(models.ProductionRecord).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and record.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    return record


@router.patch("/{record_id}", response_model=schemas.ProductionRecordOut)
def update_record(record_id: int, payload: schemas.ProductionRecordUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    record = db.query(models.ProductionRecord).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    changed = payload.model_dump(exclude_unset=True)
    for field, value in changed.items():
        setattr(record, field, value)
    log_action(db, admin_user, "UPDATE", "production_record", record_id,
               f"Batch #{record.batch_no}", changed)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = db.query(models.ProductionRecord).get(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and record.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    log_action(db, current_user, "DELETE", "production_record", record_id,
               f"Batch #{record.batch_no}")
    db.delete(record)
    db.commit()


@router.get("/export/excel")
def export_production_excel(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    shift: Optional[models.ShiftEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.ProductionRecord)
    if date_from:
        q = q.filter(models.ProductionRecord.production_date >= date_from)
    if date_to:
        q = q.filter(models.ProductionRecord.production_date <= date_to)
    if shift:
        q = q.filter_by(shift=shift)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.ProductionRecord.machine_id.in_(machine_ids))
    records = q.order_by(models.ProductionRecord.production_date.desc()).all()

    m_map = {m.id: m.machine_code for m in db.query(models.Machine).all()}
    p_map = {p.id: (p.product_name_ar or p.product_name) for p in db.query(models.Product).all()}

    rows = []
    for r in records:
        rows.append([
            r.id, r.batch_no, r.production_date, r.production_time or "",
            r.shift, m_map.get(r.machine_id, ""), p_map.get(r.product_id, ""),
            r.ice_weight or "", r.sauce_weight or "", r.biscuit_weight or "",
            r.min_weight or "", r.actual_weight or "", r.max_weight or "",
            r.pieces_produced or "",
        ])
    return build_excel(
        f"production_records_{date.today()}.xlsx",
        ["ID", "Batch", "Date", "Time", "Shift", "Machine", "Product",
         "Ice Wt", "Sauce Wt", "Biscuit Wt", "Min Wt", "Actual Wt", "Max Wt", "Pieces"],
        rows,
    )
