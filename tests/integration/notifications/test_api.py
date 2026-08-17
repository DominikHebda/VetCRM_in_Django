from datetime import datetime

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from tests.factories.visits import VisitFactory
from visits.models import Visit

pytestmark = pytest.mark.django_db


def test_notifications_require_authentication(api_client):
    response = api_client.get(
        reverse("notification-list")
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticated_user_can_view_notifications(
    authenticated_client,
):
    response = authenticated_client.get(
        reverse("notification-list")
    )

    assert response.status_code == status.HTTP_200_OK
    assert "count" in response.data
    assert "items" in response.data


def test_veterinarian_sees_only_own_notifications(
    api_client,
    veterinarian_user,
):
    today = timezone.localdate()

    visit_date = timezone.make_aware(
        datetime.combine(
            today,
            datetime.min.time().replace(hour=10),
        )
    )

    own_visit = VisitFactory(
        veterinarian=veterinarian_user,
        visit_date=visit_date,
        status=Visit.Status.SCHEDULED,
    )

    VisitFactory(
        visit_date=visit_date,
        status=Visit.Status.SCHEDULED,
    )

    api_client.force_authenticate(user=veterinarian_user)

    response = api_client.get(reverse("notification-list"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["items"][0]["visit_id"] == own_visit.id