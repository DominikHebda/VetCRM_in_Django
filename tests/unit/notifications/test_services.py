from datetime import datetime, timedelta

import pytest
from django.utils import timezone

from notifications.services import NotificationService
from tests.factories.prescriptions import PrescriptionFactory
from tests.factories.vaccinations import VaccinationFactory
from tests.factories.visits import VisitFactory
from visits.models import Visit

pytestmark = pytest.mark.django_db


def test_returns_vaccination_due_within_30_days():
    today = timezone.localdate()

    vaccination = VaccinationFactory(
        vaccine_name="Rabies",
        next_due_date=today + timedelta(days=10),
    )

    notifications = NotificationService.get_upcoming_vaccinations()

    assert len(notifications) == 1

    notification = notifications[0]

    assert notification["type"] == "vaccination_due"
    assert notification["severity"] == "warning"
    assert notification["due_date"] == vaccination.next_due_date.isoformat()
    assert notification["animal_id"] == vaccination.animal_id
    assert notification["vaccination_id"] == vaccination.id


def test_does_not_return_vaccination_due_after_30_days():
    today = timezone.localdate()

    VaccinationFactory(
        next_due_date=today + timedelta(days=31),
    )

    notifications = NotificationService.get_upcoming_vaccinations()

    assert notifications == []


def test_does_not_return_overdue_vaccination():
    today = timezone.localdate()

    VaccinationFactory(
        next_due_date=today - timedelta(days=1),
    )

    notifications = NotificationService.get_upcoming_vaccinations()

    assert notifications == []


def test_does_not_return_vaccination_without_due_date():
    VaccinationFactory(
        next_due_date=None,
    )

    notifications = NotificationService.get_upcoming_vaccinations()

    assert notifications == []


def test_orders_vaccinations_by_due_date():
    today = timezone.localdate()

    later = VaccinationFactory(
        next_due_date=today + timedelta(days=20),
    )
    sooner = VaccinationFactory(
        next_due_date=today + timedelta(days=5),
    )

    notifications = NotificationService.get_upcoming_vaccinations()

    assert notifications[0]["vaccination_id"] == sooner.id
    assert notifications[1]["vaccination_id"] == later.id


def test_returns_prescription_expiring_within_7_days():
    today = timezone.localdate()

    prescription = PrescriptionFactory(
        valid_until=today + timedelta(days=3),
    )

    notifications = NotificationService.get_expiring_prescriptions()

    assert len(notifications) == 1

    notification = notifications[0]

    assert notification["type"] == "prescription_expiring"
    assert notification["severity"] == "warning"
    assert notification["due_date"] == prescription.valid_until.isoformat()
    assert notification["animal_id"] == prescription.animal_id
    assert notification["prescription_id"] == prescription.id


def test_does_not_return_prescription_expiring_after_7_days():
    today = timezone.localdate()

    PrescriptionFactory(
        valid_until=today + timedelta(days=8),
    )

    notifications = NotificationService.get_expiring_prescriptions()

    assert notifications == []


def test_does_not_return_expired_prescription():
    today = timezone.localdate()

    PrescriptionFactory(
        valid_until=today - timedelta(days=1),
    )

    notifications = NotificationService.get_expiring_prescriptions()

    assert notifications == []


def test_orders_prescriptions_by_expiration_date():
    today = timezone.localdate()

    later = PrescriptionFactory(
        valid_until=today + timedelta(days=6),
    )
    sooner = PrescriptionFactory(
        valid_until=today + timedelta(days=2),
    )

    notifications = NotificationService.get_expiring_prescriptions()

    assert notifications[0]["prescription_id"] == sooner.id
    assert notifications[1]["prescription_id"] == later.id


def test_returns_scheduled_visit_for_today():
    today = timezone.localdate()

    visit_date = timezone.make_aware(
        datetime.combine(
            today,
            datetime.min.time(),
        )
    )

    visit = VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.SCHEDULED,
    )

    notifications = NotificationService.get_today_visits()

    assert len(notifications) == 1

    notification = notifications[0]

    assert notification["type"] == "visit_today"
    assert notification["severity"] == "info"
    assert notification["visit_id"] == visit.id
    assert notification["animal_id"] == visit.animal_id
    assert notification["due_date"] == visit.visit_date.isoformat()


def test_does_not_return_completed_or_cancelled_visits():
    today = timezone.localdate()

    visit_date = timezone.make_aware(
        datetime.combine(
            today,
            datetime.min.time(),
        )
    )

    VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.COMPLETED,
    )
    VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.CANCELLED,
    )

    notifications = NotificationService.get_today_visits()

    assert notifications == []


def test_does_not_return_visit_from_another_day():
    tomorrow = timezone.localdate() + timedelta(days=1)

    visit_date = timezone.make_aware(
        datetime.combine(
            tomorrow,
            datetime.min.time(),
        )
    )

    VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.SCHEDULED,
    )

    notifications = NotificationService.get_today_visits()

    assert notifications == []


def test_orders_today_visits_by_time():
    today = timezone.localdate()

    later = VisitFactory(
        visit_date=timezone.make_aware(
            datetime.combine(
                today,
                datetime.min.time().replace(hour=15),
            )
        ),
        status=Visit.Status.SCHEDULED,
    )

    sooner = VisitFactory(
        visit_date=timezone.make_aware(
            datetime.combine(
                today,
                datetime.min.time().replace(hour=9),
            )
        ),
        status=Visit.Status.SCHEDULED,
    )

    notifications = NotificationService.get_today_visits()

    assert notifications[0]["visit_id"] == sooner.id
    assert notifications[1]["visit_id"] == later.id


def test_get_notifications_combines_all_notification_types():
    today = timezone.localdate()

    VaccinationFactory(
        next_due_date=today + timedelta(days=10),
    )

    PrescriptionFactory(
        valid_until=today + timedelta(days=3),
    )

    visit_date = timezone.make_aware(
        datetime.combine(
            today,
            datetime.min.time().replace(hour=12),
        )
    )

    VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.SCHEDULED,
    )

    data = NotificationService.get_notifications()

    assert data["count"] == 3

    types = {
        item["type"]
        for item in data["items"]
    }

    assert types == {
        "vaccination_due",
        "prescription_expiring",
        "visit_today",
    }