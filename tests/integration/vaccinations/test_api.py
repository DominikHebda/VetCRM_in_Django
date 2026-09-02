import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories.animals import AnimalFactory
from tests.factories.vaccinations import VaccinationFactory
from vaccinations.models import Vaccination

pytestmark = pytest.mark.django_db


def test_list_vaccinations(authenticated_client):
    VaccinationFactory.create_batch(3)

    url = reverse("vaccination-list")
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 3


def test_retrieve_vaccination(authenticated_client):
    vaccination = VaccinationFactory()

    url = reverse("vaccination-detail", args=[vaccination.id])
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == vaccination.id
    assert response.data["vaccine_name"] == vaccination.vaccine_name


def test_create_vaccination(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    animal = AnimalFactory()

    payload = {
        "animal": animal.id,
        "veterinarian": veterinarian_user.id,
        "vaccine_name": "Rabies",
        "manufacturer": "VetPharma",
        "batch_number": "BATCH-123",
        "vaccination_date": "2026-07-28",
        "next_due_date": "2027-07-28",
        "notes": "Annual vaccination",
    }

    url = reverse("vaccination-list")
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Vaccination.objects.count() == 1

    vaccination = Vaccination.objects.get()

    assert vaccination.animal == animal
    assert vaccination.veterinarian == veterinarian_user
    assert vaccination.vaccine_name == "Rabies"
    assert vaccination.manufacturer == "VetPharma"
    assert vaccination.batch_number == "BATCH-123"


def test_update_vaccination(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    vaccination = VaccinationFactory(
        vaccine_name="Old vaccine",
        notes="Old notes",
    )

    payload = {
        "animal": vaccination.animal.id,
        "veterinarian": vaccination.veterinarian.id,
        "vaccine_name": "Updated vaccine",
        "manufacturer": vaccination.manufacturer,
        "batch_number": vaccination.batch_number,
        "vaccination_date": vaccination.vaccination_date.isoformat(),
        "next_due_date": (
            vaccination.next_due_date.isoformat()
            if vaccination.next_due_date
            else None
        ),
        "notes": "Updated notes",
    }

    url = reverse("vaccination-detail", args=[vaccination.id])
    response = api_client.put(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK

    vaccination.refresh_from_db()

    assert vaccination.vaccine_name == "Updated vaccine"
    assert vaccination.notes == "Updated notes"


def test_delete_vaccination(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    vaccination = VaccinationFactory()

    url = reverse("vaccination-detail", args=[vaccination.id])
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Vaccination.objects.filter(id=vaccination.id).exists()


def test_filter_vaccinations_by_animal(authenticated_client):
    animal = AnimalFactory()
    matching_vaccination = VaccinationFactory(animal=animal)
    VaccinationFactory()

    url = reverse("vaccination-list")
    response = authenticated_client.get(url, {"animal": animal.id})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_vaccination.id


def test_filter_vaccinations_by_veterinarian(
    authenticated_client,
    veterinarian_user,
):
    matching_vaccination = VaccinationFactory(
        veterinarian=veterinarian_user
    )
    VaccinationFactory()

    url = reverse("vaccination-list")
    response = authenticated_client.get(
        url,
        {"veterinarian": veterinarian_user.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_vaccination.id


def test_search_vaccinations_by_vaccine_name(authenticated_client):
    matching_vaccination = VaccinationFactory(
        vaccine_name="Rabies Vaccine"
    )
    VaccinationFactory(vaccine_name="Canine Distemper")

    url = reverse("vaccination-list")
    response = authenticated_client.get(url, {"search": "Rabies"})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_vaccination.id


def test_search_vaccinations_by_manufacturer(authenticated_client):
    matching_vaccination = VaccinationFactory(
        manufacturer="VetPharma"
    )
    VaccinationFactory(manufacturer="AnimalMed")

    url = reverse("vaccination-list")
    response = authenticated_client.get(url, {"search": "VetPharma"})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_vaccination.id


def test_order_vaccinations_by_vaccination_date(authenticated_client):
    older_vaccination = VaccinationFactory(
        vaccination_date="2024-01-01"
    )
    newer_vaccination = VaccinationFactory(
        vaccination_date="2025-01-01"
    )

    url = reverse("vaccination-list")
    response = authenticated_client.get(
        url,
        {"ordering": "vaccination_date"},
    )

    assert response.status_code == status.HTTP_200_OK

    result_ids = [item["id"] for item in response.data["results"]]

    assert result_ids == [
        older_vaccination.id,
        newer_vaccination.id,
    ]


def test_receptionist_cannot_create_vaccination(
    api_client,
    receptionist_user,
    veterinarian_user,
):
    api_client.force_authenticate(user=receptionist_user)

    animal = AnimalFactory()

    payload = {
        "animal": animal.id,
        "veterinarian": veterinarian_user.id,
        "vaccine_name": "Rabies",
        "manufacturer": "VetPharma",
        "batch_number": "BATCH-123",
        "vaccination_date": "2026-07-28",
        "next_due_date": "2027-07-28",
        "notes": "Annual vaccination",
    }

    url = reverse("vaccination-list")
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Vaccination.objects.count() == 0
