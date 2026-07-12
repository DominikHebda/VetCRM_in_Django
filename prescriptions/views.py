from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Prescription
from .serializers import PrescriptionSerializer
from .services import generate_prescription_number
from drf_spectacular.utils import extend_schema


@extend_schema(
    tags=["Prescriptions"],
)


class PrescriptionViewSet(viewsets.ModelViewSet):

    queryset = Prescription.objects.select_related(
        "animal",
        "visit",
        "veterinarian",
    )

    serializer_class = PrescriptionSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def perform_create(self, serializer):

        serializer.save(
            veterinarian=self.request.user,
            prescription_number=generate_prescription_number(),
        )