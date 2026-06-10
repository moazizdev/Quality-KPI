from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_engineer_machine_ids

router = APIRouter(prefix="/kpi", tags=["KPI Dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/summary", response_model=schemas.KPISummary)
def kpi_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    hall_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    prod_q = db.query(models.ProductionRecord)
    dev_q = db.query(models.Deviation)

    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        prod_q = prod_q.filter(models.ProductionRecord.machine_id.in_(machine_ids))
        dev_q = dev_q.filter(models.Deviation.machine_id.in_(machine_ids))
    elif hall_id:
        mids = [m.id for m in db.query(models.Machine).filter_by(hall_id=hall_id).all()]
        prod_q = prod_q.filter(models.ProductionRecord.machine_id.in_(mids))
        dev_q = dev_q.filter(models.Deviation.machine_id.in_(mids))

    if date_from:
        prod_q = prod_q.filter(models.ProductionRecord.production_date >= date_from)
        dev_q = dev_q.filter(models.Deviation.date >= date_from)
    if date_to:
        prod_q = prod_q.filter(models.ProductionRecord.production_date <= date_to)
        dev_q = dev_q.filter(models.Deviation.date <= date_to)

    total_production = prod_q.count()
    total_deviations = dev_q.count()
    total_defect_qty = dev_q.with_entities(func.sum(models.Deviation.quantity)).scalar() or 0
    total_pieces_produced = prod_q.with_entities(func.sum(models.ProductionRecord.pieces_produced)).scalar() or 0

    defect_rate = round((total_defect_qty / total_pieces_produced * 100), 2) if total_pieces_produced > 0 else 0.0

    open_capa = db.query(models.CAPACase).filter(
        models.CAPACase.status.in_([models.CAPAStatusEnum.open, models.CAPAStatusEnum.in_progress])
    ).count()

    open_complaints = db.query(models.CustomerComplaint).filter(
        models.CustomerComplaint.status.in_([
            models.ComplaintStatusEnum.open,
            models.ComplaintStatusEnum.under_review,
        ])
    ).count()

    return schemas.KPISummary(
        total_production_records=total_production,
        total_deviations=total_deviations,
        total_defect_quantity=total_defect_qty,
        defect_rate_percent=defect_rate,
        open_capa_cases=open_capa,
        open_complaints=open_complaints,
    )


@router.get("/defects-by-category")
def defects_by_category(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = (
        db.query(
            models.DefectCategory.defect_code,
            models.DefectCategory.defect_name,
            func.sum(models.Deviation.quantity).label("total_quantity"),
            func.count(models.Deviation.id).label("occurrence_count"),
        )
        .join(models.Deviation, models.Deviation.defect_category_id == models.DefectCategory.id)
    )
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.Deviation.machine_id.in_(machine_ids))
    if date_from:
        q = q.filter(models.Deviation.date >= date_from)
    if date_to:
        q = q.filter(models.Deviation.date <= date_to)
    results = q.group_by(models.DefectCategory.id).order_by(func.sum(models.Deviation.quantity).desc()).all()
    return [
        {
            "defect_code": r.defect_code,
            "defect_name": r.defect_name,
            "total_quantity": r.total_quantity or 0,
            "occurrence_count": r.occurrence_count,
        }
        for r in results
    ]


@router.get("/defects-by-machine")
def defects_by_machine(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = (
        db.query(
            models.Machine.machine_code,
            models.Machine.machine_name,
            models.Hall.name.label("hall_name"),
            func.sum(models.Deviation.quantity).label("total_quantity"),
            func.count(models.Deviation.id).label("occurrence_count"),
        )
        .join(models.Deviation, models.Deviation.machine_id == models.Machine.id)
        .join(models.Hall, models.Hall.id == models.Machine.hall_id)
    )
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.Machine.id.in_(machine_ids))
    if date_from:
        q = q.filter(models.Deviation.date >= date_from)
    if date_to:
        q = q.filter(models.Deviation.date <= date_to)
    results = q.group_by(models.Machine.id, models.Hall.id).order_by(func.sum(models.Deviation.quantity).desc()).all()
    return [
        {
            "machine_code": r.machine_code,
            "machine_name": r.machine_name,
            "hall": r.hall_name,
            "total_quantity": r.total_quantity or 0,
            "occurrence_count": r.occurrence_count,
        }
        for r in results
    ]
