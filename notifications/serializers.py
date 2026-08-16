from rest_framework import serializers


class NotificationItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    severity = serializers.CharField()
    message = serializers.CharField()
    due_date = serializers.CharField()
    animal_id = serializers.IntegerField()

    vaccination_id = serializers.IntegerField(required=False)
    prescription_id = serializers.IntegerField(required=False)
    visit_id = serializers.IntegerField(required=False)

class NotificationListSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    items = NotificationItemSerializer(many=True)