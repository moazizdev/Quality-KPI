#!/usr/bin/env python3
"""
Generate a license key for a given machine fingerprint.
Usage: python gen_license.py <fingerprint>

The secret must be set in ../config.ini under [license] section.
"""
import sys
import hashlib
import hmac
from configparser import ConfigParser
from pathlib import Path

CONFIG_FILE = Path(__file__).resolve().parent.parent / "config.ini"


def get_secret():
    cfg = ConfigParser()
    cfg.read(str(CONFIG_FILE))
    if cfg.has_option("license", "secret"):
        val = cfg.get("license", "secret").strip()
        if val:
            return val
    return None


def generate_license(machine_fingerprint, secret):
    h = hmac.new(secret.encode(), machine_fingerprint.encode(), hashlib.sha256)
    return h.hexdigest()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python gen_license.py <machine_fingerprint>")
        sys.exit(1)

    secret = get_secret()
    if not secret:
        print("Error: [license] secret not found in config.ini")
        sys.exit(1)

    fingerprint = sys.argv[1].strip()
    key = generate_license(fingerprint, secret)
    print(key)
