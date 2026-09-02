import pytest
from django.urls import reverse
from rest_framework import status

from medical.models import MedicalRecord
from tests.factories.medical import MedicalRecordFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_list_medical_records(authenticated_client):
    MedicalRecordFactory.create_batch(3)

    url = reverse("medical-record-list")
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 3


def test_retrieve_medical_record(authenticated_client):
    medical_record = MedicalRecordFactory()

    url = reverse("medical-record-detail", args=[medical_record.id])
    response = authenticated_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == medical_record.id
    assert response.data["diagnosis"] == medical_record.diagnosis


def test_create_medical_record(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    visit = VisitFactory()

    payload = {
        "visit": visit.id,
        "diagnosis": "Ear infection",
        "treatment": "Antibiotic therapy",
        "recommendations": "Control visit in seven days",
        "weight": "8.40",
        "temperature": "39.1",
    }

    url = reverse("medical-record-list")
    response = api_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert MedicalRecord.objects.count() == 1

    medical_record = MedicalRecord.objects.get()

    assert medical_record.visit == visit
    assert medical_record.diagnosis == "Ear infection"
    assert medical_record.treatment == "Antibiotic therapy"


def test_create_second_record_for_same_visit_is_rejected(
    api_client,
    veterinarian_user,
):
    api_client.force_authenticate(user=veterinarian_user)
    medical_record = MedicalRecordFactory()

    payload = {
        "visit": medical_record.visit.id,
        "diagnosis": "Another diagnosis",
    }

    url = reverse("medical-record-list")
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert MedicalRecord.objects.count() == 1
    assert "visit" in response.data


def test_update_medical_record(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    medical_record = MedicalRecordFactory(
        diagnosis="Initial diagnosis",
        treatment="Initial treatment",
    )

    payload = {
        "visit": medical_record.visit.id,
        "diagnosis": "Updated diagnosis",
        "treatment": "Updated treatment",
        "recommendations": medical_record.recommendations,
        "weight": (
            str(medical_record.weight)
            if medical_record.weight is not None
            else None
        ),
        "temperature": (
            str(medical_record.temperature)
            if medical_record.temperature is not None
            else None
        ),
    }

    url = reverse("medical-record-detail", args=[medical_record.id])
    response = api_client.put(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK

    medical_record.refresh_from_db()

    assert medical_record.diagnosis == "Updated diagnosis"
    assert medical_record.treatment == "Updated treatment"


def test_delete_medical_record(api_client, veterinarian_user):
    api_client.force_authenticate(user=veterinarian_user)
    medical_record = MedicalRecordFactory()

    url = reverse("medical-record-detail", args=[medical_record.id])
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not MedicalRecord.objects.filter(
        id=medical_record.id
    ).exists()


def test_filter_medical_records_by_visit(authenticated_client):
    visit = VisitFactory()
    matching_record = MedicalRecordFactory(visit=visit)
    MedicalRecordFactory()

    url = reverse("medical-record-list")
    response = authenticated_client.get(url, {"visit": visit.id})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_record.id


def test_filter_medical_records_by_animal(authenticated_client):
    matching_record = MedicalRecordFactory()
    MedicalRecordFactory()

    animal = matching_record.visit.animal

    url = reverse("medical-record-list")
    response = authenticated_client.get(
        url,
        {"visit__animal": animal.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_record.id


def test_search_medical_records_by_diagnosis(authenticated_client):
    matching_record = MedicalRecordFactory(
        diagnosis="Chronic skin allergy"
    )
    MedicalRecordFactory(diagnosis="Ear infection")

    url = reverse("medical-record-list")
    response = authenticated_client.get(url, {"search": "allergy"})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_record.id


def test_search_medical_records_by_treatment(authenticated_client):
    matching_record = MedicalRecordFactory(
        treatment="Antibiotic therapy"
    )
    MedicalRecordFactory(treatment="Diet change")

    url = reverse("medical-record-list")
    response = authenticated_client.get(
        url,
        {"search": "Antibiotic"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == matching_record.id


def test_order_medical_records_by_created_at(authenticated_client):
    older_record = MedicalRecordFactory()
    newer_record = MedicalRecordFactory()

    url = reverse("medical-record-list")
    response = authenticated_client.get(
        url,
        {"ordering": "created_at"},
    )

    assert response.status_code == status.HTTP_200_OK

    result_ids = [item["id"] for item in response.data["results"]]

    assert result_ids == [
        older_record.id,
        newer_record.id,
    ]


def test_receptionist_cannot_create_medical_record(
    api_client,
    receptionist_user,
):
    api_client.force_authenticate(user=receptionist_user)

    visit = VisitFactory()

    payload = {
        "visit": visit.id,
        "diagnosis": "Ear infection",
        "treatment": "Antibiotic therapy",
    }

    url = reverse("medical-record-list")
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert MedicalRecord.objects.count() == 0
