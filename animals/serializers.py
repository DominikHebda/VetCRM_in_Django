from rest_framework import serializers

from .models import Animal


class AnimalSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.__str__", read_only=True)

    class Meta:
        model = Animal
        fields = "__all__"
