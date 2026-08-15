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


def test_veterinarian_can_view_overview(
    veterinarian_client,
):
    AnimalFactory.create_batch(3)

    response = veterinarian_client.get(
        reverse("analytics-overview")
    )

    assert response.status_code == status.HTTP_200_OK
    assert "visits_by_month" in response.data
    assert "animals_by_species" in response.data
    assert "top_vaccines" in response.data
    assert "top_medications" in response.data
    assert "visits_by_veterinarian" in response.data


def test_admin_can_view_overview(admin_client):
    response = admin_client.get(
        reverse("analytics-overview")
    )

    assert response.status_code == status.HTTP_200_OK


def test_receptionist_cannot_view_overview(
    api_client,
    receptionist_user,
):
    api_client.force_authenticate(user=receptionist_user)

    response = api_client.get(
        reverse("analytics-overview")
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def veterinarian_client(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    return api_client