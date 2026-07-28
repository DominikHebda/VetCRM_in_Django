from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework import status

from prescriptions.models import Prescription
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_list_prescriptions(authenticated_client):
    PrescriptionFactory.create_batch(3)

    url = reverse("prescription-list")
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 3


def test_retrieve_prescription(authenticated_client):
    prescription = PrescriptionFactory()

    url = reverse("prescription-detail", args=[prescription.id])
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == prescription.id
    assert (
        response.data["prescription_number"]
        == prescription.prescription_number
    )
    assert response.data["medication_name"] == prescription.medication_name


def test_create_prescription(authenticated_client, user):
    visit = VisitFactory()
    issue_date = date.today()

    payload = {
        "animal": visit.animal.id,
        "visit": visit.id,
        "medication_name": "Amoxicillin",
        "active_substance": "Amoxicillin",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 14,
        "issue_date": issue_date.isoformat(),
        "valid_until": (issue_date + timedelta(days=30)).isoformat(),
        "instructions": "Administer after food",
    }

    url = reverse("prescription-list")
    response = authenticated_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Prescription.objects.count() == 1

    prescription = Prescription.objects.get()

    assert prescription.animal == visit.animal
    assert prescription.visit == visit
    assert prescription.veterinarian == user
    assert prescription.medication_name == "Amoxicillin"
    assert prescription.quantity == 14
    assert prescription.prescription_number == (
        f"RX-{issue_date.year}-000001"
    )


def test_create_prescriptions_generates_consecutive_numbers(
    authenticated_client,
    user,
):
    first_visit = VisitFactory()
    second_visit = VisitFactory()
    issue_date = date.today()

    first_payload = {
        "animal": first_visit.animal.id,
        "visit": first_visit.id,
        "medication_name": "Amoxicillin",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 14,
        "issue_date": issue_date.isoformat(),
        "valid_until": (issue_date + timedelta(days=30)).isoformat(),
    }
    second_payload = {
        "animal": second_visit.animal.id,
        "visit": second_visit.id,
        "medication_name": "Meloxicam",
        "dosage": "1 tablet",
        "frequency": "Once daily",
        "duration": "5 days",
        "quantity": 5,
        "issue_date": issue_date.isoformat(),
        "valid_until": (issue_date + timedelta(days=30)).isoformat(),
    }

    url = reverse("prescription-list")

    first_response = authenticated_client.post(
        url,
        first_payload,
        format="json",
    )
    second_response = authenticated_client.post(
        url,
        second_payload,
        format="json",
    )

    assert first_response.status_code == status.HTTP_201_CREATED
    assert second_response.status_code == status.HTTP_201_CREATED
    assert first_response.data["prescription_number"] == (
        f"RX-{issue_date.year}-000001"
    )
    assert second_response.data["prescription_number"] == (
        f"RX-{issue_date.year}-000002"
    )

    assert Prescription.objects.filter(veterinarian=user).count() == 2


def test_create_prescription_ignores_read_only_fields(
    authenticated_client,
    user,
):
    visit = VisitFactory()
    issue_date = date.today()

    payload = {
        "animal": visit.animal.id,
        "visit": visit.id,
        "veterinarian": visit.veterinarian.id,
        "prescription_number": "CUSTOM-NUMBER",
        "medication_name": "Amoxicillin",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 14,
        "issue_date": issue_date.isoformat(),
        "valid_until": (issue_date + timedelta(days=30)).isoformat(),
    }

    url = reverse("prescription-list")
    response = authenticated_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED

    prescription = Prescription.objects.get()

    assert prescription.veterinarian == user
    assert prescription.prescription_number != "CUSTOM-NUMBER"
    assert prescription.prescription_number == (
        f"RX-{issue_date.year}-000001"
    )


def test_create_prescription_rejects_invalid_dates(
    authenticated_client,
):
    visit = VisitFactory()

    payload = {
        "animal": visit.animal.id,
        "visit": visit.id,
        "medication_name": "Amoxicillin",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 14,
        "issue_date": "2026-01-31",
        "valid_until": "2026-01-01",
    }

    url = reverse("prescription-list")
    response = authenticated_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "valid_until" in response.data
    assert Prescription.objects.count() == 0


