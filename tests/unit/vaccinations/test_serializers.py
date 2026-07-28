import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from tests.factories.animals import AnimalFactory
from tests.factories.vaccinations import VaccinationFactory
from vaccinations.serializers import VaccinationSerializer

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_serialize_vaccination():
    vaccination = VaccinationFactory(
        vaccine_name="Rabies",
        manufacturer="VetPharma",
        batch_number="BATCH-123",
        notes="No adverse reactions.",
    )

    data = VaccinationSerializer(vaccination).data

    assert data["id"] == vaccination.id
    assert data["animal"] == vaccination.animal.id
    assert data["animal_name"] == vaccination.animal.name
    assert data["veterinarian"] == vaccination.veterinarian.id
    assert (
        data["veterinarian_name"]
        == vaccination.veterinarian.get_full_name()
    )
    assert data["vaccine_name"] == "Rabies"
    assert data["manufacturer"] == "VetPharma"
    assert data["batch_number"] == "BATCH-123"
    assert data["notes"] == "No adverse reactions."
    assert "vaccination_date" in data
    assert "next_due_date" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_animal_name_is_read_only():
    vaccination = VaccinationFactory()
    another_animal = AnimalFactory()

    serializer = VaccinationSerializer(
        vaccination,
        data={
            "animal": another_animal.id,
            "animal_name": "Changed animal name",
            "veterinarian": vaccination.veterinarian.id,
            "vaccine_name": vaccination.vaccine_name,
            "manufacturer": vaccination.manufacturer,
            "batch_number": vaccination.batch_number,
            "vaccination_date": vaccination.vaccination_date,
            "next_due_date": vaccination.next_due_date,
            "notes": vaccination.notes,
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_vaccination = serializer.save()

    assert updated_vaccination.animal == another_animal
    assert updated_vaccination.animal.name != "Changed animal name"


def test_veterinarian_name_is_read_only():
    veterinarian = User.objects.create_user(
        username="vet",
        first_name="Anna",
        last_name="Nowak",
        password="test-password",
    )
    vaccination = VaccinationFactory(veterinarian=veterinarian)

    serializer = VaccinationSerializer(
        vaccination,
        data={
            "animal": vaccination.animal.id,
            "veterinarian": veterinarian.id,
            "veterinarian_name": "Changed veterinarian",
            "vaccine_name": vaccination.vaccine_name,
            "manufacturer": vaccination.manufacturer,
            "batch_number": vaccination.batch_number,
            "vaccination_date": vaccination.vaccination_date,
            "next_due_date": vaccination.next_due_date,
            "notes": vaccination.notes,
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_vaccination = serializer.save()

    assert updated_vaccination.veterinarian == veterinarian
    assert updated_vaccination.veterinarian.get_full_name() == "Anna Nowak"


def test_create_vaccination_with_serializer():
    animal = AnimalFactory()
    veterinarian = User.objects.create_user(
        username="new-vet",
        first_name="Jan",
        last_name="Kowalski",
        password="test-password",
    )

    vaccination_date = timezone.localdate()
    next_due_date = vaccination_date + timezone.timedelta(days=365)

    serializer = VaccinationSerializer(
        data={
            "animal": animal.id,
            "veterinarian": veterinarian.id,
            "vaccine_name": "Rabies",
            "manufacturer": "VetPharma",
            "batch_number": "BATCH-456",
            "vaccination_date": vaccination_date,
            "next_due_date": next_due_date,
            "notes": "Annual vaccination",
        }
    )

    assert serializer.is_valid(), serializer.errors

    vaccination = serializer.save()

    assert vaccination.animal == animal
    assert vaccination.veterinarian == veterinarian
    assert vaccination.vaccine_name == "Rabies"
    assert vaccination.manufacturer == "VetPharma"
    assert vaccination.batch_number == "BATCH-456"
    assert vaccination.vaccination_date == vaccination_date
    assert vaccination.next_due_date == next_due_date
    assert vaccination.notes == "Annual vaccination"


def test_update_vaccination_with_serializer():
    vaccination = VaccinationFactory(
        vaccine_name="Old vaccine",
        manufacturer="Old manufacturer",
        notes="Old notes",
    )

    serializer = VaccinationSerializer(
        vaccination,
        data={
            "animal": vaccination.animal.id,
            "veterinarian": vaccination.veterinarian.id,
            "vaccine_name": "Updated vaccine",
            "manufacturer": "Updated manufacturer",
            "batch_number": vaccination.batch_number,
            "vaccination_date": vaccination.vaccination_date,
            "next_due_date": vaccination.next_due_date,
            "notes": "Updated notes",
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_vaccination = serializer.save()

    assert updated_vaccination.vaccine_name == "Updated vaccine"
    assert updated_vaccination.manufacturer == "Updated manufacturer"
    assert updated_vaccination.notes == "Updated notes"