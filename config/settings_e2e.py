"""Settings for isolated local browser tests."""

from . import settings as base_settings
from .settings import *  # noqa: F403

E2E_MODE = True
E2E_ROOT = base_settings.BASE_DIR / ".e2e"
E2E_ROOT.mkdir(parents=True, exist_ok=True)

SECRET_KEY = "e2e-only-secret-key-for-isolated-browser-tests-not-production"
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": E2E_ROOT / "db.sqlite3",
    }
}

FRONTEND_URL = "http://127.0.0.1:5174"
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8002",
    FRONTEND_URL,
]

OAUTH2_PROVIDER = {
    **base_settings.OAUTH2_PROVIDER,
    "ALLOWED_REDIRECT_URI_SCHEMES": ["http"],
}

SECURE_PROXY_SSL_HEADER = None
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SESSION_COOKIE_NAME = "vetcrm_e2e_sessionid"
CSRF_COOKIE_NAME = "vetcrm_e2e_csrftoken"

MEDIA_ROOT = E2E_ROOT / "media"
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}