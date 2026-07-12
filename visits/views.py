from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.viewsets import ModelViewSet

from drf_spectacular.utils import extend_schema

from .models import Visit
from .serializers import VisitSerializer


@extend_schema(
    tags=["Visits"],
    summary="Manage veterinary visits",
    description="Manage veterinary visits.",
)
class VisitViewSet(ModelViewSet):

    queryset = Visit.objects.select_related(
        "animal",
        "veterinarian",
    )

    serializer_class = VisitSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "animal",
        "veterinarian",
    ]

    search_fields = [
        "reason",
        "animal__name",
    ]

    ordering_fields = [
        "visit_date",
        "created_at",
    ]