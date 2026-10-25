from datetime import UTC, date, datetime
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from oauth2_provider.models import get_application_model

from accounts.models import UserProfile
from animals.models import Animal
from medical.models import MedicalRecord
from owners.models import Owner
from prescriptions.models import Prescription
from vaccinations.models import Vaccination
from visits.models import Visit


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
            users = {}

            for username, role in (
                ("e2e_admin", UserProfile.Role.ADMIN),
                ("e2e_vet", UserProfile.Role.VET),
                ("e2e_receptionist", UserProfile.Role.RECEPTIONIST),
            ):
                user, _ = get_user_model().objects.update_or_create(
                    username=username,
                    defaults={
                        "email": f"{username}@example.invalid",
                        "first_name": "E2E",
                        "last_name": role,
                        "is_active": True,
                        "is_staff": role == UserProfile.Role.ADMIN,
                        "is_superuser": role == UserProfile.Role.ADMIN,
                    },
                )
                user.set_password("E2e-Login-Only-42!")
                user.save(update_fields=["password"])

                UserProfile.objects.update_or_create(
                    user=user,
                    defaults={"role": role},
                )
                users[username] = user

            owner, _ = Owner.objects.update_or_create(
                email="e2e-readonly@example.invalid",
                defaults={
                    "first_name": "E2E",
                    "last_name": "Odczyt",
                    "phone": "500600701",
                    "address": "ul. Odczytowa 1, Testowo",
                },
            )

            animal, _ = Animal.objects.update_or_create(
                owner=owner,
                name="E2E Pacjent Odczyt",
                defaults={
                    "species": "dog",
                    "breed": "Rasa testowa",
                    "birth_date": date(2020, 5, 15),
                    "chip_number": "900000000000001",
                    "notes": "Pacjent do testu odczytu przez VET.",
                },
            )

            visit, _ = Visit.objects.update_or_create(
                animal=animal,
                reason="E2E wizyta do odczytu dokumentacji",
                defaults={
                    "veterinarian": users["e2e_vet"],
                    "visit_date": datetime(
                        2026, 9, 15, 8, 30, tzinfo=UTC,
                    ),
                    "status": "COMPLETED",
                    "notes": "Wizyta do testu uprawnień recepcji.",
                },
            )

            MedicalRecord.objects.update_or_create(
                visit=visit,
                defaults={
                    "diagnosis": "E2E Diagnoza Odczyt",
                    "treatment": "E2E Leczenie Odczyt",
                    "recommendations": "Kontrola zgodnie z zaleceniami.",
                    "weight": "12.50",
                    "temperature": "38.5",
                },
            )

            Vaccination.objects.update_or_create(
                animal=animal,
                vaccine_name="E2E Szczepionka Odczyt",
                defaults={
                    "veterinarian": users["e2e_vet"],
                    "manufacturer": "E2E Producent Odczyt",
                    "batch_number": "E2E-ODCZYT-001",
                    "vaccination_date": date(2026, 9, 15),
                    "next_due_date": date(2027, 9, 15),
                    "notes": "Szczepienie do testu uprawnień recepcji.",
                },
            )

            Prescription.objects.update_or_create(
                prescription_number="E2E-READONLY-001",
                defaults={
                    "animal": animal,
                    "visit": visit,
                    "veterinarian": users["e2e_vet"],
                    "medication_name": "E2E Lek Odczyt",
                    "active_substance": "E2E Substancja Odczyt",
                    "dosage": "1 tabletka",
                    "frequency": "Raz dziennie",
                    "duration": "7 dni",
                    "quantity": 7,
                    "issue_date": date(2026, 9, 15),
                    "valid_until": date(2026, 10, 15),
                    "instructions": "Recepta do testu uprawnień recepcji.",
                },
            )

            application_defaults = {
                "name": "VetCRM browser tests",
                "user": users["e2e_admin"],
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