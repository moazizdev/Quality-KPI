"""
Desktop entry point for Quality KPI System.
Runs the FastAPI server with a native webview window.
Supports both development use and PyInstaller-packaged executables.
"""
import sys
import os
import threading

# Ensure project root / app directory is on sys.path
if getattr(sys, "frozen", False):
    os.chdir(os.path.dirname(sys.executable))
    sys.path.insert(0, os.path.dirname(sys.executable))
else:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def run_server():
    ssl_keyfile = None
    ssl_certfile = None

    from run import ensure_cert
    if ensure_cert():
        from pathlib import Path
        cert = Path(__file__).resolve().parent / ".certs" / "cert.pem"
        key = Path(__file__).resolve().parent / ".certs" / "key.pem"
        if cert.exists():
            ssl_certfile = str(cert)
            ssl_keyfile = str(key)

    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        log_level="warning",
        reload=False,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
    )


def run_seed():
    """Run the seed script on first launch (if DB is empty)."""
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    try:
        if db.query(models.Hall).count() == 0:
            print("Seeding database with sample data...")
            from seed_dev import seed_dev
            seed_dev()
    finally:
        db.close()


def main():
    os.environ["WEBKIT_IGNORE_SSL_ERRORS"] = "1"

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    run_seed()

    try:
        import webview
        webview.create_window(
            "Quality KPI System",
            "https://127.0.0.1:8000",
            width=1280,
            height=800,
            resizable=True,
            text_select=True,
        )
        webview.start()
    except Exception as e:
        print(f"Desktop window not available: {e}")
        print("")
        print("  Open http://127.0.0.1:8000 in your browser.")
        print("  Press Ctrl+C to stop the server.")
        print("")
        server_thread.join()


if __name__ == "__main__":
    main()
