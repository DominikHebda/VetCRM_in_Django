from decimal import Decimal

import pytest
from django.db import IntegrityError

from tests.factories.medical import MedicalRecordFactory
from tests.factories.visits import VisitFactory

pytestmark = pytest.mark.django_db


def test_create_medical_record():
    medical_record = MedicalRecordFactory()

    assert medical_record.pk is not None


def test_medical_record_belongs_to_visit():
    medical_record = MedicalRecordFactory()

    assert medical_record.visit is not None
    assert medical_record.visit.medical_record == medical_record


def test_optional_fields_can_be_blank():
    medical_record = MedicalRecordFactory(
        treatment="",
        recommendations="",
        weight=None,
        temperature=None,
    )

    assert medical_record.treatment == ""
    assert medical_record.recommendations == ""
    assert medical_record.weight is None
    assert medical_record.temperature is None


def test_decimal_fields_are_stored_correctly():
    medical_record = MedicalRecordFactory(
        weight=Decimal("12.50"),
        temperature=Decimal("38.7"),
    )

    medical_record.refresh_from_db()

    assert medical_record.weight == Decimal("12.50")
    assert medical_record.temperature == Decimal("38.7")


def test_medical_record_string_representation():
    medical_record = MedicalRecordFactory()

    assert str(medical_record) == f"Medical Record #{medical_record.pk}"


def test_visit_can_have_only_one_medical_record():
    visit = VisitFactory()

    MedicalRecordFactory(visit=visit)

    with pytest.raises(IntegrityError):
        MedicalRecordFactory(visit=visit)