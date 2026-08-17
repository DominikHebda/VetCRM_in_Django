from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import NotificationListSerializer
from .services import NotificationService


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Notifications"],
        summary="Get current notifications",
        responses=NotificationListSerializer,
    )
    def get(self, request):
        data = NotificationService.get_notifications(request.user)
        serializer = NotificationListSerializer(data)

        return Response(serializer.data)
