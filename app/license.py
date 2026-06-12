import hashlib
import hmac
import os
import socket
import time
from datetime import datetime, timezone
from pathlib import Path

LICENSE_FILE = Path(__file__).resolve().parent.parent / "license.key"
_LICENSE_SECRET = "dc6d7f04eec8cc228bc881dabfab4767204f7c7274e6ece7481f60a56fc7afec"
_DEFAULT_EXPIRY_DAYS = 30


def _get_secret():
    return _LICENSE_SECRET


def get_machine_fingerprint():
    parts = []
    try:
        for iface in sorted(os.listdir("/sys/class/net/")):
            if iface == "lo":
                continue
            with open(f"/sys/class/net/{iface}/address") as f:
                parts.append(f.read().strip())
    except Exception:
        pass
    try:
        parts.append(Path("/etc/machine-id").read_text().strip())
    except Exception:
        pass
    try:
        parts.append(Path("/etc/hostname").read_text().strip())
    except Exception:
        pass
    parts.append(socket.gethostname())
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def _generate_license(machine_fingerprint, secret, expiry_days=None, expiry_ts=None):
    if expiry_ts is None:
        if expiry_days is None:
            expiry_days = _DEFAULT_EXPIRY_DAYS
        expiry_ts = int(time.time()) + expiry_days * 86400
    data = f"{machine_fingerprint}|{expiry_ts}"
    signature = hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()
    return f"{expiry_ts}:{signature}"


def _validate_license(license_key, machine_fingerprint, secret):
    if ":" in license_key:
        parts = license_key.split(":", 1)
        if len(parts) != 2:
            return False
        expiry_ts_str, signature = parts
        try:
            expiry_ts = int(expiry_ts_str)
        except ValueError:
            return False
        if time.time() > expiry_ts:
            return False
        data = f"{machine_fingerprint}|{expiry_ts}"
        expected = hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)
    expected = hmac.new(secret.encode(), machine_fingerprint.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(license_key, expected)


def get_license_expiry():
    if not LICENSE_FILE.exists():
        return None
    stored = LICENSE_FILE.read_text().strip()
    if ":" not in stored:
        return None
    parts = stored.split(":", 1)
    if len(parts) != 2:
        return None
    try:
        return int(parts[0])
    except ValueError:
        return None


def is_activated():
    secret = _get_secret()
    if not secret:
        return False
    if not LICENSE_FILE.exists():
        return False
    stored = LICENSE_FILE.read_text().strip()
    if not stored:
        return False
    fp = get_machine_fingerprint()
    return _validate_license(stored, fp, secret)


def activate(license_key):
    secret = _get_secret()
    if not secret:
        return False, "License system not initialized"
    if not license_key:
        return False, "License key is required"
    fp = get_machine_fingerprint()
    if not _validate_license(license_key, fp, secret):
        return False, "Invalid license key for this machine"
    LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
    LICENSE_FILE.write_text(license_key.strip())
    return True, "Activated successfully"
