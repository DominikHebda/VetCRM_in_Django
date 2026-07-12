from rest_framework.viewsets import ModelViewSet
from .models import Owner
from .serializers import OwnerSerializer
from drf_spectacular.utils import extend_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

@extend_schema(
    tags=["Owners"],
    summary="Manage pet owners",
    description="CRUD operations for pet owners."
)

class OwnerViewSet(ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone_number",
    ]
    ordering_fields = [
        "last_name",
        "created_at",
    ]