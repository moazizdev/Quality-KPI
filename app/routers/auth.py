from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin,
)
from app.audit import log_action

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserOut.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return db.query(models.User).all()


@router.post("/users", response_model=schemas.UserOut, status_code=201)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    user = models.User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()
    log_action(db, admin_user, "CREATE", "user", user.id,
               f"{user.username} ({user.role})", {"username": user.username, "role": user.role, "full_name": user.full_name})
    if payload.assigned_machine_ids:
        db.query(models.Machine).filter(
            models.Machine.id.in_(payload.assigned_machine_ids)
        ).update({"assigned_user_id": user.id}, synchronize_session=False)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    changed = {}
    if payload.password:
        user.password_hash = hash_password(payload.password)
        changed["password"] = "***"
    if payload.full_name is not None:
        user.full_name = payload.full_name
        changed["full_name"] = payload.full_name
    if payload.role is not None:
        user.role = payload.role
        changed["role"] = payload.role
    if payload.is_active is not None:
        user.is_active = int(payload.is_active)
        changed["is_active"] = payload.is_active
    if payload.assigned_machine_ids is not None:
        changed["assigned_machine_ids"] = payload.assigned_machine_ids
        db.query(models.Machine).filter(
            models.Machine.assigned_user_id == user.id
        ).update({"assigned_user_id": None}, synchronize_session=False)
        db.query(models.Machine).filter(
            models.Machine.id.in_(payload.assigned_machine_ids)
        ).update({"assigned_user_id": user.id}, synchronize_session=False)
    if changed:
        log_action(db, admin_user, "UPDATE", "user", user_id,
                   f"{user.username} ({user.role})", changed)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == models.UserRoleEnum.admin:
        admins = db.query(models.User).filter(models.User.role == models.UserRoleEnum.admin).count()
        if admins <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin")
    log_action(db, admin_user, "DELETE", "user", user_id,
               f"{user.username} ({user.role})")
    db.query(models.Machine).filter(
        models.Machine.assigned_user_id == user.id
    ).update({"assigned_user_id": None}, synchronize_session=False)
    db.delete(user)
    db.commit()
