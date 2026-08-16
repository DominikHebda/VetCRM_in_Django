from datetime import timedelta

from django.utils import timezone

from prescriptions.models import Prescription
from vaccinations.models import Vaccination
from visits.models import Visit


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
                "due_date": vaccination.next_due_date.isoformat(),
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
                "due_date": prescription.valid_until.isoformat(),
                "animal_id": prescription.animal_id,
                "prescription_id": prescription.id,
            }
            for prescription in prescriptions
        ]

    @staticmethod
    def get_today_visits():
        today = timezone.localdate()

        visits = (
            Visit.objects.select_related(
                "animal",
                "veterinarian",
            )
            .filter(
                visit_date__date=today,
                status=Visit.Status.SCHEDULED,
            )
            .order_by("visit_date")
        )

        return [
            {
                "type": "visit_today",
                "severity": "info",
                "message": (
                    f"Visit for {visit.animal.name} is scheduled for today"
                ),
                "due_date": visit.visit_date.isoformat(),
                "animal_id": visit.animal_id,
                "visit_id": visit.id,
            }
            for visit in visits
        ]

    @classmethod
    def get_notifications(cls):
        items = [
            *cls.get_upcoming_vaccinations(),
            *cls.get_expiring_prescriptions(),
            *cls.get_today_visits(),
            ]
            
        items.sort(
            key=lambda item: (
            item["due_date"],
            )
        )
           
        return {
            "count": len(items),
            "items": items,
        }            