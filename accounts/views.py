# Create your views here.
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import CurrentUserSerializer, VeterinarianSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Authentication"],
        summary="Get current authenticated user",
        responses=CurrentUserSerializer,
    )
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class VeterinarianListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Accounts"],
        summary="List veterinarians",
        responses=VeterinarianSerializer(many=True),
    )
    def get(self, request):
        user_model = request.user.__class__

        veterinarians = user_model.objects.filter(
            profile__role=UserProfile.Role.VET,
        ).order_by("last_name", "first_name", "username")

        serializer = VeterinarianSerializer(veterinarians, many=True)
        return Response(serializer.data)
