from django.urls import path

from .views import CurrentUserView, VeterinarianListView

urlpatterns = [
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("veterinarians/", VeterinarianListView.as_view(), name="veterinarian-list"),
]
