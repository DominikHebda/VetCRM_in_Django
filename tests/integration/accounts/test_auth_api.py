from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from oauth2_provider.models import AccessToken, Application
from rest_framework import status

from accounts.models import UserProfile

pytestmark = pytest.mark.django_db


@pytest.fixture
def oauth_application(user):
    return Application.objects.create(
        name="VetCRM test client",
        user=user,
        client_type=Application.CLIENT_PUBLIC,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris="http://localhost:5173/oauth/callback",
    )


@pytest.fixture
def access_token(user, oauth_application):
    return AccessToken.objects.create(
        user=user,
        application=oauth_application,
        token="test-access-token",
        expires=timezone.now() + timedelta(minutes=30),
        scope="read write",
    )


def test_current_user_requires_authentication(api_client):
    response = api_client.get(reverse("current-user"))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_current_user_accepts_valid_oauth_token(
    api_client,
    user,
    access_token,
):
    response = api_client.get(
        reverse("current-user"),
        HTTP_AUTHORIZATION=f"Bearer {access_token.token}",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == user.id
    assert response.data["username"] == user.username
    assert response.data["email"] == user.email
    assert response.data["role"] == UserProfile.Role.RECEPTIONIST


def test_current_user_returns_profile_data(
    api_client,
    user,
    access_token,
):
    user.profile.role = UserProfile.Role.VET
    user.profile.phone = "123456789"
    user.profile.license_number = "VET-123"
    user.profile.save()

    response = api_client.get(
        reverse("current-user"),
        HTTP_AUTHORIZATION=f"Bearer {access_token.token}",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["role"] == UserProfile.Role.VET
    assert response.data["phone"] == "123456789"
    assert response.data["license_number"] == "VET-123"


def test_current_user_rejects_expired_oauth_token(
    api_client,
    user,
    oauth_application,
):
    expired_token = AccessToken.objects.create(
        user=user,
        application=oauth_application,
        token="expired-access-token",
        expires=timezone.now() - timedelta(minutes=1),
        scope="read write",
    )

    response = api_client.get(
        reverse("current-user"),
        HTTP_AUTHORIZATION=f"Bearer {expired_token.token}",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_current_user_rejects_unknown_token(api_client):
    response = api_client.get(
        reverse("current-user"),
        HTTP_AUTHORIZATION="Bearer unknown-access-token",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED