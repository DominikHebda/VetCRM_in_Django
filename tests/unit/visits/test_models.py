import pytest

from tests.factories.visits import VisitFactory
from visits.models import Visit

pytestmark = pytest.mark.django_db


def test_create_visit():
    visit = VisitFactory()

    assert visit.pk is not None

def test_visit_belongs_to_animal():
    visit = VisitFactory()

    assert visit.animal is not None

def test_visit_has_veterinarian():
    visit = VisitFactory()

    assert visit.veterinarian is not None

def test_default_status_is_scheduled():
    visit = VisitFactory(status=Visit.Status.SCHEDULED)

    assert visit.status == Visit.Status.SCHEDULED

def test_visit_string_representation():
    visit = VisitFactory()

    assert str(visit) == f"{visit.animal.name} - {visit.visit_date}"