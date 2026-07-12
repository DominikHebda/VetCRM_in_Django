from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
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
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "animal",
        "status",
        "veterinarian",
    ]

    search_fields = [
        "reason",
    ]

    ordering_fields = [
        "visit_date",
    ]