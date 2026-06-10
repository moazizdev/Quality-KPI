from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin, get_engineer_machine_ids
from app.excel_export import build_excel
from app.audit import log_action

router = APIRouter(prefix="/deviations", tags=["Deviations"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.DeviationOut])
def list_deviations(
    response: Response,
    machine_id: Optional[int] = None,
    defect_category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Deviation)
    if machine_id:
        q = q.filter_by(machine_id=machine_id)
    if defect_category_id:
        q = q.filter_by(defect_category_id=defect_category_id)
    if date_from:
        q = q.filter(models.Deviation.date >= date_from)
    if date_to:
        q = q.filter(models.Deviation.date <= date_to)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.Deviation.machine_id.in_(machine_ids))
    total = q.count()
    items = q.order_by(models.Deviation.date.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("", response_model=schemas.DeviationOut, status_code=201)
def create_deviation(
    payload: schemas.DeviationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field, model_cls, label in [
        (payload.machine_id, models.Machine, "Machine"),
        (payload.product_id, models.Product, "Product"),
        (payload.defect_category_id, models.DefectCategory, "Defect category"),
    ]:
        if not db.query(model_cls).get(field):
            raise HTTPException(status_code=404, detail=f"{label} not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and payload.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    deviation = models.Deviation(**payload.model_dump())
    db.add(deviation)
    db.flush()
    log_action(db, current_user, "CREATE", "deviation", deviation.id,
               f"Deviation #{deviation.id}", payload.model_dump())
    db.commit()
    db.refresh(deviation)
    return deviation


@router.get("/{deviation_id}", response_model=schemas.DeviationOut)
def get_deviation(
    deviation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deviation = db.query(models.Deviation).get(deviation_id)
    if not deviation:
        raise HTTPException(status_code=404, detail="Deviation not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and deviation.machine_id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    return deviation


@router.patch("/{deviation_id}", response_model=schemas.DeviationOut)
def update_deviation(deviation_id: int, payload: schemas.DeviationUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    deviation = db.query(models.Deviation).get(deviation_id)
    if not deviation:
        raise HTTPException(status_code=404, detail="Deviation not found")
    changed = payload.model_dump(exclude_unset=True)
    for field, value in changed.items():
        setattr(deviation, field, value)
    log_action(db, admin_user, "UPDATE", "deviation", deviation_id,
               f"Deviation #{deviation_id}", changed)
    db.commit()
    db.refresh(deviation)
    return deviation


@router.get("/export/excel")
def export_deviations_excel(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Deviation)
    if date_from:
        q = q.filter(models.Deviation.date >= date_from)
    if date_to:
        q = q.filter(models.Deviation.date <= date_to)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.Deviation.machine_id.in_(machine_ids))
    items = q.order_by(models.Deviation.date.desc()).all()

    m_map = {m.id: m.machine_code for m in db.query(models.Machine).all()}
    p_map = {p.id: (p.product_name_ar or p.product_name) for p in db.query(models.Product).all()}
    d_map = {d.id: f"[{d.defect_code}] {d.defect_name}" for d in db.query(models.DefectCategory).all()}

    rows = []
    for d in items:
        rows.append([
            d.id, d.date, d.deviation_time or "",
            m_map.get(d.machine_id, ""), p_map.get(d.product_id, ""),
            d_map.get(d.defect_category_id, ""), d.quantity, d.notes or "",
        ])
    return build_excel(
        f"deviations_{date.today()}.xlsx",
        ["ID", "Date", "Time", "Machine", "Product", "Defect Category", "Quantity", "Notes"],
        rows,
    )


# ─── Defect Categories ───────────────────────────────────────────────────────

defect_router = APIRouter(prefix="/defect-categories", tags=["Defect Categories"], dependencies=[Depends(get_current_user)])


@defect_router.get("", response_model=List[schemas.DefectCategoryOut])
def list_defect_categories(db: Session = Depends(get_db)):
    return db.query(models.DefectCategory).all()


@defect_router.post("", response_model=schemas.DefectCategoryOut, status_code=201)
def create_defect_category(
    payload: schemas.DefectCategoryCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    if db.query(models.DefectCategory).filter_by(defect_code=payload.defect_code).first():
        raise HTTPException(status_code=409, detail="Defect code already exists")
    cat = models.DefectCategory(**payload.model_dump())
    db.add(cat)
    db.flush()
    log_action(db, admin_user, "CREATE", "defect_category", cat.id,
               f"[{cat.defect_code}] {cat.defect_name}", payload.model_dump())
    db.commit()
    db.refresh(cat)
    return cat


@defect_router.get("/{cat_id}", response_model=schemas.DefectCategoryOut)
def get_defect_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.DefectCategory).get(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Defect category not found")
    return cat


@defect_router.patch("/{cat_id}", response_model=schemas.DefectCategoryOut)
def update_defect_category(cat_id: int, payload: schemas.DefectCategoryUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    cat = db.query(models.DefectCategory).get(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Defect category not found")
    changed = payload.model_dump(exclude_unset=True)
    summary = f"[{cat.defect_code}] {cat.defect_name}"
    for field, value in changed.items():
        setattr(cat, field, value)
    log_action(db, admin_user, "UPDATE", "defect_category", cat_id, summary, changed)
    db.commit()
    db.refresh(cat)
    return cat


@defect_router.delete("/{cat_id}", status_code=204)
def delete_defect_category(cat_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    cat = db.query(models.DefectCategory).get(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Defect category not found")
    log_action(db, admin_user, "DELETE", "defect_category", cat_id,
               f"[{cat.defect_code}] {cat.defect_name}")
    db.delete(cat)
    db.commit()
