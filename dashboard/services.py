from django.utils import timezone

from accounts.models import UserProfile
from animals.models import Animal
from owners.models import Owner
from prescriptions.models import Prescription
from vaccinations.models import Vaccination
from visits.models import Visit


class DashboardService:
    @staticmethod
    def get_summary(user):
        today = timezone.localdate()

        visits = Visit.objects.all()

        if user.profile.role == UserProfile.Role.VET:
            visits = visits.filter(veterinarian=user)

        return {
            "owners_count": Owner.objects.count(),
            "animals_count": Animal.objects.count(),
            "today_visits": visits.filter(
                visit_date__date=today,
            ).count(),
            "scheduled_visits": visits.filter(
                status=Visit.Status.SCHEDULED,
            ).count(),
            "vaccinations_due": Vaccination.objects.filter(
                next_due_date__lte=today,
            ).count(),
            "prescriptions_expiring": Prescription.objects.filter(
                valid_until__lte=today,
            ).count(),
            "recent_visits": list(
                visits.select_related("animal")
                .order_by("-visit_date")[:5]
                .values(
                    "id",
                    "visit_date",
                    "reason",
                    "status",
                    "animal__name",
                )
            ),
            "recent_animals": list(
                Animal.objects.select_related("owner")
                .order_by("-created_at")[:5]
                .values(
                    "id",
                    "name",
                    "species",
                    "owner__last_name",
                )
            ),
        }