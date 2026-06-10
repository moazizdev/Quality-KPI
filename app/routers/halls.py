from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.audit import log_action

router = APIRouter(prefix="/halls", tags=["Halls"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.HallOut])
def list_halls(db: Session = Depends(get_db)):
    return db.query(models.Hall).all()


@router.post("", response_model=schemas.HallOut, status_code=201)
def create_hall(payload: schemas.HallCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    if db.query(models.Hall).filter_by(name=payload.name).first():
        raise HTTPException(status_code=409, detail="Hall already exists")
    hall = models.Hall(**payload.model_dump())
    db.add(hall)
    db.flush()
    log_action(db, admin_user, "CREATE", "hall", hall.id, hall.name, payload.model_dump())
    db.commit()
    db.refresh(hall)
    return hall


@router.get("/{hall_id}", response_model=schemas.HallOut)
def get_hall(hall_id: int, db: Session = Depends(get_db)):
    hall = db.query(models.Hall).get(hall_id)
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    return hall


@router.patch("/{hall_id}", response_model=schemas.HallOut)
def update_hall(hall_id: int, payload: schemas.HallUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    hall = db.query(models.Hall).get(hall_id)
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    changed = payload.model_dump(exclude_unset=True)
    for field, value in changed.items():
        setattr(hall, field, value)
    log_action(db, admin_user, "UPDATE", "hall", hall_id, hall.name if hall.name else f"Hall #{hall_id}", changed)
    db.commit()
    db.refresh(hall)
    return hall


@router.delete("/{hall_id}", status_code=204)
def delete_hall(hall_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    hall = db.query(models.Hall).get(hall_id)
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    log_action(db, admin_user, "DELETE", "hall", hall_id, hall.name)
    db.delete(hall)
    db.commit()
