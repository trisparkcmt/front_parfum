from rest_framework import permissions


class IsCreatorOrReadOnly(permissions.BasePermission):
    """Autorise la consultation à tous les authentifiés et l'édition uniquement au créateur.

    - GET/HEAD/OPTIONS : autorisé pour tous les utilisateurs authentifiés.
    - PUT/PATCH/DELETE : autorisé seulement si l'objet appartient au client connecté.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not hasattr(request.user, 'client'):
            return False

        return obj.client == request.user.client
