from decimal import Decimal

import pytest

from medical.serializers import MedicalRecordSerializer
from tests.factories.medical import MedicalRecordFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_serialize_medical_record():
    medical_record = MedicalRecordFactory(
        diagnosis="Skin allergy",
        treatment="Antihistamine treatment",
        recommendations="Avoid suspected allergen",
        weight=Decimal("12.50"),
        temperature=Decimal("38.7"),
    )

    data = MedicalRecordSerializer(medical_record).data

    assert data["id"] == medical_record.id
    assert data["visit"] == medical_record.visit.id
    assert data["diagnosis"] == "Skin allergy"
    assert data["treatment"] == "Antihistamine treatment"
    assert data["recommendations"] == "Avoid suspected allergen"
    assert data["weight"] == "12.50"
    assert data["temperature"] == "38.7"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_medical_record_with_serializer():
    visit = VisitFactory()

    serializer = MedicalRecordSerializer(
        data={
            "visit": visit.id,
            "diagnosis": "Ear infection",
            "treatment": "Antibiotic therapy",
            "recommendations": "Control visit in seven days",
            "weight": "8.40",
            "temperature": "39.1",
        }
    )

    assert serializer.is_valid(), serializer.errors

    medical_record = serializer.save()

    assert medical_record.visit == visit
    assert medical_record.diagnosis == "Ear infection"
    assert medical_record.treatment == "Antibiotic therapy"
    assert medical_record.recommendations == "Control visit in seven days"
    assert medical_record.weight == Decimal("8.40")
    assert medical_record.temperature == Decimal("39.1")


def test_create_medical_record_with_optional_fields_empty():
    visit = VisitFactory()

    serializer = MedicalRecordSerializer(
        data={
            "visit": visit.id,
            "diagnosis": "Routine examination",
            "treatment": "",
            "recommendations": "",
            "weight": None,
            "temperature": None,
        }
    )

    assert serializer.is_valid(), serializer.errors

    medical_record = serializer.save()

    assert medical_record.treatment == ""
    assert medical_record.recommendations == ""
    assert medical_record.weight is None
    assert medical_record.temperature is None


def test_update_medical_record_with_serializer():
    medical_record = MedicalRecordFactory(
        diagnosis="Initial diagnosis",
        treatment="Initial treatment",
        recommendations="Initial recommendations",
    )

    serializer = MedicalRecordSerializer(
        medical_record,
        data={
            "visit": medical_record.visit.id,
            "diagnosis": "Updated diagnosis",
            "treatment": "Updated treatment",
            "recommendations": "Updated recommendations",
            "weight": "15.20",
            "temperature": "38.5",
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_record = serializer.save()

    assert updated_record.diagnosis == "Updated diagnosis"
    assert updated_record.treatment == "Updated treatment"
    assert updated_record.recommendations == "Updated recommendations"
    assert updated_record.weight == Decimal("15.20")
    assert updated_record.temperature == Decimal("38.5")


def test_serializer_rejects_second_record_for_same_visit():
    medical_record = MedicalRecordFactory()

    serializer = MedicalRecordSerializer(
        data={
            "visit": medical_record.visit.id,
            "diagnosis": "Another diagnosis",
        }
    )

    assert not serializer.is_valid()
    assert "visit" in serializer.errors