#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d venv ]; then
    echo "First run — setting up..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt -q
    python seed_dev.py
    echo "Setup complete!"
else
    source venv/bin/activate
fi

python run.py

echo
read -p "Press Enter to close..."