def test_create_prescription_rejects_zero_quantity(
    authenticated_client,
):
    visit = VisitFactory()

    payload = {
        "animal": visit.animal.id,
        "visit": visit.id,
        "medication_name": "Amoxicillin",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "duration": "7 days",
        "quantity": 0,
        "issue_date": "2026-01-01",
        "valid_until": "2026-01-31",
    }

    url = reverse("prescription-list")
    response = authenticated_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "quantity" in response.data
    assert Prescription.objects.count() == 0


def test_partial_update_prescription(authenticated_client):
    prescription = PrescriptionFactory(
        medication_name="Initial medication",
        quantity=10,
    )

    payload = {
        "medication_name": "Updated medication",
        "quantity": 20,
    }

    url = reverse("prescription-detail", args=[prescription.id])
    response = authenticated_client.patch(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK

    prescription.refresh_from_db()

    assert prescription.medication_name == "Updated medication"
    assert prescription.quantity == 20


def test_delete_prescription(authenticated_client):
    prescription = PrescriptionFactory()

    url = reverse("prescription-detail", args=[prescription.id])
    response = authenticated_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Prescription.objects.filter(
        id=prescription.id
    ).exists()


def test_filter_prescriptions_by_animal(authenticated_client):
    matching_prescription = PrescriptionFactory()
    PrescriptionFactory()

    url = reverse("prescription-list")
    response = authenticated_client.get(
        url,
        {"animal": matching_prescription.animal.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert (
        response.data["results"][0]["id"]
        == matching_prescription.id
    )


def test_filter_prescriptions_by_visit(authenticated_client):
    matching_prescription = PrescriptionFactory()
    PrescriptionFactory()

    url = reverse("prescription-list")
    response = authenticated_client.get(
        url,
        {"visit": matching_prescription.visit.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert (
        response.data["results"][0]["id"]
        == matching_prescription.id
    )


def test_filter_prescriptions_by_veterinarian(authenticated_client):
    matching_prescription = PrescriptionFactory()
    PrescriptionFactory()

    url = reverse("prescription-list")
    response = authenticated_client.get(
        url,
        {"veterinarian": matching_prescription.veterinarian.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert (
        response.data["results"][0]["id"]
        == matching_prescription.id
    )


@pytest.mark.parametrize(
    ("field", "search_value"),
    [
        ("medication_name", "Amoxicillin"),
        ("active_substance", "Meloxicam"),
        ("prescription_number", "000123"),
    ],
)
def test_search_prescriptions(
    authenticated_client,
    field,
    search_value,
):
    values = {
        "medication_name": "Unrelated medication",
        "active_substance": "Unrelated substance",
        "prescription_number": "RX-2026-999999",
    }

    values[field] = search_value

    matching_prescription = PrescriptionFactory(**values)

    PrescriptionFactory(
        medication_name="Different medication",
        active_substance="Different substance",
        prescription_number="RX-2026-888888",
    )

    url = reverse("prescription-list")
    response = authenticated_client.get(
        url,
        {"search": search_value},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_prescription.id


def test_order_prescriptions_by_issue_date(authenticated_client):
    older_prescription = PrescriptionFactory(
        issue_date=date(2026, 1, 1),
        valid_until=date(2026, 1, 31),
    )
    newer_prescription = PrescriptionFactory(
        issue_date=date(2026, 2, 1),
        valid_until=date(2026, 2, 28),
    )

    url = reverse("prescription-list")
    response = authenticated_client.get(
        url,
        {"ordering": "issue_date"},
    )

    assert response.status_code == status.HTTP_200_OK

    result_ids = [item["id"] for item in response.data["results"]]

    assert result_ids == [
        older_prescription.id,
        newer_prescription.id,
    ]


def test_unauthenticated_user_cannot_list_prescriptions(api_client):
    url = reverse("prescription-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED