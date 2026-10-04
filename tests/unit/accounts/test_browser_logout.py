import pytest
from django.contrib.auth import SESSION_KEY, get_user_model
from django.test import Client
from django.urls import reverse

pytestmark = pytest.mark.django_db


def authenticated_client():
    user = get_user_model().objects.create_user(
        username="logout_test_user",
        password="test-password",
    )
    client = Client(enforce_csrf_checks=True)
    client.force_login(user)
    return client


def test_logout_get_preserves_session():
    client = authenticated_client()

    response = client.get(reverse("logout"))

    assert response.status_code == 200
    assert SESSION_KEY in client.session
    assert b"csrfmiddlewaretoken" in response.content


def test_logout_post_without_csrf_preserves_session():
    client = authenticated_client()

    response = client.post(reverse("logout"))

    assert response.status_code == 403
    assert SESSION_KEY in client.session


def test_logout_post_with_csrf_ends_session(settings):
    settings.FRONTEND_URL = "http://localhost:5173"
    client = authenticated_client()
    client.get(reverse("logout"))
    csrf_token = client.cookies["csrftoken"].value

    response = client.post(
        reverse("logout"),
        {"csrfmiddlewaretoken": csrf_token},
    )

    assert response.status_code == 302
    assert response.url == settings.FRONTEND_URL
    assert SESSION_KEY not in client.session