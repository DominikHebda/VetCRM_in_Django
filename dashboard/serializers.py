from rest_framework import serializers


class RecentVisitSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    visit_date = serializers.DateTimeField()
    reason = serializers.CharField()
    status = serializers.CharField()
    animal__name = serializers.CharField()


class RecentAnimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    species = serializers.CharField()
    owner__last_name = serializers.CharField()

    
class DashboardSummarySerializer(serializers.Serializer):
    owners_count = serializers.IntegerField()
    animals_count = serializers.IntegerField()
    today_visits = serializers.IntegerField()
    vaccinations_due = serializers.IntegerField()
    prescriptions_expiring = serializers.IntegerField()
    recent_visits = RecentVisitSerializer(many=True)
    recent_animals = RecentAnimalSerializer(many=True)

