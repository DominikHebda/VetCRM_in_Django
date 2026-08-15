from datetime import timedelta

from django.utils import timezone

from vaccinations.models import Vaccination


class NotificationService:
    VACCINATION_DUE_DAYS = 30

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