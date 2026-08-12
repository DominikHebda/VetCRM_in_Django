from rest_framework import serializers


class VisitsByMonthSerializer(serializers.Serializer):
    month = serializers.DateField()
    count = serializers.IntegerField()


class AnimalsBySpeciesSerializer(serializers.Serializer):
    species = serializers.CharField()
    count = serializers.IntegerField()


class AnalyticsOverviewSerializer(serializers.Serializer):
    visits_by_month = VisitsByMonthSerializer(many=True)
    animals_by_species = AnimalsBySpeciesSerializer(many=True)