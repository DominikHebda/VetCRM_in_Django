from datetime import timedelta

import pytest
from django.utils import timezone

from analytics.services import AnalyticsService
from tests.factories.animals import AnimalFactory
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