from drf_spectacular.utils import extend_schema
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import MedicalRecord
from .serializers import MedicalRecordSerializer


@extend_schema(
    tags=["Medical Records"],
    description="Manage medical records.",
)
class MedicalRecordViewSet(ModelViewSet):

    queryset = MedicalRecord.objects.select_related(
        "visit",
        "visit__animal",
    )

    serializer_class = MedicalRecordSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "visit",
        "visit__animal",
    ]

    search_fields = [
        "diagnosis",
        "treatment",
    ]

    ordering_fields = [
        "created_at",
    ]