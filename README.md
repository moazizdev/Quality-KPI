# Quality KPI System

نظام مؤشرات الجودة — Quality Control and KPI tracking for manufacturing environments.
Bilingual Arabic/English SPA with desktop app support.

---

## 📦 Windows Installation (for non-technical users)

### Requirements
- Windows 10 or 11
- Python 3.10+ (download from [python.org](https://www.python.org/downloads/) — check **"Add Python to PATH"**)

### Setup

1. **Extract** the project folder anywhere (e.g. `C:\QC_KPI`)
2. **Double-click** `setup.bat` — this will:
   - Create a virtual environment
   - Install all dependencies
   - Create the database with sample data
   - Add a shortcut on your desktop
3. **Double-click** `QC KPI.bat` (or the desktop shortcut) to launch

> Login: **admin** / **admin123**

### Alternative: Browser mode

Double-click `start_server.bat` — opens the dashboard in your web browser at `http://127.0.0.1:8000`.

---

## 🖥️ Using a Shared Database (Network Drive)

Multiple users can share the same database file on a network drive:

1. Place the database file on a shared folder, e.g. `\\SERVER\SharedFolder\quality_kpi.db`
2. Open `config.ini` in a text editor
3. Uncomment and edit the path line:
   ```ini
   [database]
   path = \\SERVER\SharedFolder\quality_kpi.db
   ```
4. Run `setup.bat` on each computer (it will use the shared database)

> **Important:** All users must have read/write permissions to the shared folder.
> Only one person should run seed setup — others just need `QC KPI.bat`.

### Config file options

| Setting | Example | Description |
|---------|---------|-------------|
| `path` | `\\SERVER\Share\db.db` | Network path (UNC format) |
| `path` | `D:\Shared\db.db` | Local drive path |
| `path` | `quality_kpi.db` | Local file in project folder (default) |

Environment variable `DATABASE_URL` overrides the config file.

---

## 💾 Database Backup (Admin)

The admin user can back up the database from within the app:

1. Login as **admin**
2. Click **"Database Backup"** in the sidebar
3. Choose:
   - **Download Backup** — downloads a `.db` file to your computer
   - **Create Backup Copy** — saves a timestamped copy next to the original file

Backup uses SQLite's online backup API — safe to use while the system is running.

### Backup API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /backup/info` | Show database location, size, existing backups |
| `GET /backup/download` | Download a live backup (admin only) |
| `GET /backup/create-copy` | Create timestamped copy on disk (admin only) |

---

## 🧪 Development Quick Start

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_dev.py               # seed with sample data
uvicorn app.main:app --reload    # http://localhost:8000
```

### Seed scripts

| Script | Contents |
|--------|----------|
| `seed.py` | Real data only: 3 halls, 12 machines, 43 products, 89 defect categories, admin user |
| `seed_dev.py` | Everything in seed.py + sample production records, deviations, CAPA cases, complaints |

---

## 📁 Project Structure

```
quality_kpi/
├── app/
│   ├── main.py              # FastAPI app + router registration
│   ├── database.py          # SQLAlchemy engine & session (configurable path)
│   ├── models.py            # All ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT authentication
│   ├── excel_export.py      # Excel export utility
│   └── routers/
│       ├── auth.py          # Login
│       ├── halls.py         # Halls CRUD
│       ├── machines.py      # Machines CRUD
│       ├── products.py      # Products CRUD
│       ├── production.py    # Production Records CRUD
│       ├── deviations.py    # Deviations + Defect Categories
│       ├── capa.py          # CAPA Cases
│       ├── complaints.py    # Customer Complaints
│       ├── kpi.py           # KPI Dashboard endpoints
│       ├── reports.py       # Weekly report (DOCX + PDF)
│       └── backup.py        # Database backup & info
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js, api.js, translations.js
│       └── pages/ (11 page controllers)
├── desktop_app.py           # PyWebView desktop entry point
├── seed.py                  # Production seed (real data only)
├── seed_dev.py              # Development seed (includes sample data)
├── config.ini               # Database path configuration
├── setup.bat                # Windows one-click installer
├── QC KPI.bat               # Windows desktop launcher
├── start_server.bat         # Windows browser launcher
└── requirements.txt
```

---

## 📊 Reports

| Format | Endpoint | Description |
|--------|----------|-------------|
| JSON | `GET /reports/weekly` | Weekly report data |
| DOCX | `GET /reports/weekly/docx` | Arabic Word document |
| PDF | `GET /reports/weekly/pdf` | Arabic PDF (requires WeasyPrint) |

---

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive Swagger docs.

| Module | Base Path |
|--------|-----------|
| Halls | `/halls` |
| Machines | `/machines` |
| Products | `/products` |
| Production Records | `/production-records` |
| Defect Categories | `/defect-categories` |
| Deviations | `/deviations` |
| CAPA Cases | `/capa` |
| Customer Complaints | `/complaints` |
| KPI Dashboard | `/kpi/summary` |

---

## Data Model

```
Hall
└── Machine
    ├── ProductionRecord  ← (also linked to Product)
    └── Deviation         ← (also linked to Product + DefectCategory)
        └── CAPACase

CustomerComplaint  (independent module)
```
