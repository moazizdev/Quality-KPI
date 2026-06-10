import io
import tempfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import inspect as sa_inspect, text
from sqlalchemy.orm import Session

from app.database import get_db, DATABASE_URL, engine, Base
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/backup", tags=["Backup"], dependencies=[Depends(get_current_user)])

BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "backups"
# Tables to exclude from SQL backup (SQLAlchemy internals)
EXCLUDE_TABLES = {"alembic_version", "spatial_ref_sys", "geography_columns", "geometry_columns"}


def _is_sqlite() -> bool:
    return DATABASE_URL.startswith("sqlite:///")


def _get_db_path():
    if _is_sqlite():
        path_part = DATABASE_URL[len("sqlite:///"):]
        return Path(path_part).resolve()
    return None


def _backup_dir() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    return BACKUP_DIR


def _escape_sql(val):
    """Escape a Python value for use in a SQL INSERT statement."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, float):
        return str(val)
    if isinstance(val, bytes):
        return f"E'\\\\x{val.hex()}'"
    s = str(val).replace("'", "''")
    return f"'{s}'"


def _sql_dump(output: io.StringIO):
    """Write a portable SQL dump of all user tables using SQLAlchemy."""
    inspector = sa_inspect(engine)
    table_names = [t for t in inspector.get_table_names() if t not in EXCLUDE_TABLES]

    output.write("-- Quality KPI System - SQL Dump\n")
    output.write(f"-- Generated: {datetime.now().isoformat()}\n")
    output.write(f"-- Engine: {engine.name}\n\n")

    # Disable constraints temporarily for clean import
    if engine.name == "postgresql":
        output.write("SET session_replication_role = 'replica';\n\n")

    with engine.connect() as conn:
        for table_name in table_names:
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            cols_str = ", ".join(columns)

            # Get CREATE TABLE
            output.write(f"\n-- Table: {table_name}\n")

            rows = conn.execute(text(f"SELECT * FROM {table_name}"))
            row_count = 0
            for row in rows:
                values = ", ".join(_escape_sql(v) for v in row)
                output.write(f"INSERT INTO {table_name} ({cols_str}) VALUES ({values});\n")
                row_count += 1

            output.write(f"-- {row_count} rows exported\n")

    if engine.name == "postgresql":
        output.write("\nSET session_replication_role = 'origin';\n")


def _write_sql_dump(path: Path):
    buf = io.StringIO()
    _sql_dump(buf)
    path.write_text(buf.getvalue(), encoding="utf-8")


def _mask_url(url: str) -> str:
    """Mask the password in a database URL."""
    if "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    if "@" not in rest:
        return url
    creds, host = rest.rsplit("@", 1)
    if ":" not in creds:
        return url
    user, _ = creds.split(":", 1)
    return f"{scheme}://{user}:****@{host}"


def _list_backups() -> list:
    if _is_sqlite():
        db_path = _get_db_path()
        if db_path:
            return sorted(
                str(p) for p in db_path.parent.glob("quality_kpi_backup_*.db")
            )
    else:
        bdir = _backup_dir()
        return sorted(str(p) for p in bdir.glob("quality_kpi_backup_*"))

    return []


@router.get("/download")
def download_backup(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRoleEnum.admin:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"detail": "Admin access required"})

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if _is_sqlite():
        db_path = _get_db_path()
        if not db_path or not db_path.is_file():
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Database file not found"})

        import sqlite3
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
        source = sqlite3.connect(str(db_path))
        dest = sqlite3.connect(tmp.name)
        source.backup(dest)
        source.close()
        dest.close()

        tmp_path = Path(tmp.name)
        tmp.close()
        filename = f"quality_kpi_backup_{timestamp}.db"

        def cleanup():
            if tmp_path.is_file():
                tmp_path.unlink()

        return StreamingResponse(
            open(tmp_path, "rb"),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    else:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".sql", mode="w", encoding="utf-8")
        tmp_path = Path(tmp.name)
        tmp.close()

        try:
            _write_sql_dump(tmp_path)
            filename = f"quality_kpi_backup_{timestamp}.sql"

            return StreamingResponse(
                open(tmp_path, "rb"),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        finally:
            if tmp_path.is_file():
                tmp_path.unlink()


@router.get("/create-copy")
def create_backup_copy(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRoleEnum.admin:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"detail": "Admin access required"})

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if _is_sqlite():
        db_path = _get_db_path()
        if not db_path or not db_path.is_file():
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Database file not found"})

        import sqlite3
        backup_path = db_path.parent / f"quality_kpi_backup_{timestamp}.db"
        source = sqlite3.connect(str(db_path))
        dest = sqlite3.connect(str(backup_path))
        source.backup(dest)
        source.close()
        dest.close()

        size_mb = backup_path.stat().st_size / (1024 * 1024)
        return {
            "message": "Backup created successfully",
            "path": str(backup_path),
            "size_mb": round(size_mb, 2),
            "timestamp": timestamp,
        }
    else:
        bdir = _backup_dir()
        backup_path = bdir / f"quality_kpi_backup_{timestamp}.sql"
        _write_sql_dump(backup_path)
        size_mb = backup_path.stat().st_size / (1024 * 1024)
        return {
            "message": "Backup created successfully",
            "path": str(backup_path),
            "size_mb": round(size_mb, 2),
            "timestamp": timestamp,
        }


@router.get("/info")
def backup_info(current_user: models.User = Depends(get_current_user)):
    safe_url = _mask_url(DATABASE_URL)
    if _is_sqlite():
        db_path = _get_db_path()
        if not db_path or not db_path.is_file():
            return {"path": safe_url, "size_mb": 0, "exists": False}
        size_mb = db_path.stat().st_size / (1024 * 1024)
        return {
            "path": str(db_path),
            "size_mb": round(size_mb, 2),
            "exists": True,
            "backups": _list_backups(),
            "database_type": "sqlite",
        }
    else:
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
                table_count = result.scalar()
            return {
                "path": safe_url,
                "size_mb": 0,
                "exists": True,
                "backups": _list_backups(),
                "database_type": "postgresql",
                "table_count": table_count,
                "backup_dir": str(_backup_dir()),
            }
        except Exception as e:
            return {"path": safe_url, "size_mb": 0, "exists": False, "error": str(e)}
