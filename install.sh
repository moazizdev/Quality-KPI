#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "${YELLOW}  Quality KPI System — Installer${NC}"
echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo ""

# ── Check Python ──
echo -e "${YELLOW}[1/4] Checking Python...${NC}"
if ! command -v python3 &>/dev/null; then
    echo -e "  ${RED}✗${NC} Python 3 not found. Install it first:"
    echo "    sudo apt install python3 python3-pip python3-venv"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} $(python3 --version)"

if ! python3 -c "import venv" &>/dev/null; then
    echo -e "  ${RED}✗${NC} python3-venv not found. Install it:"
    echo "    sudo apt install python3-venv"
    exit 1
fi

# ── Virtual Environment ──
echo -e "${YELLOW}[2/4] Setting up virtual environment...${NC}"
if [ ! -d venv ]; then
    python3 -m venv venv
    echo -e "  ${GREEN}✓${NC} Virtual environment created"
else
    echo -e "  ${GREEN}✓${NC} Virtual environment already exists"
fi
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# ── Database ──
echo -e "${YELLOW}[3/4] Setting up database...${NC}"
if [ ! -f quality_kpi.db ]; then
    python3 seed_dev.py
    echo -e "  ${GREEN}✓${NC} Database created with sample data"
else
    echo -e "  ${GREEN}✓${NC} Database already exists"
fi

# ── Run ──
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Starting server...${NC}"
echo -e "${GREEN}  Open http://127.0.0.1:8000${NC}"
echo -e "${GREEN}  Login: admin / admin123${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

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
