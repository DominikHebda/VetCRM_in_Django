import pytest

from accounts.models import UserProfile
from owners.models import Owner


@pytest.mark.unit
@pytest.mark.django_db
class TestFactories:
    def test_user_factory_creates_user_with_hashed_password(self, user):
        assert user.pk is not None
        assert user.check_password("test-password-123")
        assert user.password != "test-password-123"

    def test_admin_fixture_has_admin_role(self, admin_profile):
        assert admin_profile.role == UserProfile.Role.ADMIN
        assert admin_profile.user.pk is not None

    def test_veterinarian_has_license_number(
        self,
        veterinarian_profile,
    ):
        assert veterinarian_profile.role == UserProfile.Role.VET
        assert veterinarian_profile.license_number.startswith("VET-")

    def test_receptionist_has_receptionist_role(
        self,
        receptionist_profile,
    ):
        assert (
            receptionist_profile.role
            == UserProfile.Role.RECEPTIONIST
        )

    def test_owner_factory_creates_valid_owner(self, owner):
        assert isinstance(owner, Owner)
        assert owner.pk is not None
        assert owner.email
        assert owner.created_at is not None
        assert owner.updated_at is not None

    def test_authenticated_client_contains_authenticated_user(
        self,
        authenticated_client,
        user,
    ):
        response = authenticated_client.get("/api/owners/")

        assert response.status_code != 401