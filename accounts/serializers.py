from rest_framework import serializers


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    license_number = serializers.SerializerMethodField()

    def get_role(self, user):
        profile = getattr(user, "profile", None)
        return profile.role if profile else None

    def get_phone(self, user):
        profile = getattr(user, "profile", None)
        return profile.phone if profile else ""

    def get_license_number(self, user):
        profile = getattr(user, "profile", None)
        return profile.license_number if profile else ""