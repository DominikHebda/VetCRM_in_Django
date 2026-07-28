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