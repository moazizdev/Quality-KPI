from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.audit import log_action

router = APIRouter(prefix="/departments", tags=["Departments"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).order_by(models.Department.sort_order, models.Department.name).all()


@router.post("", response_model=schemas.DepartmentOut, status_code=201)
def create_department(payload: schemas.DepartmentCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    if db.query(models.Department).filter_by(name=payload.name).first():
        raise HTTPException(status_code=409, detail="Department already exists")
    dept = models.Department(**payload.model_dump())
    db.add(dept)
    db.flush()
    log_action(db, admin_user, "CREATE", "department", dept.id, dept.name, payload.model_dump())
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/{dept_id}", response_model=schemas.DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.patch("/{dept_id}", response_model=schemas.DepartmentOut)
def update_department(dept_id: int, payload: schemas.DepartmentUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    dept = db.query(models.Department).get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    changed = payload.model_dump(exclude_unset=True)
    if "name" in changed and changed["name"] != dept.name:
        if db.query(models.Department).filter_by(name=changed["name"]).first():
            raise HTTPException(status_code=409, detail="Department name already exists")
    for field, value in changed.items():
        setattr(dept, field, value)
    log_action(db, admin_user, "UPDATE", "department", dept_id, dept.name, changed)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=204)
def delete_department(dept_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    dept = db.query(models.Department).get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    log_action(db, admin_user, "DELETE", "department", dept_id, dept.name)
    db.delete(dept)
    db.commit()
