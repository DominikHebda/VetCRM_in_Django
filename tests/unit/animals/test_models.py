import pytest
from django.db import IntegrityError

from animals.models import Animal
from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory

pytestmark = pytest.mark.unit

pytestmark = pytest.mark.django_db


def test_animal_string_representation(db):
    animal = AnimalFactory(name="Burek")

    assert str(animal) == "Burek"


def test_animal_belongs_to_owner(db):
    owner = OwnerFactory()
    animal = AnimalFactory(owner=owner)

    assert animal.owner == owner


def test_animal_accepts_supported_species():
    animal = AnimalFactory(species="cat")

    assert animal.species == "cat"


def test_optional_fields_can_be_null():
    animal = AnimalFactory(
        breed=None,
        birth_date=None,
        chip_number=None,
        notes=None,
    )

    animal.refresh_from_db()

    assert animal.breed is None
    assert animal.birth_date is None
    assert animal.chip_number is None
    assert animal.notes is None


def test_deleting_owner_deletes_animals():
    owner = OwnerFactory()
    animal = AnimalFactory(owner=owner)
    animal_id = animal.pk

    owner.delete()

    assert not Animal.objects.filter(pk=animal_id).exists()


def test_animal_requires_owner():
    with pytest.raises(IntegrityError):
        AnimalFactory(owner=None)


def test_animal_has_timestamps():
    animal = AnimalFactory()

    assert animal.created_at is not None
    assert animal.updated_at is not None