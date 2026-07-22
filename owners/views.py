from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from .models import Owner
from .serializers import OwnerSerializer


@extend_schema(
    tags=["Owners"],
    description="Manage pet owners.",
)
class OwnerViewSet(ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "email",
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    ordering_fields = [
        "first_name",
        "last_name",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "last_name",
        "first_name",
    ]
