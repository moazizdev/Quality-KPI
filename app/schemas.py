from pydantic import BaseModel, ConfigDict
from datetime import date as DateType, datetime
from typing import Optional
from app.models import ShiftEnum, CAPAStatusEnum, ComplaintStatusEnum


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str
    full_name: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "eng"
    full_name: Optional[str] = None
    assigned_machine_ids: Optional[list[int]] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    assigned_machine_ids: Optional[list[int]] = None


# ─── Hall ────────────────────────────────────────────────────────────────────

class HallBase(BaseModel):
    name: str

class HallCreate(HallBase):
    pass

class HallUpdate(BaseModel):
    name: Optional[str] = None

class HallOut(HallBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Machine ─────────────────────────────────────────────────────────────────

class MachineBase(BaseModel):
    hall_id: int
    machine_code: str
    machine_name: str
    assigned_user_id: Optional[int] = None

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    hall_id: Optional[int] = None
    machine_code: Optional[str] = None
    machine_name: Optional[str] = None
    assigned_user_id: Optional[int] = None

class MachineOut(MachineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hall: Optional[HallOut] = None


# ─── Product ─────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    product_name: str
    product_name_ar: Optional[str] = None
    default_pieces: Optional[int] = None
    default_ice_weight: Optional[float] = None
    default_sauce_weight: Optional[float] = None
    default_biscuit_weight: Optional[float] = None
    default_min_weight: Optional[float] = None
    default_max_weight: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_name_ar: Optional[str] = None
    default_pieces: Optional[int] = None
    default_ice_weight: Optional[float] = None
    default_sauce_weight: Optional[float] = None
    default_biscuit_weight: Optional[float] = None
    default_min_weight: Optional[float] = None
    default_max_weight: Optional[float] = None

class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Production Record ───────────────────────────────────────────────────────

class ProductionRecordBase(BaseModel):
    machine_id: int
    product_id: int
    batch_no: str
    production_date: DateType
    shift: ShiftEnum
    ice_weight: Optional[float] = None
    sauce_weight: Optional[float] = None
    biscuit_weight: Optional[float] = None
    min_weight: Optional[float] = None
    actual_weight: Optional[float] = None
    max_weight: Optional[float] = None
    pieces_produced: Optional[int] = None
    production_time: Optional[str] = None

class ProductionRecordCreate(ProductionRecordBase):
    pass

class ProductionRecordUpdate(BaseModel):
    machine_id: Optional[int] = None
    product_id: Optional[int] = None
    batch_no: Optional[str] = None
    production_date: Optional[DateType] = None
    shift: Optional[ShiftEnum] = None
    ice_weight: Optional[float] = None
    sauce_weight: Optional[float] = None
    biscuit_weight: Optional[float] = None
    min_weight: Optional[float] = None
    actual_weight: Optional[float] = None
    max_weight: Optional[float] = None
    pieces_produced: Optional[int] = None
    production_time: Optional[str] = None

class ProductionRecordOut(ProductionRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ─── Defect Category ─────────────────────────────────────────────────────────

class DefectCategoryBase(BaseModel):
    defect_code: str
    defect_name: str
    description: Optional[str] = None

class DefectCategoryCreate(DefectCategoryBase):
    pass

class DefectCategoryUpdate(BaseModel):
    defect_code: Optional[str] = None
    defect_name: Optional[str] = None
    description: Optional[str] = None

class DefectCategoryOut(DefectCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Deviation ───────────────────────────────────────────────────────────────

class DeviationBase(BaseModel):
    machine_id: int
    product_id: int
    defect_category_id: int
    date: DateType
    deviation_time: Optional[str] = None
    quantity: int
    notes: Optional[str] = None

class DeviationCreate(DeviationBase):
    pass

class DeviationUpdate(BaseModel):
    machine_id: Optional[int] = None
    product_id: Optional[int] = None
    defect_category_id: Optional[int] = None
    date: Optional[DateType] = None
    deviation_time: Optional[str] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None

class DeviationOut(DeviationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ─── CAPA Case ───────────────────────────────────────────────────────────────

class CAPACaseBase(BaseModel):
    deviation_id: int
    capa_time: Optional[str] = None
    probable_cause: Optional[str] = None
    immediate_correction: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    status: CAPAStatusEnum = CAPAStatusEnum.open
    assigned_department: Optional[str] = None

class CAPACaseCreate(CAPACaseBase):
    pass

class CAPACaseUpdate(BaseModel):
    probable_cause: Optional[str] = None
    immediate_correction: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    capa_time: Optional[str] = None
    status: Optional[CAPAStatusEnum] = None
    assigned_department: Optional[str] = None

class CAPACaseOut(CAPACaseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    closed_at: Optional[datetime] = None


# ─── Customer Complaint ──────────────────────────────────────────────────────

class CustomerComplaintBase(BaseModel):
    customer_name: str
    complaint_number: str
    complaint_date: DateType
    complaint_time: Optional[str] = None
    complaint_summary: str
    assigned_department: Optional[str] = None
    assigned_to: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    resolution: Optional[str] = None
    status: ComplaintStatusEnum = ComplaintStatusEnum.open

class CustomerComplaintCreate(CustomerComplaintBase):
    pass

class CustomerComplaintUpdate(BaseModel):
    assigned_department: Optional[str] = None
    assigned_to: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    resolution: Optional[str] = None
    status: Optional[ComplaintStatusEnum] = None

class CustomerComplaintOut(CustomerComplaintBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ─── Department ───────────────────────────────────────────────────────────────

class DepartmentBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    defect_prefixes: Optional[str] = None
    sort_order: int = 0

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    defect_prefixes: Optional[str] = None
    sort_order: Optional[int] = None

class DepartmentOut(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    username: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    summary: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None


# ─── KPI Dashboard ───────────────────────────────────────────────────────────

class KPISummary(BaseModel):
    total_production_records: int
    total_deviations: int
    total_defect_quantity: int
    defect_rate_percent: float
    open_capa_cases: int
    open_complaints: int
