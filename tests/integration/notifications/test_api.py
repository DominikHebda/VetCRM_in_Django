import pytest
from django.urls import reverse
from rest_framework import status

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