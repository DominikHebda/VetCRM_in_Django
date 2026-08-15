from datetime import timedelta

from django.utils import timezone

from prescriptions.models import Prescription
from vaccinations.models import Vaccination


class NotificationService:
    VACCINATION_DUE_DAYS = 30
    PRESCRIPTION_EXPIRING_DAYS = 7

    @classmethod
    def get_upcoming_vaccinations(cls):
        today = timezone.localdate()
        deadline = today + timedelta(days=cls.VACCINATION_DUE_DAYS)

        vaccinations = (
            Vaccination.objects.select_related(
                "animal",
                "animal__owner",
            )
            .filter(
                next_due_date__isnull=False,
                next_due_date__gte=today,
                next_due_date__lte=deadline,
            )
            .order_by("next_due_date")
        )

        return [
            {
                "type": "vaccination_due",
                "severity": "warning",
                "message": (
                    f"{vaccination.vaccine_name} vaccination for "
                    f"{vaccination.animal.name} is due soon"
                ),
                "due_date": vaccination.next_due_date,
                "animal_id": vaccination.animal_id,
                "vaccination_id": vaccination.id,
            }
            for vaccination in vaccinations
        ]

    @classmethod
    def get_expiring_prescriptions(cls):
        today = timezone.localdate()
        deadline = today + timedelta(days=cls.PRESCRIPTION_EXPIRING_DAYS)

        prescriptions = (
            Prescription.objects.select_related(
                "animal",
                "veterinarian",
            )
            .filter(
                valid_until__gte=today,
                valid_until__lte=deadline,
            )
            .order_by("valid_until")
        )

        return [
            {
                "type": "prescription_expiring",
                "severity": "warning",
                "message": (
                    f"Prescription {prescription.prescription_number} for "
                    f"{prescription.animal.name} expires soon"
                ),
                "due_date": prescription.valid_until,
                "animal_id": prescription.animal_id,
                "prescription_id": prescription.id,
            }
            for prescription in prescriptions
        ]