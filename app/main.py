from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, JSONResponse
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.license import is_activated, get_machine_fingerprint, is_whitelisted, refresh_whitelist
from app.routers import halls, machines, products, production, deviations, capa, complaints, kpi, auth, reports, backup, audit, departments, license, system

# ─── Migration helpers (minimise DB round-trips for remote databases) ──────

MIGRATIONS = {
    "audit_logs": [
        ("user_id", "INTEGER REFERENCES users(id)"),
        ("username", "VARCHAR(50)"),
        ("action", "VARCHAR(20)"),
        ("entity_type", "VARCHAR(50)"),
        ("entity_id", "INTEGER"),
        ("summary", "VARCHAR(255)"),
        ("details", "JSON"),
        ("ip_address", "VARCHAR(45)"),
    ],
    "machines": [("assigned_user_id", "INTEGER REFERENCES users(id)")],
    "production_records": [("pieces_produced", "INTEGER"), ("production_time", "VARCHAR(5)")],
    "deviations": [("deviation_time", "VARCHAR(5)")],
    "products": [
        ("product_name_ar", "VARCHAR(200)"),
        ("default_pieces", "INTEGER"),
        ("default_ice_weight", "FLOAT"),
        ("default_sauce_weight", "FLOAT"),
        ("default_biscuit_weight", "FLOAT"),
        ("default_min_weight", "FLOAT"),
        ("default_max_weight", "FLOAT"),
    ],
    "capa_cases": [("capa_time", "VARCHAR(5)")],
    "customer_complaints": [("complaint_time", "VARCHAR(5)")],
    "users": [("is_active", "INTEGER DEFAULT 1"), ("full_name", "VARCHAR(150)")],
}


def _run_migrations():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    for table_name, columns in MIGRATIONS.items():
        if table_name not in existing_tables:
            continue
        try:
            existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
            with engine.connect() as conn:
                for col_name, col_type in columns:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                conn.commit()
        except Exception:
            pass


Base.metadata.create_all(bind=engine)
_run_migrations()

# ─── Whitelist check on startup ─────────────────────────────────────────────
whitelist_ok = refresh_whitelist()
if whitelist_ok and is_whitelisted() is False:
    import sys
    print("FATAL: This server's fingerprint is not on the whitelist.")
    print(f"       Fingerprint: {get_machine_fingerprint()}")
    sys.exit(1)

app = FastAPI(
    title="Quality KPI System",
    description="Quality Control and KPI tracking for manufacturing environments",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── License Middleware ──────────────────────────────────────────────────────────

SKIP_LICENSE_PREFIXES = {"/license", "/auth/", "/js/", "/css/", "/icons/", "/favicon", "/manifest.json", "/sw.js"}


import logging
_logger = logging.getLogger("quality_kpi")


@app.middleware("http")
async def license_middleware(request: Request, call_next):
    path = request.url.path
    if path == "/" or any(path.startswith(p) for p in SKIP_LICENSE_PREFIXES):
        return await call_next(request)

    if not is_activated():
        return JSONResponse(
            status_code=402,
            content={"detail": "License required", "fingerprint": get_machine_fingerprint()},
        )

    wl = is_whitelisted()
    if wl is False:
        return JSONResponse(
            status_code=403,
            content={"detail": "Server not authorized (whitelist check failed)", "fingerprint": get_machine_fingerprint()},
        )
    if wl is None:
        _logger.warning("Whitelist not available; allowing request")

    return await call_next(request)


# ─── Register Routers ────────────────────────────────────────────────────────
app.include_router(license.router)
app.include_router(auth.router)
app.include_router(halls.router)
app.include_router(machines.router)
app.include_router(products.router)
app.include_router(production.router)
app.include_router(deviations.router)
app.include_router(deviations.defect_router)
app.include_router(capa.router)
app.include_router(complaints.router)
app.include_router(kpi.router)
app.include_router(reports.router)
app.include_router(backup.router)
app.include_router(departments.router)
app.include_router(audit.router)
app.include_router(system.router)


# ─── Serve Frontend SPA ───────────────────────────────────────────────────────
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"


@app.get("/")
def serve_root():
    index = frontend_dir / "index.html"
    if index.is_file():
        return FileResponse(str(index), media_type="text/html")
    return {"message": "Quality KPI API is running", "docs": "/docs"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    file_path = frontend_dir / full_path
    if file_path.is_file():
        return FileResponse(str(file_path))
    index = frontend_dir / "index.html"
    if index.is_file():
        return FileResponse(str(index), media_type="text/html")
    return {"error": "not found"}
