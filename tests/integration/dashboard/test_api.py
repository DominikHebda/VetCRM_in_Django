import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory

pytestmark = pytest.mark.django_db


def test_dashboard_requires_authentication(api_client):
    response = api_client.get(reverse("dashboard"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticated_user_can_access_dashboard(authenticated_client):
    owner = OwnerFactory()
    OwnerFactory()

    AnimalFactory.create_batch(
        3,
        owner=owner,
    )

    response = authenticated_client.get(reverse("dashboard"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["owners_count"] == 2
    assert response.data["animals_count"] == 3
    assert "today_visits" in response.data
    assert "vaccinations_due" in response.data
    assert "prescriptions_expiring" in response.data