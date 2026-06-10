from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


# ─── Enums ───────────────────────────────────────────────────────────────────

class ShiftEnum(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    night = "night"


class CAPAStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class ComplaintStatusEnum(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    resolved = "resolved"
    notified = "notified"


class UserRoleEnum(str, enum.Enum):
    admin = "admin"
    eng = "eng"


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.eng)
    full_name = Column(String(150), nullable=True)
    is_active = Column(Integer, default=1)

    machines = relationship("Machine", back_populates="assigned_user")


# ─── Hall ────────────────────────────────────────────────────────────────────

class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    machines = relationship("Machine", back_populates="hall")


# ─── Machine ─────────────────────────────────────────────────────────────────

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    hall_id = Column(Integer, ForeignKey("halls.id"), nullable=False)
    machine_code = Column(String(50), unique=True, nullable=False)
    machine_name = Column(String(150), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    hall = relationship("Hall", back_populates="machines")
    assigned_user = relationship("User", back_populates="machines")
    production_records = relationship("ProductionRecord", back_populates="machine")
    deviations = relationship("Deviation", back_populates="machine")


# ─── Product ─────────────────────────────────────────────────────────────────

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), unique=True, nullable=False)
    product_name_ar = Column(String(200), nullable=True)
    default_pieces = Column(Integer, nullable=True)
    default_ice_weight = Column(Float, nullable=True)
    default_sauce_weight = Column(Float, nullable=True)
    default_biscuit_weight = Column(Float, nullable=True)
    default_min_weight = Column(Float, nullable=True)
    default_max_weight = Column(Float, nullable=True)

    production_records = relationship("ProductionRecord", back_populates="product")
    deviations = relationship("Deviation", back_populates="product")


# ─── Production Record ───────────────────────────────────────────────────────

class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_no = Column(String(100), nullable=False)
    production_date = Column(Date, nullable=False)
    shift = Column(Enum(ShiftEnum), nullable=False)

    ice_weight = Column(Float, nullable=True)
    sauce_weight = Column(Float, nullable=True)
    biscuit_weight = Column(Float, nullable=True)
    min_weight = Column(Float, nullable=True)
    actual_weight = Column(Float, nullable=True)
    max_weight = Column(Float, nullable=True)
    pieces_produced = Column(Integer, nullable=True)
    production_time = Column(String(5), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="production_records")
    product = relationship("Product", back_populates="production_records")


# ─── Defect Category ─────────────────────────────────────────────────────────

class DefectCategory(Base):
    __tablename__ = "defect_categories"

    id = Column(Integer, primary_key=True, index=True)
    defect_code = Column(String(20), unique=True, nullable=False)
    defect_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    deviations = relationship("Deviation", back_populates="defect_category")


# ─── Deviation ───────────────────────────────────────────────────────────────

class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    defect_category_id = Column(Integer, ForeignKey("defect_categories.id"), nullable=False)
    date = Column(Date, nullable=False)
    deviation_time = Column(String(5), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    machine = relationship("Machine", back_populates="deviations")
    product = relationship("Product", back_populates="deviations")
    defect_category = relationship("DefectCategory", back_populates="deviations")
    capa_cases = relationship("CAPACase", back_populates="deviation")


# ─── CAPA Case ───────────────────────────────────────────────────────────────

class CAPACase(Base):
    __tablename__ = "capa_cases"

    id = Column(Integer, primary_key=True, index=True)
    deviation_id = Column(Integer, ForeignKey("deviations.id"), nullable=False)

    capa_time = Column(String(5), nullable=True)
    probable_cause = Column(Text, nullable=True)
    immediate_correction = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    status = Column(Enum(CAPAStatusEnum), default=CAPAStatusEnum.open, nullable=False)
    assigned_department = Column(String(150), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    deviation = relationship("Deviation", back_populates="capa_cases")


# ─── Customer Complaint ──────────────────────────────────────────────────────

class CustomerComplaint(Base):
    __tablename__ = "customer_complaints"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(200), nullable=False)
    complaint_number = Column(String(100), unique=True, nullable=False)
    complaint_date = Column(Date, nullable=False)
    complaint_time = Column(String(5), nullable=True)
    complaint_summary = Column(Text, nullable=False)
    assigned_department = Column(String(150), nullable=True)
    assigned_to = Column(String(150), nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    status = Column(Enum(ComplaintStatusEnum), default=ComplaintStatusEnum.open, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Department ───────────────────────────────────────────────────────────────

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    name_en = Column(String(150), nullable=True)
    defect_prefixes = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=False)
    action = Column(String(20), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    summary = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
