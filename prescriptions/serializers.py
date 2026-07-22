from rest_framework import serializers

from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription

        fields = "__all__"

        read_only_fields = (
            "prescription_number",
            "veterinarian",
            "created_at",
            "updated_at",
        )


def validate(self, attrs):

    issue_date = attrs["issue_date"]
    valid_until = attrs["valid_until"]

    if valid_until < issue_date:
        raise serializers.ValidationError(
            "The prescription expiration date cannot be earlier than the issue date."
        )

    return attrs


def validate_quantity(self, value):

    if value <= 0:
        raise serializers.ValidationError("Quantity must be greater than zero.")

    return value
