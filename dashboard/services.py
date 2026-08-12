from django.utils import timezone

from animals.models import Animal
from owners.models import Owner
from prescriptions.models import Prescription
from vaccinations.models import Vaccination
from visits.models import Visit


class DashboardService:
    @staticmethod
    def get_summary():
        today = timezone.localdate()

        return {
            "owners_count": Owner.objects.count(),
            "animals_count": Animal.objects.count(),
            "today_visits": Visit.objects.filter(
                visit_date__date=today,
            ).count(),
            "vaccinations_due": Vaccination.objects.filter(
                next_due_date__lte=today,
            ).count(),
            "prescriptions_expiring": Prescription.objects.filter(
                valid_until__lte=today,
            ).count(),
        }