from datetime import timedelta

import pytest
from django.utils import timezone

from analytics.services import AnalyticsService
from tests.factories.animals import AnimalFactory
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.vaccinations import VaccinationFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_overview_groups_animals_by_species():
    AnimalFactory(species="Dog")
    AnimalFactory(species="Dog")
    AnimalFactory(species="Cat")

    data = AnalyticsService.overview()

    assert data["animals_by_species"][0]["count"] == 2
    assert data["animals_by_species"][1]["count"] == 1


def test_overview_groups_visits_by_month():
    now = timezone.now()

    VisitFactory(visit_date=now)
    VisitFactory(visit_date=now + timedelta(days=1))

    data = AnalyticsService.overview()

    assert len(data["visits_by_month"]) == 1
    assert data["visits_by_month"][0]["count"] == 2


def test_overview_returns_most_common_vaccines():
    VaccinationFactory.create_batch(
        3,
        vaccine_name="Rabies",
    )
    VaccinationFactory(
        vaccine_name="Leptospirosis",
    )

    data = AnalyticsService.overview()

    assert data["top_vaccines"][0]["vaccine_name"] == "Rabies"
    assert data["top_vaccines"][0]["count"] == 3


def test_overview_returns_most_common_medications():
    PrescriptionFactory.create_batch(
        3,
        medication_name="Amoxicillin",
    )
    PrescriptionFactory(
        medication_name="Meloxicam",
    )

    data = AnalyticsService.overview()

    assert data["top_medications"][0]["medication_name"] == "Amoxicillin"
    assert data["top_medications"][0]["count"] == 3


def test_overview_groups_visits_by_veterinarian(veterinarian_user,):
    VisitFactory.create_batch(
        3,
        veterinarian=veterinarian_user,
    )
    VisitFactory()

    data = AnalyticsService.overview()

    veterinarian_result = next(
        item
        for item in data["visits_by_veterinarian"]
        if item["veterinarian_id"] == veterinarian_user.id
    )

    assert veterinarian_result["count"] == 3