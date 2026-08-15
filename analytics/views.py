from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminOrVeterinarian

from .serializers import AnalyticsOverviewSerializer
from .services import AnalyticsService


class AnalyticsOverviewView(APIView):
    permission_classes = [IsAdminOrVeterinarian]

    @extend_schema(
        tags=["Analytics"],
        summary="Analytics overview",
        responses=AnalyticsOverviewSerializer,
    )
    def get(self, request):
        serializer = AnalyticsOverviewSerializer(
            AnalyticsService.overview()
        )

        return Response(serializer.data)