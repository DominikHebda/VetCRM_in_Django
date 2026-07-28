import datetime

import pytest

from prescriptions.serializers import PrescriptionSerializer
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_serialize_prescription():
    prescription = PrescriptionFactory(
        prescription_number="RX-2026-000001",
        medication_name="Amoxicillin",
        active_substance="Amoxicillin",
        dosage="1 tablet",
        frequency="Twice daily",
        duration="7 days",
        quantity=14,
        issue_date=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 1, 31),
        instructions="Administer after food",
    )

    data = PrescriptionSerializer(prescription).data

    assert data["id"] == prescription.id
    assert data["animal"] == prescription.animal.id
    assert data["visit"] == prescription.visit.id
    assert data["veterinarian"] == prescription.veterinarian.id
    assert data["prescription_number"] == "RX-2026-000001"
    assert data["medication_name"] == "Amoxicillin"
    assert data["active_substance"] == "Amoxicillin"
    assert data["dosage"] == "1 tablet"
    assert data["frequency"] == "Twice daily"
    assert data["duration"] == "7 days"
    assert data["quantity"] == 14
    assert data["issue_date"] == "2026-01-01"
    assert data["valid_until"] == "2026-01-31"
    assert data["instructions"] == "Administer after food"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_prescription_with_serializer():
    visit = VisitFactory()

    serializer = PrescriptionSerializer(
        data={
            "animal": visit.animal.id,
            "visit": visit.id,
            "medication_name": "Amoxicillin",
            "active_substance": "Amoxicillin",
            "dosage": "1 tablet",
            "frequency": "Twice daily",
            "duration": "7 days",
            "quantity": 14,
            "issue_date": "2026-01-01",
            "valid_until": "2026-01-31",
            "instructions": "Administer after food",
        }
    )

    assert serializer.is_valid(), serializer.errors

    prescription = serializer.save(
        veterinarian=visit.veterinarian,
        prescription_number="RX-2026-000001",
    )

    assert prescription.animal == visit.animal
    assert prescription.visit == visit
    assert prescription.veterinarian == visit.veterinarian
    assert prescription.prescription_number == "RX-2026-000001"
    assert prescription.quantity == 14


def test_read_only_fields_are_ignored_on_input():
    visit = VisitFactory()

    serializer = PrescriptionSerializer(
        data={
            "animal": visit.animal.id,
            "visit": visit.id,
            "veterinarian": visit.veterinarian.id,
            "prescription_number": "CUSTOM-NUMBER",
            "medication_name": "Amoxicillin",
            "dosage": "1 tablet",
            "frequency": "Twice daily",
            "duration": "7 days",
            "quantity": 14,
            "issue_date": "2026-01-01",
            "valid_until": "2026-01-31",
        }
    )

    assert serializer.is_valid(), serializer.errors
    assert "veterinarian" not in serializer.validated_data
    assert "prescription_number" not in serializer.validated_data


def test_serializer_rejects_valid_until_before_issue_date():
    visit = VisitFactory()

    serializer = PrescriptionSerializer(
        data={
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
    )

    assert not serializer.is_valid()
    assert "valid_until" in serializer.errors


@pytest.mark.parametrize("quantity", [0, -1])
def test_serializer_rejects_non_positive_quantity(quantity):
    visit = VisitFactory()

    serializer = PrescriptionSerializer(
        data={
            "animal": visit.animal.id,
            "visit": visit.id,
            "medication_name": "Amoxicillin",
            "dosage": "1 tablet",
            "frequency": "Twice daily",
            "duration": "7 days",
            "quantity": quantity,
            "issue_date": "2026-01-01",
            "valid_until": "2026-01-31",
        }
    )

    assert not serializer.is_valid()
    assert "quantity" in serializer.errors


def test_partial_update_validates_dates_against_instance():
    prescription = PrescriptionFactory(
        issue_date=datetime.date(2026, 1, 10),
        valid_until=datetime.date(2026, 1, 31),
    )

    serializer = PrescriptionSerializer(
        prescription,
        data={"valid_until": "2026-01-01"},
        partial=True,
    )

    assert not serializer.is_valid()
    assert "valid_until" in serializer.errors


def test_update_prescription_with_serializer():
    prescription = PrescriptionFactory(
        medication_name="Initial medication",
        quantity=10,
    )

    serializer = PrescriptionSerializer(
        prescription,
        data={
            "medication_name": "Updated medication",
            "quantity": 20,
        },
        partial=True,
    )

    assert serializer.is_valid(), serializer.errors

    updated_prescription = serializer.save()

    assert updated_prescription.medication_name == "Updated medication"
    assert updated_prescription.quantity == 20