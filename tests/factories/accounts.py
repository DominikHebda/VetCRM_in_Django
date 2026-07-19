from itertools import count

import factory
from django.contrib.auth import get_user_model

from accounts.models import UserProfile

User = get_user_model()

_license_numbers = count(1)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda number: f"user{number}")
    email = factory.LazyAttribute(
        lambda user: f"{user.username}@example.com"
    )
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True

    password = factory.PostGenerationMethodCall(
        "set_password",
        "test-password-123",
    )


def update_profile(
    user,
    *,
    role: str,
    license_number: str = "",
) -> UserProfile:
    profile = user.profile
    profile.role = role
    profile.license_number = license_number
    profile.save(
        update_fields=[
            "role",
            "license_number",
            "updated_at",
        ]
    )
    return profile


class AdminProfileFactory:
    @classmethod
    def create(cls, **kwargs) -> UserProfile:
        user = kwargs.pop("user", None) or UserFactory()

        return update_profile(
            user,
            role=UserProfile.Role.ADMIN,
        )


class VeterinarianProfileFactory:
    @classmethod
    def create(cls, **kwargs) -> UserProfile:
        user = kwargs.pop("user", None) or UserFactory()

        license_number = kwargs.pop(
            "license_number",
            f"VET-{next(_license_numbers):06d}",
        )

        return update_profile(
            user,
            role=UserProfile.Role.VET,
            license_number=license_number,
        )


class ReceptionistProfileFactory:
    @classmethod
    def create(cls, **kwargs) -> UserProfile:
        user = kwargs.pop("user", None) or UserFactory()

        return update_profile(
            user,
            role=UserProfile.Role.RECEPTIONIST,
        )