from rest_framework import serializers

from .models import Visit


class VisitSerializer(serializers.ModelSerializer):

    animal_name = serializers.CharField(
        source="animal.name",
        read_only=True
    )

    veterinarian_name = serializers.CharField(
        source="veterinarian.get_full_name",
        read_only=True
    )

    class Meta:
        model = Visit

        fields = (
            "id",
            "animal",
            "animal_name",
            "veterinarian",
            "veterinarian_name",
            "visit_date",
            "reason",
            "notes",
            "status",
            "created_at",
        )