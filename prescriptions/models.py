from django.conf import settings
from django.db import models

from animals.models import Animal
from common.models import TimeStampedModel
from visits.models import Visit


class Prescription(TimeStampedModel):
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )

    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="prescriptions",
    )

    prescription_number = models.CharField(
        max_length=50,
        unique=True,
    )

    medication_name = models.CharField(
        max_length=200,
    )

    active_substance = models.CharField(
        max_length=200,
        blank=True,
    )

    dosage = models.CharField(
        max_length=100,
    )

    frequency = models.CharField(
        max_length=100,
    )

    duration = models.CharField(
        max_length=100,
    )

    quantity = models.PositiveIntegerField()

    issue_date = models.DateField()

    valid_until = models.DateField()

    instructions = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["-issue_date"]

        indexes = [
            models.Index(fields=["issue_date"]),
            models.Index(fields=["prescription_number"]),
        ]

    def __str__(self):
        return f"{self.prescription_number} - {self.medication_name}"
