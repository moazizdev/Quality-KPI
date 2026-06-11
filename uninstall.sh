#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo -e "${YELLOW}  Quality KPI System — Uninstaller${NC}"
echo -e "${YELLOW}══════════════════════════════════════${NC}"
echo ""
echo "This will remove:"
echo "  • Database file (quality_kpi.db)"
echo "  • Virtual environment (venv/ folder)"
echo "  • Python cache files"
echo ""
echo -e "  ${YELLOW}Source code will NOT be deleted.${NC}"
echo ""

read -p "Keep database file? (y/n) [n]: " keepdb

echo ""
echo -e "${RED}────────────────────────────────────────${NC}"
echo -e "${RED}  WARNING: This cannot be undone!${NC}"
echo -e "${RED}────────────────────────────────────────${NC}"
echo ""
read -p "Type YES to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo -e "${GREEN}Cancelled. Nothing was changed.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}[1/5] Stopping server...${NC}"
SERVER_PID=$(lsof -t -i:8000 2>/dev/null || true)
if [ -n "$SERVER_PID" ]; then
  kill -9 "$SERVER_PID" 2>/dev/null || true
  echo -e "  ${GREEN}✓${NC} Server stopped"
else
  echo -e "  ${GREEN}✓${NC} No server running"
fi

echo -e "${YELLOW}[2/5] Removing database...${NC}"
if [ "$keepdb" = "y" ] || [ "$keepdb" = "Y" ]; then
  echo -e "  ${YELLOW}⚠${NC} Database kept (as you requested)"
elif [ -f "quality_kpi.db" ]; then
  rm -f quality_kpi.db
  if [ -f "quality_kpi.db" ]; then
    echo -e "  ${RED}✗${NC} Could not delete database. Check permissions."
  else
    echo -e "  ${GREEN}✓${NC} Database deleted"
  fi
else
  echo -e "  ${GREEN}✓${NC} No database found"
fi

echo -e "${YELLOW}[3/5] Removing virtual environment...${NC}"
DELETED=0
for VENV in "./venv" "../venv" "../.venv"; do
  if [ -d "$VENV" ]; then
    rm -rf "$VENV"
    if [ ! -d "$VENV" ]; then
      echo -e "  ${GREEN}✓${NC} Virtual environment deleted ($VENV)"
      DELETED=1
      break
    fi
  fi
done
if [ "$DELETED" -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No virtual environment found"
fi

echo -e "${YELLOW}[4/6] Cleaning generated files...${NC}"
rm -f license.key
rm -rf .certs
echo -e "  ${GREEN}✓${NC} License and certificate files removed"

echo -e "${YELLOW}[5/6] Cleaning Python cache...${NC}"
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Temporary files cleaned"

echo -e "${YELLOW}[6/6] Removing uninstaller...${NC}"
rm -f uninstall.sh
echo -e "  ${GREEN}✓${NC} Done"
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Uninstall Complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo "Your source files are still at:"
echo "  $(pwd)"
echo ""
echo "To reinstall, run:"
echo "  python -m venv ../venv"
echo "  pip install -r requirements.txt"
echo "  python seed.py"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
