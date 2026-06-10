"""
Production seed — real/static data only.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed():
    print("Seeding database...")

    # ── Admin User ───────────────────────────────────────────────────────────
    admin = db.query(models.User).filter_by(username="admin").first()
    if not admin:
        admin = models.User(
            username="admin",
            password_hash=hash_password("admin123"),
            role=models.UserRoleEnum.admin,
            full_name="System Admin",
        )
        db.add(admin)
        db.flush()
    users = [admin]

    # ── Halls (3 halls) ──────────────────────────────────────────────────────
    hall_names = ["صالة إنتاج 1", "صالة إنتاج 2", "صالة إنتاج 3"]
    halls = []
    for name in hall_names:
        h = db.query(models.Hall).filter_by(name=name).first()
        if not h:
            h = models.Hall(name=name)
            db.add(h)
            db.flush()
        halls.append(h)
    hall_map = {h.name: h for h in halls}

    # ── Machines (12 machines across 3 halls) ─────────────────────────────────
    machine_defs = [
        ("M1",  "Production Line 1",          "صالة إنتاج 1"),
        ("M2",  "Production Line 2",          "صالة إنتاج 1"),
        ("M3",  "Production Line 3",          "صالة إنتاج 1"),
        ("M4",  "Production Line 4",          "صالة إنتاج 1"),
        ("M5",  "Production Line 5",          "صالة إنتاج 2"),
        ("M6",  "Production Line 6",          "صالة إنتاج 2"),
        ("M7",  "Production Line 7",          "صالة إنتاج 2"),
        ("M8",  "Production Line 8",          "صالة إنتاج 2"),
        ("M9",  "Production Line 9",          "صالة إنتاج 3"),
        ("M10", "Production Line 10",         "صالة إنتاج 3"),
        ("M10-PK2", "Production Line 10 PK2", "صالة إنتاج 3"),
        ("M18", "Production Line 18",         "صالة إنتاج 3"),
    ]
    machines = []
    for code, name, hall_name in machine_defs:
        hall = hall_map[hall_name]
        m = db.query(models.Machine).filter_by(machine_code=code).first()
        if not m:
            m = models.Machine(
                hall_id=hall.id,
                machine_code=code,
                machine_name=name,
            )
            db.add(m)
            db.flush()
        machines.append(m)

    # ── Products (43 real products) ──────────────────────────────────────────
    product_data = [
        ("Five Chocolate",        "شيكوالتة فايف جي",            12, 95.5, 6.5,  7.5,  107, 109.5, 112),
        ("Cookies Five",          "كوكيز فايف جي",               12, 95.5, 6.5,  7.5,  107, 109.5, 112),
        ("Strawberry Five",       "فراولة فايف جي",              12, 95.5, 10.5, None, 104, 106,   108),
        ("Biscuit Caramel Five",  "بسكويت كراميل فايف جي",       12, 95.5, 6.5,  7.5,  107, 109.5, 112),
        ("Yogurt Five",           "زبادي فايف جي",               12, 82.5, 11.0, None,  90,  93.5,   97),
        ("Go On Chocolate",       "جو اون شيكوالته",             12, 83.5, 4.5,  4.5,   90,  92.5,   95),
        ("Go On Strawberry",      "جو فراولة / جو اون فراولة",   12, 83.5, 8.5,  None,  90,  92,     94),
        ("Go On Biscuit",         "جو اون بسكويت",               12, 83.5, 4.5,  4.5,   90,  92.5,   95),
        ("Marbello Vanilla",      "ماربيلو فانيليا",             24, 49.0, 4.5,  None,  52,  53.5,   55),
        ("Marbello Chocolate",    "ماربيلو شيكوالتة",            24, 49.0, 4.5,  None,  52,  53.5,   55),
        ("Free Good Vanilla",     "فري جود فانيليا",             18, 59.0, 9.5,  None,  67,  68.5,   70),
        ("Free Good Chocolate",   "فري جود شيكوالتة",            18, 59.0, 7.5,  4.5,   69,  71,     73),
        ("Free Good Cono",        "فري جود كونو / هاب الند كونو",30, 28.0, 2.5,  15.0,  42,  45.5,   49),
        ("Free Good Cake",        "فري جود كيك",                 18, 59.0, 7.5,  4.5,   69,  71,     73),
        ("Froop Milk",            "فروبي ميلك",                  24, 62.5, 24.5, None,  82,  87,     92),
        ("Royal Chocolate Cono",  "رويال شيكوالته كونو",         20, 38.0, 6.5,  16.75, 58.5, 61.25, 64),
        ("Volcano Vanilla Cono",  "فولكانو فانيليا كونو",        12, 43.0, 7.5,  15.75, 63.5, 66.25, 69),
        ("Cookies and Cream Cono","كوكيز اند كريم كونو",         20, 41.0, 6.5,  16.5,  61,   64,     67),
        ("Best Cono",             "بيست كونو فانيليا / شيكوالتة",20, 38.0, 5.75, 15.5,  57,   59.25,  61.5),
        ("Joker Vanilla Cono",    "جوكر فانيليا كونو",           25, 38.0, 5.75, 14.5,  56,   58.25,  60.5),
        ("Snickers Chocolate",    "اسنيكرز شيكوالتة",            18, 42.5, 4.5,  24.0,  67,   71,     75.5),
        ("Snickers Cookies",      "اسنيكرز كوكيز",               18, 42.5, 4.5,  21.0,  65,   68,     71.5),
        ("Volcano Chocolate",     "فولكانو شيكوالتة",            18, 47.0, 19.0, 2.5,   66,   68.5,   71),
        ("Volcano Vanilla",       "فولكانو فانيليا",             18, 47.0, 19.0, 2.5,   66,   68.5,   71),
        ("Volcano Dark Mocha",    "فولكانو دارك / موكا",         18, 47.0, 18.0, None,  63,   65,     67),
        ("Volcano Coconut",       "فولكانو جوز هند",             18, 47.0, 19.0, 1.5,   65,   67.5,   70),
        ("Royal Double Stick",    "رويال / دابل استيك",          18, 39.0, 15.5, 2.5,   55,   57,     59),
        ("Volcano XIA Pistachio", "فولكانو اكسيا بيستاشيو",      12, 50.5, 20.0, 4.5,   72,   75,     78),
        ("Fraichage Hazelnut Stick","فرايتاج شيكوالته بندق استيك",12, 50.5, 19.5, 3.5,   71,   73.5,   76),
        ("Mango Cup",             "مانجو زبدية",                 24, 76.0, None, None,  75,   76,     77),
        ("Watermelon",            "بطيخ",                        24, 56.0, None, None,  55,   56,     57),
        ("Pop Cantaloupe",        "بوب كنتالوب / كيك / جوافة",   24, 56.0, None, None,  55,   56,     57),
        ("Switch Mix",            "سويتش / سويتش ميكس",          12, 49.0, 16.5, 19.0,  81,   84.5,   88),
        ("Mini Tart",             "ميني تارت",                    8, 112.5,12.0, 7.5,  143,  147.5,  152),
        ("Combo Vanilla Caramel", "كومبو فانيليا & كراميل",      18, 46.0, 7.5,  15.5,  80,   83.5,   87),
        ("Combo Cookies",         "كومبو كوكيز",                 18, 46.0, 7.5,  15.5,  80,   83.5,   87),
        ("Combo XIA",             "كومبو اكسيا فانيليا / شيكوالتة",18, 49.5, 7.5,  16.5,  83,   87.5,   92),
        ("Fraichage Hazelnut Cono","فرايتاج شيكوالته بندق كونو", 18, 49.5, 7.5,  15.5,  83,   87,     91),
        ("Frisco Vanilla Caramel", "فريسكو فانيليا & كراميل",    16, 43.0, 11.0, 16.0,  81,   89,     97),
        ("Gowali",                "جوالي (فانيليا - شيكوالتة)",   2, 1750.0,None,None,1740, 1750,  1760),
        ("Mizaj",                 "مزاج خوخ / جوافة / نعناع / توت",24, 66.5,None,None,  64,   66.5,   69),
        ("Mizaj Mango XL",        "مزاج مانجو XL",               12, 97.5, None,None,  95,   97.5,  100),
        ("Dewoo",                 "ديوو (مانجو / فراولة)",       18, 104.0,None,None, 102,  104,   106),
    ]
    for (name, name_ar, pcs, ice, sauce, biscuit, min_wt, target, max_wt) in product_data:
        p = db.query(models.Product).filter_by(product_name=name).first()
        if not p:
            p = models.Product(
                product_name=name,
                product_name_ar=name_ar,
                default_pieces=pcs,
                default_ice_weight=ice,
                default_sauce_weight=sauce,
                default_biscuit_weight=biscuit,
                default_min_weight=min_wt,
                default_max_weight=max_wt,
            )
            db.add(p)
            db.flush()

    # ── Defect Categories (89 real defects) ──────────────────────────────────
    defect_defs = [
        ("AD01", "تكتل الإضافات في جزء واحد"),
        ("AD02", "إضافات رطبة/مكسورة زيادة"),
        ("AD03", "نوع إضافات غير مطابق للوصفة"),
        ("AD04", "عدم وجود إضافة / إنسداد فى كل العيون"),
        ("AD05", "عدم وجود إضافة / إنسداد فى بعض العيون"),
        ("CHEM01", "خطر كيميائى"),
        ("LK01", "تسريب من جسم الكوب/العبوة"),
        ("LK02", "تسريب من منطقة الغطاء"),
        ("LK03", "تسريب بعد التجميد"),
        ("LK04", "تسريب أثناء النقل الداخلي"),
        ("LK05", "تسريب بسبب تشقق العبوة"),
        ("LK06", "تسريب من اللحام بعد الفحص"),
        ("MIC01", "حدوث تلوث ميكروبى"),
        ("PH01", "تلوث/شوائب في الإضافات"),
        ("PH02", "جسم غريب (بلاستيك/معدن)"),
        ("PH03", "شعر/ألياف"),
        ("PH04", "أتربة/رمل"),
        ("PH05", "تلوث المنتج بمواد خام"),
        ("PH06", "تلوث المنتج بآفات حشرية ومواد سامة"),
        ("PH07", "حدوث تلوث خلطى"),
        ("PH08", "اكسسورات"),
        ("PH09", "بقايا ورق/كرتون"),
        ("PK01", "اعوجاج/تشوه الكوب"),
        ("PK02", "كوب مكسور/مشقوق"),
        ("PK03", "اتساخ الكوب من الداخل قبل التعبئة"),
        ("PK04", "تجعد/تمزق في ورق التغليف"),
        ("PK05", "زيادة عدد الكراتين"),
        ("PK06", "نقص عدد الكراتين"),
        ("PK07", "تجميع كراتين غير محكم"),
        ("PK08", "عدم إحكام غلق الغطاء"),
        ("PK09", "غطاء مكسور/مشقوق"),
        ("PK10", "عدم وجود غطاء"),
        ("PK11", "غطاء غير مطابق للمقاس"),
        ("PK12", "تراكب/ميل في الغطاء"),
        ("PK13", "مضارب الأغطية (خبطات/خدوش)"),
        ("PK14", "اتساخ الغطاء"),
        ("PK15", "تشوه حافة الغطاء"),
        ("PK16", "عصا مكسورة"),
        ("PK17", "عصا غير في المنتصف"),
        ("PK18", "عصا طالعة زيادة/غاطسة زيادة"),
        ("PK19", "مضارب العصا (خبطات/تكسرات)"),
        ("PK20", "خشونة/شوائب بالعصا"),
        ("PK21", "ضعف لحام الغطاء/الفويل"),
        ("PK22", "لحام غير مكتمل (جزء مفتوح)"),
        ("PK23", "احتراق/اسوداد في منطقة اللحام"),
        ("PK24", "تجعيد الفويل داخل خط اللحام"),
        ("PK25", "انحراف القطعة داخل الرول"),
        ("PK26", "تلوث في خط اللحام (شوكولاتة/ثلج)"),
        ("PK27", "ضغط لحام عالي يعمل قطع للفويل"),
        ("PK28", "عيوب الكرتون"),
        ("PK29", "كرتونة ضعيفة/مبللة"),
        ("PK30", "سوء رص داخل الكرتونة"),
        ("PK31", "عدم لصق/تلزيق الكرتونة"),
        ("PK32", "مكونات غير مدونة/خطأ حساسية"),
        ("PK34", "عطل / توقف روبوتات الماكينة"),
        ("PK35", "اتساخ الكوب من الخارج"),
        ("PK36", "باركود كرتونة غير صحيح/غير مقروء"),
        ("PR01", "خطأ فى طباعة الرسالة"),
        ("PR02", "عدم وضوح الطباعة"),
        ("PR03", "انعدام الطباعة"),
        ("PR04", "طباعة مقلوبة/في مكان غلط"),
        ("PR05", "خطأ في اسم المنتج/الباركود"),
        ("Q01", "قوام ناعم زيادة (ذوبان/ضعف تجميد/سيولة)"),
        ("Q02", "قوام متصلب"),
        ("Q03", "بلورات ثلجية واضحة"),
        ("Q04", "انفصال دهني/تزييت"),
        ("Q05", "طعم/رائحة غير طبيعية"),
        ("Q06", "لون غير مطابق"),
        ("Q07", "تكتل/تحبب في المنتج"),
        ("Q08", "فقاعات/فراغات داخل المنتج"),
        ("Q09", "شكل غير متناسق"),
        ("T01", "ارتفاع حرارة الفريزر"),
        ("T02", "انخفاض حرارة شديد (تجمد زائد)"),
        ("T03", "وقت تجميد غير كافي"),
        ("T04", "تذبذب الحرارة أثناء التشغيل"),
        ("T05", "تكوّن ثلج زائد على المعدات"),
        ("T06", "انسداد هواء/مراوح ضعيفة"),
        ("VA01", "تكسير/سحق أثناء النقل الداخلي"),
        ("VA02", "تعرض لحرارة أثناء التحميل"),
        ("VA03", "تكديس خاطئ يسبب تلف العبوات"),
        ("VA04", "اختلاط دفعات/عدم تتبع"),
        ("W01", "نقص وزن"),
        ("W02", "زيادة وزن"),
        ("W03", "تذبذب وزن"),
        ("W04", "نقص الإضافات (مكسرات/بسكوت/شوكولاتة)"),
        ("W05", "زيادة الإضافات"),
        ("W06", "توزيع غير منتظم للإضافات"),
        ("W07", "عدم تفعيل ميزان العد"),
        ("X01", "منتج غير مطابق بدون سبب واضح (يحتاج تحقيق)"),
    ]
    for code, name in defect_defs:
        d = db.query(models.DefectCategory).filter_by(defect_code=code).first()
        if not d:
            d = models.DefectCategory(defect_code=code, defect_name=name)
            db.add(d)
            db.flush()

    # ── Departments ───────────────────────────────────────────────────────────
    dept_data = [
        ("الإنتاج", "Production", "AD,Q,W", 1),
        ("الإنتاج (قسم التشغيل)", "Operations", "PR,PK01,PK02,PK03,PK04,PK05,PK06,PK07,PK16,PK17,PK18,PK19,PK20,PK28,PK29,PK30,PK31,PK32,PK34,PK35,PK36", 2),
        ("الصيانة", "Maintenance", "LK,PK21,PK22,PK23,PK24,PK25,PK26,PK27,T", 3),
        ("المشتريات", "Procurement", "PH,PK08,PK09,PK10,PK11,PK12,PK13,PK14,PK15,VA", 4),
        ("الجودة", "Quality", "MIC,CHEM,X", 5),
        ("الجودة (قسم توكيد الجودة)", "Quality Assurance", "MIC,CHEM,X", 6),
    ]
    for name, name_en, prefixes, sort_order in dept_data:
        d = db.query(models.Department).filter_by(name=name).first()
        if not d:
            d = models.Department(name=name, name_en=name_en, defect_prefixes=prefixes, sort_order=sort_order)
            db.add(d)
            db.flush()

    db.commit()
    print("✓ Seed complete.")
    print(f"  {db.query(models.Hall).count()} halls, {db.query(models.Machine).count()} machines, {db.query(models.Product).count()} products")
    print(f"  {db.query(models.DefectCategory).count()} defect categories")
    print(f"  {db.query(models.Department).count()} departments")
    print(f"  Admin: admin/admin123")


if __name__ == "__main__":
    seed()
    db.close()
