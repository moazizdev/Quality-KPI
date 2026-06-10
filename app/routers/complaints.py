from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.excel_export import build_excel
from app.audit import log_action
from datetime import date

router = APIRouter(prefix="/complaints", tags=["Customer Complaints"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.CustomerComplaintOut])
def list_complaints(
    response: Response,
    status: Optional[models.ComplaintStatusEnum] = None,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(models.CustomerComplaint)
    if status:
        q = q.filter_by(status=status)
    total = q.count()
    items = q.order_by(models.CustomerComplaint.complaint_date.desc()).offset(skip).limit(limit).all()
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("", response_model=schemas.CustomerComplaintOut, status_code=201)
def create_complaint(
    payload: schemas.CustomerComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.CustomerComplaint).filter_by(complaint_number=payload.complaint_number).first():
        raise HTTPException(status_code=409, detail="Complaint number already exists")
    complaint = models.CustomerComplaint(**payload.model_dump())
    db.add(complaint)
    db.flush()
    log_action(db, current_user, "CREATE", "complaint", complaint.id,
               f"#{complaint.complaint_number} - {complaint.customer_name}", payload.model_dump())
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/{complaint_id}", response_model=schemas.CustomerComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(models.CustomerComplaint).get(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.patch("/{complaint_id}", response_model=schemas.CustomerComplaintOut)
def update_complaint(
    complaint_id: int,
    payload: schemas.CustomerComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    complaint = db.query(models.CustomerComplaint).get(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    changed = payload.model_dump(exclude_unset=True)
    for field, value in changed.items():
        setattr(complaint, field, value)
    log_action(db, current_user, "UPDATE", "complaint", complaint_id,
               f"#{complaint.complaint_number} - {complaint.customer_name}", changed)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.delete("/{complaint_id}", status_code=204)
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    complaint = db.query(models.CustomerComplaint).get(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    log_action(db, current_user, "DELETE", "complaint", complaint_id,
               f"#{complaint.complaint_number} - {complaint.customer_name}")
    db.delete(complaint)
    db.commit()


@router.get("/export/excel")
def export_complaints_excel(
    status: Optional[models.ComplaintStatusEnum] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.CustomerComplaint)
    if status:
        q = q.filter_by(status=status)
    items = q.order_by(models.CustomerComplaint.complaint_date.desc()).all()

    rows = []
    for c in items:
        rows.append([
            c.id, c.complaint_number, c.customer_name,
            c.complaint_date, c.complaint_time or "", c.status,
            c.assigned_department or "", c.assigned_to or "",
            c.complaint_summary,
        ])
    return build_excel(
        f"complaints_{date.today()}.xlsx",
        ["ID", "Number", "Customer", "Date", "Time", "Status", "Department", "Assigned To", "Summary"],
        rows,
    )
