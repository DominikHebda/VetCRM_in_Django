from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AnalyticsOverviewSerializer
from .services import AnalyticsService


class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

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