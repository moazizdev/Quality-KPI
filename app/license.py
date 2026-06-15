import hashlib
import hmac
import json
import os
import socket
import time
from datetime import datetime, timezone
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

LICENSE_FILE = Path(__file__).resolve().parent.parent / "license.key"
_LICENSE_SECRET = "dc6d7f04eec8cc228bc881dabfab4767204f7c7274e6ece7481f60a56fc7afec"
_DEFAULT_EXPIRY_DAYS = 30

# ─── GitHub Fingerprint Whitelist ──────────────────────────────────────────
_WHITELIST_PUBLIC_KEY_HEX = "94080aec69b63657dbaa9ef9f42570deaed8114fa0b1ab6e7392755e763e5564"
_WHITELIST_URL = "https://raw.githubusercontent.com/moazizdev/Quality-KPI/main/whitelist.json"
_WHITELIST_CACHE_FILE = Path(__file__).resolve().parent.parent / ".whitelist_cache"
_WHITELIST_REFRESH_INTERVAL = 3600

_whitelist_cache = None
_whitelist_pubkey = None


def _get_whitelist_pubkey():
    global _whitelist_pubkey
    if _whitelist_pubkey is None:
        raw = bytes.fromhex(_WHITELIST_PUBLIC_KEY_HEX)
        _whitelist_pubkey = Ed25519PublicKey.from_public_bytes(raw)
    return _whitelist_pubkey


def _fetch_whitelist():
    from urllib.request import Request, urlopen
    req = Request(_WHITELIST_URL, headers={"User-Agent": "QualityKPI/1.0"})
    with urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def _verify_whitelist(data):
    sig_hex = data.get("signature")
    if not sig_hex:
        return None
    payload = {k: v for k, v in data.items() if k != "signature"}
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    try:
        _get_whitelist_pubkey().verify(bytes.fromhex(sig_hex), payload_json.encode())
    except InvalidSignature:
        return None
    return set(payload.get("fingerprints", [])), payload.get("expires")


def refresh_whitelist():
    global _whitelist_cache
    now = time.time()
    try:
        data = _fetch_whitelist()
        result = _verify_whitelist(data)
        if result is None:
            return False
        fingerprints, expires = result
        _whitelist_cache = (fingerprints, expires, now)
        _WHITELIST_CACHE_FILE.write_text(json.dumps(data))
        return True
    except Exception:
        if _WHITELIST_CACHE_FILE.exists():
            try:
                data = json.loads(_WHITELIST_CACHE_FILE.read_text())
                result = _verify_whitelist(data)
                if result:
                    fingerprints, expires = result
                    _whitelist_cache = (fingerprints, expires, now)
                    return True
            except Exception:
                pass
        return False


def is_whitelisted():
    global _whitelist_cache
    now = time.time()
    if _whitelist_cache is not None and (now - _whitelist_cache[2]) > _WHITELIST_REFRESH_INTERVAL:
        refresh_whitelist()
    if _whitelist_cache is None:
        return None
    fingerprints, expires, _ = _whitelist_cache
    if expires:
        try:
            if now > datetime.fromisoformat(expires).timestamp():
                return False
        except ValueError:
            pass
    return get_machine_fingerprint() in fingerprints


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
