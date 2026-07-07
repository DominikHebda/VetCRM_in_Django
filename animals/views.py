from rest_framework.viewsets import ModelViewSet
from .models import Animal
from .serializers import AnimalSerializer
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=["Animals"],
    summary="Manage animals",
    description="CRUD operations for veterinary patients."
)

class AnimalViewSet(ModelViewSet):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer