import factory

from medical.models import MedicalRecord
from tests.factories.visits import VisitFactory


class MedicalRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MedicalRecord

    visit = factory.SubFactory(VisitFactory)
    diagnosis = factory.Faker("paragraph")
    treatment = factory.Faker("paragraph")
    recommendations = factory.Faker("paragraph")
    weight = factory.Faker(
        "pydecimal",
        left_digits=2,
        right_digits=2,
        positive=True,
    )
    temperature = factory.Faker(
        "pydecimal",
        left_digits=2,
        right_digits=1,
        positive=True,
    )