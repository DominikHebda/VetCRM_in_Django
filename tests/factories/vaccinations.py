import factory

from tests.factories.accounts import UserFactory
from tests.factories.animals import AnimalFactory
from vaccinations.models import Vaccination


class VaccinationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Vaccination

    animal = factory.SubFactory(AnimalFactory)
    veterinarian = factory.SubFactory(UserFactory)

    vaccine_name = factory.Faker("word")
    manufacturer = factory.Faker("company")
    batch_number = factory.Sequence(lambda number: f"BATCH-{number:05d}")
    vaccination_date = factory.Faker("past_date")
    next_due_date = factory.Faker("future_date")
    notes = factory.Faker("sentence")