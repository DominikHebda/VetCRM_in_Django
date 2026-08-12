from datetime import timedelta

import pytest
from django.utils import timezone

from dashboard.services import DashboardService
from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.vaccinations import VaccinationFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_dashboard_summary_counts_owners_and_animals():
    owner = OwnerFactory()
    OwnerFactory()

    AnimalFactory.create_batch(
        3,
        owner=owner,
    )

    data = DashboardService.get_summary()

    assert data["owners_count"] == 2
    assert data["animals_count"] == 3


def test_dashboard_summary_counts_today_visits():
    today = timezone.now()

    VisitFactory(visit_date=today)
    VisitFactory(visit_date=today + timedelta(days=1))

    data = DashboardService.get_summary()

    assert data["today_visits"] == 1


def test_dashboard_summary_counts_due_vaccinations():
    today = timezone.localdate()

    VaccinationFactory(next_due_date=today)
    VaccinationFactory(next_due_date=today - timedelta(days=1))
    VaccinationFactory(next_due_date=today + timedelta(days=1))

    data = DashboardService.get_summary()

    assert data["vaccinations_due"] == 2


def test_dashboard_summary_counts_expiring_prescriptions():
    today = timezone.localdate()

    PrescriptionFactory(valid_until=today)
    PrescriptionFactory(valid_until=today - timedelta(days=1))
    PrescriptionFactory(valid_until=today + timedelta(days=1))

    data = DashboardService.get_summary()

    assert data["prescriptions_expiring"] == 2


def test_dashboard_returns_recent_animals():
    AnimalFactory.create_batch(6)

    data = DashboardService.get_summary()

    assert len(data["recent_animals"]) == 5


def test_dashboard_returns_recent_visits():
    VisitFactory.create_batch(7)

    data = DashboardService.get_summary()

    assert len(data["recent_visits"]) == 5