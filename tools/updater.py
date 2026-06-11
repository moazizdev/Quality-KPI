#!/usr/bin/env python3
"""
Pull latest code from GitHub and restart the server.
Called by the /system/update API endpoint.
"""
import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RESTART_FLAG = BASE_DIR / ".restart"


def log(msg):
    print(f"[updater] {msg}")


def run(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, cwd=cwd or BASE_DIR,
                            capture_output=True, text=True)
    if result.returncode != 0:
        log(f"Command failed: {cmd}")
        log(f"stderr: {result.stderr.strip()}")
        return False
    return True


def update():
    log("Fetching latest code from GitHub...")
    if not run("git fetch origin"):
        return False, "Git fetch failed"

    log("Merging origin/master...")
    if not run("git pull origin master"):
        return False, "Git pull failed"

    # Check if requirements changed
    log("Checking dependencies...")
    run("pip install -r requirements.txt -q")

    log("Update complete. Restarting server...")
    RESTART_FLAG.touch()
    return True, "Update successful, server restarting..."


if __name__ == "__main__":
    ok, msg = update()
    print(msg)
    sys.exit(0 if ok else 1)
