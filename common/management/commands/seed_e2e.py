from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from oauth2_provider.models import get_application_model

from accounts.models import UserProfile


class Command(BaseCommand):
    help = "Prepare the isolated browser test account and OAuth application."
    requires_system_checks = []

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        expected_path = settings.BASE_DIR / ".e2e" / "db.sqlite3"

        if (
            not getattr(settings, "E2E_MODE", False)
            or db["ENGINE"] != "django.db.backends.sqlite3"
            or Path(db["NAME"]).resolve() != expected_path.resolve()
        ):
            raise CommandError(
                "This command requires config.settings_e2e "
                "and the dedicated .e2e/db.sqlite3 database."
            )

        Application = get_application_model()

        with transaction.atomic():
            user, _ = get_user_model().objects.update_or_create(
                username="e2e_admin",
                defaults={
                    "email": "e2e@example.invalid",
                    "is_active": True,
                    "is_staff": True,
                    "is_superuser": True,
                },
            )
            user.set_password("E2e-Login-Only-42!")
            user.save(update_fields=["password"])

            UserProfile.objects.update_or_create(
                user=user,
                defaults={"role": UserProfile.Role.ADMIN},
            )

            application_defaults = {
                "name": "VetCRM browser tests",
                "user": user,
                "client_type": Application.CLIENT_PUBLIC,
                "authorization_grant_type": Application.GRANT_AUTHORIZATION_CODE,
                "redirect_uris": "http://127.0.0.1:5174/auth/callback",
                "skip_authorization": True,
            }

            if hasattr(Application, "allowed_origins"):
                application_defaults["allowed_origins"] = (
                    "http://127.0.0.1:5174"
                )

            Application.objects.update_or_create(
                client_id="vetcrm-e2e-client",
                defaults=application_defaults,
            )

        self.stdout.write(self.style.SUCCESS("E2E account and OAuth app ready."))