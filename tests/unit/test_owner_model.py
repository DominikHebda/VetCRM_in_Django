import pytest
from django.db import IntegrityError, transaction

from owners.models import Owner
from tests.factories.owners import OwnerFactory


@pytest.mark.unit
@pytest.mark.django_db
class TestOwnerModel:
    def test_factory_creates_owner(self):
        owner = OwnerFactory()

        assert owner.pk is not None
        assert Owner.objects.filter(pk=owner.pk).exists()

    def test_string_representation_contains_full_name(self):
        owner = OwnerFactory(
            first_name="Jan",
            last_name="Kowalski",
        )

        assert str(owner) == "Jan Kowalski"

    def test_email_must_be_unique(self):
        OwnerFactory(email="owner@example.com")

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                OwnerFactory(email="owner@example.com")

    def test_phone_can_be_blank(self):
        owner = OwnerFactory(phone="")

        assert owner.phone == ""

    def test_phone_can_be_null(self):
        owner = OwnerFactory(phone=None)

        assert owner.phone is None

    def test_address_can_be_blank(self):
        owner = OwnerFactory(address="")

        assert owner.address == ""

    def test_address_can_be_null(self):
        owner = OwnerFactory(address=None)

        assert owner.address is None

    def test_created_at_is_set_automatically(self):
        owner = OwnerFactory()

        assert owner.created_at is not None

    def test_updated_at_is_set_automatically(self):
        owner = OwnerFactory()

        assert owner.updated_at is not None

    def test_default_ordering_uses_last_name_then_first_name(self):
        owner_c = OwnerFactory(
            first_name="Adam",
            last_name="Nowak",
        )
        owner_b = OwnerFactory(
            first_name="Zofia",
            last_name="Kowalski",
        )
        owner_a = OwnerFactory(
            first_name="Anna",
            last_name="Kowalski",
        )

        owners = list(Owner.objects.all())

        assert owners == [
            owner_a,
            owner_b,
            owner_c,
        ]
