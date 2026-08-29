from django.contrib.auth import get_user_model
from django.core.management import call_command

from accounts.models import UserProfile


def test_create_initial_admin_creates_superuser(monkeypatch, db):
    monkeypatch.setenv("DJANGO_ADMIN_USERNAME", "initial_admin")
    monkeypatch.setenv("DJANGO_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("DJANGO_ADMIN_PASSWORD", "Strong-Test-Password-123!")

    call_command("create_initial_admin")

    User = get_user_model()
    user = User.objects.get(username="initial_admin")

    assert user.email == "admin@example.com"
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.is_active is True
    assert user.check_password("Strong-Test-Password-123!") is True
    assert user.profile.role == UserProfile.Role.ADMIN


def test_create_initial_admin_is_idempotent(monkeypatch, db):
    monkeypatch.setenv("DJANGO_ADMIN_USERNAME", "initial_admin")
    monkeypatch.setenv("DJANGO_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("DJANGO_ADMIN_PASSWORD", "Strong-Test-Password-123!")

    call_command("create_initial_admin")
    call_command("create_initial_admin")

    User = get_user_model()

    assert User.objects.filter(username="initial_admin").count() == 1

    user = User.objects.get(username="initial_admin")
    assert user.profile.role == UserProfile.Role.ADMIN


def test_create_initial_admin_does_not_reset_existing_password(monkeypatch, db):
    User = get_user_model()

    user = User.objects.create_user(
        username="initial_admin",
        email="old@example.com",
        password="Existing-Password-123!",
    )

    monkeypatch.setenv("DJANGO_ADMIN_USERNAME", "initial_admin")
    monkeypatch.setenv("DJANGO_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("DJANGO_ADMIN_PASSWORD", "New-Password-456!")

    call_command("create_initial_admin")

    user.refresh_from_db()

    assert user.email == "admin@example.com"
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.profile.role == UserProfile.Role.ADMIN
    assert user.check_password("Existing-Password-123!") is True
    assert user.check_password("New-Password-456!") is False