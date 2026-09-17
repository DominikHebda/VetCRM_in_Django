from django.contrib import admin

from .models import Animal


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "species",
        "breed",
        "owner",
        "chip_number",
        "birth_date",
        "created_at",
    )
    search_fields = (
        "name",
        "breed",
        "chip_number",
        "owner__first_name",
        "owner__last_name",
    )
    list_filter = (
        "species",
    )
    ordering = (
        "name",
    )