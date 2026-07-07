from django.db import models

from visits.models import Visit


class MedicalRecord(models.Model):

    visit = models.OneToOneField(
        Visit,
        on_delete=models.CASCADE,
        related_name="medical_record",
    )

    diagnosis = models.TextField()

    treatment = models.TextField(blank=True)

    recommendations = models.TextField(blank=True)

    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Medical Record #{self.pk}"