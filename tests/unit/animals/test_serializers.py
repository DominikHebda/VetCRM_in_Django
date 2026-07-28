import pytest

from animals.serializers import AnimalSerializer
from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory

pytestmark = pytest.mark.unit

pytestmark = pytest.mark.django_db

def test_serializer_returns_animal_data():
    animal = AnimalFactory(
        name="Luna",
        species="cat",
        breed="British Shorthair",
    )

    data = AnimalSerializer(animal).data

    assert data["id"] == animal.id
    assert data["owner"] == animal.owner_id
    assert data["name"] == "Luna"
    assert data["species"] == "cat"
    assert data["breed"] == "British Shorthair"


def test_serializer_accepts_valid_data():
    owner = OwnerFactory()
    serializer = AnimalSerializer(
        data={
            "owner": owner.pk,
            "name": "Rex",
            "species": "dog",
            "breed": "German Shepherd",
        }
    )

    assert serializer.is_valid(), serializer.errors

    animal = serializer.save()

    assert animal.owner == owner
    assert animal.name == "Rex"
    assert animal.species == "dog"


def test_serializer_rejects_invalid_species():
    owner = OwnerFactory()
    serializer = AnimalSerializer(
        data={
            "owner": owner.pk,
            "name": "Rex",
            "species": "horse",
        }
    )

    assert not serializer.is_valid()
    assert "species" in serializer.errors


def test_serializer_requires_owner():
    serializer = AnimalSerializer(
        data={
            "name": "Rex",
            "species": "dog",
        }
    )

    assert not serializer.is_valid()
    assert "owner" in serializer.errors


def test_serializer_requires_name():
    owner = OwnerFactory()
    serializer = AnimalSerializer(
        data={
            "owner": owner.pk,
            "species": "dog",
        }
    )

    assert not serializer.is_valid()
    assert "name" in serializer.errors


def test_serializer_timestamps_are_read_only():
    animal = AnimalFactory()
    original_created_at = animal.created_at

    serializer = AnimalSerializer(
        animal,
        data={
            "owner": animal.owner_id,
            "name": animal.name,
            "species": animal.species,
            "created_at": "2000-01-01T00:00:00Z",
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_animal = serializer.save()

    assert updated_animal.created_at == original_created_at