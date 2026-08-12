from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import DashboardSummarySerializer
from .services import DashboardService


class DashboardView(APIView):
    @extend_schema(
        tags=["Dashboard"],
        summary="Get dashboard summary",
        responses=DashboardSummarySerializer,
    )
    def get(self, request):
        data = DashboardService.get_summary()

        serializer = DashboardSummarySerializer(data)

        return Response(serializer.data)