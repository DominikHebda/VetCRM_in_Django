from django.contrib import admin

from .models import MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = (
        "visit",
        "diagnosis",
        "weight",
        "temperature",
        "created_at",
    )
    search_fields = (
        "visit__animal__name",
        "visit__animal__owner__first_name",
        "visit__animal__owner__last_name",
        "diagnosis",
        "treatment",
    )
    ordering = ("-created_at",)
    list_select_related = (
        "visit",
        "visit__animal",
        "visit__animal__owner",
    )
