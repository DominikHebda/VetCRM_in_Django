from django.contrib import admin

from .models import Visit


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "veterinarian",
        "visit_date",
        "reason",
        "status",
    )
    list_filter = (
        "status",
        "visit_date",
        "veterinarian",
    )
    search_fields = (
        "animal__name",
        "veterinarian__username",
        "veterinarian__first_name",
        "veterinarian__last_name",
        "reason",
    )
    ordering = ("visit_date",)
    list_select_related = (
        "animal",
        "veterinarian",
    )
