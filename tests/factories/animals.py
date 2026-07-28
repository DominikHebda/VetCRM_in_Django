import factory

from animals.models import Animal
from tests.factories.owners import OwnerFactory


class AnimalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Animal

    owner = factory.SubFactory(OwnerFactory)
    name = factory.Sequence(lambda number: f"Animal {number}")
    species = "dog"
    breed = "Labrador"
    birth_date = factory.Faker("date_of_birth")
    chip_number = factory.Sequence(
        lambda number: f"CHIP-{number:08d}"
    )
    notes = factory.Faker("sentence")