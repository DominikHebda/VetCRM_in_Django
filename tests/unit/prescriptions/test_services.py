from datetime import date

import pytest

from prescriptions.services import (
    current_prescription_year,
    generate_prescription_number,
)
from tests.factories.prescriptions import PrescriptionFactory

pytestmark = pytest.mark.django_db


def test_generate_first_prescription_number():
    year = date.today().year

    prescription_number = generate_prescription_number()

    assert prescription_number == f"RX-{year}-000001"


def test_generate_next_prescription_number():
    year = date.today().year

    PrescriptionFactory(
        prescription_number=f"RX-{year}-000001",
    )

    prescription_number = generate_prescription_number()

    assert prescription_number == f"RX-{year}-000002"


def test_generate_number_ignores_previous_year():
    current_year = date.today().year
    previous_year = current_year - 1

    PrescriptionFactory(
        prescription_number=f"RX-{previous_year}-000125",
    )

    prescription_number = generate_prescription_number()

    assert prescription_number == f"RX-{current_year}-000001"


def test_generate_number_continues_from_last_prescription():
    year = date.today().year

    PrescriptionFactory(
        prescription_number=f"RX-{year}-000004",
    )
    PrescriptionFactory(
        prescription_number=f"RX-{year}-000005",
    )

    prescription_number = generate_prescription_number()

    assert prescription_number == f"RX-{year}-000006"


def test_current_prescription_year():
    assert current_prescription_year() == date.today().year