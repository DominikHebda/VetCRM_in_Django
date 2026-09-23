from rest_framework import serializers

from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(
        source="animal.name",
        read_only=True,
    )

    animal_owner_name = serializers.CharField(
        source="animal.owner.__str__",
        read_only=True,
    )

    veterinarian_name = serializers.CharField(
        source="veterinarian.get_full_name",
        read_only=True,
    )

    class Meta:
        model = Prescription
        fields = (
            "id",
            "animal",
            "animal_name",
            "animal_owner_name",
            "visit",
            "veterinarian",
            "veterinarian_name",
            "prescription_number",
            "medication_name",
            "active_substance",
            "dosage",
            "frequency",
            "duration",
            "quantity",
            "issue_date",
            "valid_until",
            "instructions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "prescription_number",
            "veterinarian",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        issue_date = attrs.get(
            "issue_date",
            getattr(self.instance, "issue_date", None),
        )
        valid_until = attrs.get(
            "valid_until",
            getattr(self.instance, "valid_until", None),
        )

        if (
            issue_date is not None
            and valid_until is not None
            and valid_until < issue_date
        ):
            raise serializers.ValidationError(
                {
                    "valid_until": (
                        "The prescription expiration date cannot be "
                        "earlier than the issue date."
                    )
                }
            )

        return attrs

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        return value