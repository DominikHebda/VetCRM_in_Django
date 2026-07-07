from rest_framework.viewsets import ModelViewSet
from .models import Owner
from .serializers import OwnerSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=["Owners"],
    summary="Manage pet owners",
    description="CRUD operations for pet owners."
)

class OwnerViewSet(ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer