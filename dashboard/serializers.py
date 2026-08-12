from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    owners_count = serializers.IntegerField()
    animals_count = serializers.IntegerField()
    today_visits = serializers.IntegerField()
    vaccinations_due = serializers.IntegerField()
    prescriptions_expiring = serializers.IntegerField()