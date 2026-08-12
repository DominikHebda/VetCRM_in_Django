import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories.animals import AnimalFactory

pytestmark = pytest.mark.django_db


def test_overview_requires_authentication(api_client):
    response = api_client.get(
        reverse("analytics-overview")
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticated_user_can_view_overview(
    authenticated_client,
):
    AnimalFactory.create_batch(3)

    response = authenticated_client.get(
        reverse("analytics-overview")
    )

    assert response.status_code == status.HTTP_200_OK
    assert "visits_by_month" in response.data
    assert "animals_by_species" in response.data