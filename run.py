#!/usr/bin/env python3
"""Run the Quality KPI server with auto-generated HTTPS support."""
import os
import ssl
import subprocess
import sys
from pathlib import Path

CERT_DIR = Path(__file__).parent / ".certs"
CERT_FILE = CERT_DIR / "cert.pem"
KEY_FILE = CERT_DIR / "key.pem"


def ensure_cert():
    CERT_DIR.mkdir(exist_ok=True)
    if CERT_FILE.exists() and KEY_FILE.exists():
        return True
    print("Generating self-signed SSL certificate...")
    try:
        subprocess.run(
            [
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-keyout", str(KEY_FILE),
                "-out", str(CERT_FILE), "-days", "3650", "-nodes",
                "-subj", "/CN=QualityKPI",
            ],
            check=True, capture_output=True,
        )
        os.chmod(CERT_FILE, 0o644)
        os.chmod(KEY_FILE, 0o600)
        print("SSL certificate created at", CERT_DIR)
    except FileNotFoundError:
        print("openssl not found. Install it or access via HTTP (no install prompt).")
        return False
    return True


if __name__ == "__main__":
    import uvicorn

    ssl_ok = ensure_cert()

    if ssl_ok and CERT_FILE.exists():
        print("\n  Server running at:")
        print(f"  \033[92mhttps://0.0.0.0:8000\033[0m  (PWA install supported on mobile)\n")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            ssl_keyfile=str(KEY_FILE),
            ssl_certfile=str(CERT_FILE),
        )
    else:
        print("\n  Server running at:")
        print(f"  \033[93mhttp://0.0.0.0:8000\033[0m  (no PWA install on mobile)\n")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
        )
