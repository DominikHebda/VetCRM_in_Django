from django.conf import settings
from django.db import models

from animals.models import Animal
from common.models import TimeStampedModel


class Vaccination(TimeStampedModel):
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="vaccinations",
    )

    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="vaccinations",
    )

    vaccine_name = models.CharField(max_length=150)

    manufacturer = models.CharField(
        max_length=150,
        blank=True,
    )

    batch_number = models.CharField(
        max_length=100,
        blank=True,
    )

    vaccination_date = models.DateField()

    next_due_date = models.DateField(
        null=True,
        blank=True,
    )

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-vaccination_date"]

        indexes = [
            models.Index(fields=["vaccination_date"]),
            models.Index(fields=["next_due_date"]),
        ]

    def __str__(self):
        return f"{self.animal.name} - {self.vaccine_name}"
