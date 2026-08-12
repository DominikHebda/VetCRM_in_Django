from datetime import timedelta

import pytest
from django.utils import timezone

from dashboard.services import DashboardService
from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.vaccinations import VaccinationFactory
from tests.factories.visits import VisitFactory
from visits.models import Visit

pytestmark = pytest.mark.django_db


def test_dashboard_summary_counts_owners_and_animals(admin_user):
    owner = OwnerFactory()
    OwnerFactory()

    AnimalFactory.create_batch(
        3,
        owner=owner,
    )

    data = DashboardService.get_summary(admin_user)

    assert data["owners_count"] == 2
    assert data["animals_count"] == 3


def test_dashboard_summary_counts_today_visits(admin_user):
    today = timezone.now()

    VisitFactory(visit_date=today)
    VisitFactory(visit_date=today + timedelta(days=1))

    data = DashboardService.get_summary(admin_user)

    assert data["today_visits"] == 1


def test_dashboard_summary_counts_due_vaccinations(admin_user):
    today = timezone.localdate()

    VaccinationFactory(next_due_date=today)
    VaccinationFactory(next_due_date=today - timedelta(days=1))
    VaccinationFactory(next_due_date=today + timedelta(days=1))

    data = DashboardService.get_summary(admin_user)

    assert data["vaccinations_due"] == 2


def test_dashboard_summary_counts_expiring_prescriptions(admin_user):
    today = timezone.localdate()

    PrescriptionFactory(valid_until=today)
    PrescriptionFactory(valid_until=today - timedelta(days=1))
    PrescriptionFactory(valid_until=today + timedelta(days=1))

    data = DashboardService.get_summary(admin_user)

    assert data["prescriptions_expiring"] == 2


def test_dashboard_returns_recent_animals(admin_user):
    AnimalFactory.create_batch(6)

    data = DashboardService.get_summary(admin_user)

    assert len(data["recent_animals"]) == 5


def test_dashboard_returns_recent_visits(admin_user):
    VisitFactory.create_batch(7)

    data = DashboardService.get_summary(admin_user)

    assert len(data["recent_visits"]) == 5


def test_dashboard_counts_scheduled_visits(admin_user):
    VisitFactory(status=Visit.Status.SCHEDULED)
    VisitFactory(status=Visit.Status.SCHEDULED)
    VisitFactory(status=Visit.Status.COMPLETED)

    data = DashboardService.get_summary(admin_user)

    assert data["scheduled_visits"] == 2


def test_veterinarian_dashboard_only_counts_own_visits(
    veterinarian_user,
):
    VisitFactory(
        veterinarian=veterinarian_user,
        status=Visit.Status.SCHEDULED,
    )
    VisitFactory(
        status=Visit.Status.SCHEDULED,
    )

    data = DashboardService.get_summary(veterinarian_user)

    assert data["scheduled_visits"] == 1
    assert len(data["recent_visits"]) == 1