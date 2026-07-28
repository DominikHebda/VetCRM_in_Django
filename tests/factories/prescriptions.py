import datetime

import factory

from prescriptions.models import Prescription
from tests.factories.accounts import UserFactory
from tests.factories.animals import AnimalFactory
from tests.factories.visits import VisitFactory


class PrescriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Prescription

    animal = factory.SubFactory(AnimalFactory)
    visit = factory.SubFactory(
        VisitFactory,
        animal=factory.SelfAttribute("..animal"),
    )
    veterinarian = factory.SubFactory(UserFactory)

    prescription_number = factory.Sequence(
        lambda n: f"RX-2026-{n + 1:06d}"
    )

    medication_name = factory.Faker("word")
    active_substance = factory.Faker("word")
    dosage = "1 tablet"
    frequency = "Twice daily"
    duration = "7 days"
    quantity = 14

    issue_date = factory.LazyFunction(datetime.date.today)

    valid_until = factory.LazyAttribute(
        lambda obj: obj.issue_date + datetime.timedelta(days=30)
    )

    instructions = factory.Faker("sentence")