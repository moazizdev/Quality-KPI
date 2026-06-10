from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin, get_engineer_machine_ids
from app.audit import log_action

router = APIRouter(prefix="/machines", tags=["Machines"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.MachineOut])
def list_machines(
    hall_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Machine)
    if hall_id:
        q = q.filter_by(hall_id=hall_id)
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None:
        q = q.filter(models.Machine.id.in_(machine_ids))
    return q.all()


@router.post("", response_model=schemas.MachineOut, status_code=201)
def create_machine(
    payload: schemas.MachineCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    if not db.query(models.Hall).get(payload.hall_id):
        raise HTTPException(status_code=404, detail="Hall not found")
    if db.query(models.Machine).filter_by(machine_code=payload.machine_code).first():
        raise HTTPException(status_code=409, detail="Machine code already exists")
    machine = models.Machine(**payload.model_dump())
    db.add(machine)
    db.flush()
    log_action(db, admin_user, "CREATE", "machine", machine.id,
               f"{machine.machine_code} - {machine.machine_name}", payload.model_dump())
    db.commit()
    db.refresh(machine)
    return machine


@router.get("/{machine_id}", response_model=schemas.MachineOut)
def get_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    machine = db.query(models.Machine).get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    machine_ids = get_engineer_machine_ids(current_user, db)
    if machine_ids is not None and machine.id not in machine_ids:
        raise HTTPException(status_code=403, detail="Not your assigned machine")
    return machine


@router.patch("/{machine_id}", response_model=schemas.MachineOut)
def update_machine(machine_id: int, payload: schemas.MachineUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    machine = db.query(models.Machine).get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    changed = payload.model_dump(exclude_unset=True)
    summary = f"{machine.machine_code} - {machine.machine_name}"
    for field, value in changed.items():
        setattr(machine, field, value)
    log_action(db, admin_user, "UPDATE", "machine", machine_id, summary, changed)
    db.commit()
    db.refresh(machine)
    return machine


@router.delete("/{machine_id}", status_code=204)
def delete_machine(machine_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    machine = db.query(models.Machine).get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    log_action(db, admin_user, "DELETE", "machine", machine_id,
               f"{machine.machine_code} - {machine.machine_name}")
    db.delete(machine)
    db.commit()
