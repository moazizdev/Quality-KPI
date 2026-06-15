#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# ── Ensure venv and dependencies ──
if [ ! -d venv ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

# ── Seed database if needed ──
if [ ! -f quality_kpi.db ]; then
    python3 seed_dev.py
fi

# ── Server loop ──
RESTART_FLAG=".restart"
cleanup() { rm -f "$RESTART_FLAG"; exit 0; }
trap cleanup SIGINT SIGTERM

while true; do
    python3 run.py
    if [ -f "$RESTART_FLAG" ]; then
        rm -f "$RESTART_FLAG"
        echo "Restarting server..."
        sleep 1
        continue
    fi
    break
done
