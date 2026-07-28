import factory

from owners.models import Owner


class OwnerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Owner

    first_name = factory.Faker("first_name", locale="pl_PL")
    last_name = factory.Faker("last_name", locale="pl_PL")
    email = factory.Sequence(lambda number: f"owner{number}@example.com")
    phone = factory.Sequence(lambda number: f"+4820000{number:04d}")
    address = factory.Faker("address", locale="pl_PL")
