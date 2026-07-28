from datetime import timedelta

import factory
from django.utils import timezone

from tests.factories.accounts import UserFactory
from tests.factories.animals import AnimalFactory
from visits.models import Visit


class VisitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visit

    animal = factory.SubFactory(AnimalFactory)
    veterinarian = factory.SubFactory(UserFactory)

    visit_date = factory.LazyFunction(
        lambda: timezone.now() + timedelta(days=7)
    )
    reason = factory.Faker("sentence", nb_words=4)
    notes = factory.Faker("paragraph")
    status = Visit.Status.SCHEDULED