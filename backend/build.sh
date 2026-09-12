#!/usr/bin/env bash
set -o errexit

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Upgrading pip..."
python -m pip install --upgrade pip

echo "==> Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Applying database migrations..."
python manage.py migrate --no-input

echo "==> Ensuring default Administrator and App Settings exist..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from api.models import AdminUser, AppSettingsModel
admin_email = os.getenv('ADMIN_USERNAME', 'admin@mind2i.edu')
admin_pwd = os.getenv('ADMIN_PASSWORD', 'mind2i@admin')
if not AdminUser.objects.filter(email__iexact=admin_email).exists():
    AdminUser.objects.create(
        id='adm_default',
        name='Administrator',
        email=admin_email,
        password=admin_pwd,
        role='super_admin',
        assignedBatches=['all'],
        permissions=['all'],
        isActive=True
    )
    print(f'Created default administrator: {admin_email}')
else:
    print(f'Administrator {admin_email} already provisioned.')

AppSettingsModel.objects.get_or_create(
    id='settings_default',
    defaults={'appName': 'MIND2I Workshop & Bootcamp Hub'}
)
"

echo "==> Build completed successfully!"

