from rest_framework import viewsets
from drf_spectacular.utils import extend_schema

from .models import Owner
from .serializers import OwnerSerializer


@extend_schema(
    tags=["Owners"],
    description="Manage pet owners."
)
class OwnerViewSet(viewsets.ModelViewSet):

    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer