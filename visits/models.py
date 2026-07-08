from django.conf import settings
from django.db import models

from animals.models import Animal
from common.models import TimeStampedModel


class Visit(TimeStampedModel):

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="visits"
    )

    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="visits"
    )

    visit_date = models.DateTimeField()

    reason = models.CharField(max_length=255)

    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["visit_date"]

    def __str__(self):
        return f"{self.animal.name} - {self.visit_date}"