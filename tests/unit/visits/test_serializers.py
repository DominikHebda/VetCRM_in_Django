import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from tests.factories.animals import AnimalFactory
from tests.factories.visits import VisitFactory
from visits.models import Visit
from visits.serializers import VisitSerializer

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_serialize_visit():
    visit = VisitFactory(
        reason="Routine checkup",
        notes="Animal is healthy.",
        status=Visit.Status.COMPLETED,
    )

    data = VisitSerializer(visit).data

    assert data["id"] == visit.id
    assert data["animal"] == visit.animal.id
    assert data["animal_name"] == visit.animal.name
    assert data["veterinarian"] == visit.veterinarian.id
    assert data["veterinarian_name"] == visit.veterinarian.get_full_name()
    assert data["reason"] == "Routine checkup"
    assert data["notes"] == "Animal is healthy."
    assert data["status"] == Visit.Status.COMPLETED
    assert "visit_date" in data
    assert "created_at" in data


def test_animal_name_is_read_only():
    visit = VisitFactory()
    another_animal = AnimalFactory()

    serializer = VisitSerializer(
        visit,
        data={
            "animal": another_animal.id,
            "animal_name": "Modified name",
            "veterinarian": visit.veterinarian.id,
            "visit_date": visit.visit_date,
            "reason": visit.reason,
            "notes": visit.notes,
            "status": visit.status,
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_visit = serializer.save()

    assert updated_visit.animal == another_animal
    assert updated_visit.animal.name != "Modified name"


def test_veterinarian_name_is_read_only():
    veterinarian = User.objects.create_user(
        username="vet",
        first_name="Anna",
        last_name="Nowak",
        password="test-password",
    )
    visit = VisitFactory(veterinarian=veterinarian)

    serializer = VisitSerializer(
        visit,
        data={
            "animal": visit.animal.id,
            "veterinarian": veterinarian.id,
            "veterinarian_name": "Changed name",
            "visit_date": visit.visit_date,
            "reason": visit.reason,
            "notes": visit.notes,
            "status": visit.status,
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_visit = serializer.save()

    assert updated_visit.veterinarian == veterinarian
    assert updated_visit.veterinarian.get_full_name() == "Anna Nowak"


def test_create_visit_with_serializer():
    animal = AnimalFactory()
    veterinarian = User.objects.create_user(
        username="new-vet",
        first_name="Jan",
        last_name="Kowalski",
        password="test-password",
    )
    visit_date = timezone.now() + timezone.timedelta(days=1)

    serializer = VisitSerializer(
        data={
            "animal": animal.id,
            "veterinarian": veterinarian.id,
            "visit_date": visit_date,
            "reason": "Vaccination",
            "notes": "First dose",
            "status": Visit.Status.SCHEDULED,
        }
    )

    assert serializer.is_valid(), serializer.errors

    visit = serializer.save()

    assert visit.animal == animal
    assert visit.veterinarian == veterinarian
    assert visit.reason == "Vaccination"
    assert visit.notes == "First dose"
    assert visit.status == Visit.Status.SCHEDULED


def test_update_visit_with_serializer():
    visit = VisitFactory(
        reason="Initial reason",
        notes="Initial notes",
        status=Visit.Status.SCHEDULED,
    )

    serializer = VisitSerializer(
        visit,
        data={
            "animal": visit.animal.id,
            "veterinarian": visit.veterinarian.id,
            "visit_date": visit.visit_date,
            "reason": "Updated reason",
            "notes": "Updated notes",
            "status": Visit.Status.COMPLETED,
        },
    )

    assert serializer.is_valid(), serializer.errors

    updated_visit = serializer.save()

    assert updated_visit.reason == "Updated reason"
    assert updated_visit.notes == "Updated notes"
    assert updated_visit.status == Visit.Status.COMPLETED