from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.models import UserProfile


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None

    profile = getattr(user, "profile", None)

    if profile is None:
        return None

    return profile.role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_user_role(request.user) == UserProfile.Role.ADMIN


class IsAdminOrVeterinarian(BasePermission):
    def has_permission(self, request, view):
        return get_user_role(request.user) in {
            UserProfile.Role.ADMIN,
            UserProfile.Role.VET,
        }


class IsAdminOrReceptionist(BasePermission):
    def has_permission(self, request, view):
        return get_user_role(request.user) in {
            UserProfile.Role.ADMIN,
            UserProfile.Role.RECEPTIONIST,
        }


class OwnerAnimalPermission(BasePermission):
    """
    Admin and receptionist have full access.
    Veterinarian has read-only access.
    """

    def has_permission(self, request, view):
        role = get_user_role(request.user)

        if role in {
            UserProfile.Role.ADMIN,
            UserProfile.Role.RECEPTIONIST,
        }:
            return True

        if role == UserProfile.Role.VET:
            return request.method in SAFE_METHODS

        return False


class ClinicalPermission(BasePermission):
    """
    Admin and veterinarian have full access.
    Receptionist has read-only access.
    """

    def has_permission(self, request, view):
        role = get_user_role(request.user)

        if role in {
            UserProfile.Role.ADMIN,
            UserProfile.Role.VET,
        }:
            return True

        if role == UserProfile.Role.RECEPTIONIST:
            return request.method in SAFE_METHODS

        return False