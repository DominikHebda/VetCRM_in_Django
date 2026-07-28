from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from .models import Vaccination
from .serializers import VaccinationSerializer


@extend_schema(
    tags=["Vaccinations"],
    summary="Manage animal vaccinations",
)
class VaccinationViewSet(ModelViewSet):
    queryset = Vaccination.objects.select_related(
        "animal",
        "veterinarian",
    )

    serializer_class = VaccinationSerializer

    filter_backends = (
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    )

    filterset_fields = (
        "animal",
        "veterinarian",
    )

    search_fields = (
        "vaccine_name",
        "manufacturer",
    )

    ordering_fields = (
        "vaccination_date",
        "next_due_date",
    )
