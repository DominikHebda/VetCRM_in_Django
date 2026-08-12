from django.db.models import Count
from django.db.models.functions import TruncMonth

from animals.models import Animal
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

        return {
            "visits_by_month": visits_by_month,
            "animals_by_species": animals_by_species,
        }