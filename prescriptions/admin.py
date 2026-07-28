from django.contrib import admin

# Register your models here.
from .models import Prescription


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = (
        "prescription_number",
        "animal",
        "veterinarian",
        "medication_name",
        "issue_date",
        "valid_until",
    )

    search_fields = (
        "prescription_number",
        "medication_name",
        "animal__name",
    )

    list_filter = (
        "issue_date",
        "valid_until",
    )

    ordering = ("-issue_date",)
