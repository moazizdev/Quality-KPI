from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin
from app.audit import log_action

router = APIRouter(prefix="/products", tags=["Products"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.post("", response_model=schemas.ProductOut, status_code=201)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    if db.query(models.Product).filter_by(product_name=payload.product_name).first():
        raise HTTPException(status_code=409, detail="Product already exists")
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.flush()
    log_action(db, admin_user, "CREATE", "product", product.id,
               product.product_name_ar or product.product_name, payload.model_dump())
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    changed = payload.model_dump(exclude_unset=True)
    summary = product.product_name_ar or product.product_name
    for field, value in changed.items():
        setattr(product, field, value)
    log_action(db, admin_user, "UPDATE", "product", product_id, summary, changed)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(require_admin)):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    log_action(db, admin_user, "DELETE", "product", product_id,
               product.product_name_ar or product.product_name)
    db.delete(product)
    db.commit()
