from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class UserProfile(TimeStampedModel):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        VET = "VET", "Veterinarian"
        RECEPTIONIST = "RECEPTIONIST", "Receptionist"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEPTIONIST
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    license_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Veterinary license number"
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"