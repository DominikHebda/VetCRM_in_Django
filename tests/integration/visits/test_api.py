import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories.accounts import UserFactory
from tests.factories.animals import AnimalFactory
from tests.factories.visits import VisitFactory
from visits.models import Visit

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def veterinarian():
    return UserFactory()


@pytest.fixture
def authenticated_client(api_client, veterinarian):
    api_client.force_authenticate(user=veterinarian)
    return api_client

def test_list_visits(authenticated_client):
    VisitFactory.create_batch(3)

    url = reverse("visit-list")
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 3

def test_retrieve_visit(authenticated_client):
    visit = VisitFactory()

    url = reverse("visit-detail", args=[visit.id])
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == visit.id

def test_create_visit(authenticated_client, veterinarian):
    animal = AnimalFactory()

    payload = {
        "animal": animal.id,
        "veterinarian": veterinarian.id,
        "visit_date": "2030-01-01T10:00:00Z",
        "reason": "Vaccination",
        "notes": "First visit",
        "status": Visit.Status.SCHEDULED,
    }

    url = reverse("visit-list")
    response = authenticated_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Visit.objects.count() == 1

def test_update_visit(authenticated_client):
    visit = VisitFactory()

    payload = {
        "animal": visit.animal.id,
        "veterinarian": visit.veterinarian.id,
        "visit_date": visit.visit_date.isoformat().replace("+00:00", "Z"),
        "reason": "Updated reason",
        "notes": visit.notes,
        "status": Visit.Status.COMPLETED,
    }

    url = reverse("visit-detail", args=[visit.id])
    response = authenticated_client.put(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK

    visit.refresh_from_db()
    assert visit.reason == "Updated reason"
    assert visit.status == Visit.Status.COMPLETED

def test_delete_visit(authenticated_client):
    visit = VisitFactory()

    url = reverse("visit-detail", args=[visit.id])
    response = authenticated_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Visit.objects.count() == 0