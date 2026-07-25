import factory

from tests.factories.accounts import UserFactory
from tests.factories.animals import AnimalFactory
from visits.models import Visit


class VisitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visit

    animal = factory.SubFactory(AnimalFactory)
    veterinarian = factory.SubFactory(UserFactory)

    visit_date = factory.Faker("future_datetime")
    reason = factory.Faker("sentence", nb_words=4)
    notes = factory.Faker("paragraph")
    status = Visit.Status.SCHEDULED