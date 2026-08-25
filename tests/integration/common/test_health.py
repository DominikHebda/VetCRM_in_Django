from unittest.mock import patch

import pytest
from django.db import DatabaseError
from django.urls import reverse


def test_liveness_endpoint(client):
    response = client.get(reverse("health-live"))

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
    }


@pytest.mark.django_db
def test_readiness_endpoint(client):
    response = client.get(reverse("health-ready"))

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
    }


@pytest.mark.django_db
def test_readiness_returns_503_when_database_is_unavailable(client):
    with patch(
        "common.health.connection.cursor",
        side_effect=DatabaseError,
    ):
        response = client.get(reverse("health-ready"))

    assert response.status_code == 503
    assert response.json() == {
        "status": "unavailable",
        "database": "error",
    }