import pytest

from tests.factories.vaccinations import VaccinationFactory

pytestmark = pytest.mark.django_db


def test_create_vaccination():
    vaccination = VaccinationFactory()

    assert vaccination.pk is not None


def test_vaccination_belongs_to_animal():
    vaccination = VaccinationFactory()

    assert vaccination.animal is not None


def test_vaccination_has_veterinarian():
    vaccination = VaccinationFactory()

    assert vaccination.veterinarian is not None


def test_optional_fields_can_be_blank():
    vaccination = VaccinationFactory(
        manufacturer="",
        batch_number="",
        next_due_date=None,
        notes="",
    )

    assert vaccination.manufacturer == ""
    assert vaccination.batch_number == ""
    assert vaccination.next_due_date is None
    assert vaccination.notes == ""


def test_vaccination_string_representation():
    vaccination = VaccinationFactory(
        vaccine_name="Rabies"
    )

    assert str(vaccination) == (
        f"{vaccination.animal.name} - Rabies"
    )