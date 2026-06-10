"""
Development seed — adds sample records, deviations, CAPA, complaints on top of seed.py.
Run: python seed_dev.py
"""
from datetime import date, timedelta
import random
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed_dev():
    # Run production seed first (idempotent)
    from seed import seed as prod_seed
    prod_seed()

    print("Adding development sample data...")

    # Reload reference data
    halls = db.query(models.Hall).all()
    machines = db.query(models.Machine).all()
    products = db.query(models.Product).all()
    defects_list = db.query(models.DefectCategory).all()
    departments = db.query(models.Department).all()

    # ── Engineers ────────────────────────────────────────────────────────────
    engineers = [
        ("eng1", "eng123", models.UserRoleEnum.eng, "أحمد علي"),
        ("eng2", "eng456", models.UserRoleEnum.eng, "سارة محمد"),
        ("eng3", "eng789", models.UserRoleEnum.eng, "خالد إبراهيم"),
        ("eng4", "eng000", models.UserRoleEnum.eng, "منى حسن"),
    ]
    created_users = []
    for username, pw, role, name in engineers:
        u = db.query(models.User).filter_by(username=username).first()
        if not u:
            u = models.User(
                username=username,
                password_hash=hash_password(pw),
                role=role,
                full_name=name,
            )
            db.add(u)
            db.flush()
        created_users.append(u)

    # Assign engineers to machines
    for i, m in enumerate(machines):
        eng = created_users[i % len(created_users)]
        m.assigned_user_id = eng.id

    # ── Production Records (30 days x all machines) ──────────────────────────
    shifts = [models.ShiftEnum.morning, models.ShiftEnum.afternoon, models.ShiftEnum.night]
    today = date.today()
    records_added = 0
    for i in range(30):
        rec_date = today - timedelta(days=i)
        for machine in machines:
            product = random.choice(products)
            batch = f"B{rec_date.strftime('%Y%m%d')}-{machine.machine_code}"
            if not db.query(models.ProductionRecord).filter_by(batch_no=batch).first():
                rec = models.ProductionRecord(
                    machine_id=machine.id,
                    product_id=product.id,
                    batch_no=batch,
                    production_date=rec_date,
                    shift=random.choice(shifts),
                    ice_weight=round(random.uniform(90, 110), 2),
                    sauce_weight=round(random.uniform(18, 22), 2),
                    biscuit_weight=round(random.uniform(28, 32), 2),
                    min_weight=140.0,
                    actual_weight=round(random.uniform(138, 162), 2),
                    max_weight=165.0,
                    pieces_produced=random.randint(2000, 5000),
                )
                db.add(rec)
                records_added += 1

    # ── Deviations (80 records) ──────────────────────────────────────────────
    deviations = []
    for _ in range(80):
        dev_date = today - timedelta(days=random.randint(0, 29))
        machine = random.choice(machines)
        product = random.choice(products)
        defect = random.choice(defects_list)
        dev = models.Deviation(
            machine_id=machine.id,
            product_id=product.id,
            defect_category_id=defect.id,
            date=dev_date,
            quantity=random.randint(1, 15),
        )
        db.add(dev)
        db.flush()
        deviations.append(dev)

    # ── CAPA Cases (linked to first 40 deviations) ───────────────────────────
    arabic_causes = [
        "نتيجة لوجود مشكلة في طلمبة السحب",
        "نتيجة مشكلة فى حساسات التغليف والسخانات",
        "نتيجة عدم كفاءة سخانات اللحامات",
        "نتيجة لوجود عطل في روبوت المشابك",
        "نتيجة مشكلة في برج الغطاء",
        "نتيجة عدم التدريب الكافى لفريق التشغيل",
        "نتيجة تحويل التانكات وزيادة سرعة الماكينة بدون ضبط السحب",
        "نتيجة عدم تنظيف الصاجة الخاصة بالماكينة",
        "نتيجة لوجود ذباب داخل صالة الانتاج",
        "نتيجة لوجود شعر داخل الغطاء",
        "نتيجة عدم اكمال حوض شيكولاتة التغطيس",
        "نتيجة مشكلة فى السخانات العرضية والقطاعات",
        "نتيجة وجود مشكلة في الاسبريهات",
        "نتيجة انسداد في بعض العيون",
        "نتيجة مشاكل فى السخانات",
    ]
    arabic_depts = [
        "الصيانة",
        "الإنتاج (قسم التشغيل)",
        "الإنتاج",
        "المشتريات",
        "الجودة (قسم توكيد الجودة)",
    ]
    statuses = [models.CAPAStatusEnum.open, models.CAPAStatusEnum.in_progress, models.CAPAStatusEnum.closed]
    for dev in deviations[:40]:
        case = models.CAPACase(
            deviation_id=dev.id,
            probable_cause=random.choice(arabic_causes),
            immediate_correction="تم إجراء التعديل اليدوي",
            corrective_action="تم جدولة إعادة المعايرة الكاملة",
            preventive_action="إضافة فحص معايرة أسبوعي لخطة الصيانة",
            status=random.choice(statuses),
            assigned_department=random.choice(arabic_depts),
        )
        db.add(case)

    # ── Customer Complaints (3 records) ───────────────────────────────────────
    complaint_data = [
        ("موزعات النيل", "CNT-2024-001", "وجود جسم غريب في العبوة"),
        ("مجموعة النجوم للتجزئة", "CNT-2024-002", "وزن المنتج أقل من المطلوب في 3 أصناف"),
        ("سوبر ماركت المترو", "CNT-2024-003", "خطأ في ملصق النكهة"),
    ]
    statuses_c = [models.ComplaintStatusEnum.open, models.ComplaintStatusEnum.under_review, models.ComplaintStatusEnum.resolved]
    for i, (customer, number, summary) in enumerate(complaint_data):
        if not db.query(models.CustomerComplaint).filter_by(complaint_number=number).first():
            c = models.CustomerComplaint(
                customer_name=customer,
                complaint_number=number,
                complaint_date=today - timedelta(days=i * 5),
                complaint_summary=summary,
                assigned_department=random.choice(arabic_depts),
                assigned_to="أحمد حسن",
                status=statuses_c[i],
            )
            db.add(c)

    db.commit()
    print("✓ Development seed complete.")
    print(f"  {db.query(models.User).count()} users")
    print(f"  {records_added} production records added ({db.query(models.ProductionRecord).count()} total)")
    print(f"  {db.query(models.Deviation).count()} deviations")
    print(f"  {db.query(models.CAPACase).count()} CAPA cases")
    print(f"  {db.query(models.CustomerComplaint).count()} complaints")


if __name__ == "__main__":
    seed_dev()
    db.close()
