from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from .models import Animal
from .serializers import AnimalSerializer


@extend_schema(
    tags=["Animals"],
    summary="Manage animals",
    description="CRUD operations for veterinary patients.",
)
class AnimalViewSet(ModelViewSet):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_fields = [
        "owner",
        "species",
    ]

    search_fields = [
        "name",
        "breed",
        "chip_number",
    ]

    ordering_fields = [
        "name",
        "birth_date",
    ]
