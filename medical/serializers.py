from rest_framework import serializers

from .models import MedicalRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(
        source="visit.animal.name",
        read_only=True,
    )
    animal_species = serializers.CharField(
        source="visit.animal.species",
        read_only=True,
    )
    animal_owner_name = serializers.CharField(
        source="visit.animal.owner.__str__",
        read_only=True,
    )

    class Meta:
        model = MedicalRecord
        fields = "__all__"
