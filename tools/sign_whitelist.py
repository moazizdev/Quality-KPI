#!/usr/bin/env python3
"""
Sign a fingerprint whitelist JSON file with the Ed25519 private key.

Usage:
  python sign_whitelist.py <private_key_hex> <input.json> [output.json]

If output is omitted, prints to stdout.

Input JSON format:
  {
    "fingerprints": ["<hex_fingerprint>", ...],
    "expires": "2026-12-31T00:00:00Z"
  }

Output JSON format (signed):
  {
    "fingerprints": [...],
    "expires": "...",
    "signature": "<hex_ed25519_signature>"
  }
"""
import json
import sys
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption


def sign_whitelist(private_key_hex, payload):
    raw = bytes.fromhex(private_key_hex)
    key = Ed25519PrivateKey.from_private_bytes(raw)
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = key.sign(payload_json.encode())
    payload["signature"] = signature.hex()
    return payload


def main():
    if len(sys.argv) < 3:
        print(__doc__.strip())
        sys.exit(1)

    priv_hex = sys.argv[1]
    in_path = Path(sys.argv[2])
    out_path = Path(sys.argv[3]) if len(sys.argv) > 3 else None

    payload = json.loads(in_path.read_text())
    signed = sign_whitelist(priv_hex, payload)
    output = json.dumps(signed, indent=2)

    if out_path:
        out_path.write_text(output)
        print(f"Signed whitelist written to {out_path}")
    else:
        print(output)


if __name__ == "__main__":
    main()
