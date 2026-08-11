from types import SimpleNamespace

import pytest
from rest_framework.test import APIRequestFactory

from accounts.permissions import (
    ClinicalPermission,
    IsAdmin,
    IsAdminOrVeterinarian,
    OwnerAnimalPermission,
)

pytestmark = pytest.mark.django_db

request_factory = APIRequestFactory()


def build_request(user, method="get"):
    request_method = getattr(request_factory, method)
    request = request_method("/")
    request.user = user
    return request


def test_admin_permission_allows_admin(admin_user):
    request = build_request(admin_user)

    permission = IsAdmin()

    assert permission.has_permission(request, SimpleNamespace())


def test_admin_permission_rejects_veterinarian(veterinarian_user):
    request = build_request(veterinarian_user)

    permission = IsAdmin()

    assert not permission.has_permission(request, SimpleNamespace())


def test_admin_or_veterinarian_allows_veterinarian(
    veterinarian_user,
):
    request = build_request(veterinarian_user)

    permission = IsAdminOrVeterinarian()

    assert permission.has_permission(request, SimpleNamespace())


def test_owner_animal_permission_allows_receptionist_write(
    receptionist_user,
):
    request = build_request(receptionist_user, method="post")

    permission = OwnerAnimalPermission()

    assert permission.has_permission(request, SimpleNamespace())


def test_owner_animal_permission_allows_vet_read(
    veterinarian_user,
):
    request = build_request(veterinarian_user)

    permission = OwnerAnimalPermission()

    assert permission.has_permission(request, SimpleNamespace())


def test_owner_animal_permission_rejects_vet_write(
    veterinarian_user,
):
    request = build_request(veterinarian_user, method="post")

    permission = OwnerAnimalPermission()

    assert not permission.has_permission(request, SimpleNamespace())


def test_clinical_permission_allows_vet_write(
    veterinarian_user,
):
    request = build_request(veterinarian_user, method="post")

    permission = ClinicalPermission()

    assert permission.has_permission(request, SimpleNamespace())


def test_clinical_permission_allows_receptionist_read(
    receptionist_user,
):
    request = build_request(receptionist_user)

    permission = ClinicalPermission()

    assert permission.has_permission(request, SimpleNamespace())


def test_clinical_permission_rejects_receptionist_write(
    receptionist_user,
):
    request = build_request(receptionist_user, method="post")

    permission = ClinicalPermission()

    assert not permission.has_permission(request, SimpleNamespace())