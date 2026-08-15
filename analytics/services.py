from django.db.models import Count
from django.db.models.functions import TruncMonth

from animals.models import Animal
from prescriptions.models import Prescription
from vaccinations.models import Vaccination
from visits.models import Visit


class AnalyticsService:
    @staticmethod
    def overview():
        visits_by_month = list(
            Visit.objects.annotate(
                month=TruncMonth("visit_date"),
            )
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        animals_by_species = list(
            Animal.objects.values("species")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        top_vaccines = list(
            Vaccination.objects.values("vaccine_name")
            .annotate(count=Count("id"))
            .order_by("-count", "vaccine_name")[:5]
        )

        top_medications = list(
            Prescription.objects.values("medication_name")
            .annotate(count=Count("id"))
            .order_by("-count", "medication_name")[:5]
        )

        visits_by_veterinarian = list(
            Visit.objects.values(
                "veterinarian_id",
                "veterinarian__first_name",
                "veterinarian__last_name",
            )
            .annotate(count=Count("id"))
            .order_by("-count", "veterinarian_id")
        )

        return {
            "visits_by_month": visits_by_month,
            "animals_by_species": animals_by_species,
            "top_vaccines": top_vaccines,
            "top_medications": top_medications,
            "visits_by_veterinarian": visits_by_veterinarian,
        }