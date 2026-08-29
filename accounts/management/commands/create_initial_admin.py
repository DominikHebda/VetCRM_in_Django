import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from accounts.models import UserProfile


class Command(BaseCommand):
    help = "Create the initial production administrator from environment variables."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_ADMIN_USERNAME")
        email = os.environ.get("DJANGO_ADMIN_EMAIL")
        password = os.environ.get("DJANGO_ADMIN_PASSWORD")

        if not username:
            raise CommandError("DJANGO_ADMIN_USERNAME is required.")

        if not email:
            raise CommandError("DJANGO_ADMIN_EMAIL is required.")

        if not password:
            raise CommandError("DJANGO_ADMIN_PASSWORD is required.")

        User = get_user_model()

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f"Administrator '{username}' created.")
            )
        else:
            changed = False

            if user.email != email:
                user.email = email
                changed = True

            if not user.is_staff:
                user.is_staff = True
                changed = True

            if not user.is_superuser:
                user.is_superuser = True
                changed = True

            if not user.is_active:
                user.is_active = True
                changed = True

            if changed:
                user.save()

            self.stdout.write(
                self.style.WARNING(
                    f"User '{username}' already exists; administrator flags verified."
                )
            )

        profile = user.profile

        if profile.role != UserProfile.Role.ADMIN:
            profile.role = UserProfile.Role.ADMIN
            profile.save(update_fields=["role", "updated_at"])

        self.stdout.write(
            self.style.SUCCESS(
                f"User '{username}' has VetCRM role ADMIN."
            )
        )