from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """
    Разрешение, предоставляющее доступ только студентам.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student()
        )


class IsTeacher(permissions.BasePermission):
    """
    Разрешение, предоставляющее доступ только преподавателям.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_teacher()
        )


class IsOwnerOrTeacher(permissions.BasePermission):
    """
    Разрешение, позволяющее студентам видеть только свои данные,
    а преподавателям - данные всех студентов.
    """
    
    def has_object_permission(self, request, view, obj):
        # Всегда разрешаем GET, HEAD или OPTIONS запросы для преподавателей
        if request.user.is_teacher():
            return True
            
        # Проверяем, является ли пользователь владельцем объекта
        return obj == request.user or hasattr(obj, 'user') and obj.user == request.user 