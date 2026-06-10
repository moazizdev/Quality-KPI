from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv
from pathlib import Path
import configparser
import os
import sys

load_dotenv()

CONFIG_FILE = Path(__file__).resolve().parent.parent / "config.ini"


def get_database_url() -> str:
    # 1. Environment variable override
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url

    # 2. Config file (supports network shares)
    if CONFIG_FILE.is_file():
        cfg = configparser.ConfigParser()
        cfg.read(str(CONFIG_FILE))
        try:
            cfg_path = cfg.get("database", "path")
            if cfg_path.strip():
                path = cfg_path.strip()
                # If it looks like a file path (not a full URL), make it sqlite
                if not path.startswith("sqlite://") and not path.startswith("postgresql://"):
                    # Handle UNC paths (\\server\share\file.db)
                    path = path.replace("\\", "/")
                    # UNC paths start with //
                    if path.startswith("//"):
                        path = "//" + path
                    return f"sqlite:///{path}"
                return path
        except (configparser.NoSectionError, configparser.NoOptionError):
            pass

    # 3. Packaged app (PyInstaller) — store in user data directory
    if getattr(sys, "frozen", False):
        if os.name == "nt":
            base = Path(os.environ.get("APPDATA", Path.home()))
        else:
            base = Path.home() / ".local" / "share"
        db_dir = base / "QualityKPI"
        db_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{db_dir / 'quality_kpi.db'}"

    # 4. Default — local file in project root
    return os.getenv("DATABASE_URL", "sqlite:///./quality_kpi.db")


DATABASE_URL = get_database_url()
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
