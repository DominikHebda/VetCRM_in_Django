#!/bin/sh
set -e

python manage.py migrate
python manage.py shell <<'PY'
from django.conf import settings
from django.contrib.auth import get_user_model

db = settings.DATABASES["default"]
print("VETCRM_DIAG ENGINE:", db.get("ENGINE"), flush=True)
print("VETCRM_DIAG HOST:", db.get("HOST"), flush=True)
print("VETCRM_DIAG DATABASE:", db.get("NAME"), flush=True)
print("VETCRM_DIAG AUTH_BACKENDS:", settings.AUTHENTICATION_BACKENDS, flush=True)

user = get_user_model().objects.filter(username="Administrator1").first()
print("VETCRM_DIAG ADMIN_EXISTS:", user is not None, flush=True)
if user is not None:
    print(
        "VETCRM_DIAG ADMIN_FLAGS:",
        user.is_active,
        user.is_staff,
        user.is_superuser,
        user.has_usable_password(),
        flush=True,
    )
PY
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
