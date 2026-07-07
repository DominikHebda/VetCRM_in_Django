from drf_spectacular.utils import extend_schema
from rest_framework.viewsets import ModelViewSet

from .models import MedicalRecord
from .serializers import MedicalRecordSerializer


@extend_schema(
    tags=["Medical Records"],
    summary="Manage medical records",
)
class MedicalRecordViewSet(ModelViewSet):

    queryset = MedicalRecord.objects.select_related(
        "visit",
        "visit__animal",
    )

    serializer_class = MedicalRecordSerializer