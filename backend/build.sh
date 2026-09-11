#!/usr/bin/env bash
set -o errexit
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
