import datetime

import pytest
from django.db import IntegrityError

from tests.factories.prescriptions import PrescriptionFactory

pytestmark = pytest.mark.django_db


def test_create_prescription():
    prescription = PrescriptionFactory()

    assert prescription.pk is not None


def test_prescription_relationships():
    prescription = PrescriptionFactory()

    assert prescription.animal is not None
    assert prescription.visit is not None
    assert prescription.veterinarian is not None


def test_optional_fields_can_be_blank():
    prescription = PrescriptionFactory(
        active_substance="",
        instructions="",
    )

    assert prescription.active_substance == ""
    assert prescription.instructions == ""


def test_prescription_string_representation():
    prescription = PrescriptionFactory(
        prescription_number="RX-2026-000001",
        medication_name="Amoxicillin",
    )

    assert str(prescription) == "RX-2026-000001 - Amoxicillin"


def test_prescription_number_is_unique():
    PrescriptionFactory(
        prescription_number="RX-2026-000001",
    )

    with pytest.raises(IntegrityError):
        PrescriptionFactory(
            prescription_number="RX-2026-000001",
        )


def test_issue_date_before_valid_until():
    prescription = PrescriptionFactory(
        issue_date=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 1, 31),
    )

    assert prescription.issue_date < prescription.valid_until