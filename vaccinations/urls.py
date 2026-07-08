from rest_framework.routers import DefaultRouter

from .views import VaccinationViewSet

router = DefaultRouter()
router.register(r'vaccinations', VaccinationViewSet)

urlpatterns = router.urls