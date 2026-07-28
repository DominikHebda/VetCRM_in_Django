import pytest

from owners.serializers import OwnerSerializer
from tests.factories.owners import OwnerFactory


@pytest.mark.unit
@pytest.mark.django_db
class TestOwnerSerializer:
    def test_serializes_owner(self):
        owner = OwnerFactory(
            first_name="Anna",
            last_name="Kowalska",
            email="anna@example.com",
            phone="+48123456789",
            address="Warszawa",
        )

        serializer = OwnerSerializer(owner)

        assert serializer.data["id"] == owner.pk
        assert serializer.data["first_name"] == "Anna"
        assert serializer.data["last_name"] == "Kowalska"
        assert serializer.data["email"] == "anna@example.com"
        assert serializer.data["phone"] == "+48123456789"
        assert serializer.data["address"] == "Warszawa"
        assert "created_at" in serializer.data
        assert "updated_at" in serializer.data

    def test_accepts_valid_data(self):
        serializer = OwnerSerializer(
            data={
                "first_name": "Jan",
                "last_name": "Nowak",
                "email": "jan.nowak@example.com",
                "phone": "+48111222333",
                "address": "Kraków",
            }
        )

        assert serializer.is_valid(), serializer.errors

        owner = serializer.save()

        assert owner.pk is not None
        assert owner.first_name == "Jan"
        assert owner.email == "jan.nowak@example.com"

    def test_rejects_invalid_email(self):
        serializer = OwnerSerializer(
            data={
                "first_name": "Jan",
                "last_name": "Nowak",
                "email": "not-an-email",
            }
        )

        assert not serializer.is_valid()
        assert "email" in serializer.errors

    def test_rejects_duplicate_email(self):
        OwnerFactory(email="duplicate@example.com")

        serializer = OwnerSerializer(
            data={
                "first_name": "Anna",
                "last_name": "Nowak",
                "email": "duplicate@example.com",
            }
        )

        assert not serializer.is_valid()
        assert "email" in serializer.errors

    @pytest.mark.parametrize(
        "missing_field",
        [
            "first_name",
            "last_name",
            "email",
        ],
    )
    def test_rejects_missing_required_fields(self, missing_field):
        data = {
            "first_name": "Anna",
            "last_name": "Nowak",
            "email": "anna.nowak@example.com",
        }
        data.pop(missing_field)

        serializer = OwnerSerializer(data=data)

        assert not serializer.is_valid()
        assert missing_field in serializer.errors

    def test_phone_is_optional(self):
        serializer = OwnerSerializer(
            data={
                "first_name": "Anna",
                "last_name": "Nowak",
                "email": "anna@example.com",
            }
        )

        assert serializer.is_valid(), serializer.errors

    def test_timestamp_fields_are_read_only(self):
        serializer = OwnerSerializer(
            data={
                "first_name": "Anna",
                "last_name": "Nowak",
                "email": "anna@example.com",
                "created_at": "2000-01-01T00:00:00Z",
                "updated_at": "2000-01-01T00:00:00Z",
            }
        )

        assert serializer.is_valid(), serializer.errors

        owner = serializer.save()

        assert owner.created_at.year != 2000
        assert owner.updated_at.year != 2000
