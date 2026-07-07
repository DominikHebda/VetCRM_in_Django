from rest_framework import serializers

from .models import Vaccination


class VaccinationSerializer(serializers.ModelSerializer):

    animal_name = serializers.CharField(
        source="animal.name",
        read_only=True,
    )

    veterinarian_name = serializers.CharField(
        source="veterinarian.get_full_name",
        read_only=True,
    )

    class Meta:
        model = Vaccination

        fields = (
            "id",
            "animal",
            "animal_name",
            "veterinarian",
            "veterinarian_name",
            "vaccine_name",
            "manufacturer",
            "batch_number",
            "vaccination_date",
            "next_due_date",
            "notes",
            "created_at",
            "updated_at",
        )