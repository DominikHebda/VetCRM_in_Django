from rest_framework import serializers


class VisitsByMonthSerializer(serializers.Serializer):
    month = serializers.DateField()
    count = serializers.IntegerField()


class AnimalsBySpeciesSerializer(serializers.Serializer):
    species = serializers.CharField()
    count = serializers.IntegerField()


class TopVaccineSerializer(serializers.Serializer):
    vaccine_name = serializers.CharField()
    count = serializers.IntegerField()


class TopMedicationSerializer(serializers.Serializer):
    medication_name = serializers.CharField()
    count = serializers.IntegerField()


class VisitsByVeterinarianSerializer(serializers.Serializer):
    veterinarian_id = serializers.IntegerField()
    veterinarian__first_name = serializers.CharField()
    veterinarian__last_name = serializers.CharField()
    count = serializers.IntegerField()


class AnalyticsOverviewSerializer(serializers.Serializer):
    visits_by_month = VisitsByMonthSerializer(many=True)
    animals_by_species = AnimalsBySpeciesSerializer(many=True)
    top_vaccines = TopVaccineSerializer(many=True)
    top_medications = TopMedicationSerializer(many=True)
    visits_by_veterinarian = VisitsByVeterinarianSerializer(many=True)