import pytest
from rest_framework.test import APIClient

from tests.factories.accounts import (
    AdminProfileFactory,
    ReceptionistProfileFactory,
    UserFactory,
    VeterinarianProfileFactory,
)
from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def admin_profile(db):
    return AdminProfileFactory.create()


@pytest.fixture
def veterinarian_profile(db):
    return VeterinarianProfileFactory.create()


@pytest.fixture
def receptionist_profile(db):
    return ReceptionistProfileFactory.create()


@pytest.fixture
def admin_user(admin_profile):
    return admin_profile.user


@pytest.fixture
def veterinarian_user(veterinarian_profile):
    return veterinarian_profile.user


@pytest.fixture
def receptionist_user(receptionist_profile):
    return receptionist_profile.user


@pytest.fixture
def owner(db):
    return OwnerFactory()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def animal(db):
    return AnimalFactory()